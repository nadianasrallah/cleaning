import { Router } from "express";
import { db } from "../db";
import { staff, users } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { authMiddleware, requireRole, requireCompany } from "../middleware/auth";
import { hashPassword } from "../lib/auth";
import { z } from "zod";

const router = Router();

const createStaffSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  role: z.enum(["admin", "cleaner", "manager"]).default("cleaner"),
  hourlyRate: z.string().or(z.number()).transform(v => String(v)).optional(),
  skills: z.array(z.string()).optional(),
});

const updateStaffSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  role: z.enum(["admin", "cleaner", "manager"]).optional(),
  hourlyRate: z.string().or(z.number()).transform(v => String(v)).optional(),
  skills: z.array(z.string()).optional(),
  availability: z.record(z.object({
    start: z.string(),
    end: z.string(),
  })).optional(),
  isActive: z.boolean().optional(),
});

router.get("/", authMiddleware, requireCompany, async (req, res) => {
  try {
    const staffMembers = await db.select({
      staff: staff,
      user: {
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(staff)
    .innerJoin(users, eq(staff.userId, users.id))
    .where(eq(staff.companyId, req.user!.companyId!));

    res.json({ staff: staffMembers });
  } catch (error) {
    console.error("Get staff error:", error);
    res.status(500).json({ error: "Failed to get staff" });
  }
});

router.post("/", authMiddleware, requireCompany, requireRole("owner", "admin"), async (req, res) => {
  try {
    const data = createStaffSchema.parse(req.body);
    
    const [existingUser] = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await hashPassword(data.password);

    const [newUser] = await db.insert(users).values({
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: "staff",
      companyId: req.user!.companyId,
    }).returning();

    const [newStaff] = await db.insert(staff).values({
      userId: newUser.id,
      companyId: req.user!.companyId!,
      role: data.role,
      hourlyRate: data.hourlyRate,
      skills: data.skills || [],
      hireDate: new Date(),
    }).returning();

    res.json({
      staff: newStaff,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        phone: newUser.phone,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Create staff error:", error);
    res.status(500).json({ error: "Failed to create staff" });
  }
});

router.put("/:id", authMiddleware, requireCompany, requireRole("owner", "admin"), async (req, res) => {
  try {
    const data = updateStaffSchema.parse(req.body);
    
    const [existing] = await db.select().from(staff)
      .where(and(
        eq(staff.id, parseInt(req.params.id)),
        eq(staff.companyId, req.user!.companyId!)
      ))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: "Staff member not found" });
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
      .update(staff)
      .set({
        role: data.role,
        hourlyRate: data.hourlyRate,
        skills: data.skills,
        availability: data.availability,
        isActive: data.isActive,
        updatedAt: new Date(),
      })
      .where(eq(staff.id, parseInt(req.params.id)))
      .returning();

    res.json({ staff: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Update staff error:", error);
    res.status(500).json({ error: "Failed to update staff" });
  }
});

router.delete("/:id", authMiddleware, requireCompany, requireRole("owner", "admin"), async (req, res) => {
  try {
    const [existing] = await db.select().from(staff)
      .where(and(
        eq(staff.id, parseInt(req.params.id)),
        eq(staff.companyId, req.user!.companyId!)
      ))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    await db.update(staff).set({ isActive: false, updatedAt: new Date() }).where(eq(staff.id, parseInt(req.params.id)));
    await db.update(users).set({ isActive: false, updatedAt: new Date() }).where(eq(users.id, existing.userId));

    res.json({ success: true });
  } catch (error) {
    console.error("Delete staff error:", error);
    res.status(500).json({ error: "Failed to delete staff" });
  }
});

export default router;
