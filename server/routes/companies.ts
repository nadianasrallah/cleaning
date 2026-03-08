import { Router } from "express";
import { db } from "../db";
import { companies, companyBranding, services, staff, users } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { authMiddleware, requireRole, requireCompany } from "../middleware/auth";
import { z } from "zod";

const router = Router();

const updateCompanySchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  timezone: z.string().optional(),
});

const updateBrandingSchema = z.object({
  logoUrl: z.string().url().optional().nullable(),
  faviconUrl: z.string().url().optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  fontFamily: z.string().optional(),
  customDomain: z.string().optional().nullable(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

router.get("/current", authMiddleware, requireCompany, async (req, res) => {
  try {
    const [company] = await db.select().from(companies).where(eq(companies.id, req.user!.companyId!)).limit(1);
    
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    const [branding] = await db.select().from(companyBranding).where(eq(companyBranding.companyId, company.id)).limit(1);

    res.json({ company, branding });
  } catch (error) {
    console.error("Get company error:", error);
    res.status(500).json({ error: "Failed to get company" });
  }
});

router.put("/current", authMiddleware, requireCompany, requireRole("owner", "admin"), async (req, res) => {
  try {
    const data = updateCompanySchema.parse(req.body);
    
    const [updated] = await db
      .update(companies)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(companies.id, req.user!.companyId!))
      .returning();

    res.json({ company: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Update company error:", error);
    res.status(500).json({ error: "Failed to update company" });
  }
});

router.put("/current/branding", authMiddleware, requireCompany, requireRole("owner", "admin"), async (req, res) => {
  try {
    const data = updateBrandingSchema.parse(req.body);
    
    const [existing] = await db.select().from(companyBranding).where(eq(companyBranding.companyId, req.user!.companyId!)).limit(1);

    if (existing) {
      const [updated] = await db
        .update(companyBranding)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(companyBranding.companyId, req.user!.companyId!))
        .returning();
      return res.json({ branding: updated });
    }

    const [created] = await db.insert(companyBranding).values({
      companyId: req.user!.companyId!,
      ...data,
    }).returning();

    res.json({ branding: created });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Update branding error:", error);
    res.status(500).json({ error: "Failed to update branding" });
  }
});

router.get("/by-slug/:slug", async (req, res) => {
  try {
    const [company] = await db.select().from(companies)
      .where(and(eq(companies.slug, req.params.slug), eq(companies.isActive, true)))
      .limit(1);
    
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    const [branding] = await db.select().from(companyBranding).where(eq(companyBranding.companyId, company.id)).limit(1);

    const companyServices = await db.select().from(services)
      .where(and(eq(services.companyId, company.id), eq(services.isActive, true)));

    res.json({
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        email: company.email,
        phone: company.phone,
      },
      branding,
      services: companyServices,
    });
  } catch (error) {
    console.error("Get company by slug error:", error);
    res.status(500).json({ error: "Failed to get company" });
  }
});

router.get("/by-domain/:domain", async (req, res) => {
  try {
    const [branding] = await db.select().from(companyBranding)
      .where(and(
        eq(companyBranding.customDomain, req.params.domain),
        eq(companyBranding.customDomainVerified, true)
      ))
      .limit(1);
    
    if (!branding) {
      return res.status(404).json({ error: "Company not found" });
    }

    const [company] = await db.select().from(companies)
      .where(and(eq(companies.id, branding.companyId), eq(companies.isActive, true)))
      .limit(1);

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    const companyServices = await db.select().from(services)
      .where(and(eq(services.companyId, company.id), eq(services.isActive, true)));

    res.json({
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        email: company.email,
        phone: company.phone,
      },
      branding,
      services: companyServices,
    });
  } catch (error) {
    console.error("Get company by domain error:", error);
    res.status(500).json({ error: "Failed to get company" });
  }
});

router.post("/current/domain/verify", authMiddleware, requireCompany, requireRole("owner", "admin"), async (req, res) => {
  const dns = await import('dns').then(m => m.promises);
  
  try {
    const { domain } = req.body;
    
    if (!domain) {
      return res.status(400).json({ error: "Domain is required" });
    }

    const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    const [existingBranding] = await db.select()
      .from(companyBranding)
      .where(eq(companyBranding.companyId, req.user!.companyId!))
      .limit(1);

    if (!existingBranding) {
      await db.insert(companyBranding).values({
        companyId: req.user!.companyId!,
        customDomain: cleanDomain,
        customDomainVerified: false
      });
    } else {
      await db.update(companyBranding)
        .set({ 
          customDomain: cleanDomain,
          customDomainVerified: false,
          updatedAt: new Date()
        })
        .where(eq(companyBranding.companyId, req.user!.companyId!));
    }

    let dnsVerified = false;
    let verificationMethod = '';
    let dnsRecords: string[] = [];

    const expectedTargets = [
      process.env.REPLIT_DEV_DOMAIN || '',
      'cleanpro.replit.dev',
      'cleanpro.app',
      'replit.dev'
    ].filter(Boolean);

    try {
      const cnameRecords = await dns.resolveCname(cleanDomain);
      dnsRecords = cnameRecords;
      
      dnsVerified = cnameRecords.some(record => 
        expectedTargets.some(target => record.toLowerCase().includes(target.toLowerCase()))
      );
      verificationMethod = 'CNAME';
    } catch (cnameError: any) {
      try {
        const aRecords = await dns.resolve4(cleanDomain);
        dnsRecords = aRecords;
        
        let platformIPs: string[] = [];
        try {
          const replitDevDomain = process.env.REPLIT_DEV_DOMAIN || 'cleanpro.replit.dev';
          platformIPs = await dns.resolve4(replitDevDomain);
        } catch (e) {
          platformIPs = [];
        }
        
        if (platformIPs.length > 0) {
          dnsVerified = aRecords.some(ip => platformIPs.includes(ip));
        } else {
          dnsVerified = false;
        }
        verificationMethod = 'A';
      } catch (aError) {
        dnsVerified = false;
      }
    }

    if (dnsVerified) {
      await db.update(companyBranding)
        .set({ 
          customDomainVerified: true,
          updatedAt: new Date()
        })
        .where(eq(companyBranding.companyId, req.user!.companyId!));
    }

    res.json({
      domain: cleanDomain,
      verified: dnsVerified,
      verificationMethod,
      dnsRecords,
      message: dnsVerified 
        ? 'Domain verified successfully!' 
        : 'Domain not verified. Please add a CNAME record pointing to your CleanPro subdomain.',
      instructions: !dnsVerified ? {
        type: 'CNAME',
        host: cleanDomain.startsWith('www.') ? 'www' : '@',
        value: process.env.REPLIT_DEV_DOMAIN || 'cleanpro.replit.dev',
        note: 'Add this DNS record with your domain registrar, then try verification again.'
      } : undefined
    });
  } catch (error: any) {
    console.error("Domain verification error:", error);
    res.status(500).json({ error: "Failed to verify domain" });
  }
});

router.get("/current/domain/status", authMiddleware, requireCompany, async (req, res) => {
  try {
    const [branding] = await db.select({
      customDomain: companyBranding.customDomain,
      customDomainVerified: companyBranding.customDomainVerified
    })
    .from(companyBranding)
    .where(eq(companyBranding.companyId, req.user!.companyId!))
    .limit(1);

    if (!branding || !branding.customDomain) {
      return res.json({
        configured: false,
        domain: null,
        verified: false
      });
    }

    res.json({
      configured: true,
      domain: branding.customDomain,
      verified: branding.customDomainVerified || false,
      instructions: !branding.customDomainVerified ? {
        type: 'CNAME',
        host: branding.customDomain.startsWith('www.') ? 'www' : '@',
        value: process.env.REPLIT_DEV_DOMAIN || 'cleanpro.replit.dev',
        note: 'Add this DNS record with your domain registrar, then try verification again.'
      } : undefined
    });
  } catch (error: any) {
    console.error("Domain status error:", error);
    res.status(500).json({ error: "Failed to get domain status" });
  }
});

export default router;
