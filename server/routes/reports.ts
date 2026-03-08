import { Router } from "express";
import { db } from "../db";
import { bookings, clients, services, staff, users } from "../db/schema";
import { eq, and, sql, gte, lte, count, desc } from "drizzle-orm";
import { authMiddleware, requireCompany } from "../middleware/auth";
import { subDays, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, startOfYear, endOfYear } from "date-fns";

const router = Router();

router.get("/summary", authMiddleware, requireCompany, async (req, res) => {
  try {
    const companyId = req.user!.companyId!;
    const period = req.query.period as string || 'month';

    let startDate: Date;
    let endDate = new Date();
    let prevStartDate: Date;
    let prevEndDate: Date;

    if (period === 'week') {
      startDate = startOfWeek(new Date());
      endDate = endOfWeek(new Date());
      prevStartDate = subDays(startDate, 7);
      prevEndDate = subDays(endDate, 7);
    } else if (period === 'year') {
      startDate = startOfYear(new Date());
      endDate = endOfYear(new Date());
      prevStartDate = startOfYear(subMonths(new Date(), 12));
      prevEndDate = endOfYear(subMonths(new Date(), 12));
    } else {
      startDate = startOfMonth(new Date());
      endDate = endOfMonth(new Date());
      prevStartDate = startOfMonth(subMonths(new Date(), 1));
      prevEndDate = endOfMonth(subMonths(new Date(), 1));
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    const prevStartDateStr = prevStartDate.toISOString().split('T')[0];
    const prevEndDateStr = prevEndDate.toISOString().split('T')[0];

    const [thisMonthRevenue] = await db.select({
      total: sql<number>`COALESCE(SUM(CAST(${bookings.totalPrice} AS DECIMAL)), 0)`
    })
    .from(bookings)
    .where(and(
      eq(bookings.companyId, companyId),
      eq(bookings.status, 'completed'),
      gte(bookings.scheduledDate, startDateStr),
      lte(bookings.scheduledDate, endDateStr)
    ));

    const [lastMonthRevenue] = await db.select({
      total: sql<number>`COALESCE(SUM(CAST(${bookings.totalPrice} AS DECIMAL)), 0)`
    })
    .from(bookings)
    .where(and(
      eq(bookings.companyId, companyId),
      eq(bookings.status, 'completed'),
      gte(bookings.scheduledDate, prevStartDateStr),
      lte(bookings.scheduledDate, prevEndDateStr)
    ));

    const thisMonth = Number(thisMonthRevenue.total) || 0;
    const lastMonth = Number(lastMonthRevenue.total) || 0;
    const change = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

    const [allTimeRevenue] = await db.select({
      total: sql<number>`COALESCE(SUM(CAST(${bookings.totalPrice} AS DECIMAL)), 0)`
    })
    .from(bookings)
    .where(and(
      eq(bookings.companyId, companyId),
      eq(bookings.status, 'completed')
    ));

    const [totalBookings] = await db.select({ count: count() })
      .from(bookings)
      .where(eq(bookings.companyId, companyId));

    const [completedBookings] = await db.select({ count: count() })
      .from(bookings)
      .where(and(eq(bookings.companyId, companyId), eq(bookings.status, 'completed')));

    const [pendingBookings] = await db.select({ count: count() })
      .from(bookings)
      .where(and(eq(bookings.companyId, companyId), eq(bookings.status, 'pending')));

    const [cancelledBookings] = await db.select({ count: count() })
      .from(bookings)
      .where(and(eq(bookings.companyId, companyId), eq(bookings.status, 'cancelled')));

    const [thisMonthBookings] = await db.select({ count: count() })
      .from(bookings)
      .where(and(
        eq(bookings.companyId, companyId),
        gte(bookings.scheduledDate, startDateStr),
        lte(bookings.scheduledDate, endDateStr)
      ));

    const [totalClients] = await db.select({ count: count() })
      .from(clients)
      .where(eq(clients.companyId, companyId));

    const [activeClients] = await db.select({ count: count() })
      .from(clients)
      .where(and(eq(clients.companyId, companyId), eq(clients.isActive, true)));

    const [newClients] = await db.select({ count: count() })
      .from(clients)
      .where(and(
        eq(clients.companyId, companyId),
        gte(clients.createdAt, startDate)
      ));

    const topServicesResult = await db.select({
      name: services.name,
      count: count(),
      revenue: sql<number>`COALESCE(SUM(CAST(${bookings.totalPrice} AS DECIMAL)), 0)`
    })
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .where(and(
      eq(bookings.companyId, companyId),
      gte(bookings.scheduledDate, startDateStr),
      lte(bookings.scheduledDate, endDateStr)
    ))
    .groupBy(services.id, services.name)
    .orderBy(desc(sql`count(*)`))
    .limit(5);

    const dailyRevenueResult = await db.select({
      date: bookings.scheduledDate,
      amount: sql<number>`COALESCE(SUM(CAST(${bookings.totalPrice} AS DECIMAL)), 0)`
    })
    .from(bookings)
    .where(and(
      eq(bookings.companyId, companyId),
      eq(bookings.status, 'completed'),
      gte(bookings.scheduledDate, startDateStr),
      lte(bookings.scheduledDate, endDateStr)
    ))
    .groupBy(bookings.scheduledDate)
    .orderBy(bookings.scheduledDate);

    const staffPerformanceResult = await db.select({
      firstName: users.firstName,
      lastName: users.lastName,
      completed: count(),
      revenue: sql<number>`COALESCE(SUM(CAST(${bookings.totalPrice} AS DECIMAL)), 0)`
    })
    .from(bookings)
    .innerJoin(staff, eq(bookings.staffId, staff.id))
    .innerJoin(users, eq(staff.userId, users.id))
    .where(and(
      eq(bookings.companyId, companyId),
      eq(bookings.status, 'completed'),
      gte(bookings.scheduledDate, startDateStr),
      lte(bookings.scheduledDate, endDateStr)
    ))
    .groupBy(staff.id, users.firstName, users.lastName)
    .orderBy(desc(sql`count(*)`))
    .limit(5);

    res.json({
      report: {
        revenue: {
          total: Number(allTimeRevenue.total) || 0,
          thisMonth,
          lastMonth,
          change
        },
        bookings: {
          total: totalBookings.count,
          completed: completedBookings.count,
          pending: pendingBookings.count,
          cancelled: cancelledBookings.count,
          thisMonth: thisMonthBookings.count
        },
        clients: {
          total: totalClients.count,
          active: activeClients.count,
          new: newClients.count
        },
        topServices: topServicesResult.map(s => ({
          name: s.name,
          count: Number(s.count),
          revenue: Number(s.revenue) || 0
        })),
        dailyRevenue: dailyRevenueResult.map(d => ({
          date: d.date,
          amount: Number(d.amount) || 0
        })),
        staffPerformance: staffPerformanceResult.map(s => ({
          name: `${s.firstName} ${s.lastName}`,
          completed: Number(s.completed),
          revenue: Number(s.revenue) || 0
        }))
      }
    });
  } catch (error: any) {
    console.error("Reports error:", error);
    res.status(500).json({ error: "Failed to generate reports" });
  }
});

export default router;
