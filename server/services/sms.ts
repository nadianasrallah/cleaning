import twilio from 'twilio';
import { db } from '../db';
import { smsLogs, bookings, clients, users, companies, services } from '../db/schema';
import { eq } from 'drizzle-orm';
import { format, subHours } from 'date-fns';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

let twilioClient: twilio.Twilio | null = null;

function getClient() {
  if (!accountSid || !authToken) {
    console.warn('Twilio credentials not configured');
    return null;
  }
  if (!twilioClient) {
    twilioClient = twilio(accountSid, authToken);
  }
  return twilioClient;
}

export interface SMSMessage {
  to: string;
  body: string;
  companyId: string;
  bookingId?: number;
  messageType: 'booking_confirmation' | 'booking_reminder' | 'booking_cancelled' | 'custom';
}

export async function sendSMS(message: SMSMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const client = getClient();
  
  if (!client || !twilioPhone) {
    console.log('SMS Mock (Twilio not configured):', message);
    
    await db.insert(smsLogs).values({
      companyId: message.companyId,
      bookingId: message.bookingId || null,
      recipientPhone: message.to,
      messageType: message.messageType,
      content: message.body,
      status: 'mock',
      sentAt: new Date()
    });
    
    return { success: true, messageId: 'mock-' + Date.now() };
  }

  try {
    const result = await client.messages.create({
      body: message.body,
      from: twilioPhone,
      to: message.to
    });

    await db.insert(smsLogs).values({
      companyId: message.companyId,
      bookingId: message.bookingId || null,
      recipientPhone: message.to,
      messageType: message.messageType,
      content: message.body,
      twilioMessageId: result.sid,
      status: 'sent',
      sentAt: new Date()
    });

    return { success: true, messageId: result.sid };
  } catch (error: any) {
    console.error('Twilio SMS error:', error);

    await db.insert(smsLogs).values({
      companyId: message.companyId,
      bookingId: message.bookingId || null,
      recipientPhone: message.to,
      messageType: message.messageType,
      content: message.body,
      status: 'failed',
      errorMessage: error.message
    });

    return { success: false, error: error.message };
  }
}

export async function sendBookingConfirmation(bookingId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const [booking] = await db.select({
      id: bookings.id,
      scheduledDate: bookings.scheduledDate,
      address: bookings.address,
      totalPrice: bookings.totalPrice,
      companyId: bookings.companyId,
      clientId: bookings.clientId,
      serviceId: bookings.serviceId
    })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

    if (!booking) {
      return { success: false, error: 'Booking not found' };
    }

    const [client] = await db.select({
      userId: clients.userId
    })
    .from(clients)
    .where(eq(clients.id, booking.clientId))
    .limit(1);

    if (!client) {
      return { success: false, error: 'Client not found' };
    }

    const [user] = await db.select({
      firstName: users.firstName,
      phone: users.phone
    })
    .from(users)
    .where(eq(users.id, client.userId))
    .limit(1);

    if (!user?.phone) {
      return { success: false, error: 'Client phone not found' };
    }

    const [company] = await db.select({
      name: companies.name
    })
    .from(companies)
    .where(eq(companies.id, booking.companyId))
    .limit(1);

    const [service] = await db.select({
      name: services.name
    })
    .from(services)
    .where(eq(services.id, booking.serviceId))
    .limit(1);

    const dateStr = format(new Date(booking.scheduledDate), 'EEEE, MMMM d');
    const timeStr = format(new Date(booking.scheduledDate), 'h:mm a');

    const body = `Hi ${user.firstName}! Your ${service?.name || 'cleaning'} with ${company?.name || 'CleanPro'} is confirmed for ${dateStr} at ${timeStr}. Address: ${booking.address}. Total: $${booking.totalPrice}. Reply HELP for support or STOP to unsubscribe.`;

    return await sendSMS({
      to: user.phone,
      body,
      companyId: booking.companyId,
      bookingId: booking.id,
      messageType: 'booking_confirmation'
    });
  } catch (error: any) {
    console.error('Failed to send booking confirmation:', error);
    return { success: false, error: error.message };
  }
}

