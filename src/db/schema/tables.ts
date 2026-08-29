import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/** Fixed UUID for the single shop used until marketplace mode is enabled. */
export const DEFAULT_SHOP_ID = "00000000-0000-4000-8000-000000000001";
export const DEFAULT_SHOP_SLUG = "default";

export const userRoleEnum = pgEnum("user_role", ["USER", "ADMIN", "CLEANER"]);

export const shopStatusEnum = pgEnum("shop_status", [
  "TRIAL",
  "ACTIVE",
  "SUSPENDED",
  "CLOSED",
]);

export const shopRoleEnum = pgEnum("shop_role", [
  "OWNER",
  "ADMIN",
  "CLEANER",
  "CUSTOMER",
]);

export const memberStatusEnum = pgEnum("member_status", [
  "INVITED",
  "ACTIVE",
  "REMOVED",
]);

export const deliveryModeEnum = pgEnum("delivery_mode", ["ON_SITE", "DROP_OFF"]);

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "PENDING",
  "APPROVED",
  "ASSIGNED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED_BY_USER",
  "CANCELLED_BY_ADMIN",
  "REJECTED",
]);

export const paymentMethodEnum = pgEnum("payment_method", ["CASH"]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "UNPAID",
  "PAID",
  "REFUNDED_MANUAL",
]);

export const slotStatusEnum = pgEnum("slot_status", ["OPEN", "FULL", "BLOCKED"]);

export const notificationChannelEnum = pgEnum("notification_channel", [
  "EMAIL",
  "SMS",
  "IN_APP",
]);

export const notificationStatusEnum = pgEnum("notification_status", [
  "PENDING",
  "SENT",
  "FAILED",
]);

export type ThemeConfig = {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  font?: string;
  heroImage?: string;
  layout?: "classic" | "minimal" | "bold";
  customCss?: string;
};

/**
 * Marketplace scaffold: one row today (`default` shop).
 * Future: many shops + subdomain routing; app code should prefer getDefaultShop().
 */
