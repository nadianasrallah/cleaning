import { db } from '../db';
import { staff, bookings, services } from '../db/schema';
import { eq, and, gte, lte, sql, or, ne, isNull } from 'drizzle-orm';
import { addMinutes, parseISO, format, startOfDay, endOfDay, isBefore, isAfter, areIntervalsOverlapping } from 'date-fns';

export interface TimeSlot {
  start: Date;
  end: Date;
  staffId?: number;
  available: boolean;
}

export interface StaffAvailability {
  staffId: number;
  staffName: string;
  date: Date;
  slots: TimeSlot[];
  dayAvailability?: { start: string; end: string };
}

export interface SchedulingConflict {
  type: 'overlap' | 'unavailable' | 'outside_hours';
  message: string;
  conflictingBookingId?: number;
}

export interface AutoAssignResult {
  staffId: number | null;
  staffName?: string;
  score: number;
  reason: string;
}

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export async function getStaffAvailability(
  companyId: string,
  date: Date,
  durationMinutes: number = 60
): Promise<StaffAvailability[]> {
  const dayName = DAY_NAMES[date.getDay()];
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  const staffMembers = await db.select({
    id: staff.id,
    availability: staff.availability,
    skills: staff.skills,
    userId: staff.userId
  })
  .from(staff)
  .where(and(
    eq(staff.companyId, companyId),
    eq(staff.isActive, true)
  ));

  const dateStr = format(date, 'yyyy-MM-dd');
  
  const existingBookings = await db.select({
    id: bookings.id,
    staffId: bookings.staffId,
    scheduledDate: bookings.scheduledDate,
    scheduledTime: bookings.scheduledTime,
    scheduledEndTime: bookings.scheduledEndTime,
    status: bookings.status
  })
  .from(bookings)
  .where(and(
    eq(bookings.companyId, companyId),
    eq(bookings.scheduledDate, dateStr),
    ne(bookings.status, 'cancelled')
  ));

  const result: StaffAvailability[] = [];

  for (const member of staffMembers) {
    const availability = member.availability as Record<string, { start: string; end: string }> | null;
    const dayAvailability = availability?.[dayName];

    if (!dayAvailability) {
      result.push({
        staffId: member.id,
        staffName: `Staff #${member.id}`,
        date,
        slots: [],
        dayAvailability: undefined
      });
      continue;
    }

    const slots = generateTimeSlots(
      date,
      dayAvailability.start,
      dayAvailability.end,
      durationMinutes,
      existingBookings.filter(b => b.staffId === member.id)
    );

    result.push({
      staffId: member.id,
      staffName: `Staff #${member.id}`,
      date,
      slots,
      dayAvailability
    });
  }

  return result;
}

function generateTimeSlots(
  date: Date,
  startTime: string,
  endTime: string,
  durationMinutes: number,
  existingBookings: any[]
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const dateStr = format(date, 'yyyy-MM-dd');

  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  let currentSlotStart = new Date(date);
  currentSlotStart.setHours(startHour, startMinute, 0, 0);

  const dayEndTime = new Date(date);
  dayEndTime.setHours(endHour, endMinute, 0, 0);

  while (addMinutes(currentSlotStart, durationMinutes) <= dayEndTime) {
    const slotEnd = addMinutes(currentSlotStart, durationMinutes);

    const isAvailable = !existingBookings.some(booking => {
      const bookingStart = new Date(booking.scheduledDate);
      const bookingEnd = booking.scheduledEndTime 
        ? new Date(booking.scheduledEndTime)
        : addMinutes(bookingStart, 60);

      return areIntervalsOverlapping(
        { start: currentSlotStart, end: slotEnd },
        { start: bookingStart, end: bookingEnd }
      );
    });

    slots.push({
      start: new Date(currentSlotStart),
      end: slotEnd,
      available: isAvailable
    });

    currentSlotStart = addMinutes(currentSlotStart, 30);
  }

  return slots;
}

