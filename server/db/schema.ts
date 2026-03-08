import { pgTable, text, serial, integer, boolean, timestamp, varchar, decimal, jsonb, uuid, date } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  role: varchar("role", { length: 20 }).notNull().default("client"),
  companyId: uuid("company_id"),
  avatarUrl: text("avatar_url"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }),
  ownerId: integer("owner_id").notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zip_code", { length: 20 }),
  timezone: varchar("timezone", { length: 50 }).default("America/New_York"),
  subscriptionTier: varchar("subscription_tier", { length: 20 }).default("free"),
  subscriptionStatus: varchar("subscription_status", { length: 20 }).default("active"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const companyBranding = pgTable("company_branding", {
  id: serial("id").primaryKey(),
  companyId: uuid("company_id").notNull().unique(),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  primaryColor: varchar("primary_color", { length: 7 }).default("#3B82F6"),
  secondaryColor: varchar("secondary_color", { length: 7 }).default("#1E40AF"),
  accentColor: varchar("accent_color", { length: 7 }).default("#F59E0B"),
  fontFamily: varchar("font_family", { length: 100 }).default("Inter"),
  customDomain: varchar("custom_domain", { length: 255 }),
  customDomainVerified: boolean("custom_domain_verified").default(false),
  metaTitle: varchar("meta_title", { length: 255 }),
  metaDescription: text("meta_description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  companyId: uuid("company_id").notNull(),
  role: varchar("role", { length: 50 }).default("cleaner"),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  skills: jsonb("skills").$type<string[]>().default([]),
  availability: jsonb("availability").$type<Record<string, { start: string; end: string }>>(),
  isActive: boolean("is_active").notNull().default(true),
  hireDate: timestamp("hire_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  companyId: uuid("company_id").notNull(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zip_code", { length: 20 }),
  propertyType: varchar("property_type", { length: 50 }),
  bedrooms: integer("bedrooms"),
  bathrooms: decimal("bathrooms", { precision: 3, scale: 1 }),
  squareFeet: integer("square_feet"),
  accessInstructions: text("access_instructions"),
  notes: text("notes"),
  source: varchar("source", { length: 50 }),
  leadScore: integer("lead_score").default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const services = pgTable("services", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  pricePerBedroom: decimal("price_per_bedroom", { precision: 10, scale: 2 }).default("0"),
  pricePerBathroom: decimal("price_per_bathroom", { precision: 10, scale: 2 }).default("0"),
  durationMinutes: integer("duration_minutes").notNull().default(60),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull(),
  clientId: integer("client_id"),
  serviceId: uuid("service_id"),
  staffId: integer("staff_id"),
  scheduledDate: date("scheduled_date").notNull(),
  scheduledTime: varchar("scheduled_time", { length: 10 }).notNull(),
  scheduledEndTime: timestamp("scheduled_end_time"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }),
  notes: text("notes"),
  address: text("address"),
  bedrooms: integer("bedrooms"),
  bathrooms: decimal("bathrooms", { precision: 3, scale: 1 }),
  frequency: varchar("frequency", { length: 20 }).default("one-time"),
  recurringParentId: integer("recurring_parent_id"),
  paymentStatus: varchar("payment_status", { length: 20 }).default("pending"),
  paymentIntentId: varchar("payment_intent_id", { length: 255 }),
  stripeSessionId: varchar("stripe_session_id", { length: 255 }),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  completedAt: timestamp("completed_at"),
  cancelledAt: timestamp("cancelled_at"),
  cancellationReason: text("cancellation_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  companyId: uuid("company_id").notNull(),
  clientId: integer("client_id").notNull(),
  lastMessageAt: timestamp("last_message_at"),
  unreadCountCompany: integer("unread_count_company").default(0),
  unreadCountClient: integer("unread_count_client").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  senderId: integer("sender_id").notNull(),
  senderType: varchar("sender_type", { length: 20 }).notNull(),
  content: text("content").notNull(),
  attachmentUrl: text("attachment_url"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  companyId: uuid("company_id"),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  data: jsonb("data"),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const smsLogs = pgTable("sms_logs", {
  id: serial("id").primaryKey(),
  companyId: uuid("company_id").notNull(),
  bookingId: integer("booking_id"),
  recipientPhone: varchar("recipient_phone", { length: 20 }).notNull(),
  messageType: varchar("message_type", { length: 50 }).notNull(),
  content: text("content").notNull(),
  twilioMessageId: varchar("twilio_message_id", { length: 255 }),
  status: varchar("status", { length: 20 }).default("pending"),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  companyId: uuid("company_id").notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  source: varchar("source", { length: 50 }),
  eventType: varchar("event_type", { length: 50 }),
  buildingName: varchar("building_name", { length: 255 }),
  promoCode: varchar("promo_code", { length: 50 }),
  score: integer("score").default(0),
  status: varchar("status", { length: 20 }).default("new"),
  notes: text("notes"),
  serviceInterest: varchar("service_interest", { length: 255 }),
  address: text("address"),
  bedrooms: integer("bedrooms"),
  bathrooms: decimal("bathrooms", { precision: 3, scale: 1 }),
  preferredDate: date("preferred_date"),
  referralCode: varchar("referral_code", { length: 50 }),
  abandonedStep: integer("abandoned_step"),
  abandonedData: jsonb("abandoned_data"),
  convertedToClientId: integer("converted_to_client_id"),
  convertedAt: timestamp("converted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  companyId: uuid("company_id").notNull(),
  referrerId: integer("referrer_id").notNull(),
  referralCode: varchar("referral_code", { length: 50 }).notNull().unique(),
  referredEmail: varchar("referred_email", { length: 255 }),
  referredClientId: integer("referred_client_id"),
  rewardType: varchar("reward_type", { length: 20 }).default("discount"),
  rewardValue: decimal("reward_value", { precision: 10, scale: 2 }).default("10"),
  rewardStatus: varchar("reward_status", { length: 20 }).default("pending"),
  rewardClaimedAt: timestamp("reward_claimed_at"),
  status: varchar("status", { length: 20 }).default("pending"),
  convertedAt: timestamp("converted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const promoCodes = pgTable("promo_codes", {
  id: serial("id").primaryKey(),
  companyId: uuid("company_id").notNull(),
  code: varchar("code", { length: 50 }).notNull(),
  discountType: varchar("discount_type", { length: 20 }).notNull(),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").default(0),
  minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }),
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  companyId: uuid("company_id").notNull(),
  clientId: integer("client_id").notNull(),
  bookingId: uuid("booking_id"),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending"),
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const emailLogs = pgTable("email_logs", {
  id: serial("id").primaryKey(),
  companyId: uuid("company_id").notNull(),
  bookingId: uuid("booking_id"),
  invoiceId: integer("invoice_id"),
  recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
  emailType: varchar("email_type", { length: 50 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  content: text("content").notNull(),
  status: varchar("status", { length: 20 }).default("pending"),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
  staff: one(staff, {
    fields: [users.id],
    references: [staff.userId],
  }),
  client: one(clients, {
    fields: [users.id],
    references: [clients.userId],
  }),
  notifications: many(notifications),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  owner: one(users, {
    fields: [companies.ownerId],
    references: [users.id],
  }),
  branding: one(companyBranding, {
    fields: [companies.id],
    references: [companyBranding.companyId],
  }),
  staff: many(staff),
  clients: many(clients),
  services: many(services),
  bookings: many(bookings),
  leads: many(leads),
  promoCodes: many(promoCodes),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  company: one(companies, {
    fields: [bookings.companyId],
    references: [companies.id],
  }),
  client: one(clients, {
    fields: [bookings.clientId],
    references: [clients.id],
  }),
  service: one(services, {
    fields: [bookings.serviceId],
    references: [services.id],
  }),
  staff: one(staff, {
    fields: [bookings.staffId],
    references: [staff.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  company: one(companies, {
    fields: [conversations.companyId],
    references: [companies.id],
  }),
  client: one(clients, {
    fields: [conversations.clientId],
    references: [clients.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const webhookConfigs = pgTable("webhook_configs", {
  id: serial("id").primaryKey(),
  companyId: uuid("company_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  url: text("url").notNull(),
  secret: varchar("secret", { length: 255 }),
  events: jsonb("events").$type<string[]>().default([]),
  headers: jsonb("headers").$type<Record<string, string>>(),
  isActive: boolean("is_active").notNull().default(true),
  retryCount: integer("retry_count").default(3),
  timeoutMs: integer("timeout_ms").default(30000),
  lastTriggeredAt: timestamp("last_triggered_at"),
  failureCount: integer("failure_count").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const webhookLogs = pgTable("webhook_logs", {
  id: serial("id").primaryKey(),
  webhookConfigId: integer("webhook_config_id").notNull(),
  companyId: uuid("company_id").notNull(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  payload: jsonb("payload"),
  responseStatus: integer("response_status"),
  responseBody: text("response_body"),
  errorMessage: text("error_message"),
  attemptNumber: integer("attempt_number").default(1),
  success: boolean("success").default(false),
  duration: integer("duration"),
  triggeredAt: timestamp("triggered_at").notNull().defaultNow(),
});

export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  companyId: uuid("company_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  keyHash: varchar("key_hash", { length: 255 }).notNull(),
  keyPrefix: varchar("key_prefix", { length: 10 }).notNull(),
  permissions: jsonb("permissions").$type<string[]>().default([]),
  isActive: boolean("is_active").notNull().default(true),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
