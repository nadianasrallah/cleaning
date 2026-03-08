import { Router } from "express";
import { db } from "../db";
import { notifications } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const userNotifications = await db.select()
      .from(notifications)
      .where(eq(notifications.userId, req.user!.userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    const unreadCount = userNotifications.filter(n => !n.isRead).length;

    res.json({ notifications: userNotifications, unreadCount });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ error: "Failed to get notifications" });
  }
});

router.put("/:id/read", authMiddleware, async (req, res) => {
  try {
    const [notification] = await db.select().from(notifications)
      .where(and(
        eq(notifications.id, parseInt(req.params.id)),
        eq(notifications.userId, req.user!.userId)
      ))
      .limit(1);

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    await db.update(notifications).set({
      isRead: true,
      readAt: new Date(),
    }).where(eq(notifications.id, notification.id));

    res.json({ success: true });
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

router.put("/read-all", authMiddleware, async (req, res) => {
  try {
    await db.update(notifications).set({
      isRead: true,
      readAt: new Date(),
    }).where(and(
      eq(notifications.userId, req.user!.userId),
      eq(notifications.isRead, false)
    ));

    res.json({ success: true });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
});

export default router;