export async function checkSchedulingConflicts(
  companyId: string,
  staffId: number,
  scheduledDate: Date,
  durationMinutes: number,
  excludeBookingId?: number
): Promise<SchedulingConflict[]> {
  const conflicts: SchedulingConflict[] = [];
  const scheduledEnd = addMinutes(scheduledDate, durationMinutes);
  const dayName = DAY_NAMES[scheduledDate.getDay()];

  const [staffMember] = await db.select({
    availability: staff.availability
  })
  .from(staff)
  .where(eq(staff.id, staffId))
  .limit(1);

  if (!staffMember) {
    conflicts.push({
      type: 'unavailable',
      message: 'Staff member not found'
    });
    return conflicts;
  }

  const availability = staffMember.availability as Record<string, { start: string; end: string }> | null;
  const dayAvailability = availability?.[dayName];

  if (!dayAvailability) {
    conflicts.push({
      type: 'unavailable',
      message: `Staff is not available on ${dayName}s`
    });
  } else {
    const [startHour, startMinute] = dayAvailability.start.split(':').map(Number);
    const [endHour, endMinute] = dayAvailability.end.split(':').map(Number);

    const availStart = new Date(scheduledDate);
    availStart.setHours(startHour, startMinute, 0, 0);

    const availEnd = new Date(scheduledDate);
    availEnd.setHours(endHour, endMinute, 0, 0);

    if (isBefore(scheduledDate, availStart) || isAfter(scheduledEnd, availEnd)) {
      conflicts.push({
        type: 'outside_hours',
        message: `Booking is outside staff's working hours (${dayAvailability.start} - ${dayAvailability.end})`
      });
    }
  }

  const dateStr = format(scheduledDate, 'yyyy-MM-dd');

  const baseQuery = and(
    eq(bookings.companyId, companyId),
    eq(bookings.staffId, staffId),
    eq(bookings.scheduledDate, dateStr),
    ne(bookings.status, 'cancelled')
  );

  const existingBookings = await db.select({
    id: bookings.id,
    scheduledDate: bookings.scheduledDate,
    scheduledTime: bookings.scheduledTime,
    scheduledEndTime: bookings.scheduledEndTime
  })
  .from(bookings)
  .where(baseQuery);

  for (const booking of existingBookings) {
    if (excludeBookingId && booking.id === excludeBookingId) continue;

    const bookingStart = new Date(booking.scheduledDate);
    const bookingEnd = booking.scheduledEndTime 
      ? new Date(booking.scheduledEndTime)
      : addMinutes(bookingStart, 60);

    if (areIntervalsOverlapping(
      { start: scheduledDate, end: scheduledEnd },
      { start: bookingStart, end: bookingEnd }
    )) {
      conflicts.push({
        type: 'overlap',
        message: `Overlaps with existing booking #${booking.id}`,
        conflictingBookingId: booking.id
      });
    }
  }

  return conflicts;
}

