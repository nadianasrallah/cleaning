import { Router } from "express";
import { authMiddleware, requireCompany } from "../middleware/auth";
import { db } from "../db";
import { emailLogs } from "../db/schema";
import { eq, desc, and } from "drizzle-orm";
import {
  sendBookingConfirmationEmail,
  sendBookingReminderEmail,
  sendBookingCancellationEmail,
  sendWelcomeEmail,
  sendInvoiceEmail,
  sendCustomEmail
} from "../services/email";

const router = Router();

router.get("/logs", authMiddleware, requireCompany, async (req, res) => {
  try {
    const companyId = req.user!.companyId!;
    const { limit = 50, offset = 0, emailType } = req.query;

    let query = db.select()
      .from(emailLogs)
      .where(eq(emailLogs.companyId, companyId))
      .orderBy(desc(emailLogs.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    const logs = await query;

    res.json({ logs });
  } catch (error: any) {
    console.error("Get email logs error:", error);
    res.status(500).json({ error: "Failed to get email logs" });
  }
});

router.post("/send/booking-confirmation", authMiddleware, requireCompany, async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ error: "Booking ID is required" });
    }

    const result = await sendBookingConfirmationEmail(bookingId);

    if (result.success) {
      res.json({ success: true, messageId: result.messageId });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error("Send booking confirmation email error:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

router.post("/send/booking-reminder", authMiddleware, requireCompany, async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ error: "Booking ID is required" });
    }

    const result = await sendBookingReminderEmail(bookingId);

    if (result.success) {
      res.json({ success: true, messageId: result.messageId });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error("Send booking reminder email error:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

router.post("/send/booking-cancellation", authMiddleware, requireCompany, async (req, res) => {
  try {
    const { bookingId, reason } = req.body;

    if (!bookingId) {
      return res.status(400).json({ error: "Booking ID is required" });
    }

    const result = await sendBookingCancellationEmail(bookingId, reason);

    if (result.success) {
      res.json({ success: true, messageId: result.messageId });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error("Send booking cancellation email error:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

router.post("/send/welcome", authMiddleware, requireCompany, async (req, res) => {
  try {
    const companyId = req.user!.companyId!;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const result = await sendWelcomeEmail(parseInt(userId), companyId);

    if (result.success) {
      res.json({ success: true, messageId: result.messageId });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error("Send welcome email error:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

router.post("/send/invoice", authMiddleware, requireCompany, async (req, res) => {
  try {
    const { invoiceId } = req.body;

    if (!invoiceId) {
      return res.status(400).json({ error: "Invoice ID is required" });
    }

    const result = await sendInvoiceEmail(parseInt(invoiceId));

    if (result.success) {
      res.json({ success: true, messageId: result.messageId });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error("Send invoice email error:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

router.post("/send/custom", authMiddleware, requireCompany, async (req, res) => {
  try {
    const companyId = req.user!.companyId!;
    const { email, subject, content } = req.body;

    if (!email || !subject || !content) {
      return res.status(400).json({ error: "Email, subject, and content are required" });
    }

    const result = await sendCustomEmail(companyId, email, subject, content);

    if (result.success) {
      res.json({ success: true, messageId: result.messageId });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error("Send custom email error:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

export default router;
