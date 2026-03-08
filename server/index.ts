import express from "express";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import { runMigrations } from "stripe-replit-sync";

import authRoutes from "./routes/auth";
import companiesRoutes from "./routes/companies";
import servicesRoutes from "./routes/services";
import staffRoutes from "./routes/staff";
import clientsRoutes from "./routes/clients";
import bookingsRoutes from "./routes/bookings";
import messagesRoutes from "./routes/messages";
import leadsRoutes from "./routes/leads";
import notificationsRoutes from "./routes/notifications";
import smsRoutes from "./routes/sms";
import promoCodesRoutes from "./routes/promo-codes";
import clientPortalRoutes from "./routes/client";
import stripeRoutes from "./routes/stripe";
import schedulingRoutes from "./routes/scheduling";
import emailRoutes from "./routes/email";
import webhooksRoutes from "./routes/webhooks";
import domainsRoutes from "./routes/domains";
import reportsRoutes from "./routes/reports";
import publicRoutes from "./routes/public";
import referralsRoutes from "./routes/referrals";
import { WebhookHandlers } from "./services/webhookHandlers";
import { getStripeSync, isStripeConfigured } from "./services/stripe";

const app = express();
const server = createServer(app);

const wss = new WebSocketServer({ server, path: "/ws" });

const clients = new Map<number, Set<WebSocket>>();

wss.on("connection", (ws, req) => {
  const url = new URL(req.url || "", `http://${req.headers.host}`);
  const userId = parseInt(url.searchParams.get("userId") || "0");

  if (userId) {
    if (!clients.has(userId)) {
      clients.set(userId, new Set());
    }
    clients.get(userId)!.add(ws);

    ws.on("close", () => {
      clients.get(userId)?.delete(ws);
      if (clients.get(userId)?.size === 0) {
        clients.delete(userId);
      }
    });
  }

  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log("WebSocket message:", message);
    } catch (e) {
      console.error("Invalid WebSocket message:", e);
    }
  });
});

export function sendToUser(userId: number, data: any) {
  const userClients = clients.get(userId);
  if (userClients) {
    const message = JSON.stringify(data);
    userClients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
}

async function initStripe() {
  if (!isStripeConfigured()) {
    console.log("Stripe not configured, skipping initialization");
    return;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn("DATABASE_URL not set, skipping Stripe initialization");
    return;
  }

  try {
    console.log("Initializing Stripe schema...");
    await runMigrations({ databaseUrl, schema: "stripe" });
    console.log("Stripe schema ready");

    const stripeSync = await getStripeSync();

    console.log("Setting up managed webhook...");
    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
    
    try {
      const result = await stripeSync.findOrCreateManagedWebhook(
        `${webhookBaseUrl}/api/stripe/webhook`,
        {
          enabled_events: ["*"],
          description: "Managed webhook for CleanPro Stripe sync",
        }
      );
      if (result && result.webhook) {
        console.log(`Webhook configured: ${result.webhook.url} (UUID: ${result.uuid})`);
      } else {
        console.log("Webhook setup returned no result, continuing without managed webhook");
      }
    } catch (webhookError) {
      console.warn("Could not set up managed webhook:", webhookError);
    }

    console.log("Syncing Stripe data...");
    stripeSync
      .syncBackfill()
      .then(() => {
        console.log("Stripe data synced");
      })
      .catch((err: any) => {
        console.error("Error syncing Stripe data:", err);
      });
  } catch (error) {
    console.error("Failed to initialize Stripe:", error);
  }
}

initStripe();

app.use(cors());

app.post(
  "/api/stripe/webhook/:uuid",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];

    if (!signature) {
      return res.status(400).json({ error: "Missing stripe-signature" });
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;

      if (!Buffer.isBuffer(req.body)) {
        console.error("STRIPE WEBHOOK ERROR: req.body is not a Buffer");
        return res.status(500).json({ error: "Webhook processing error" });
      }

      const { uuid } = req.params;
      await WebhookHandlers.processWebhook(req.body as Buffer, sig, uuid);

      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error("Webhook error:", error.message);
      res.status(400).json({ error: "Webhook processing error" });
    }
  }
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/companies", companiesRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/leads", leadsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/sms", smsRoutes);
app.use("/api/promo-codes", promoCodesRoutes);
app.use("/api/client", clientPortalRoutes);
app.use("/api/stripe", stripeRoutes);
app.use("/api/scheduling", schedulingRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/webhooks", webhooksRoutes);
app.use("/api/domains", domainsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/referrals", referralsRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../dist/index.html"));
  });
}

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app, server };
