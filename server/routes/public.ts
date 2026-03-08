import { Router } from "express";
import { db } from "../db";
import { companies, companyBranding, services, bookings, users, clients, staff, leads, referrals, notifications } from "../db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { format, addMinutes, parse, isAfter, isBefore } from "date-fns";
import { getUncachableStripeClient } from "../services/stripe";

const router = Router();

const DEFAULT_TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00'
];

router.get("/company/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const [company] = await db.select()
      .from(companies)
      .where(and(
        eq(companies.slug, slug),
        eq(companies.isActive, true)
      ))
      .limit(1);

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    const [branding] = await db.select()
      .from(companyBranding)
      .where(eq(companyBranding.companyId, company.id))
      .limit(1);

    const companyServices = await db.select({
      id: services.id,
      name: services.name,
      description: services.description,
      basePrice: services.basePrice,
      pricePerBedroom: services.pricePerBedroom,
      pricePerBathroom: services.pricePerBathroom,
      durationMinutes: services.durationMinutes,
    })
    .from(services)
    .where(and(
      eq(services.companyId, company.id),
      eq(services.isActive, true)
    ));

    res.json({
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        phone: company.phone,
        email: company.email,
      },
      branding: branding ? {
        logoUrl: branding.logoUrl,
        primaryColor: branding.primaryColor || '#0d9488',
        secondaryColor: branding.secondaryColor || '#0284c7',
      } : null,
      services: companyServices,
    });
  } catch (error) {
    console.error("Get public company error:", error);
    res.status(500).json({ error: "Failed to get company" });
  }
});

router.get("/availability/:companyId", async (req, res) => {
  try {
    const { companyId } = req.params;
    const { date, serviceId } = req.query;

    if (!date) {
      return res.status(400).json({ error: "Date is required" });
    }

    const dateStr = date as string;

    const [service] = serviceId ? await db.select()
      .from(services)
      .where(eq(services.id, serviceId as string))
      .limit(1) : [null];

    const serviceDuration = service?.durationMinutes || 60;

    const existingBookings = await db.select({
      scheduledTime: bookings.scheduledTime,
      status: bookings.status,
      serviceId: bookings.serviceId,
    })
    .from(bookings)
    .where(and(
      eq(bookings.companyId, companyId),
      eq(bookings.scheduledDate, dateStr),
      sql`${bookings.status} NOT IN ('cancelled')`
    ));

    const allServices = await db.select({
      id: services.id,
      durationMinutes: services.durationMinutes,
    })
    .from(services)
    .where(eq(services.companyId, companyId));

    const serviceMap = new Map(allServices.map(s => [s.id, s.durationMinutes]));

    const companyStaff = await db.select()
      .from(staff)
      .where(and(
        eq(staff.companyId, companyId),
        eq(staff.isActive, true)
      ));

    const staffCount = Math.max(companyStaff.length, 1);

    function parseTime(timeStr: string): number {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    }

    function formatTime(minutes: number): string {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }

    const bookingRanges = existingBookings.map(b => {
      const startMinutes = parseTime(b.scheduledTime);
      const duration = b.serviceId ? (serviceMap.get(b.serviceId) || 60) : 60;
      return {
        start: startMinutes,
        end: startMinutes + duration
      };
    });

    const slots = DEFAULT_TIME_SLOTS.map(time => {
      const slotStart = parseTime(time);
      const slotEnd = slotStart + serviceDuration;

      let overlappingBookings = 0;
      for (const range of bookingRanges) {
        if (slotStart < range.end && slotEnd > range.start) {
          overlappingBookings++;
        }
      }

      return {
        time,
        available: overlappingBookings < staffCount
      };
    });

    res.json({ slots });
  } catch (error) {
    console.error("Get availability error:", error);
    res.status(500).json({ error: "Failed to get availability" });
  }
});

