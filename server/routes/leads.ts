import { Router } from "express";
import { db } from "../db";
import { leads, clients, users } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { authMiddleware, requireCompany, optionalAuth } from "../middleware/auth";
import { hashPassword } from "../lib/auth";
import { z } from "zod";

const router = Router();

const createLeadSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  source: z.string().optional(),
  eventType: z.string().optional(),
  buildingName: z.string().optional(),
  notes: z.string().optional(),
  companySlug: z.string().optional(),
});

const updateLeadSchema = z.object({
  status: z.enum(["new", "contacted", "qualified", "converted", "lost"]).optional(),
  score: z.number().optional(),
  notes: z.string().optional(),
});

router.get("/", authMiddleware, requireCompany, async (req, res) => {
  try {
    const { status, source } = req.query;
    
    let companyLeads = await db.select().from(leads)
      .where(eq(leads.companyId, req.user!.companyId!))
      .orderBy(desc(leads.createdAt));

    if (status) {
      companyLeads = companyLeads.filter(l => l.status === status);
    }
    
    if (source) {
      companyLeads = companyLeads.filter(l => l.source === source);
    }

    res.json({ leads: companyLeads });
  } catch (error) {
    console.error("Get leads error:", error);
    res.status(500).json({ error: "Failed to get leads" });
  }
});

router.post("/", optionalAuth, async (req, res) => {
  try {
    const data = createLeadSchema.parse(req.body);
    
    let companyId = req.user?.companyId;

    if (!companyId && data.companySlug) {
      const { companies } = await import("../db/schema");
      const [company] = await db.select().from(companies).where(eq(companies.slug, data.companySlug)).limit(1);
      if (company) {
        companyId = company.id;
      }
    }

    if (!companyId) {
      const { companies } = await import("../db/schema");
      const [defaultCompany] = await db.select().from(companies).limit(1);
      if (defaultCompany) {
        companyId = defaultCompany.id;
      } else {
        return res.status(400).json({ error: "No company found" });
      }
    }

    const [newLead] = await db.insert(leads).values({
      companyId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      source: data.source || "website",
      eventType: data.eventType,
      buildingName: data.buildingName,
      notes: data.notes,
      score: 10,
    }).returning();

    res.json({ lead: newLead, success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Create lead error:", error);
    res.status(500).json({ error: "Failed to create lead" });
  }
});

router.put("/:id", authMiddleware, requireCompany, async (req, res) => {
  try {
    const data = updateLeadSchema.parse(req.body);
    
    const [existing] = await db.select().from(leads)
      .where(and(
        eq(leads.id, parseInt(req.params.id)),
        eq(leads.companyId, req.user!.companyId!)
      ))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: "Lead not found" });
    }

    const [updated] = await db
      .update(leads)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(leads.id, parseInt(req.params.id)))
      .returning();

    res.json({ lead: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Update lead error:", error);
    res.status(500).json({ error: "Failed to update lead" });
  }
});

router.post("/:id/convert", authMiddleware, requireCompany, async (req, res) => {
  try {
    const [lead] = await db.select().from(leads)
      .where(and(
        eq(leads.id, parseInt(req.params.id)),
        eq(leads.companyId, req.user!.companyId!)
      ))
      .limit(1);

    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    if (!lead.email) {
      return res.status(400).json({ error: "Lead must have an email to convert" });
    }

    let [existingUser] = await db.select().from(users).where(eq(users.email, lead.email)).limit(1);
    
    if (!existingUser) {
      const tempPassword = await hashPassword(Math.random().toString(36).slice(-8));
      [existingUser] = await db.insert(users).values({
        email: lead.email,
        password: tempPassword,
        firstName: lead.firstName,
        lastName: lead.lastName,
        phone: lead.phone,
        role: "client",
      }).returning();
    }

    const [existingClient] = await db.select().from(clients)
      .where(and(
        eq(clients.userId, existingUser.id),
        eq(clients.companyId, req.user!.companyId!)
      ))
      .limit(1);

    if (existingClient) {
      return res.status(400).json({ error: "Client already exists" });
    }

    const [newClient] = await db.insert(clients).values({
      userId: existingUser.id,
      companyId: req.user!.companyId!,
      source: lead.source || "lead",
      notes: lead.notes,
    }).returning();

    await db.update(leads).set({
      status: "converted",
      convertedToClientId: newClient.id,
      convertedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(leads.id, lead.id));

    res.json({
      success: true,
      client: newClient,
      user: {
        id: existingUser.id,
        email: existingUser.email,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
      },
    });
  } catch (error) {
    console.error("Convert lead error:", error);
    res.status(500).json({ error: "Failed to convert lead" });
  }
});

export default router;
