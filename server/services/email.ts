import { db } from '../db';
import { bookings, clients, companies, users, services, invoices, emailLogs } from '../db/schema';
import { eq } from 'drizzle-orm';
import { format } from 'date-fns';
import { Resend } from 'resend';

interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  companyId: string;
  emailType: 'booking_confirmation' | 'booking_reminder' | 'booking_cancelled' | 'invoice' | 'welcome' | 'custom';
  bookingId?: string;
  invoiceId?: number;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

let connectionSettings: any;

async function getResendCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return { apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email };
}

async function getResendClient() {
  const credentials = await getResendCredentials();
  return {
    client: new Resend(credentials.apiKey),
    fromEmail: credentials.fromEmail
  };
}

export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const result = await client.emails.send({
      from: fromEmail || 'CleanPro <noreply@resend.dev>',
      to: message.to,
      subject: message.subject,
      html: message.html,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    console.log(`Email sent successfully to ${message.to}`);
    console.log(`  Subject: ${message.subject}`);
    console.log(`  Type: ${message.emailType}`);

    await db.insert(emailLogs).values({
      companyId: message.companyId,
      bookingId: message.bookingId || null,
      invoiceId: message.invoiceId || null,
      recipientEmail: message.to,
      emailType: message.emailType,
      subject: message.subject,
      content: message.html,
      status: 'sent',
      sentAt: new Date()
    });

    return { success: true, messageId: result.data?.id || 'sent-' + Date.now() };
  } catch (error: any) {
    console.error('Email send error:', error);

    await db.insert(emailLogs).values({
      companyId: message.companyId,
      bookingId: message.bookingId || null,
      invoiceId: message.invoiceId || null,
      recipientEmail: message.to,
      emailType: message.emailType,
      subject: message.subject,
      content: message.html,
      status: 'failed',
      errorMessage: error.message
    });

    return { success: false, error: error.message };
  }
}

function getEmailTemplate(type: string, data: any): { subject: string; html: string } {
  const companyName = data.companyName || 'CleanPro';
  const primaryColor = data.primaryColor || '#3B82F6';

  const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${companyName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: ${primaryColor}; margin: 0;">${companyName}</h1>
  </div>
  ${content}
  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
    <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
    <p style="font-size: 12px;">If you have any questions, reply to this email or contact us.</p>
  </div>
</body>
</html>`;

  switch (type) {
    case 'booking_confirmation':
      return {
        subject: `Booking Confirmed - ${data.serviceName} on ${data.dateStr}`,
        html: baseTemplate(`
          <h2 style="color: ${primaryColor};">Booking Confirmed!</h2>
          <p>Hi ${data.clientName},</p>
          <p>Your cleaning appointment has been confirmed. Here are the details:</p>
          <div style="background: #f7f7f7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Service:</strong> ${data.serviceName}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${data.dateStr}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${data.timeStr}</p>
            <p style="margin: 5px 0;"><strong>Address:</strong> ${data.address}</p>
            <p style="margin: 5px 0;"><strong>Total:</strong> $${data.totalPrice}</p>
          </div>
          <p>We'll send you a reminder 24 hours before your appointment.</p>
          <p>Thank you for choosing ${companyName}!</p>
        `)
      };

    case 'booking_reminder':
      return {
        subject: `Reminder: ${data.serviceName} Tomorrow at ${data.timeStr}`,
        html: baseTemplate(`
          <h2 style="color: ${primaryColor};">Appointment Reminder</h2>
          <p>Hi ${data.clientName},</p>
          <p>This is a friendly reminder about your cleaning appointment tomorrow:</p>
          <div style="background: #f7f7f7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Service:</strong> ${data.serviceName}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${data.dateStr}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${data.timeStr}</p>
            <p style="margin: 5px 0;"><strong>Address:</strong> ${data.address}</p>
          </div>
          <p>Please ensure access to your property is available at the scheduled time.</p>
          <p>See you tomorrow!</p>
        `)
      };

    case 'booking_cancelled':
      return {
        subject: `Booking Cancelled - ${data.dateStr}`,
        html: baseTemplate(`
          <h2 style="color: #EF4444;">Booking Cancelled</h2>
          <p>Hi ${data.clientName},</p>
          <p>Your cleaning appointment has been cancelled.</p>
          <div style="background: #f7f7f7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Service:</strong> ${data.serviceName}</p>
            <p style="margin: 5px 0;"><strong>Original Date:</strong> ${data.dateStr}</p>
            ${data.reason ? `<p style="margin: 5px 0;"><strong>Reason:</strong> ${data.reason}</p>` : ''}
          </div>
          <p>If you'd like to reschedule, please contact us or book a new appointment.</p>
        `)
      };

    case 'invoice':
      return {
        subject: `Invoice #${data.invoiceNumber} from ${companyName}`,
        html: baseTemplate(`
          <h2 style="color: ${primaryColor};">Invoice #${data.invoiceNumber}</h2>
          <p>Hi ${data.clientName},</p>
          <p>Here is your invoice for recent cleaning services:</p>
          <div style="background: #f7f7f7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${data.invoiceDate}</p>
            <p style="margin: 5px 0;"><strong>Due Date:</strong> ${data.dueDate}</p>
            <p style="margin: 5px 0;"><strong>Amount:</strong> $${data.amount}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> ${data.status}</p>
          </div>
          ${data.paymentLink ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.paymentLink}" style="background: ${primaryColor}; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">Pay Now</a>
            </div>
          ` : ''}
          <p>Thank you for your business!</p>
        `)
      };

    case 'welcome':
      return {
        subject: `Welcome to ${companyName}!`,
        html: baseTemplate(`
          <h2 style="color: ${primaryColor};">Welcome to ${companyName}!</h2>
          <p>Hi ${data.clientName},</p>
          <p>Thank you for creating an account with us. We're excited to have you as a client!</p>
          <div style="background: #f7f7f7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Email:</strong> ${data.email}</p>
            <p style="margin: 5px 0;"><strong>Account created:</strong> ${data.createdAt}</p>
          </div>
          <p>With your account, you can:</p>
          <ul>
            <li>Book and manage cleaning appointments</li>
            <li>View your booking history</li>
            <li>Access invoices and payment history</li>
            <li>Message us directly through your portal</li>
          </ul>
          ${data.portalLink ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.portalLink}" style="background: ${primaryColor}; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">Access Your Portal</a>
            </div>
          ` : ''}
          <p>We look forward to serving you!</p>
        `)
      };

    default:
      return {
        subject: data.subject || 'Message from ' + companyName,
        html: baseTemplate(data.content || '<p>No content provided.</p>')
      };
  }
}

