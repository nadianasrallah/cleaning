import { Router } from "express";
import { db } from "../db";
import { leads, bookings, clients, companies, notifications, users, webhookConfigs, webhookLogs, apiKeys } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { sendBookingConfirmationEmail, sendWelcomeEmail, sendBookingCancellationEmail } from "../services/email";
import { sendBookingConfirmation as sendBookingConfirmationSMS } from "../services/sms";
import { authMiddleware } from "../middleware/auth";
import crypto from "crypto";

const router = Router();

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendWebhookRequest(
  config: typeof webhookConfigs.$inferSelect,
  eventType: string,
  payload: any
): Promise<{ success: boolean; responseStatus: number; responseBody: string; errorMessage: string; duration: number }> {
  const startTime = Date.now();
  let responseStatus = 0;
  let responseBody = '';
  let errorMessage = '';
  let success = false;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(config.headers as Record<string, string> || {})
    };

    if (config.secret) {
      const timestamp = Date.now().toString();
      const signature = crypto
        .createHmac('sha256', config.secret)
        .update(`${timestamp}.${JSON.stringify(payload)}`)
        .digest('hex');
      headers['X-Webhook-Signature'] = signature;
      headers['X-Webhook-Timestamp'] = timestamp;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs || 30000);

    const response = await fetch(config.url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        event: eventType,
        timestamp: new Date().toISOString(),
        data: payload
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);
    responseStatus = response.status;
    responseBody = await response.text();
    success = response.ok;
  } catch (err: any) {
    errorMessage = err.message;
  }

  return {
    success,
    responseStatus,
    responseBody: responseBody.substring(0, 5000),
    errorMessage,
    duration: Date.now() - startTime
  };
}

async function triggerOutboundWebhooks(companyId: string, eventType: string, payload: any) {
  try {
    const configs = await db.select()
      .from(webhookConfigs)
      .where(and(
        eq(webhookConfigs.companyId, companyId),
        eq(webhookConfigs.isActive, true)
      ));

    for (const config of configs) {
      const events = config.events as string[] || [];
      if (!events.includes(eventType) && !events.includes('*')) {
        continue;
      }

      const maxRetries = config.retryCount || 3;
      let attemptNumber = 0;
      let deliverySucceeded = false;

      while (attemptNumber < maxRetries && !deliverySucceeded) {
        attemptNumber++;
        
        if (attemptNumber > 1) {
          const backoffMs = Math.min(1000 * Math.pow(2, attemptNumber - 1), 30000);
          await delay(backoffMs);
        }

        const result = await sendWebhookRequest(config, eventType, payload);

        await db.insert(webhookLogs).values({
          webhookConfigId: config.id,
          companyId,
          eventType,
          payload,
          responseStatus: result.responseStatus,
          responseBody: result.responseBody,
          errorMessage: result.errorMessage,
          attemptNumber,
          success: result.success,
          duration: result.duration
        });

        if (result.success) {
          deliverySucceeded = true;
          await db.update(webhookConfigs)
            .set({
              lastTriggeredAt: new Date(),
              failureCount: 0,
              updatedAt: new Date()
            })
            .where(eq(webhookConfigs.id, config.id));
        }
      }

      if (!deliverySucceeded) {
        await db.update(webhookConfigs)
          .set({
            failureCount: (config.failureCount || 0) + 1,
            lastTriggeredAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(webhookConfigs.id, config.id));
      }
    }
  } catch (error) {
    console.error('Error triggering outbound webhooks:', error);
  }
}

router.post("/lead-capture", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      source,
      eventType,
      buildingName,
      promoCode,
      companySlug,
      notes
    } = req.body;

    let companyId: string | null = null;
    if (companySlug) {
      const [company] = await db.select({ id: companies.id })
        .from(companies)
        .where(eq(companies.slug, companySlug))
        .limit(1);
      companyId = company?.id || null;
    }

    if (!companyId) {
      const [defaultCompany] = await db.select({ id: companies.id })
        .from(companies)
        .limit(1);
      companyId = defaultCompany?.id || null;
    }

    if (!companyId) {
      return res.status(400).json({ error: "No company found" });
    }

    let leadScore = 50;
    if (email) leadScore += 10;
    if (phone) leadScore += 10;
    if (promoCode) leadScore += 15;
    if (eventType) leadScore += 5;

    const [newLead] = await db.insert(leads).values({
      companyId,
      firstName,
      lastName,
      email,
      phone,
      source: source || 'webhook',
      eventType,
      buildingName,
      promoCode,
      score: leadScore,
      status: 'new',
      notes
    }).returning();

    const adminUsers = await db.select({ id: users.id })
      .from(users)
      .where(and(
        eq(users.companyId, companyId),
        eq(users.role, 'admin')
      ));

    for (const admin of adminUsers) {
      await db.insert(notifications).values({
        userId: admin.id,
        companyId,
        type: 'new_lead',
        title: 'New Lead Captured',
        message: `${firstName || ''} ${lastName || ''} ${email || phone || 'Unknown'} submitted via webhook`,
        data: { leadId: newLead.id }
      });
    }

    await triggerOutboundWebhooks(companyId, 'lead.created', {
      lead: newLead,
      source: source || 'webhook'
    });

    res.json({
      success: true,
      leadId: newLead.id,
      score: leadScore
    });
  } catch (error: any) {
    console.error("Lead capture webhook error:", error);
    res.status(500).json({ error: "Failed to process lead" });
  }
});

