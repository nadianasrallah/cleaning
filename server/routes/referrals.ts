import { Router } from "express";
import { db } from "../db";
import { referrals, clients, users, leads, companies } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { authMiddleware, requireCompany } from "../middleware/auth";
import { z } from "zod";
import { randomBytes } from "crypto";

const router = Router();

function generateReferralCode(): string {
  return randomBytes(4).toString('hex').toUpperCase();
}

router.get("/", authMiddleware, requireCompany, async (req, res) => {
  try {
    const companyReferrals = await db.select({
      referral: referrals,
      referrer: {
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      }
    })
    .from(referrals)
    .leftJoin(clients, eq(referrals.referrerId, clients.id))
    .leftJoin(users, eq(clients.userId, users.id))
    .where(eq(referrals.companyId, req.user!.companyId!))
    .orderBy(desc(referrals.createdAt));

    res.json({ referrals: companyReferrals });
  } catch (error) {
    console.error("Get referrals error:", error);
    res.status(500).json({ error: "Failed to get referrals" });
  }
});

router.get("/stats", authMiddleware, requireCompany, async (req, res) => {
  try {
    const allReferrals = await db.select().from(referrals)
      .where(eq(referrals.companyId, req.user!.companyId!));

    const total = allReferrals.length;
    const converted = allReferrals.filter(r => r.status === 'converted').length;
    const pending = allReferrals.filter(r => r.status === 'pending').length;
    const rewardsClaimed = allReferrals.filter(r => r.rewardStatus === 'claimed').length;
    const totalRewardsValue = allReferrals
      .filter(r => r.rewardStatus === 'claimed')
      .reduce((sum, r) => sum + parseFloat(r.rewardValue || '0'), 0);

    res.json({
      total,
      converted,
      pending,
      conversionRate: total > 0 ? ((converted / total) * 100).toFixed(1) : 0,
      rewardsClaimed,
      totalRewardsValue
    });
  } catch (error) {
    console.error("Get referral stats error:", error);
    res.status(500).json({ error: "Failed to get referral stats" });
  }
});

router.get("/my-code", authMiddleware, async (req, res) => {
  try {
    const [client] = await db.select().from(clients)
      .where(and(
        eq(clients.userId, req.user!.id),
        eq(clients.companyId, req.user!.companyId!)
      ))
      .limit(1);

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    const [company] = await db.select().from(companies)
      .where(eq(companies.id, req.user!.companyId!))
      .limit(1);

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    let [existingReferral] = await db.select().from(referrals)
      .where(and(
        eq(referrals.referrerId, client.id),
        eq(referrals.companyId, req.user!.companyId!),
        eq(referrals.status, 'pending')
      ))
      .limit(1);

    if (!existingReferral) {
      [existingReferral] = await db.insert(referrals).values({
        companyId: req.user!.companyId!,
        referrerId: client.id,
        referralCode: generateReferralCode(),
        rewardType: 'discount',
        rewardValue: '10',
      }).returning();
    }

    const allReferrals = await db.select().from(referrals)
      .where(and(
        eq(referrals.referrerId, client.id),
        eq(referrals.companyId, req.user!.companyId!)
      ));

    const converted = allReferrals.filter(r => r.status === 'converted').length;
    const totalEarned = allReferrals
      .filter(r => r.rewardStatus === 'claimed')
      .reduce((sum, r) => sum + parseFloat(r.rewardValue || '0'), 0);

    res.json({
      referralCode: existingReferral.referralCode,
      referralLink: `/book/${company.slug}?ref=${existingReferral.referralCode}`,
      stats: {
        totalReferred: allReferrals.length,
        converted,
        totalEarned
      }
    });
  } catch (error) {
    console.error("Get my referral code error:", error);
    res.status(500).json({ error: "Failed to get referral code" });
  }
});

router.post("/validate", async (req, res) => {
  try {
    const { code, companyId } = req.body;

    if (!code || !companyId) {
      return res.status(400).json({ error: "Code and company ID required" });
    }

    const [referral] = await db.select().from(referrals)
      .where(and(
        eq(referrals.referralCode, code.toUpperCase()),
        eq(referrals.companyId, companyId)
      ))
      .limit(1);

    if (!referral) {
      return res.status(404).json({ valid: false, error: "Invalid referral code" });
    }

    const [referrerClient] = await db.select().from(clients)
      .where(eq(clients.id, referral.referrerId))
      .limit(1);

    let referrerName = "A friend";
    if (referrerClient) {
      const [referrerUser] = await db.select().from(users)
        .where(eq(users.id, referrerClient.userId))
        .limit(1);
      if (referrerUser) {
        referrerName = referrerUser.firstName || "A friend";
      }
    }

    res.json({
      valid: true,
      referrerName,
      discount: {
        type: referral.rewardType,
        value: referral.rewardValue
      }
    });
  } catch (error) {
    console.error("Validate referral error:", error);
    res.status(500).json({ error: "Failed to validate referral" });
  }
});

router.post("/track-conversion", async (req, res) => {
  try {
    const { referralCode, referredEmail, referredClientId, companyId } = req.body;

    if (!referralCode || !companyId) {
      return res.status(400).json({ error: "Referral code and company ID required" });
    }

    const [referral] = await db.select().from(referrals)
      .where(and(
        eq(referrals.referralCode, referralCode.toUpperCase()),
        eq(referrals.companyId, companyId)
      ))
      .limit(1);

    if (!referral) {
      return res.status(404).json({ error: "Referral not found" });
    }

    await db.insert(referrals).values({
      companyId,
      referrerId: referral.referrerId,
      referralCode: generateReferralCode(),
      referredEmail,
      referredClientId,
      rewardType: referral.rewardType,
      rewardValue: referral.rewardValue,
      status: 'converted',
      convertedAt: new Date(),
    });

    await db.update(referrals)
      .set({ 
        rewardStatus: 'earned',
        updatedAt: new Date()
      })
      .where(eq(referrals.id, referral.id));

    res.json({ success: true });
  } catch (error) {
    console.error("Track referral conversion error:", error);
    res.status(500).json({ error: "Failed to track conversion" });
  }
});

router.post("/:id/claim-reward", authMiddleware, requireCompany, async (req, res) => {
  try {
    const [referral] = await db.select().from(referrals)
      .where(and(
        eq(referrals.id, parseInt(req.params.id)),
        eq(referrals.companyId, req.user!.companyId!)
      ))
      .limit(1);

    if (!referral) {
      return res.status(404).json({ error: "Referral not found" });
    }

    if (referral.rewardStatus !== 'earned') {
      return res.status(400).json({ error: "Reward not available to claim" });
    }

    const [updated] = await db.update(referrals)
      .set({
        rewardStatus: 'claimed',
        rewardClaimedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(referrals.id, referral.id))
      .returning();

    res.json({ success: true, referral: updated });
  } catch (error) {
    console.error("Claim referral reward error:", error);
    res.status(500).json({ error: "Failed to claim reward" });
  }
});

export default router;