export async function sendBookingConfirmationEmail(bookingId: string): Promise<EmailResult> {
  try {
    const [booking] = await db.select({
      id: bookings.id,
      scheduledDate: bookings.scheduledDate,
      scheduledTime: bookings.scheduledTime,
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

    if (!booking.clientId) {
      return { success: false, error: 'Booking has no client assigned' };
    }

    if (!booking.serviceId) {
      return { success: false, error: 'Booking has no service assigned' };
    }

    const clientId = booking.clientId;
    const serviceId = booking.serviceId;

    const [client] = await db.select({ userId: clients.userId })
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);

    if (!client) {
      return { success: false, error: 'Client not found' };
    }

    const [user] = await db.select({
      firstName: users.firstName,
      email: users.email
    })
    .from(users)
    .where(eq(users.id, client.userId))
    .limit(1);

    if (!user?.email) {
      return { success: false, error: 'Client email not found' };
    }

    const [company] = await db.select({ name: companies.name })
      .from(companies)
      .where(eq(companies.id, booking.companyId))
      .limit(1);

    const [service] = await db.select({ name: services.name })
      .from(services)
      .where(eq(services.id, serviceId))
      .limit(1);

    const dateStr = format(new Date(booking.scheduledDate + 'T00:00:00'), 'EEEE, MMMM d, yyyy');
    const timeStr = booking.scheduledTime || '9:00 AM';

    const template = getEmailTemplate('booking_confirmation', {
      companyName: company?.name,
      clientName: user.firstName || 'Valued Customer',
      serviceName: service?.name || 'Cleaning Service',
      dateStr,
      timeStr,
      address: booking.address,
      totalPrice: booking.totalPrice
    });

    return await sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
      companyId: booking.companyId,
      emailType: 'booking_confirmation',
      bookingId: booking.id
    });
  } catch (error: any) {
    console.error('Failed to send booking confirmation email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendBookingReminderEmail(bookingId: string): Promise<EmailResult> {
  try {
    const [booking] = await db.select({
      id: bookings.id,
      scheduledDate: bookings.scheduledDate,
      scheduledTime: bookings.scheduledTime,
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

    if (!booking.clientId) {
      return { success: false, error: 'Booking has no client assigned' };
    }

    if (!booking.serviceId) {
      return { success: false, error: 'Booking has no service assigned' };
    }

    const clientId = booking.clientId;
    const serviceId = booking.serviceId;

    const [client] = await db.select({ userId: clients.userId })
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);

    if (!client) {
      return { success: false, error: 'Client not found' };
    }

    const [user] = await db.select({
      firstName: users.firstName,
      email: users.email
    })
    .from(users)
    .where(eq(users.id, client.userId))
    .limit(1);

    if (!user?.email) {
      return { success: false, error: 'Client email not found' };
    }

    const [company] = await db.select({ name: companies.name })
      .from(companies)
      .where(eq(companies.id, booking.companyId))
      .limit(1);

    const [service] = await db.select({ name: services.name })
      .from(services)
      .where(eq(services.id, serviceId))
      .limit(1);

    const dateStr = format(new Date(booking.scheduledDate + 'T00:00:00'), 'EEEE, MMMM d, yyyy');
    const timeStr = booking.scheduledTime || '9:00 AM';

    const template = getEmailTemplate('booking_reminder', {
      companyName: company?.name,
      clientName: user.firstName || 'Valued Customer',
      serviceName: service?.name || 'Cleaning Service',
      dateStr,
      timeStr,
      address: booking.address
    });

    return await sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
      companyId: booking.companyId,
      emailType: 'booking_reminder',
      bookingId: booking.id
    });
  } catch (error: any) {
    console.error('Failed to send booking reminder email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendBookingCancellationEmail(bookingId: string, reason?: string): Promise<EmailResult> {
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

    if (!booking.clientId) {
      return { success: false, error: 'Booking has no client assigned' };
    }

    if (!booking.serviceId) {
      return { success: false, error: 'Booking has no service assigned' };
    }

    const clientId = booking.clientId;
    const serviceId = booking.serviceId;

    const [client] = await db.select({ userId: clients.userId })
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);

    if (!client) {
      return { success: false, error: 'Client not found' };
    }

    const [user] = await db.select({
      firstName: users.firstName,
      email: users.email
    })
    .from(users)
    .where(eq(users.id, client.userId))
    .limit(1);

    if (!user?.email) {
      return { success: false, error: 'Client email not found' };
    }

    const [company] = await db.select({ name: companies.name })
      .from(companies)
      .where(eq(companies.id, booking.companyId))
      .limit(1);

    const [service] = await db.select({ name: services.name })
      .from(services)
      .where(eq(services.id, serviceId))
      .limit(1);

    const dateStr = format(new Date(booking.scheduledDate + 'T00:00:00'), 'EEEE, MMMM d, yyyy');

    const template = getEmailTemplate('booking_cancelled', {
      companyName: company?.name,
      clientName: user.firstName || 'Valued Customer',
      serviceName: service?.name || 'Cleaning Service',
      dateStr,
      reason
    });

    return await sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
      companyId: booking.companyId,
      emailType: 'booking_cancelled',
      bookingId: booking.id
    });
  } catch (error: any) {
    console.error('Failed to send booking cancellation email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendWelcomeEmail(userId: number, companyId: string): Promise<EmailResult> {
  try {
    const [user] = await db.select({
      firstName: users.firstName,
      email: users.email,
      createdAt: users.createdAt
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

    if (!user?.email) {
      return { success: false, error: 'User email not found' };
    }

    const [company] = await db.select({ name: companies.name })
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    const template = getEmailTemplate('welcome', {
      companyName: company?.name,
      clientName: user.firstName || 'Valued Customer',
      email: user.email,
      createdAt: format(new Date(user.createdAt), 'MMMM d, yyyy'),
      portalLink: '/client'
    });

    return await sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
      companyId,
      emailType: 'welcome'
    });
  } catch (error: any) {
    console.error('Failed to send welcome email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendInvoiceEmail(invoiceId: number): Promise<EmailResult> {
  try {
    const [invoice] = await db.select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    const [client] = await db.select({ userId: clients.userId })
      .from(clients)
      .where(eq(clients.id, invoice.clientId))
      .limit(1);

    if (!client) {
      return { success: false, error: 'Client not found' };
    }

    const [user] = await db.select({
      firstName: users.firstName,
      email: users.email
    })
    .from(users)
    .where(eq(users.id, client.userId))
    .limit(1);

    if (!user?.email) {
      return { success: false, error: 'Client email not found' };
    }

    const [company] = await db.select({ name: companies.name })
      .from(companies)
      .where(eq(companies.id, invoice.companyId))
      .limit(1);

    const template = getEmailTemplate('invoice', {
      companyName: company?.name,
      clientName: user.firstName || 'Valued Customer',
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: format(new Date(invoice.createdAt), 'MMMM d, yyyy'),
      dueDate: invoice.dueDate ? format(new Date(invoice.dueDate), 'MMMM d, yyyy') : 'Due on receipt',
      amount: invoice.amount,
      status: invoice.status
    });

    return await sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
      companyId: invoice.companyId,
      emailType: 'invoice',
      invoiceId: invoice.id
    });
  } catch (error: any) {
    console.error('Failed to send invoice email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendCustomEmail(
  companyId: string,
  email: string,
  subject: string,
  content: string
): Promise<EmailResult> {
  const [company] = await db.select({ name: companies.name })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);

  const template = getEmailTemplate('custom', {
    companyName: company?.name,
    subject,
    content
  });

  return await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    companyId,
    emailType: 'custom'
  });
}
