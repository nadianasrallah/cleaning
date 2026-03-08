import { Router } from "express";
import { db } from "../db";
import { users, companies, clients, bookings, services, invoices, conversations, messages } from "../db/schema";
import { eq, and, desc, gte, lt, sql } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";
import { hashPassword, verifyPassword } from "../lib/auth";

const router = Router();

router.use(authMiddleware);

router.get("/stats", async (req, res) => {
  try {
    const userId = req.user!.userId;
    
    const [client] = await db.select().from(clients).where(eq(clients.userId, userId)).limit(1);
    
    if (!client) {
      return res.json({ stats: { upcomingBookings: 0, completedBookings: 0, totalSpent: 0 } });
    }

    const now = new Date().toISOString().split('T')[0];
    
    const upcomingBookingsResult = await db.select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(and(
        eq(bookings.clientId, client.id),
        gte(bookings.scheduledDate, now),
        sql`${bookings.status} NOT IN ('cancelled', 'completed')`
      ));

    const completedBookingsResult = await db.select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(and(
        eq(bookings.clientId, client.id),
        eq(bookings.status, 'completed')
      ));

    const totalSpentResult = await db.select({ total: sql<number>`COALESCE(SUM(${bookings.totalPrice}), 0)` })
      .from(bookings)
      .where(and(
        eq(bookings.clientId, client.id),
        eq(bookings.status, 'completed')
      ));

    res.json({
      stats: {
        upcomingBookings: Number(upcomingBookingsResult[0]?.count || 0),
        completedBookings: Number(completedBookingsResult[0]?.count || 0),
        totalSpent: Number(totalSpentResult[0]?.total || 0)
      }
    });
  } catch (error) {
    console.error("Failed to get client stats:", error);
    res.status(500).json({ error: "Failed to get stats" });
  }
});

router.get("/bookings", async (req, res) => {
  try {
    const userId = req.user!.userId;
    const status = req.query.status as string;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const [client] = await db.select().from(clients).where(eq(clients.userId, userId)).limit(1);
    
    if (!client) {
      return res.json({ bookings: [] });
    }

    const now = new Date().toISOString().split('T')[0];
    let whereConditions = [eq(bookings.clientId, client.id)];

    if (status === 'upcoming') {
      whereConditions.push(gte(bookings.scheduledDate, now));
      whereConditions.push(sql`${bookings.status} NOT IN ('cancelled', 'completed')`);
    } else if (status === 'completed') {
      whereConditions.push(eq(bookings.status, 'completed'));
    }

    const bookingList = await db.select({
      id: bookings.id,
      scheduledDate: bookings.scheduledDate,
      status: bookings.status,
      totalPrice: bookings.totalPrice,
      address: bookings.address,
      notes: bookings.notes,
      serviceName: services.name
    })
    .from(bookings)
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .where(and(...whereConditions))
    .orderBy(desc(bookings.scheduledDate))
    .limit(limit);

    res.json({ bookings: bookingList });
  } catch (error) {
    console.error("Failed to get bookings:", error);
    res.status(500).json({ error: "Failed to get bookings" });
  }
});

router.get("/bookings/:id", async (req, res) => {
  try {
    const userId = req.user!.userId;
    const bookingId = req.params.id;
    
    const [client] = await db.select().from(clients).where(eq(clients.userId, userId)).limit(1);
    
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    const [result] = await db.select({
      booking: bookings,
      service: services,
    })
    .from(bookings)
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .where(and(
      eq(bookings.id, bookingId),
      eq(bookings.clientId, client.id)
    ))
    .limit(1);

    if (!result) {
      return res.status(404).json({ error: "Booking not found" });
    }

    let staffMember = null;
    if (result.booking.staffId) {
      const [s] = await db.select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(eq(users.id, result.booking.staffId))
      .limit(1);
      staffMember = s ? { user: s } : null;
    }

    res.json({ ...result, staff: staffMember });
  } catch (error) {
    console.error("Failed to get booking:", error);
    res.status(500).json({ error: "Failed to get booking" });
  }
});

router.put("/bookings/:id/cancel", async (req, res) => {
  try {
    const userId = req.user!.userId;
    const bookingId = req.params.id;
    const { reason } = req.body;
    
    const [client] = await db.select().from(clients).where(eq(clients.userId, userId)).limit(1);
    
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    const [existing] = await db.select()
      .from(bookings)
      .where(and(
        eq(bookings.id, bookingId),
        eq(bookings.clientId, client.id)
      ))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (!['pending', 'confirmed'].includes(existing.status)) {
      return res.status(400).json({ error: "This booking cannot be cancelled" });
    }

    const [updated] = await db.update(bookings)
      .set({
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: reason || 'Cancelled by client',
        updatedAt: new Date()
      })
      .where(eq(bookings.id, bookingId))
      .returning();

    res.json({ booking: updated });
  } catch (error) {
    console.error("Failed to cancel booking:", error);
    res.status(500).json({ error: "Failed to cancel booking" });
  }
});