router.post("/booking-created", async (req, res) => {
  try {
    const { bookingId, sendConfirmation = true, sendSms = false } = req.body;

    if (!bookingId) {
      return res.status(400).json({ error: "Booking ID is required" });
    }

    const [booking] = await db.select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const results: any = { bookingId: booking.id };

    if (sendConfirmation) {
      const emailResult = await sendBookingConfirmationEmail(booking.id);
      results.emailSent = emailResult.success;
    }

    if (sendSms) {
      results.smsSent = false;
    }

    const adminUsers = await db.select({ id: users.id })
      .from(users)
      .where(and(
        eq(users.companyId, booking.companyId),
        eq(users.role, 'admin')
      ));

    for (const admin of adminUsers) {
      await db.insert(notifications).values({
        userId: admin.id,
        companyId: booking.companyId,
        type: 'new_booking',
        title: 'New Booking Created',
        message: `New booking has been created`,
        data: { bookingId: booking.id }
      });
    }

    await triggerOutboundWebhooks(booking.companyId, 'booking.created', {
      booking,
      notificationsSent: results
    });

    res.json({
      success: true,
      ...results
    });
  } catch (error: any) {
    console.error("Booking created webhook error:", error);
    res.status(500).json({ error: "Failed to process booking webhook" });
  }
});

router.post("/booking-status-changed", async (req, res) => {
  try {
    const { bookingId, newStatus, reason, notifyClient = true, sendEmail = true, sendSms = false } = req.body;

    if (!bookingId || !newStatus) {
      return res.status(400).json({ error: "Booking ID and new status are required" });
    }

    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const [booking] = await db.select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const previousStatus = booking.status;

    const updateData: any = {
      status: newStatus,
      updatedAt: new Date()
    };

    if (newStatus === 'cancelled') {
      updateData.cancelledAt = new Date();
      updateData.cancellationReason = reason;
    }

    if (newStatus === 'completed') {
      updateData.completedAt = new Date();
    }

    await db.update(bookings)
      .set(updateData)
      .where(eq(bookings.id, booking.id));

    const results: any = { bookingId: booking.id, previousStatus, newStatus };

    if (newStatus === 'cancelled' && sendEmail) {
      const emailResult = await sendBookingCancellationEmail(booking.id, reason);
      results.cancellationEmailSent = emailResult.success;
    }

    if (newStatus === 'cancelled' && sendSms) {
      results.cancellationSmsSent = false;
    }

    if (booking.clientId && notifyClient) {
      const [client] = await db.select({ userId: clients.userId })
        .from(clients)
        .where(eq(clients.id, booking.clientId))
        .limit(1);

      if (client) {
        await db.insert(notifications).values({
          userId: client.userId,
          companyId: booking.companyId,
          type: 'booking_status_changed',
          title: 'Booking Status Updated',
          message: `Your booking status has been updated to: ${newStatus}`,
          data: { bookingId: booking.id, status: newStatus }
        });
      }
    }

    await triggerOutboundWebhooks(booking.companyId, 'booking.status_changed', {
      booking: { ...booking, status: newStatus },
      previousStatus,
      newStatus,
      reason
    });

    res.json({
      success: true,
      ...results
    });
  } catch (error: any) {
    console.error("Booking status webhook error:", error);
    res.status(500).json({ error: "Failed to process booking status webhook" });
  }
});

