import { Router } from "express";
import { db } from "../db";
import { bookings, clients, services, staff, users } from "../db/schema";
import { eq, and, gte, lte, desc, or } from "drizzle-orm";
import { authMiddleware, requireCompany } from "../middleware/auth";
import { z } from "zod";
import { addDays, addWeeks, addMonths, startOfDay, endOfDay } from "date-fns";

const router = Router();

const createBookingSchema = z.object({
  clientId: z.coerce.number(),
  serviceId: z.string(),
  staffId: z.coerce.number().optional(),
  scheduledDate: z.string(),
  scheduledTime: z.string().optional(),
  address: z.string().optional(),
  bedrooms: z.coerce.number().optional(),
  bathrooms: z.coerce.number().optional(),
  notes: z.string().optional(),
  frequency: z.enum(["one-time", "weekly", "bi-weekly", "monthly"]).default("one-time"),
  totalPrice: z.string().or(z.number()).transform(v => String(v)).optional(),
});

const updateBookingSchema = z.object({
  staffId: z.number().optional().nullable(),
  scheduledDate: z.string().transform(s => new Date(s)).optional(),
  status: z.enum(["pending", "confirmed", "in-progress", "completed", "cancelled"]).optional(),
  notes: z.string().optional(),
  cancellationReason: z.string().optional(),
});

router.get("/", authMiddleware, requireCompany, async (req, res) => {
  try {
    const { startDate, endDate, status, clientId, staffId } = req.query;
    
    let query = db.select({
      booking: bookings,
      client: {
        id: clients.id,
        address: clients.address,
      },
      clientUser: {
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
      },
      service: {
        id: services.id,
        name: services.name,
      },
    })
    .from(bookings)
    .innerJoin(clients, eq(bookings.clientId, clients.id))
    .innerJoin(users, eq(clients.userId, users.id))
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .where(eq(bookings.companyId, req.user!.companyId!))
    .orderBy(desc(bookings.scheduledDate));

    const result = await query;
    
    let filteredResults = result;
    
    if (startDate) {
      const startDateStr = new Date(startDate as string).toISOString().split('T')[0];
      filteredResults = filteredResults.filter(r => 
        r.booking.scheduledDate >= startDateStr
      );
    }
    
    if (endDate) {
      const endDateStr = new Date(endDate as string).toISOString().split('T')[0];
      filteredResults = filteredResults.filter(r => 
        r.booking.scheduledDate <= endDateStr
      );
    }
    
    if (status) {
      filteredResults = filteredResults.filter(r => r.booking.status === status);
    }
    
    if (clientId) {
      filteredResults = filteredResults.filter(r => r.client.id === parseInt(clientId as string));
    }
    
    if (staffId) {
      filteredResults = filteredResults.filter(r => r.booking.staffId === parseInt(staffId as string));
    }

    res.json({ bookings: filteredResults });
  } catch (error) {
    console.error("Get bookings error:", error);
    res.status(500).json({ error: "Failed to get bookings" });
  }
});

router.get("/calendar", authMiddleware, requireCompany, async (req, res) => {
  try {
    const { month, year } = req.query;
    const startDate = new Date(parseInt(year as string) || new Date().getFullYear(), parseInt(month as string) - 1 || new Date().getMonth(), 1);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const calendarBookings = await db.select({
      booking: bookings,
      service: {
        name: services.name,
      },
      client: {
        address: clients.address,
      },
      clientUser: {
        firstName: users.firstName,
        lastName: users.lastName,
      },
    })
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .innerJoin(clients, eq(bookings.clientId, clients.id))
    .innerJoin(users, eq(clients.userId, users.id))
    .where(and(
      eq(bookings.companyId, req.user!.companyId!),
      gte(bookings.scheduledDate, startDateStr),
      lte(bookings.scheduledDate, endDateStr)
    ))
    .orderBy(bookings.scheduledDate);

    res.json({ bookings: calendarBookings });
  } catch (error) {
    console.error("Get calendar error:", error);
    res.status(500).json({ error: "Failed to get calendar" });
  }
});