router.post("/bookings", async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { serviceId, scheduledDate, address, bedrooms, bathrooms, notes } = req.body;

    let [client] = await db.select().from(clients).where(eq(clients.userId, userId)).limit(1);
    
    if (!client) {
      const [service] = await db.select().from(services).where(eq(services.id, serviceId)).limit(1);
      if (!service) {
        return res.status(400).json({ error: "Service not found" });
      }

      const [newClient] = await db.insert(clients).values({
        userId,
        companyId: service.companyId,
        address,
        bedrooms,
        bathrooms: bathrooms.toString()
      }).returning();
      client = newClient;
    }

    const [service] = await db.select().from(services).where(eq(services.id, serviceId)).limit(1);
    if (!service) {
      return res.status(400).json({ error: "Service not found" });
    }

    const totalPrice = parseFloat(service.basePrice);

    const dateStr = new Date(scheduledDate).toISOString().split('T')[0];
    
    const [booking] = await db.insert(bookings).values({
      companyId: client.companyId,
      clientId: client.id,
      serviceId,
      scheduledDate: dateStr,
      scheduledTime: '09:00',
      address,
      bedrooms,
      bathrooms: bathrooms?.toString(),
      notes,
      totalPrice: totalPrice.toString(),
      status: 'pending'
    }).returning();

    res.json({ booking });
  } catch (error) {
    console.error("Failed to create booking:", error);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

router.get("/services", async (req, res) => {
  try {
    const userId = req.user!.userId;
    
    const [client] = await db.select().from(clients).where(eq(clients.userId, userId)).limit(1);
    
    let companyId = client?.companyId;
    
    if (!companyId) {
      const allServices = await db.select().from(services).where(eq(services.isActive, true)).limit(10);
      return res.json({ services: allServices });
    }

    const serviceList = await db.select()
      .from(services)
      .where(and(eq(services.companyId, companyId), eq(services.isActive, true)));

    res.json({ services: serviceList });
  } catch (error) {
    console.error("Failed to get services:", error);
    res.status(500).json({ error: "Failed to get services" });
  }
});

router.get("/invoices", async (req, res) => {
  try {
    const userId = req.user!.userId;
    
    const [client] = await db.select().from(clients).where(eq(clients.userId, userId)).limit(1);
    
    if (!client) {
      return res.json({ invoices: [] });
    }

    const invoiceList = await db.select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      amount: invoices.amount,
      totalAmount: invoices.totalAmount,
      status: invoices.status,
      dueDate: invoices.dueDate,
      paidAt: invoices.paidAt,
      createdAt: invoices.createdAt,
      serviceName: services.name
    })
    .from(invoices)
    .leftJoin(bookings, eq(invoices.bookingId, bookings.id))
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .where(eq(invoices.clientId, client.id))
    .orderBy(desc(invoices.createdAt));

    res.json({ invoices: invoiceList });
  } catch (error) {
    console.error("Failed to get invoices:", error);
    res.status(500).json({ error: "Failed to get invoices" });
  }
});

router.get("/conversations", async (req, res) => {
  try {
    const userId = req.user!.userId;
    
    const [client] = await db.select().from(clients).where(eq(clients.userId, userId)).limit(1);
    
    if (!client) {
      return res.json({ conversations: [] });
    }

    const conversationList = await db.select({
      id: conversations.id,
      companyName: companies.name,
      lastMessageAt: conversations.lastMessageAt,
      unreadCount: conversations.unreadCountClient
    })
    .from(conversations)
    .leftJoin(companies, eq(conversations.companyId, companies.id))
    .where(eq(conversations.clientId, client.id))
    .orderBy(desc(conversations.lastMessageAt));

    res.json({ conversations: conversationList });
  } catch (error) {
    console.error("Failed to get conversations:", error);
    res.status(500).json({ error: "Failed to get conversations" });
  }
});

router.get("/conversations/:id/messages", async (req, res) => {
  try {
    const conversationId = parseInt(req.params.id);

    const messageList = await db.select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);

    await db.update(conversations)
      .set({ unreadCountClient: 0 })
      .where(eq(conversations.id, conversationId));

    res.json({ messages: messageList });
  } catch (error) {
    console.error("Failed to get messages:", error);
    res.status(500).json({ error: "Failed to get messages" });
  }
});

router.post("/conversations/:id/messages", async (req, res) => {
  try {
    const userId = req.user!.userId;
    const conversationId = parseInt(req.params.id);
    const { content } = req.body;

    const [message] = await db.insert(messages).values({
      conversationId,
      senderId: userId,
      senderType: 'client',
      content
    }).returning();

    await db.update(conversations)
      .set({ 
        lastMessageAt: new Date(),
        unreadCountCompany: sql`${conversations.unreadCountCompany} + 1`
      })
      .where(eq(conversations.id, conversationId));

    res.json({ message });
  } catch (error) {
    console.error("Failed to send message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

router.put("/profile", async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { firstName, lastName, email, phone, address, city, state, zipCode } = req.body;

    await db.update(users).set({
      firstName,
      lastName,
      email,
      phone,
      updatedAt: new Date()
    }).where(eq(users.id, userId));

    const [client] = await db.select().from(clients).where(eq(clients.userId, userId)).limit(1);
    if (client) {
      await db.update(clients).set({
        address,
        city,
        state,
        zipCode,
        updatedAt: new Date()
      }).where(eq(clients.id, client.id));
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to update profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.put("/notifications", async (req, res) => {
  try {
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to update notifications:", error);
    res.status(500).json({ error: "Failed to update notifications" });
  }
});

router.put("/password", async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body;

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user || !user.password) {
      return res.status(400).json({ error: "User not found" });
    }

    const isValid = await verifyPassword(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    const hashedPassword = await hashPassword(newPassword);
    await db.update(users).set({
      password: hashedPassword,
      updatedAt: new Date()
    }).where(eq(users.id, userId));

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to change password:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
});

export default router;
