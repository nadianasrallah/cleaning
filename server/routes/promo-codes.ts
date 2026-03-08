import { Router } from "express";
import { db } from "../db";
import { promoCodes } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { authMiddleware, requireRole, requireCompany, optionalAuth } from "../middleware/auth";
import { z } from "zod";

const router = Router();

const promoCodeSchema = z.object({
  code: z.string().min(3).max(50).transform(s => s.toUpperCase()),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.string().or(z.number()).transform(v => String(v)),
  maxUses: z.number().optional(),
  minOrderAmount: z.string().or(z.number()).transform(v => String(v)).optional(),
  validFrom: z.string().transform(s => new Date(s)).optional(),
  validUntil: z.string().transform(s => new Date(s)).optional(),
  isActive: z.boolean().default(true),
});

router.get("/", authMiddleware, requireCompany, async (req, res) => {
  try {
    const codes = await db.select()
      .from(promoCodes)
      .where(eq(promoCodes.companyId, req.user!.companyId!));

    res.json({ promoCodes: codes });
  } catch (error) {
    console.error("Get promo codes error:", error);
    res.status(500).json({ error: "Failed to get promo codes" });
  }
});

router.post("/", authMiddleware, requireCompany, requireRole("owner", "admin"), async (req, res) => {
  try {
    const data = promoCodeSchema.parse(req.body);
    
    const [existing] = await db.select().from(promoCodes)
      .where(and(
        eq(promoCodes.companyId, req.user!.companyId!),
        eq(promoCodes.code, data.code)
      ))
      .limit(1);

    if (existing) {
      return res.status(400).json({ error: "Promo code already exists" });
    }

    const [newCode] = await db.insert(promoCodes).values({
      companyId: req.user!.companyId!,
      ...data,
    }).returning();

    res.json({ promoCode: newCode });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Create promo code error:", error);
    res.status(500).json({ error: "Failed to create promo code" });
  }
});

router.put("/:id", authMiddleware, requireCompany, requireRole("owner", "admin"), async (req, res) => {
  try {
    const data = promoCodeSchema.partial().parse(req.body);
    
    const [existing] = await db.select().from(promoCodes)
      .where(and(
        eq(promoCodes.id, parseInt(req.params.id)),
        eq(promoCodes.companyId, req.user!.companyId!)
      ))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: "Promo code not found" });
    }

    const [updated] = await db
      .update(promoCodes)
      .set(data)
      .where(eq(promoCodes.id, parseInt(req.params.id)))
      .returning();

    res.json({ promoCode: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Update promo code error:", error);
    res.status(500).json({ error: "Failed to update promo code" });
  }
});

router.delete("/:id", authMiddleware, requireCompany, requireRole("owner", "admin"), async (req, res) => {
  try {
    const [existing] = await db.select().from(promoCodes)
      .where(and(
        eq(promoCodes.id, parseInt(req.params.id)),
        eq(promoCodes.companyId, req.user!.companyId!)
      ))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: "Promo code not found" });
    }

    await db.update(promoCodes)
      .set({ isActive: false })
      .where(eq(promoCodes.id, parseInt(req.params.id)));

    res.json({ success: true });
  } catch (error) {
    console.error("Delete promo code error:", error);
    res.status(500).json({ error: "Failed to delete promo code" });
  }
});

router.post("/validate", optionalAuth, async (req, res) => {
  try {
    const { code, companySlug, orderAmount } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: "Promo code is required" });
    }

    let companyId = req.user?.companyId;

    if (!companyId && companySlug) {
      const { companies } = await import("../db/schema");
      const [company] = await db.select().from(companies).where(eq(companies.slug, companySlug)).limit(1);
      if (company) {
        companyId = company.id;
      }
    }

    if (!companyId) {
      return res.status(400).json({ error: "Company not found" });
    }

    const [promoCode] = await db.select().from(promoCodes)
      .where(and(
        eq(promoCodes.companyId, companyId),
        eq(promoCodes.code, code.toUpperCase()),
        eq(promoCodes.isActive, true)
      ))
      .limit(1);

    if (!promoCode) {
      return res.status(404).json({ error: "Invalid promo code" });
    }

    const now = new Date();
    if (promoCode.validFrom && promoCode.validFrom > now) {
      return res.status(400).json({ error: "Promo code is not yet valid" });
    }
    
    if (promoCode.validUntil && promoCode.validUntil < now) {
      return res.status(400).json({ error: "Promo code has expired" });
    }

    if (promoCode.maxUses && promoCode.usedCount && promoCode.usedCount >= promoCode.maxUses) {
      return res.status(400).json({ error: "Promo code has reached maximum uses" });
    }

    if (promoCode.minOrderAmount && orderAmount && parseFloat(orderAmount) < parseFloat(promoCode.minOrderAmount)) {
      return res.status(400).json({ error: `Minimum order amount is $${promoCode.minOrderAmount}` });
    }

    let discount = 0;
    if (orderAmount) {
      if (promoCode.discountType === "percentage") {
        discount = (parseFloat(orderAmount) * parseFloat(promoCode.discountValue)) / 100;
      } else {
        discount = parseFloat(promoCode.discountValue);
      }
    }

    res.json({
      valid: true,
      promoCode: {
        code: promoCode.code,
        discountType: promoCode.discountType,
        discountValue: promoCode.discountValue,
      },
      discount,
    });
  } catch (error) {
    console.error("Validate promo code error:", error);
    res.status(500).json({ error: "Failed to validate promo code" });
  }
});

export default router;
