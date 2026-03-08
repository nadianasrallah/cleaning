import { Router } from "express";
import { db } from "../db";
import { users, companies, companyBranding, staff, clients } from "../db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, generateToken, getUserByEmail } from "../lib/auth";
import { authMiddleware } from "../middleware/auth";
import { z } from "zod";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  role: z.enum(["owner", "client"]).default("client"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post("/register", async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    
    const existingUser = await getUserByEmail(data.email);
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
      role: data.role,
    }).returning();

    if (data.role === "owner" && data.companyName) {
      const slug = data.companyName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
      
      const [company] = await db.insert(companies).values({
        name: data.companyName,
        slug,
        ownerId: newUser.id,
        email: data.email,
        phone: data.phone,
      }).returning();

      await db.update(users).set({ companyId: company.id }).where(eq(users.id, newUser.id));

      await db.insert(companyBranding).values({
        companyId: company.id,
      });

      await db.insert(staff).values({
        userId: newUser.id,
        companyId: company.id,
        role: "owner",
      });

      const token = generateToken({
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
        companyId: company.id,
      });

      return res.json({
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
          companyId: company.id,
        },
        company: {
          id: company.id,
          name: company.name,
          slug: company.slug,
        },
      });
    }

    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    res.json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Registration error:", error);
    res.status(500).json({ error: "Failed to register" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    
    const user = await getUserByEmail(data.email);
    if (!user || !user.password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValid = await verifyPassword(data.password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId || undefined,
    });

    let company = null;
    if (user.companyId) {
      const [c] = await db.select().from(companies).where(eq(companies.id, user.companyId)).limit(1);
      company = c;
    }

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId,
        avatarUrl: user.avatarUrl,
      },
      company: company ? {
        id: company.id,
        name: company.name,
        slug: company.slug,
      } : null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to login" });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, req.user!.userId)).limit(1);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let company = null;
    let branding = null;
    
    if (user.companyId) {
      const [c] = await db.select().from(companies).where(eq(companies.id, user.companyId)).limit(1);
      company = c;
      
      if (company) {
        const [b] = await db.select().from(companyBranding).where(eq(companyBranding.companyId, company.id)).limit(1);
        branding = b;
      }
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        companyId: user.companyId,
        avatarUrl: user.avatarUrl,
      },
      company: company ? {
        id: company.id,
        name: company.name,
        slug: company.slug,
        subscriptionTier: company.subscriptionTier,
        subscriptionStatus: company.subscriptionStatus,
      } : null,
      branding,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
});

export default router;
