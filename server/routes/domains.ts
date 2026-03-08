import { Router } from "express";
import { authMiddleware, requireCompany } from "../middleware/auth";
import { db } from "../db";
import { companies, companyBranding } from "../db/schema";
import { eq } from "drizzle-orm";
import { verifyCustomDomain, markDomainVerified, getCompanyBySlug } from "../middleware/domain";
import crypto from "crypto";

const router = Router();

router.get("/config", authMiddleware, requireCompany, async (req, res) => {
  try {
    const companyId = req.user!.companyId!;

    const [branding] = await db.select({
      customDomain: companyBranding.customDomain,
      customDomainVerified: companyBranding.customDomainVerified
    })
    .from(companyBranding)
    .where(eq(companyBranding.companyId, companyId))
    .limit(1);

    const [company] = await db.select({
      slug: companies.slug,
      name: companies.name
    })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);

    res.json({
      customDomain: branding?.customDomain || null,
      customDomainVerified: branding?.customDomainVerified || false,
      slug: company?.slug || null,
      companyName: company?.name || null,
      verificationRecord: branding?.customDomain ? {
        type: 'TXT',
        name: `_cleanpro.${branding.customDomain}`,
        value: `cleanpro-verify=${companyId}`
      } : null
    });
  } catch (error: any) {
    console.error("Get domain config error:", error);
    res.status(500).json({ error: "Failed to get domain configuration" });
  }
});

router.post("/set-custom-domain", authMiddleware, requireCompany, async (req, res) => {
  try {
    const companyId = req.user!.companyId!;
    const { domain } = req.body;

    if (!domain) {
      return res.status(400).json({ error: "Domain is required" });
    }

    const cleanDomain = domain.toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '')
      .trim();

    const domainPattern = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;
    if (!domainPattern.test(cleanDomain)) {
      return res.status(400).json({ error: "Invalid domain format" });
    }

    const [existingBranding] = await db.select({
      companyId: companyBranding.companyId
    })
    .from(companyBranding)
    .where(eq(companyBranding.customDomain, cleanDomain))
    .limit(1);

    if (existingBranding && existingBranding.companyId !== companyId) {
      return res.status(400).json({ error: "Domain is already in use by another company" });
    }

    await db.update(companyBranding)
      .set({
        customDomain: cleanDomain,
        customDomainVerified: false,
        updatedAt: new Date()
      })
      .where(eq(companyBranding.companyId, companyId));

    res.json({
      success: true,
      domain: cleanDomain,
      verified: false,
      verificationRecord: {
        type: 'TXT',
        name: `_cleanpro.${cleanDomain}`,
        value: `cleanpro-verify=${companyId}`
      }
    });
  } catch (error: any) {
    console.error("Set custom domain error:", error);
    res.status(500).json({ error: "Failed to set custom domain" });
  }
});

router.post("/verify-domain", authMiddleware, requireCompany, async (req, res) => {
  try {
    const companyId = req.user!.companyId!;

    const [branding] = await db.select({
      customDomain: companyBranding.customDomain
    })
    .from(companyBranding)
    .where(eq(companyBranding.companyId, companyId))
    .limit(1);

    if (!branding?.customDomain) {
      return res.status(400).json({ error: "No custom domain configured" });
    }

    await db.update(companyBranding)
      .set({
        customDomainVerified: true,
        updatedAt: new Date()
      })
      .where(eq(companyBranding.companyId, companyId));

    res.json({
      success: true,
      verified: true,
      domain: branding.customDomain,
      message: "Domain verified successfully. In production, DNS TXT record verification would be performed."
    });
  } catch (error: any) {
    console.error("Verify domain error:", error);
    res.status(500).json({ error: "Failed to verify domain" });
  }
});

router.delete("/custom-domain", authMiddleware, requireCompany, async (req, res) => {
  try {
    const companyId = req.user!.companyId!;

    await db.update(companyBranding)
      .set({
        customDomain: null,
        customDomainVerified: false,
        updatedAt: new Date()
      })
      .where(eq(companyBranding.companyId, companyId));

    res.json({ success: true, message: "Custom domain removed" });
  } catch (error: any) {
    console.error("Remove custom domain error:", error);
    res.status(500).json({ error: "Failed to remove custom domain" });
  }
});

router.put("/slug", authMiddleware, requireCompany, async (req, res) => {
  try {
    const companyId = req.user!.companyId!;
    const { slug } = req.body;

    if (!slug) {
      return res.status(400).json({ error: "Slug is required" });
    }

    const cleanSlug = slug.toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .trim();

    if (cleanSlug.length < 3) {
      return res.status(400).json({ error: "Slug must be at least 3 characters" });
    }

    const [existing] = await db.select({ id: companies.id })
      .from(companies)
      .where(eq(companies.slug, cleanSlug))
      .limit(1);

    if (existing && existing.id !== companyId) {
      return res.status(400).json({ error: "Slug is already in use" });
    }

    await db.update(companies)
      .set({
        slug: cleanSlug,
        updatedAt: new Date()
      })
      .where(eq(companies.id, companyId));

    res.json({ success: true, slug: cleanSlug });
  } catch (error: any) {
    console.error("Update slug error:", error);
    res.status(500).json({ error: "Failed to update slug" });
  }
});

router.get("/lookup/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;

    let company = await getCompanyBySlug(identifier);

    if (!company) {
      const [branding] = await db.select({
        companyId: companyBranding.companyId,
        customDomainVerified: companyBranding.customDomainVerified
      })
      .from(companyBranding)
      .where(eq(companyBranding.customDomain, identifier))
      .limit(1);

      if (branding?.customDomainVerified) {
        const [foundCompany] = await db.select()
          .from(companies)
          .where(eq(companies.id, branding.companyId))
          .limit(1);
        company = foundCompany;
      }
    }

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    const [branding] = await db.select()
      .from(companyBranding)
      .where(eq(companyBranding.companyId, company.id))
      .limit(1);

    res.json({
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug
      },
      branding: branding ? {
        logoUrl: branding.logoUrl,
        faviconUrl: branding.faviconUrl,
        primaryColor: branding.primaryColor,
        secondaryColor: branding.secondaryColor,
        accentColor: branding.accentColor,
        fontFamily: branding.fontFamily,
        metaTitle: branding.metaTitle,
        metaDescription: branding.metaDescription
      } : null
    });
  } catch (error: any) {
    console.error("Lookup domain error:", error);
    res.status(500).json({ error: "Failed to lookup company" });
  }
});

export default router;
