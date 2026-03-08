import { Router } from "express";
import { db } from "../db";
import { users, companies, clients, bookings, invoices } from "../db/schema";
import { eq, sql } from "drizzle-orm";
import { authMiddleware, requireCompany } from "../middleware/auth";
import { getUncachableStripeClient, getStripePublishableKey, isStripeConfigured } from "../services/stripe";

const router = Router();

router.get("/config", async (req, res) => {
  try {
    if (!isStripeConfigured()) {
      return res.json({ configured: false, message: 'Stripe not configured' });
    }
    const publishableKey = await getStripePublishableKey();
    res.json({ configured: true, publishableKey });
  } catch (error: any) {
    console.error("Stripe config error:", error);
    res.json({ configured: false, message: error.message });
  }
});

router.get("/products", async (req, res) => {
  try {
    const result = await db.execute(sql`
      SELECT 
        p.id as product_id,
        p.name as product_name,
        p.description as product_description,
        p.active as product_active,
        p.metadata as product_metadata,
        pr.id as price_id,
        pr.unit_amount,
        pr.currency,
        pr.recurring,
        pr.active as price_active
      FROM stripe.products p
      LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
      WHERE p.active = true
      ORDER BY p.name, pr.unit_amount
    `);

    const productsMap = new Map();
    for (const row of result.rows as any[]) {
      if (!productsMap.has(row.product_id)) {
        productsMap.set(row.product_id, {
          id: row.product_id,
          name: row.product_name,
          description: row.product_description,
          active: row.product_active,
          metadata: row.product_metadata,
          prices: []
        });
      }
      if (row.price_id) {
        productsMap.get(row.product_id).prices.push({
          id: row.price_id,
          unit_amount: row.unit_amount,
          currency: row.currency,
          recurring: row.recurring,
          active: row.price_active,
        });
      }
    }

    res.json({ products: Array.from(productsMap.values()) });
  } catch (error: any) {
    console.error("Get products error:", error);
    res.status(500).json({ error: "Failed to get products" });
  }
});

router.post("/create-checkout-session", authMiddleware, async (req, res) => {
  try {
    const { priceId, bookingId, successUrl, cancelUrl } = req.body;
    const userId = req.user!.userId;

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const stripe = await getUncachableStripeClient();

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: { userId: userId.toString() },
      });
      customerId = customer.id;
      
      await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, userId));
    }

    const sessionParams: any = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      success_url: successUrl || `${req.protocol}://${req.get('host')}/client/bookings?success=true`,
      cancel_url: cancelUrl || `${req.protocol}://${req.get('host')}/client/bookings?cancelled=true`,
    };

    if (bookingId) {
      sessionParams.metadata = { bookingId: bookingId.toString() };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    res.json({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error("Create checkout session error:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

router.post("/create-subscription-checkout", authMiddleware, requireCompany, async (req, res) => {
  try {
    const { priceId, successUrl, cancelUrl } = req.body;
    const companyId = req.user!.companyId;

    const [company] = await db.select().from(companies).where(eq(companies.id, companyId!)).limit(1);
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    const stripe = await getUncachableStripeClient();

    let customerId = company.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: company.email || undefined,
        name: company.name,
        metadata: { companyId: company.id },
      });
      customerId = customer.id;

      await db.update(companies).set({ stripeCustomerId: customerId }).where(eq(companies.id, company.id));
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl || `${req.protocol}://${req.get('host')}/admin/settings?subscription=success`,
      cancel_url: cancelUrl || `${req.protocol}://${req.get('host')}/admin/settings?subscription=cancelled`,
      metadata: { companyId: company.id },
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error("Create subscription checkout error:", error);
    res.status(500).json({ error: "Failed to create subscription checkout" });
  }
});

router.post("/create-portal-session", authMiddleware, requireCompany, async (req, res) => {
  try {
    const companyId = req.user!.companyId;

    const [company] = await db.select().from(companies).where(eq(companies.id, companyId!)).limit(1);
    if (!company?.stripeCustomerId) {
      return res.status(400).json({ error: "No Stripe customer found" });
    }

    const stripe = await getUncachableStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: company.stripeCustomerId,
      return_url: `${req.protocol}://${req.get('host')}/admin/settings`,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error("Create portal session error:", error);
    res.status(500).json({ error: "Failed to create portal session" });
  }
});

router.post("/create-invoice-payment", authMiddleware, async (req, res) => {
  try {
    const { invoiceId, successUrl, cancelUrl } = req.body;
    const userId = req.user!.userId;

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ error: "Invoice already paid" });
    }

    const stripe = await getUncachableStripeClient();

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: { userId: userId.toString() },
      });
      customerId = customer.id;
      await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, userId));
    }

    const amount = Math.round(parseFloat(invoice.totalAmount || invoice.amount || '0') * 100);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Invoice #${invoice.invoiceNumber}`,
            description: `Payment for cleaning service`,
          },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: successUrl || `${req.protocol}://${req.get('host')}/client/invoices?paid=${invoiceId}`,
      cancel_url: cancelUrl || `${req.protocol}://${req.get('host')}/client/invoices`,
      metadata: { invoiceId: invoiceId.toString() },
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error("Create invoice payment error:", error);
    res.status(500).json({ error: "Failed to create invoice payment" });
  }
});

router.post("/create-payment-intent", authMiddleware, async (req, res) => {
  try {
    const { amount, bookingId, invoiceId } = req.body;
    const userId = req.user!.userId;

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const stripe = await getUncachableStripeClient();

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: { userId: userId.toString() },
      });
      customerId = customer.id;
      await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, userId));
    }

    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      customer: customerId,
      metadata: { 
        userId: userId.toString(),
        bookingId: bookingId?.toString() || '',
        invoiceId: invoiceId?.toString() || ''
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error("Create payment intent error:", error);
    res.status(500).json({ error: "Failed to create payment intent" });
  }
});

router.get("/subscription", authMiddleware, requireCompany, async (req, res) => {
  try {
    const companyId = req.user!.companyId;

    const [company] = await db.select().from(companies).where(eq(companies.id, companyId!)).limit(1);
    if (!company?.stripeSubscriptionId) {
      return res.json({ subscription: null });
    }

    const result = await db.execute(sql`
      SELECT * FROM stripe.subscriptions WHERE id = ${company.stripeSubscriptionId}
    `);

    res.json({ subscription: result.rows[0] || null });
  } catch (error: any) {
    console.error("Get subscription error:", error);
    res.status(500).json({ error: "Failed to get subscription" });
  }
});

export default router;