export async function sendBookingReminder(bookingId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const [booking] = await db.select({
      id: bookings.id,
      scheduledDate: bookings.scheduledDate,
      address: bookings.address,
      companyId: bookings.companyId,
      clientId: bookings.clientId,
      serviceId: bookings.serviceId
    })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

    if (!booking) {
      return { success: false, error: 'Booking not found' };
    }

    const [client] = await db.select({
      userId: clients.userId
    })
    .from(clients)
    .where(eq(clients.id, booking.clientId))
    .limit(1);

    if (!client) {
      return { success: false, error: 'Client not found' };
    }

    const [user] = await db.select({
      firstName: users.firstName,
      phone: users.phone
    })
    .from(users)
    .where(eq(users.id, client.userId))
    .limit(1);

    if (!user?.phone) {
      return { success: false, error: 'Client phone not found' };
    }

    const [company] = await db.select({
      name: companies.name
    })
    .from(companies)
    .where(eq(companies.id, booking.companyId))
    .limit(1);

    const [service] = await db.select({
      name: services.name
    })
    .from(services)
    .where(eq(services.id, booking.serviceId))
    .limit(1);

    const timeStr = format(new Date(booking.scheduledDate), 'h:mm a');

    const body = `Reminder: Your ${service?.name || 'cleaning'} with ${company?.name || 'CleanPro'} is tomorrow at ${timeStr}. Location: ${booking.address}. See you soon!`;

    return await sendSMS({
      to: user.phone,
      body,
      companyId: booking.companyId,
      bookingId: booking.id,
      messageType: 'booking_reminder'
    });
  } catch (error: any) {
    console.error('Failed to send booking reminder:', error);
    return { success: false, error: error.message };
  }
}

export async function sendBookingCancellation(bookingId: number, reason?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const [booking] = await db.select({
      id: bookings.id,
      scheduledDate: bookings.scheduledDate,
      companyId: bookings.companyId,
      clientId: bookings.clientId,
      serviceId: bookings.serviceId
    })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

    if (!booking) {
      return { success: false, error: 'Booking not found' };
    }

    const [client] = await db.select({
      userId: clients.userId
    })
    .from(clients)
    .where(eq(clients.id, booking.clientId))
    .limit(1);

    if (!client) {
      return { success: false, error: 'Client not found' };
    }

    const [user] = await db.select({
      firstName: users.firstName,
      phone: users.phone
    })
    .from(users)
    .where(eq(users.id, client.userId))
    .limit(1);

    if (!user?.phone) {
      return { success: false, error: 'Client phone not found' };
    }

    const [company] = await db.select({
      name: companies.name
    })
    .from(companies)
    .where(eq(companies.id, booking.companyId))
    .limit(1);

    const dateStr = format(new Date(booking.scheduledDate), 'MMMM d');

    let body = `Your booking with ${company?.name || 'CleanPro'} for ${dateStr} has been cancelled.`;
    if (reason) {
      body += ` Reason: ${reason}`;
    }
    body += ' Contact us to reschedule.';

    return await sendSMS({
      to: user.phone,
      body,
      companyId: booking.companyId,
      bookingId: booking.id,
      messageType: 'booking_cancelled'
    });
  } catch (error: any) {
    console.error('Failed to send cancellation SMS:', error);
    return { success: false, error: error.message };
  }
}

export async function sendCustomSMS(
  companyId: string,
  phone: string,
  message: string,
  bookingId?: number
): Promise<{ success: boolean; error?: string }> {
  return await sendSMS({
    to: phone,
    body: message,
    companyId,
    bookingId,
    messageType: 'custom'
  });
}

export function isTwilioConfigured(): boolean {
  return !!(accountSid && authToken && twilioPhone);
}