export async function autoAssignStaff(
  companyId: string,
  scheduledDate: Date,
  durationMinutes: number,
  serviceId?: number,
  preferredStaffId?: number
): Promise<AutoAssignResult> {
  const dayName = DAY_NAMES[scheduledDate.getDay()];
  const scheduledEnd = addMinutes(scheduledDate, durationMinutes);
  const dateStr = format(scheduledDate, 'yyyy-MM-dd');

  const staffMembers = await db.select({
    id: staff.id,
    availability: staff.availability,
    skills: staff.skills,
    hourlyRate: staff.hourlyRate
  })
  .from(staff)
  .where(and(
    eq(staff.companyId, companyId),
    eq(staff.isActive, true)
  ));

  const existingBookings = await db.select({
    staffId: bookings.staffId,
    scheduledDate: bookings.scheduledDate,
    scheduledTime: bookings.scheduledTime,
    scheduledEndTime: bookings.scheduledEndTime
  })
  .from(bookings)
  .where(and(
    eq(bookings.companyId, companyId),
    eq(bookings.scheduledDate, dateStr),
    ne(bookings.status, 'cancelled')
  ));

  let serviceName: string | null = null;
  if (serviceId) {
    const [service] = await db.select({ name: services.name })
      .from(services)
      .where(eq(services.id, serviceId))
      .limit(1);
    serviceName = service?.name || null;
  }

  const candidates: Array<{
    staffId: number;
    score: number;
    reason: string;
  }> = [];

  for (const member of staffMembers) {
    const availability = member.availability as Record<string, { start: string; end: string }> | null;
    const dayAvailability = availability?.[dayName];

    if (!dayAvailability) continue;

    const [startHour, startMinute] = dayAvailability.start.split(':').map(Number);
    const [endHour, endMinute] = dayAvailability.end.split(':').map(Number);

    const availStart = new Date(scheduledDate);
    availStart.setHours(startHour, startMinute, 0, 0);

    const availEnd = new Date(scheduledDate);
    availEnd.setHours(endHour, endMinute, 0, 0);

    if (isBefore(scheduledDate, availStart) || isAfter(scheduledEnd, availEnd)) {
      continue;
    }

    const hasConflict = existingBookings.some(booking => {
      if (booking.staffId !== member.id) return false;

      const bookingStart = new Date(booking.scheduledDate);
      const bookingEnd = booking.scheduledEndTime 
        ? new Date(booking.scheduledEndTime)
        : addMinutes(bookingStart, 60);

      return areIntervalsOverlapping(
        { start: scheduledDate, end: scheduledEnd },
        { start: bookingStart, end: bookingEnd }
      );
    });

    if (hasConflict) continue;

    let score = 100;

    if (preferredStaffId && member.id === preferredStaffId) {
      score += 50;
    }

    const skills = member.skills as string[] || [];
    if (serviceName && skills.some(s => 
      s.toLowerCase().includes(serviceName!.toLowerCase()) ||
      serviceName!.toLowerCase().includes(s.toLowerCase())
    )) {
      score += 20;
    }

    const staffBookingsToday = existingBookings.filter(b => b.staffId === member.id).length;
    score -= staffBookingsToday * 5;

    candidates.push({
      staffId: member.id,
      score,
      reason: `Available with score ${score}`
    });
  }

  if (candidates.length === 0) {
    return {
      staffId: null,
      score: 0,
      reason: 'No available staff found for the requested time slot'
    };
  }

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];

  return {
    staffId: best.staffId,
    staffName: `Staff #${best.staffId}`,
    score: best.score,
    reason: best.reason
  };
}

export async function getAvailableTimeSlots(
  companyId: string,
  date: Date,
  serviceId?: number
): Promise<{ time: string; available: boolean; staffCount: number }[]> {
  let durationMinutes = 60;

  if (serviceId) {
    const [service] = await db.select({ durationMinutes: services.durationMinutes })
      .from(services)
      .where(eq(services.id, serviceId))
      .limit(1);
    if (service) {
      durationMinutes = service.durationMinutes;
    }
  }

  const staffAvailability = await getStaffAvailability(companyId, date, durationMinutes);

  const slotMap = new Map<string, number>();

  const workingHours = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
                        '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
                        '16:00', '16:30', '17:00'];

  for (const time of workingHours) {
    slotMap.set(time, 0);
  }

  for (const staffMember of staffAvailability) {
    for (const slot of staffMember.slots) {
      if (slot.available) {
        const timeStr = format(slot.start, 'HH:mm');
        slotMap.set(timeStr, (slotMap.get(timeStr) || 0) + 1);
      }
    }
  }

  return Array.from(slotMap.entries())
    .map(([time, staffCount]) => ({
      time,
      available: staffCount > 0,
      staffCount
    }))
    .sort((a, b) => a.time.localeCompare(b.time));
}

export async function updateStaffAvailability(
  staffId: number,
  availability: Record<string, { start: string; end: string }>
): Promise<void> {
  await db.update(staff)
    .set({ 
      availability,
      updatedAt: new Date()
    })
    .where(eq(staff.id, staffId));
}

export async function getStaffSchedule(
  staffId: number,
  startDate: Date,
  endDate: Date
): Promise<any[]> {
  const startDateStr = format(startDate, 'yyyy-MM-dd');
  const endDateStr = format(endDate, 'yyyy-MM-dd');
  
  const staffBookings = await db.select({
    id: bookings.id,
    scheduledDate: bookings.scheduledDate,
    scheduledTime: bookings.scheduledTime,
    scheduledEndTime: bookings.scheduledEndTime,
    status: bookings.status,
    address: bookings.address,
    clientId: bookings.clientId,
    serviceId: bookings.serviceId
  })
  .from(bookings)
  .where(and(
    eq(bookings.staffId, staffId),
    gte(bookings.scheduledDate, startDateStr),
    lte(bookings.scheduledDate, endDateStr),
    ne(bookings.status, 'cancelled')
  ))
  .orderBy(bookings.scheduledDate);

  return staffBookings;
}