export const shops = pgTable("shops", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  subdomain: text("subdomain").notNull().unique(),
  customDomain: text("custom_domain"),
  status: shopStatusEnum("status").notNull().default("ACTIVE"),
  themeConfig: jsonb("theme_config").$type<ThemeConfig>().notNull().default({}),
  city: text("city"),
  country: text("country"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  phone: text("phone"),
  role: userRoleEnum("role").notNull().default("USER"),
  /** Marketplace scaffold: platform operator flag (unused in single-shop MVP UI). */
  isPlatformAdmin: boolean("is_platform_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Marketplace scaffold: unused by UI for now.
 * Future: per-shop roles instead of global users.role alone.
 */
export const shopMembers = pgTable("shop_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id")
    .notNull()
    .references(() => shops.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: shopRoleEnum("role").notNull().default("CUSTOMER"),
  status: memberStatusEnum("status").notNull().default("ACTIVE"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  avatar: text("avatar"),
  bio: text("bio"),
  preferredLanguage: text("preferred_language").default("en"),
});

export const addresses = pgTable("addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  shopId: uuid("shop_id")
    .notNull()
    .references(() => shops.id, { onDelete: "cascade" }),
  label: text("label"),
  line1: text("line1").notNull(),
  city: text("city").notNull(),
  postalCode: text("postal_code"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const serviceCategories = pgTable("service_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id")
    .notNull()
    .references(() => shops.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
});

export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id")
    .notNull()
    .references(() => shops.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => serviceCategories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  /** Supported modes for this service, e.g. ["ON_SITE","DROP_OFF"]. */
  deliveryModes: text("delivery_modes").array().notNull().default(["DROP_OFF"]),
  /**
   * Selectable item-type options for booking (e.g. ["leather","fabric"]).
   * Empty means the booking wizard hides the item-type field.
   */
  itemTypeOptions: text("item_type_options").array().notNull().default([]),
  durationMinutes: integer("duration_minutes").notNull().default(60),
  /** Inclusive price range — quotes are not fixed single amounts. */
  priceMin: numeric("price_min", { precision: 10, scale: 2 }).notNull().default("0"),
  priceMax: numeric("price_max", { precision: 10, scale: 2 }).notNull().default("0"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const availabilitySlots = pgTable("availability_slots", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id")
    .notNull()
    .references(() => shops.id, { onDelete: "cascade" }),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  deliveryMode: deliveryModeEnum("delivery_mode").notNull(),
  capacity: integer("capacity").notNull().default(1),
  bookedCount: integer("booked_count").notNull().default(0),
  status: slotStatusEnum("status").notNull().default("OPEN"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id")
    .notNull()
    .references(() => shops.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  serviceId: uuid("service_id")
    .notNull()
    .references(() => services.id, { onDelete: "restrict" }),
  slotId: uuid("slot_id")
    .notNull()
    .references(() => availabilitySlots.id, { onDelete: "restrict" }),
  cleanerId: uuid("cleaner_id").references(() => users.id, { onDelete: "set null" }),
  addressId: uuid("address_id").references(() => addresses.id, { onDelete: "set null" }),
  status: appointmentStatusEnum("status").notNull().default("PENDING"),
  deliveryMode: deliveryModeEnum("delivery_mode").notNull(),
  notes: text("notes"),
  /** Admin/cleaner message to the client (e.g. rejection reason). */
  statusNote: text("status_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const appointmentItems = pgTable("appointment_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  appointmentId: uuid("appointment_id")
    .notNull()
    .references(() => appointments.id, { onDelete: "cascade" }),
  /** Selected option from the service's itemTypeOptions, or null when none apply. */
  itemType: text("item_type"),
  quantity: integer("quantity").notNull().default(1),
  details: jsonb("details").$type<Record<string, unknown>>().notNull().default({}),
});

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id")
    .notNull()
    .references(() => shops.id, { onDelete: "cascade" }),
  appointmentId: uuid("appointment_id")
    .notNull()
    .references(() => appointments.id, { onDelete: "cascade" })
    .unique(),
  method: paymentMethodEnum("method").notNull().default("CASH"),
  status: paymentStatusEnum("status").notNull().default("UNPAID"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull().default("0"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const jobLogs = pgTable("job_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id")
    .notNull()
    .references(() => shops.id, { onDelete: "cascade" }),
  appointmentId: uuid("appointment_id")
    .notNull()
    .references(() => appointments.id, { onDelete: "cascade" }),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  note: text("note"),
  at: timestamp("at", { withTimezone: true }).defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id")
    .notNull()
    .references(() => shops.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  recipientId: uuid("recipient_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  appointmentId: uuid("appointment_id").references(() => appointments.id, {
    onDelete: "set null",
  }),
  body: text("body").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id")
    .notNull()
    .references(() => shops.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  appointmentId: uuid("appointment_id").references(() => appointments.id, {
    onDelete: "set null",
  }),
  /** Stable event key, e.g. BOOKING_APPROVED / APPOINTMENT_MESSAGE */
  type: text("type").notNull().default("GENERAL"),
  channel: notificationChannelEnum("channel").notNull(),
  subject: text("subject"),
  body: text("body").notNull(),
  /** Deep link inside the app (e.g. /appointments or /admin/appointments) */
  href: text("href"),
  status: notificationStatusEnum("status").notNull().default("PENDING"),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** MVP: customer review after COMPLETED. */
export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id")
    .notNull()
    .references(() => shops.id, { onDelete: "cascade" }),
  appointmentId: uuid("appointment_id")
    .notNull()
    .references(() => appointments.id, { onDelete: "cascade" })
    .unique(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Shop = typeof shops.$inferSelect;
export type NewShop = typeof shops.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Address = typeof addresses.$inferSelect;
export type Service = typeof services.$inferSelect;
export type AvailabilitySlot = typeof availabilitySlots.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type AppointmentStatus = (typeof appointmentStatusEnum.enumValues)[number];
export type DeliveryMode = (typeof deliveryModeEnum.enumValues)[number];
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];
export type SlotStatus = (typeof slotStatusEnum.enumValues)[number];
export type NotificationChannel = (typeof notificationChannelEnum.enumValues)[number];
export type NotificationStatus = (typeof notificationStatusEnum.enumValues)[number];
