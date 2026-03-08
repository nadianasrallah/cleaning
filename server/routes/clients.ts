import { Router } from "express";
import { db } from "../db";
import { clients, users, bookings } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { authMiddleware, requireRole, requireCompany } from "../middleware/auth";
import { hashPassword } from "../lib/auth";
import { z } from "zod";

const router = Router();

const createClientSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  propertyType: z.string().optional(),
  bedrooms: z.coerce.number().optional(),
  bathrooms: z.coerce.number().optional(),
  squareFeet: z.union([z.coerce.number(), z.literal('')]).optional().transform(val => val === '' ? undefined : val),
  accessInstructions: z.string().optional(),
  notes: z.string().optional(),
  source: z.string().optional(),
});

const updateClientSchema = createClientSchema.partial().omit({ email: true, password: true });

router.get("/", authMiddleware, requireCompany, async (req, res) => {
  try {
    const companyClients = await db.select({
      client: clients,
      user: {
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(clients)
    .innerJoin(users, eq(clients.userId, users.id))
    .where(and(eq(clients.companyId, req.user!.companyId!), eq(clients.isActive, true)))
    .orderBy(desc(clients.createdAt));

    res.json({ clients: companyClients });
  } catch (error) {
    console.error("Get clients error:", error);
    res.status(500).json({ error: "Failed to get clients" });
  }
});

router.get("/:id", authMiddleware, requireCompany, async (req, res) => {
  try {
    const [result] = await db.select({
      client: clients,
      user: {
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(clients)
    .innerJoin(users, eq(clients.userId, users.id))
    .where(and(
      eq(clients.id, parseInt(req.params.id)),
      eq(clients.companyId, req.user!.companyId!)
    ))
    .limit(1);

    if (!result) {
      return res.status(404).json({ error: "Client not found" });
    }

    const clientBookings = await db.select()
      .from(bookings)
      .where(eq(bookings.clientId, parseInt(req.params.id)))
      .orderBy(desc(bookings.scheduledDate));

    res.json({ ...result, bookings: clientBookings });
  } catch (error) {
    console.error("Get client error:", error);
    res.status(500).json({ error: "Failed to get client" });
  }
});

router.post("/", authMiddleware, requireCompany, async (req, res) => {
  try {
    const data = createClientSchema.parse(req.body);
    
    let [existingUser] = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
    
    if (!existingUser) {
      const hashedPassword = data.password ? await hashPassword(data.password) : await hashPassword(Math.random().toString(36).slice(-8));
      
      [existingUser] = await db.insert(users).values({
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
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
      return res.status(400).json({ error: "Client already exists for this company" });
    }

    const [newClient] = await db.insert(clients).values({
      userId: existingUser.id,
      companyId: req.user!.companyId!,
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      propertyType: data.propertyType,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms?.toString(),
      squareFeet: data.squareFeet,
      accessInstructions: data.accessInstructions,
      notes: data.notes,
      source: data.source,
    }).returning();

    res.json({
      client: newClient,
      user: {
        id: existingUser.id,
        email: existingUser.email,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        phone: existingUser.phone,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error("Create client error:", error);
    res.status(500).json({ error: "Failed to create client" });
  }
});

router.put("/:id", authMiddleware, requireCompany, async (req, res) => {
  try {
    const data = updateClientSchema.parse(req.body);
    
    const [existing] = await db.select().from(clients)
      .where(and(
        eq(clients.id, parseInt(req.params.id)),
        eq(clients.companyId, req.user!.companyId!)
      ))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: "Client not found" });
    }

    if (data.firstName || data.lastName || data.phone) {
      await db.update(users).set({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        updatedAt: new Date(),
      }).where(eq(users.id, existing.userId));
    }

    const [updated] = await db
      .update(clients)
      .set({
        ...data,
        bathrooms: data.bathrooms?.toString(),
        updatedAt: new Date(),
      })
      .where(eq(clients.id, parseInt(req.params.id)))
      .returning();

    res.json({ client: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error("Update client error:", error);
    res.status(500).json({ error: "Failed to update client" });
  }
});

router.delete("/:id", authMiddleware, requireCompany, requireRole("owner", "admin"), async (req, res) => {
  try {
    const [existing] = await db.select().from(clients)
      .where(and(
        eq(clients.id, parseInt(req.params.id)),
        eq(clients.companyId, req.user!.companyId!)
      ))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: "Client not found" });
    }

    await db.update(clients).set({ isActive: false, updatedAt: new Date() }).where(eq(clients.id, parseInt(req.params.id)));

    res.json({ success: true });
  } catch (error) {
    console.error("Delete client error:", error);
    res.status(500).json({ error: "Failed to delete client" });
  }
});

export default router;
