import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { companies, companyBranding } from "../db/schema";
import { eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface Request {
      tenantCompany?: {
        id: string;
        name: string;
        slug: string | null;
      };
      tenantBranding?: {
        logoUrl: string | null;
        faviconUrl: string | null;
        primaryColor: string;
        secondaryColor: string;
        accentColor: string;
        fontFamily: string;
        metaTitle: string | null;
        metaDescription: string | null;
      };
    }
  }
}

export async function domainMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const host = req.headers.host || '';
    
    const isDefaultDomain = 
      host.includes('replit.dev') || 
      host.includes('localhost') || 
      host.includes('127.0.0.1');

    if (!isDefaultDomain) {
      const [branding] = await db.select({
        companyId: companyBranding.companyId,
        logoUrl: companyBranding.logoUrl,
        faviconUrl: companyBranding.faviconUrl,
        primaryColor: companyBranding.primaryColor,
        secondaryColor: companyBranding.secondaryColor,
        accentColor: companyBranding.accentColor,
        fontFamily: companyBranding.fontFamily,
        metaTitle: companyBranding.metaTitle,
        metaDescription: companyBranding.metaDescription,
        customDomainVerified: companyBranding.customDomainVerified
      })
      .from(companyBranding)
      .where(eq(companyBranding.customDomain, host))
      .limit(1);

      if (branding && branding.customDomainVerified) {
        const [company] = await db.select({
          id: companies.id,
          name: companies.name,
          slug: companies.slug
        })
        .from(companies)
        .where(eq(companies.id, branding.companyId))
        .limit(1);

        if (company) {
          req.tenantCompany = company;
          req.tenantBranding = {
            logoUrl: branding.logoUrl,
            faviconUrl: branding.faviconUrl,
            primaryColor: branding.primaryColor || '#3B82F6',
            secondaryColor: branding.secondaryColor || '#1E40AF',
            accentColor: branding.accentColor || '#F59E0B',
            fontFamily: branding.fontFamily || 'Inter',
            metaTitle: branding.metaTitle,
            metaDescription: branding.metaDescription
          };
        }
      }
    }

    next();
  } catch (error) {
    console.error('Domain middleware error:', error);
    next();
  }
}

export async function getCompanyByDomain(domain: string) {
  const [branding] = await db.select({
    companyId: companyBranding.companyId,
    customDomainVerified: companyBranding.customDomainVerified
  })
  .from(companyBranding)
  .where(eq(companyBranding.customDomain, domain))
  .limit(1);

  if (!branding || !branding.customDomainVerified) {
    return null;
  }

  const [company] = await db.select()
    .from(companies)
    .where(eq(companies.id, branding.companyId))
    .limit(1);

  return company;
}

export async function getCompanyBySlug(slug: string) {
  const [company] = await db.select()
    .from(companies)
    .where(eq(companies.slug, slug))
    .limit(1);

  return company;
}

export async function verifyCustomDomain(companyId: string, domain: string): Promise<{ verified: boolean; error?: string }> {
  try {
    const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');

    await db.update(companyBranding)
      .set({ 
        customDomain: cleanDomain,
        customDomainVerified: false,
        updatedAt: new Date()
      })
      .where(eq(companyBranding.companyId, companyId));

    return { verified: false };
  } catch (error: any) {
    return { verified: false, error: error.message };
  }
}

export async function markDomainVerified(companyId: string): Promise<boolean> {
  try {
    await db.update(companyBranding)
      .set({ 
        customDomainVerified: true,
        updatedAt: new Date()
      })
      .where(eq(companyBranding.companyId, companyId));
    return true;
  } catch (error) {
    console.error('Failed to mark domain as verified:', error);
    return false;
  }
}
