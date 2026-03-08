import { Router } from "express";
import { db } from "../db";
import { services } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { authMiddleware, requireRole, requireCompany } from "../middleware/auth";
import { z } from "zod";

const router = Router();

const serviceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  basePrice: z.string().or(z.number()).transform(v => String(v)),
  pricePerBedroom: z.string().or(z.number()).transform(v => String(v)).optional(),
  pricePerBathroom: z.string().or(z.number()).transform(v => String(v)).optional(),
  durationMinutes: z.number().min(15).default(60),
  isActive: z.boolean().default(true),
});

router.get("/", authMiddleware, requireCompany, async (req, res) => {
  try {
    const companyServices = await db.select().from(services)
      .where(eq(services.companyId, req.user!.companyId!));

    res.json({ services: companyServices });
  } catch (error) {
    console.error("Get services error:", error);
    res.status(500).json({ error: "Failed to get services" });
  }
});

router.post("/", authMiddleware, requireCompany, requireRole("owner", "admin"), async (req, res) => {
  try {
    const data = serviceSchema.parse(req.body);
    
    const [newService] = await db.insert(services).values({
      companyId: req.user!.companyId!,
      name: data.name,
      description: data.description,
      basePrice: data.basePrice,
      pricePerBedroom: data.pricePerBedroom,
      pricePerBathroom: data.pricePerBathroom,
      durationMinutes: data.durationMinutes,
      isActive: data.isActive,
    }).returning();

    res.json({ service: newService });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error("Create service error:", error);
    res.status(500).json({ error: "Failed to create service" });
  }
});

router.put("/:id", authMiddleware, requireCompany, requireRole("owner", "admin"), async (req, res) => {
  try {
    const data = serviceSchema.partial().parse(req.body);
    
    const [existing] = await db.select().from(services)
      .where(and(
        eq(services.id, req.params.id),
        eq(services.companyId, req.user!.companyId!)
      ))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: "Service not found" });
    }

    const [updated] = await db
      .update(services)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(services.id, req.params.id))
      .returning();

    res.json({ service: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error("Update service error:", error);
    res.status(500).json({ error: "Failed to update service" });
  }
});

router.delete("/:id", authMiddleware, requireCompany, requireRole("owner", "admin"), async (req, res) => {
  try {
    const [existing] = await db.select().from(services)
      .where(and(
        eq(services.id, req.params.id),
        eq(services.companyId, req.user!.companyId!)
      ))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: "Service not found" });
    }

    await db
      .update(services)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(services.id, req.params.id));

    res.json({ success: true });
  } catch (error) {
    console.error("Delete service error:", error);
    res.status(500).json({ error: "Failed to delete service" });
  }
});

export default router;