router.post("/book", async (req, res) => {
  try {
    const {
      companyId,
      serviceId,
      date,
      time,
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      state,
      zipCode,
      bedrooms,
      bathrooms,
      notes
    } = req.body;

    if (!companyId || !serviceId || !date || !time || !firstName || !lastName || !email || !address) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const [company] = await db.select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    const [service] = await db.select()
      .from(services)
      .where(eq(services.id, serviceId))
      .limit(1);

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    let [existingUser] = await db.select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!existingUser) {
      const [newUser] = await db.insert(users)
        .values({
          email: email.toLowerCase(),
          firstName,
          lastName,
          phone,
          role: 'client',
          companyId,
        })
        .returning();
      existingUser = newUser;
    }

    let [existingClient] = await db.select()
      .from(clients)
      .where(and(
        eq(clients.userId, existingUser.id),
        eq(clients.companyId, companyId)
      ))
      .limit(1);

    if (!existingClient) {
      const [newClient] = await db.insert(clients)
        .values({
          userId: existingUser.id,
          companyId,
          address,
          city,
          state,
          zipCode,
          bedrooms,
          bathrooms: String(bathrooms),
          notes,
        })
        .returning();
      existingClient = newClient;
    }

    const basePrice = parseFloat(service.basePrice || '0');
    const pricePerBedroom = parseFloat(service.pricePerBedroom || '0');
    const pricePerBathroom = parseFloat(service.pricePerBathroom || '0');
    const totalPrice = basePrice + (bedrooms * pricePerBedroom) + (bathrooms * pricePerBathroom);

    const fullAddress = `${address}, ${city}, ${state} ${zipCode}`;

    const [booking] = await db.insert(bookings)
      .values({
        companyId,
        clientId: existingClient.id,
        serviceId,
        scheduledDate: date,
        scheduledTime: time,
        status: 'pending',
        totalPrice: String(totalPrice),
        address: fullAddress,
        bedrooms,
        bathrooms: String(bathrooms),
        notes,
        paymentStatus: 'pending',
      })
      .returning();

    try {
      const stripe = await getUncachableStripeClient();
      const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000';
      const protocol = domain.includes('localhost') ? 'http' : 'https';

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: email,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${service.name} - ${company.name}`,
                description: `Cleaning on ${format(new Date(date), 'MMMM d, yyyy')} at ${time}`,
              },
              unit_amount: Math.round(totalPrice * 100),
            },
            quantity: 1,
          },
        ],
        metadata: {
          bookingId: booking.id,
          companyId,
          clientId: String(existingClient.id),
        },
        success_url: `${protocol}://${domain}/book/${company.slug}/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking.id}`,
        cancel_url: `${protocol}://${domain}/book/${company.slug}?cancelled=true`,
      });

      await db.update(bookings)
        .set({ 
          stripeSessionId: session.id,
        })
        .where(eq(bookings.id, booking.id));

      res.json({ 
        success: true,
        bookingId: booking.id,
        checkoutUrl: session.url 
      });
    } catch (stripeError: any) {
      console.error("Stripe checkout error:", stripeError);
      res.json({ 
        success: true,
        bookingId: booking.id,
        message: "Booking created. Payment can be completed later."
      });
    }
  } catch (error) {
    console.error("Create public booking error:", error);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

router.get("/booking/:bookingId/status", async (req, res) => {
  try {
    const { bookingId } = req.params;

    const [booking] = await db.select({
      id: bookings.id,
      status: bookings.status,
      paymentStatus: bookings.paymentStatus,
      scheduledDate: bookings.scheduledDate,
      scheduledTime: bookings.scheduledTime,
      totalPrice: bookings.totalPrice,
      serviceName: services.name,
      companyName: companies.name,
    })
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .innerJoin(companies, eq(bookings.companyId, companies.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json({ booking });
  } catch (error) {
    console.error("Get booking status error:", error);
    res.status(500).json({ error: "Failed to get booking status" });
  }
});

router.post("/booking/payment-success", async (req, res) => {
  try {
    const { sessionId, bookingId } = req.body;

    if (!sessionId || !bookingId) {
      return res.status(400).json({ error: "Session ID and Booking ID required" });
    }

    const [booking] = await db.select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.stripeSessionId !== sessionId) {
      return res.status(403).json({ error: "Session ID mismatch" });
    }

    try {
      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status !== 'paid') {
        return res.status(400).json({ error: "Payment not completed" });
      }

      if (session.metadata?.bookingId !== bookingId) {
        return res.status(403).json({ error: "Booking ID mismatch in session" });
      }

      await db.update(bookings)
        .set({ 
          paymentStatus: 'paid',
          stripePaymentIntentId: session.payment_intent as string || null
        })
        .where(eq(bookings.id, bookingId));

      res.json({ success: true, message: "Payment confirmed. Awaiting service confirmation from the cleaning company." });
    } catch (stripeError: any) {
      console.error("Stripe verification error:", stripeError);
      return res.status(400).json({ error: "Could not verify payment" });
    }
  } catch (error) {
    console.error("Payment success handler error:", error);
    res.status(500).json({ error: "Failed to update payment status" });
  }
});

router.post("/quote-request", async (req, res) => {
  try {
    const {
      companyId,
      firstName,
      lastName,
      email,
      phone,
      serviceInterest,
      address,
      bedrooms,
      bathrooms,
      preferredDate,
      notes,
      referralCode
    } = req.body;

    if (!companyId || !email) {
      return res.status(400).json({ error: "Company ID and email are required" });
    }

    const [company] = await db.select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    let leadScore = 50;
    if (email) leadScore += 10;
    if (phone) leadScore += 10;
    if (address) leadScore += 15;
    if (serviceInterest) leadScore += 10;
    if (referralCode) leadScore += 20;

    const [newLead] = await db.insert(leads).values({
      companyId,
      firstName,
      lastName,
      email,
      phone,
      source: 'quote_request',
      serviceInterest,
      address,
      bedrooms,
      bathrooms: bathrooms ? String(bathrooms) : null,
      preferredDate,
      referralCode,
      notes,
      score: leadScore,
      status: 'new',
    }).returning();

    const adminUsers = await db.select({ id: users.id })
      .from(users)
      .where(and(
        eq(users.companyId, companyId),
        eq(users.role, 'admin')
      ));

    for (const admin of adminUsers) {
      await db.insert(notifications).values({
        userId: admin.id,
        companyId,
        type: 'new_lead',
        title: 'New Quote Request',
        message: `${firstName || ''} ${lastName || ''} requested a quote for ${serviceInterest || 'cleaning services'}`,
        data: { leadId: newLead.id, source: 'quote_request' }
      });
    }

    res.json({
      success: true,
      message: "Thank you! We'll get back to you with a quote within 24 hours.",
      leadId: newLead.id
    });
  } catch (error) {
    console.error("Quote request error:", error);
    res.status(500).json({ error: "Failed to submit quote request" });
  }
});

router.post("/abandoned-booking", async (req, res) => {
  try {
    const {
      companyId,
      step,
      formData
    } = req.body;

    if (!companyId) {
      return res.status(400).json({ error: "Company ID is required" });
    }

    if (!formData?.email) {
      return res.json({ success: true, message: "No email provided, skipping lead capture" });
    }

    const [existingLead] = await db.select()
      .from(leads)
      .where(and(
        eq(leads.companyId, companyId),
        eq(leads.email, formData.email),
        eq(leads.source, 'abandoned_booking')
      ))
      .limit(1);

    if (existingLead) {
      await db.update(leads)
        .set({
          abandonedStep: step,
          abandonedData: formData,
          updatedAt: new Date()
        })
        .where(eq(leads.id, existingLead.id));

      return res.json({ success: true, updated: true });
    }

    let leadScore = 30;
    if (step >= 2) leadScore += 10;
    if (step >= 3) leadScore += 15;
    if (step >= 4) leadScore += 20;
    if (formData.phone) leadScore += 10;
    if (formData.address) leadScore += 10;

    const [newLead] = await db.insert(leads).values({
      companyId,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      source: 'abandoned_booking',
      serviceInterest: formData.serviceId,
      address: formData.address,
      bedrooms: formData.bedrooms,
      bathrooms: formData.bathrooms ? String(formData.bathrooms) : null,
      preferredDate: formData.date,
      abandonedStep: step,
      abandonedData: formData,
      score: leadScore,
      status: 'new',
    }).returning();

    const adminUsers = await db.select({ id: users.id })
      .from(users)
      .where(and(
        eq(users.companyId, companyId),
        eq(users.role, 'admin')
      ));

    for (const admin of adminUsers) {
      await db.insert(notifications).values({
        userId: admin.id,
        companyId,
        type: 'abandoned_booking',
        title: 'Abandoned Booking',
        message: `${formData.firstName || formData.email} started but didn't complete their booking (Step ${step}/5)`,
        data: { leadId: newLead.id, step, source: 'abandoned_booking' }
      });
    }

    res.json({ success: true, leadId: newLead.id });
  } catch (error) {
    console.error("Abandoned booking capture error:", error);
    res.status(500).json({ error: "Failed to capture abandoned booking" });
  }
});

router.get("/referral/validate/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const { companyId } = req.query;

    if (!code || !companyId) {
      return res.status(400).json({ valid: false, error: "Code and company ID required" });
    }

    const [referral] = await db.select().from(referrals)
      .where(and(
        eq(referrals.referralCode, code.toUpperCase()),
        eq(referrals.companyId, companyId as string)
      ))
      .limit(1);

    if (!referral) {
      return res.json({ valid: false });
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
        type: referral.rewardType || 'discount',
        value: referral.rewardValue || '10'
      }
    });
  } catch (error) {
    console.error("Validate referral error:", error);
    res.status(500).json({ error: "Failed to validate referral" });
  }
});

export default router;