router.get("/:id", authMiddleware, requireCompany, async (req, res) => {
  try {
    const [result] = await db.select({
      booking: bookings,
      client: clients,
      clientUser: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
      },
      service: services,
    })
    .from(bookings)
    .innerJoin(clients, eq(bookings.clientId, clients.id))
    .innerJoin(users, eq(clients.userId, users.id))
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .where(and(
      eq(bookings.id, req.params.id),
      eq(bookings.companyId, req.user!.companyId!)
    ))
    .limit(1);

    if (!result) {
      return res.status(404).json({ error: "Booking not found" });
    }

    let staffMember = null;
    if (result.booking.staffId) {
      const [s] = await db.select({
        staff: staff,
        user: {
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(staff)
      .innerJoin(users, eq(staff.userId, users.id))
      .where(eq(staff.id, result.booking.staffId))
      .limit(1);
      staffMember = s;
    }

    res.json({ ...result, staff: staffMember });
  } catch (error) {
    console.error("Get booking error:", error);
    res.status(500).json({ error: "Failed to get booking" });
  }
});

router.post("/", authMiddleware, requireCompany, async (req, res) => {
  try {
    const data = createBookingSchema.parse(req.body);
    
    const [client] = await db.select().from(clients)
      .where(and(eq(clients.id, data.clientId), eq(clients.companyId, req.user!.companyId!)))
      .limit(1);
    
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    const [service] = await db.select().from(services)
      .where(and(eq(services.id, data.serviceId), eq(services.companyId, req.user!.companyId!)))
      .limit(1);
    
    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    const dateObj = new Date(data.scheduledDate);
    const dateStr = dateObj.toISOString().split('T')[0];
    const timeStr = data.scheduledTime || dateObj.toTimeString().substring(0, 5);
    
    const scheduledEndTime = new Date(data.scheduledDate);
    scheduledEndTime.setMinutes(scheduledEndTime.getMinutes() + service.durationMinutes);

    const [newBooking] = await db.insert(bookings).values({
      companyId: req.user!.companyId!,
      clientId: data.clientId,
      serviceId: data.serviceId,
      staffId: data.staffId,
      scheduledDate: dateStr,
      scheduledTime: timeStr,
      scheduledEndTime,
      address: data.address || client.address,
      bedrooms: data.bedrooms || client.bedrooms,
      bathrooms: data.bathrooms?.toString() || client.bathrooms,
      notes: data.notes,
      frequency: data.frequency,
      totalPrice: data.totalPrice,
      status: "pending",
    }).returning();

    if (data.frequency !== "one-time") {
      const recurringBookings = [];
      let nextDate = new Date(data.scheduledDate);
      
      for (let i = 0; i < 11; i++) {
        if (data.frequency === "weekly") {
          nextDate = addWeeks(nextDate, 1);
        } else if (data.frequency === "bi-weekly") {
          nextDate = addWeeks(nextDate, 2);
        } else if (data.frequency === "monthly") {
          nextDate = addMonths(nextDate, 1);
        }

        const nextEndTime = new Date(nextDate);
        nextEndTime.setMinutes(nextEndTime.getMinutes() + service.durationMinutes);
        const nextDateStr = nextDate.toISOString().split('T')[0];

        recurringBookings.push({
          companyId: req.user!.companyId!,
          clientId: data.clientId,
          serviceId: data.serviceId,
          staffId: data.staffId,
          scheduledDate: nextDateStr,
          scheduledTime: timeStr,
          scheduledEndTime: nextEndTime,
          address: data.address || client.address,
          bedrooms: data.bedrooms || client.bedrooms,
          bathrooms: data.bathrooms?.toString() || client.bathrooms,
          notes: data.notes,
          frequency: data.frequency,
          recurringParentId: newBooking.id,
          totalPrice: data.totalPrice,
          status: "pending" as const,
        });
      }

      if (recurringBookings.length > 0) {
        await db.insert(bookings).values(recurringBookings);
      }
    }

    res.json({ booking: newBooking });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Create booking error:", error);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

router.put("/:id", authMiddleware, requireCompany, async (req, res) => {
  try {
    const data = updateBookingSchema.parse(req.body);
    
    const [existing] = await db.select().from(bookings)
      .where(and(
        eq(bookings.id, req.params.id),
        eq(bookings.companyId, req.user!.companyId!)
      ))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const updateData: Record<string, any> = { ...data, updatedAt: new Date() };
    
    if (data.status === "completed") {
      updateData.completedAt = new Date();
    } else if (data.status === "cancelled") {
      updateData.cancelledAt = new Date();
    }

    const [updated] = await db
      .update(bookings)
      .set(updateData)
      .where(eq(bookings.id, req.params.id))
      .returning();

    res.json({ booking: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Update booking error:", error);
    res.status(500).json({ error: "Failed to update booking" });
  }
});

router.post("/:id/assign", authMiddleware, requireCompany, async (req, res) => {
  try {
    const { staffId } = req.body;
    
    const [existing] = await db.select().from(bookings)
      .where(and(
        eq(bookings.id, req.params.id),
        eq(bookings.companyId, req.user!.companyId!)
      ))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (staffId) {
      const [staffMember] = await db.select().from(staff)
        .where(and(eq(staff.id, staffId), eq(staff.companyId, req.user!.companyId!)))
        .limit(1);
      
      if (!staffMember) {
        return res.status(404).json({ error: "Staff member not found" });
      }
    }

    const [updated] = await db
      .update(bookings)
      .set({ staffId, updatedAt: new Date() })
      .where(eq(bookings.id, req.params.id))
      .returning();

    res.json({ booking: updated });
  } catch (error) {
    console.error("Assign booking error:", error);
    res.status(500).json({ error: "Failed to assign booking" });
  }
});

export default router;