router.post("/client-created", async (req, res) => {
  try {
    const { clientId, sendWelcome = true } = req.body;

    if (!clientId) {
      return res.status(400).json({ error: "Client ID is required" });
    }

    const [client] = await db.select()
      .from(clients)
      .where(eq(clients.id, parseInt(clientId)))
      .limit(1);

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    const results: any = { clientId: client.id };

    if (sendWelcome) {
      const emailResult = await sendWelcomeEmail(client.userId, client.companyId);
      results.welcomeEmailSent = emailResult.success;
    }

    await triggerOutboundWebhooks(client.companyId, 'client.created', {
      clientId: client.id,
      welcomeEmailSent: results.welcomeEmailSent
    });

    res.json({
      success: true,
      ...results
    });
  } catch (error: any) {
    console.error("Client created webhook error:", error);
    res.status(500).json({ error: "Failed to process client webhook" });
  }
});

router.post("/zapier", async (req, res) => {
  try {
    const { action, data, companySlug } = req.body;

    if (!action || !data) {
      return res.status(400).json({ error: "Action and data are required" });
    }

    let companyId: string | null = null;
    if (companySlug) {
      const [company] = await db.select({ id: companies.id })
        .from(companies)
        .where(eq(companies.slug, companySlug))
        .limit(1);
      companyId = company?.id || null;
    }

    switch (action) {
      case 'create_lead':
        if (!companyId) {
          return res.status(400).json({ error: "Company slug required for lead creation" });
        }
        const [lead] = await db.insert(leads).values({
          companyId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          source: data.source || 'zapier',
          notes: data.notes,
          status: 'new',
          score: 50
        }).returning();

        await triggerOutboundWebhooks(companyId, 'lead.created', {
          lead,
          source: 'zapier'
        });

        return res.json({ success: true, leadId: lead.id });

      case 'update_booking_status':
        if (!data.bookingId || !data.status) {
          return res.status(400).json({ error: "Booking ID and status required" });
        }
        const [bookingToUpdate] = await db.select({ companyId: bookings.companyId, status: bookings.status })
          .from(bookings)
          .where(eq(bookings.id, data.bookingId))
          .limit(1);

        if (!bookingToUpdate) {
          return res.status(404).json({ error: "Booking not found" });
        }

        await db.update(bookings)
          .set({ 
            status: data.status,
            updatedAt: new Date()
          })
          .where(eq(bookings.id, data.bookingId));

        await triggerOutboundWebhooks(bookingToUpdate.companyId, 'booking.status_changed', {
          bookingId: data.bookingId,
          previousStatus: bookingToUpdate.status,
          newStatus: data.status
        });

        return res.json({ success: true, bookingId: data.bookingId });

      case 'add_note_to_client':
        if (!data.clientId || !data.note) {
          return res.status(400).json({ error: "Client ID and note required" });
        }
        const [existingClient] = await db.select({ notes: clients.notes, companyId: clients.companyId })
          .from(clients)
          .where(eq(clients.id, parseInt(data.clientId)))
          .limit(1);

        if (!existingClient) {
          return res.status(404).json({ error: "Client not found" });
        }

        const existingNotes = existingClient?.notes || '';
        const newNotes = existingNotes 
          ? `${existingNotes}\n\n[${new Date().toISOString()}] ${data.note}`
          : `[${new Date().toISOString()}] ${data.note}`;
        await db.update(clients)
          .set({ notes: newNotes, updatedAt: new Date() })
          .where(eq(clients.id, parseInt(data.clientId)));

        await triggerOutboundWebhooks(existingClient.companyId, 'client.note_added', {
          clientId: data.clientId,
          note: data.note
        });

        return res.json({ success: true, clientId: data.clientId });

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error: any) {
    console.error("Zapier webhook error:", error);
    res.status(500).json({ error: "Failed to process Zapier webhook" });
  }
});

router.get("/configs", authMiddleware, async (req, res) => {
  try {
    const configs = await db.select()
      .from(webhookConfigs)
      .where(eq(webhookConfigs.companyId, req.user!.companyId!));

    res.json({ configs });
  } catch (error: any) {
    console.error("Failed to fetch webhook configs:", error);
    res.status(500).json({ error: "Failed to fetch webhook configurations" });
  }
});

router.post("/configs", authMiddleware, async (req, res) => {
  try {
    const { name, url, events, headers, secret, retryCount, timeoutMs } = req.body;

    if (!name || !url) {
      return res.status(400).json({ error: "Name and URL are required" });
    }

    const [config] = await db.insert(webhookConfigs).values({
      companyId: req.user!.companyId!,
      name,
      url,
      events: events || ['*'],
      headers: headers || {},
      secret: secret || crypto.randomBytes(32).toString('hex'),
      retryCount: retryCount || 3,
      timeoutMs: timeoutMs || 30000
    }).returning();

    res.json({ success: true, config });
  } catch (error: any) {
    console.error("Failed to create webhook config:", error);
    res.status(500).json({ error: "Failed to create webhook configuration" });
  }
});

router.put("/configs/:id", authMiddleware, async (req, res) => {
  try {
    const configId = parseInt(req.params.id);
    const { name, url, events, headers, secret, retryCount, timeoutMs, isActive } = req.body;

    const [existingConfig] = await db.select()
      .from(webhookConfigs)
      .where(and(
        eq(webhookConfigs.id, configId),
        eq(webhookConfigs.companyId, req.user!.companyId!)
      ))
      .limit(1);

    if (!existingConfig) {
      return res.status(404).json({ error: "Webhook configuration not found" });
    }

    const updateData: any = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (url !== undefined) updateData.url = url;
    if (events !== undefined) updateData.events = events;
    if (headers !== undefined) updateData.headers = headers;
    if (secret !== undefined) updateData.secret = secret;
    if (retryCount !== undefined) updateData.retryCount = retryCount;
    if (timeoutMs !== undefined) updateData.timeoutMs = timeoutMs;
    if (isActive !== undefined) updateData.isActive = isActive;

    const [updatedConfig] = await db.update(webhookConfigs)
      .set(updateData)
      .where(eq(webhookConfigs.id, configId))
      .returning();

    res.json({ success: true, config: updatedConfig });
  } catch (error: any) {
    console.error("Failed to update webhook config:", error);
    res.status(500).json({ error: "Failed to update webhook configuration" });
  }
});

router.delete("/configs/:id", authMiddleware, async (req, res) => {
  try {
    const configId = parseInt(req.params.id);

    const [existingConfig] = await db.select()
      .from(webhookConfigs)
      .where(and(
        eq(webhookConfigs.id, configId),
        eq(webhookConfigs.companyId, req.user!.companyId!)
      ))
      .limit(1);

    if (!existingConfig) {
      return res.status(404).json({ error: "Webhook configuration not found" });
    }

    await db.delete(webhookConfigs)
      .where(eq(webhookConfigs.id, configId));

    res.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete webhook config:", error);
    res.status(500).json({ error: "Failed to delete webhook configuration" });
  }
});

router.get("/configs/:id/logs", authMiddleware, async (req, res) => {
  try {
    const configId = parseInt(req.params.id);

    const [config] = await db.select()
      .from(webhookConfigs)
      .where(and(
        eq(webhookConfigs.id, configId),
        eq(webhookConfigs.companyId, req.user!.companyId!)
      ))
      .limit(1);

    if (!config) {
      return res.status(404).json({ error: "Webhook configuration not found" });
    }

    const logs = await db.select()
      .from(webhookLogs)
      .where(eq(webhookLogs.webhookConfigId, configId))
      .orderBy(webhookLogs.triggeredAt)
      .limit(100);

    res.json({ logs });
  } catch (error: any) {
    console.error("Failed to fetch webhook logs:", error);
    res.status(500).json({ error: "Failed to fetch webhook logs" });
  }
});

router.post("/configs/:id/test", authMiddleware, async (req, res) => {
  try {
    const configId = parseInt(req.params.id);

    const [config] = await db.select()
      .from(webhookConfigs)
      .where(and(
        eq(webhookConfigs.id, configId),
        eq(webhookConfigs.companyId, req.user!.companyId!)
      ))
      .limit(1);

    if (!config) {
      return res.status(404).json({ error: "Webhook configuration not found" });
    }

    const testPayload = {
      test: true,
      timestamp: new Date().toISOString(),
      message: "This is a test webhook from CleanPro"
    };

    const startTime = Date.now();
    let responseStatus = 0;
    let responseBody = '';
    let errorMessage = '';
    let success = false;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(config.headers as Record<string, string> || {})
      };

      if (config.secret) {
        const timestamp = Date.now().toString();
        const signature = crypto
          .createHmac('sha256', config.secret)
          .update(`${timestamp}.${JSON.stringify(testPayload)}`)
          .digest('hex');
        headers['X-Webhook-Signature'] = signature;
        headers['X-Webhook-Timestamp'] = timestamp;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), config.timeoutMs || 30000);

      const response = await fetch(config.url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          event: 'test',
          timestamp: new Date().toISOString(),
          data: testPayload
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);
      responseStatus = response.status;
      responseBody = await response.text();
      success = response.ok;

    } catch (err: any) {
      errorMessage = err.message;
    }

    await db.insert(webhookLogs).values({
      webhookConfigId: config.id,
      companyId: req.user!.companyId!,
      eventType: 'test',
      payload: testPayload,
      responseStatus,
      responseBody: responseBody.substring(0, 5000),
      errorMessage,
      success,
      duration: Date.now() - startTime
    });

    res.json({
      success,
      responseStatus,
      responseBody: responseBody.substring(0, 1000),
      errorMessage,
      duration: Date.now() - startTime
    });
  } catch (error: any) {
    console.error("Failed to test webhook:", error);
    res.status(500).json({ error: "Failed to test webhook" });
  }
});

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Webhook endpoints are working",
    inboundEndpoints: [
      "POST /lead-capture - Capture leads from external forms",
      "POST /booking-created - Trigger notifications for new bookings",
      "POST /booking-status-changed - Handle booking status updates",
      "POST /client-created - Send welcome emails to new clients",
      "POST /zapier - Universal Zapier integration endpoint"
    ],
    outboundEndpoints: [
      "GET /configs - List webhook configurations",
      "POST /configs - Create new webhook configuration",
      "PUT /configs/:id - Update webhook configuration",
      "DELETE /configs/:id - Delete webhook configuration",
      "GET /configs/:id/logs - View webhook delivery logs",
      "POST /configs/:id/test - Send test webhook"
    ],
    supportedEvents: [
      "lead.created",
      "booking.created",
      "booking.status_changed",
      "client.created",
      "client.note_added",
      "*"
    ]
  });
});

export default router;
