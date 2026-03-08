import { Router } from "express";
import { db } from "../db";
import { smsLogs, bookings, clients, users, companies, services } from "../db/schema";
import { eq, and, desc, gte, lt, sql } from "drizzle-orm";
import { authMiddleware, requireCompany } from "../middleware/auth";
import { z } from "zod";
import { sendBookingConfirmation, sendBookingReminder, sendCustomSMS, isTwilioConfigured } from "../services/sms";
import { addHours, startOfDay, endOfDay, addDays } from "date-fns";

const router = Router();

const sendSmsSchema = z.object({
  recipientPhone: z.string().min(10),
  content: z.string().min(1).max(1600),
  messageType: z.enum(["reminder", "confirmation", "custom", "marketing"]),
  bookingId: z.number().optional(),
});

router.get("/status", authMiddleware, async (req, res) => {
  res.json({ 
    configured: isTwilioConfigured(),
    message: isTwilioConfigured() 
      ? 'Twilio SMS is configured and ready' 
      : 'Twilio credentials not configured. SMS will be logged but not sent.'
  });
});

router.get("/logs", authMiddleware, requireCompany, async (req, res) => {
  try {
    const logs = await db.select({
      id: smsLogs.id,
      recipientPhone: smsLogs.recipientPhone,
      messageType: smsLogs.messageType,
      content: smsLogs.content,
      status: smsLogs.status,
      sentAt: smsLogs.sentAt,
      createdAt: smsLogs.createdAt,
      errorMessage: smsLogs.errorMessage
    })
    .from(smsLogs)
    .where(eq(smsLogs.companyId, req.user!.companyId!))
    .orderBy(desc(smsLogs.createdAt))
    .limit(100);

    res.json({ logs });
  } catch (error) {
    console.error("Get SMS logs error:", error);
    res.status(500).json({ error: "Failed to get SMS logs" });
  }
});

router.post("/send", authMiddleware, requireCompany, async (req, res) => {
  try {
    const data = sendSmsSchema.parse(req.body);
    
    const result = await sendCustomSMS(
      req.user!.companyId!,
      data.recipientPhone,
      data.content,
      data.bookingId
    );

    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Send SMS error:", error);
    res.status(500).json({ error: "Failed to send SMS" });
  }
});

router.post("/send-confirmation/:bookingId", authMiddleware, requireCompany, async (req, res) => {
  try {
    const bookingId = parseInt(req.params.bookingId);
    
    const [booking] = await db.select()
      .from(bookings)
      .where(and(
        eq(bookings.id, bookingId),
        eq(bookings.companyId, req.user!.companyId!)
      ))
      .limit(1);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const result = await sendBookingConfirmation(bookingId);

    if (result.success) {
      res.json({ success: true, message: 'Confirmation SMS sent' });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error("Send confirmation error:", error);
    res.status(500).json({ error: "Failed to send confirmation" });
  }
});

router.post("/send-reminder/:bookingId", authMiddleware, requireCompany, async (req, res) => {
  try {
    const bookingId = parseInt(req.params.bookingId);
    
    const [booking] = await db.select()
      .from(bookings)
      .where(and(
        eq(bookings.id, bookingId),
        eq(bookings.companyId, req.user!.companyId!)
      ))
      .limit(1);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const result = await sendBookingReminder(bookingId);

    if (result.success) {
      res.json({ success: true, message: 'Reminder SMS sent' });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error("Send reminder error:", error);
    res.status(500).json({ error: "Failed to send reminder" });
  }
});

router.post("/send-bulk-reminders", authMiddleware, requireCompany, async (req, res) => {
  try {
    const tomorrow = addDays(new Date(), 1);
    const tomorrowStart = startOfDay(tomorrow);
    const tomorrowEnd = endOfDay(tomorrow);

    const upcomingBookings = await db.select({
      id: bookings.id
    })
    .from(bookings)
    .where(and(
      eq(bookings.companyId, req.user!.companyId!),
      gte(bookings.scheduledDate, tomorrowStart),
      lt(bookings.scheduledDate, tomorrowEnd),
      eq(bookings.status, 'confirmed')
    ));

    const results = await Promise.allSettled(
      upcomingBookings.map(booking => sendBookingReminder(booking.id))
    );

    const sent = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - sent;

    res.json({ 
      success: true, 
      message: `Sent ${sent} reminders, ${failed} failed`,
      sent,
      failed
    });
  } catch (error) {
    console.error("Send bulk reminders error:", error);
    res.status(500).json({ error: "Failed to send bulk reminders" });
  }
});

export default router;
