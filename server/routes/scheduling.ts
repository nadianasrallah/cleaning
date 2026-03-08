import { Router } from "express";
import { authMiddleware, requireCompany } from "../middleware/auth";
import { 
  getStaffAvailability, 
  checkSchedulingConflicts, 
  autoAssignStaff,
  getAvailableTimeSlots,
  updateStaffAvailability,
  getStaffSchedule
} from "../services/scheduling";
import { db } from "../db";
import { staff, bookings, services, users } from "../db/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/availability", authMiddleware, requireCompany, async (req, res) => {
  try {
    const companyId = req.user!.companyId!;
    const { date, duration } = req.query;

    if (!date) {
      return res.status(400).json({ error: "Date is required" });
    }

    const targetDate = new Date(date as string);
    const durationMinutes = duration ? parseInt(duration as string) : 60;

    const availability = await getStaffAvailability(companyId, targetDate, durationMinutes);

    const enrichedAvailability = await Promise.all(availability.map(async (a) => {
      const [staffMember] = await db.select({
        userId: staff.userId
      })
      .from(staff)
      .where(eq(staff.id, a.staffId))
      .limit(1);

      let staffName = `Staff #${a.staffId}`;
      if (staffMember?.userId) {
        const [user] = await db.select({
          firstName: users.firstName,
          lastName: users.lastName
        })
        .from(users)
        .where(eq(users.id, staffMember.userId))
        .limit(1);

        if (user) {
          staffName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || staffName;
        }
      }

      return {
        ...a,
        staffName
      };
    }));

    res.json({ availability: enrichedAvailability });
  } catch (error: any) {
    console.error("Get availability error:", error);
    res.status(500).json({ error: "Failed to get staff availability" });
  }
});

router.get("/time-slots", authMiddleware, requireCompany, async (req, res) => {
  try {
    const companyId = req.user!.companyId!;
    const { date, serviceId } = req.query;

    if (!date) {
      return res.status(400).json({ error: "Date is required" });
    }

    const targetDate = new Date(date as string);
    const svcId = serviceId ? parseInt(serviceId as string) : undefined;

    const slots = await getAvailableTimeSlots(companyId, targetDate, svcId);

    res.json({ slots });
  } catch (error: any) {
    console.error("Get time slots error:", error);
    res.status(500).json({ error: "Failed to get time slots" });
  }
});

router.post("/check-conflicts", authMiddleware, requireCompany, async (req, res) => {
  try {
    const companyId = req.user!.companyId!;
    const { staffId, scheduledDate, duration, excludeBookingId } = req.body;

    if (!staffId || !scheduledDate) {
      return res.status(400).json({ error: "Staff ID and scheduled date are required" });
    }

    const conflicts = await checkSchedulingConflicts(
      companyId,
      parseInt(staffId),
      new Date(scheduledDate),
      duration || 60,
      excludeBookingId ? parseInt(excludeBookingId) : undefined
    );

    res.json({ 
      hasConflicts: conflicts.length > 0, 
      conflicts 
    });
  } catch (error: any) {
    console.error("Check conflicts error:", error);
    res.status(500).json({ error: "Failed to check conflicts" });
  }
});

router.post("/auto-assign", authMiddleware, requireCompany, async (req, res) => {
  try {
    const companyId = req.user!.companyId!;
    const { scheduledDate, duration, serviceId, preferredStaffId } = req.body;

    if (!scheduledDate) {
      return res.status(400).json({ error: "Scheduled date is required" });
    }

    const result = await autoAssignStaff(
      companyId,
      new Date(scheduledDate),
      duration || 60,
      serviceId ? parseInt(serviceId) : undefined,
      preferredStaffId ? parseInt(preferredStaffId) : undefined
    );

    if (result.staffId) {
      const [staffMember] = await db.select({
        userId: staff.userId
      })
      .from(staff)
      .where(eq(staff.id, result.staffId))
      .limit(1);

      if (staffMember?.userId) {
        const [user] = await db.select({
          firstName: users.firstName,
          lastName: users.lastName
        })
        .from(users)
        .where(eq(users.id, staffMember.userId))
        .limit(1);

        if (user) {
          result.staffName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        }
      }
    }

    res.json(result);
  } catch (error: any) {
    console.error("Auto-assign error:", error);
    res.status(500).json({ error: "Failed to auto-assign staff" });
  }
});

router.get("/staff/:staffId/schedule", authMiddleware, requireCompany, async (req, res) => {
  try {
    const { staffId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "Start date and end date are required" });
    }

    const schedule = await getStaffSchedule(
      parseInt(staffId),
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({ schedule });
  } catch (error: any) {
    console.error("Get staff schedule error:", error);
    res.status(500).json({ error: "Failed to get staff schedule" });
  }
});

router.put("/staff/:staffId/availability", authMiddleware, requireCompany, async (req, res) => {
  try {
    const companyId = req.user!.companyId!;
    const { staffId } = req.params;
    const { availability } = req.body;

    const [staffMember] = await db.select({
      id: staff.id
    })
    .from(staff)
    .where(and(
      eq(staff.id, parseInt(staffId)),
      eq(staff.companyId, companyId)
    ))
    .limit(1);

    if (!staffMember) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    await updateStaffAvailability(parseInt(staffId), availability);

    res.json({ success: true, message: "Availability updated" });
  } catch (error: any) {
    console.error("Update availability error:", error);
    res.status(500).json({ error: "Failed to update availability" });
  }
});

router.get("/staff", authMiddleware, requireCompany, async (req, res) => {
  try {
    const companyId = req.user!.companyId!;

    const staffMembers = await db.select({
      id: staff.id,
      userId: staff.userId,
      role: staff.role,
      hourlyRate: staff.hourlyRate,
      skills: staff.skills,
      availability: staff.availability,
      isActive: staff.isActive,
      hireDate: staff.hireDate
    })
    .from(staff)
    .where(eq(staff.companyId, companyId));

    const enrichedStaff = await Promise.all(staffMembers.map(async (s) => {
      const [user] = await db.select({
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone
      })
      .from(users)
      .where(eq(users.id, s.userId))
      .limit(1);

      return {
        ...s,
        name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : `Staff #${s.id}`,
        email: user?.email,
        phone: user?.phone
      };
    }));

    res.json({ staff: enrichedStaff });
  } catch (error: any) {
    console.error("Get staff error:", error);
    res.status(500).json({ error: "Failed to get staff" });
  }
});

export default router;
