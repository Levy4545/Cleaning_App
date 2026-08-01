import { relations } from "drizzle-orm";

import {
  addresses,
  appointmentItems,
  appointments,
  availabilitySlots,
  jobLogs,
  messages,
  notifications,
  payments,
  profiles,
  reviews,
  serviceCategories,
  services,
  shopMembers,
  shops,
  users,
} from "./tables";

export const shopsRelations = relations(shops, ({ many }) => ({
  members: many(shopMembers),
  categories: many(serviceCategories),
  services: many(services),
  slots: many(availabilitySlots),
  appointments: many(appointments),
}));

export const shopMembersRelations = relations(shopMembers, ({ one }) => ({
  shop: one(shops, {
    fields: [shopMembers.shopId],
    references: [shops.id],
  }),
  user: one(users, {
    fields: [shopMembers.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  addresses: many(addresses),
  memberships: many(shopMembers),
  customerAppointments: many(appointments, { relationName: "customerAppointments" }),
  cleanerAppointments: many(appointments, { relationName: "cleanerAppointments" }),
  reviews: many(reviews),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const addressesRelations = relations(addresses, ({ one, many }) => ({
  user: one(users, {
    fields: [addresses.userId],
    references: [users.id],
  }),
  shop: one(shops, {
    fields: [addresses.shopId],
    references: [shops.id],
  }),
  appointments: many(appointments),
}));

export const serviceCategoriesRelations = relations(serviceCategories, ({ one, many }) => ({
  shop: one(shops, {
    fields: [serviceCategories.shopId],
    references: [shops.id],
  }),
  services: many(services),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  shop: one(shops, {
    fields: [services.shopId],
    references: [shops.id],
  }),
  category: one(serviceCategories, {
    fields: [services.categoryId],
    references: [serviceCategories.id],
  }),
  appointments: many(appointments),
}));

export const availabilitySlotsRelations = relations(availabilitySlots, ({ one, many }) => ({
  shop: one(shops, {
    fields: [availabilitySlots.shopId],
    references: [shops.id],
  }),
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  shop: one(shops, {
    fields: [appointments.shopId],
    references: [shops.id],
  }),
  customer: one(users, {
    fields: [appointments.customerId],
    references: [users.id],
    relationName: "customerAppointments",
  }),
  cleaner: one(users, {
    fields: [appointments.cleanerId],
    references: [users.id],
    relationName: "cleanerAppointments",
  }),
  service: one(services, {
    fields: [appointments.serviceId],
    references: [services.id],
  }),
  slot: one(availabilitySlots, {
    fields: [appointments.slotId],
    references: [availabilitySlots.id],
  }),
  address: one(addresses, {
    fields: [appointments.addressId],
    references: [addresses.id],
  }),
  items: many(appointmentItems),
  payment: one(payments, {
    fields: [appointments.id],
    references: [payments.appointmentId],
  }),
  logs: many(jobLogs),
  review: one(reviews, {
    fields: [appointments.id],
    references: [reviews.appointmentId],
  }),
}));

export const appointmentItemsRelations = relations(appointmentItems, ({ one }) => ({
  appointment: one(appointments, {
    fields: [appointmentItems.appointmentId],
    references: [appointments.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  shop: one(shops, {
    fields: [payments.shopId],
    references: [shops.id],
  }),
  appointment: one(appointments, {
    fields: [payments.appointmentId],
    references: [appointments.id],
  }),
}));

export const jobLogsRelations = relations(jobLogs, ({ one }) => ({
  appointment: one(appointments, {
    fields: [jobLogs.appointmentId],
    references: [appointments.id],
  }),
  actor: one(users, {
    fields: [jobLogs.actorId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  shop: one(shops, {
    fields: [messages.shopId],
    references: [shops.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  recipient: one(users, {
    fields: [messages.recipientId],
    references: [users.id],
  }),
  appointment: one(appointments, {
    fields: [messages.appointmentId],
    references: [appointments.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  shop: one(shops, {
    fields: [notifications.shopId],
    references: [shops.id],
  }),
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  shop: one(shops, {
    fields: [reviews.shopId],
    references: [shops.id],
  }),
  appointment: one(appointments, {
    fields: [reviews.appointmentId],
    references: [appointments.id],
  }),
  customer: one(users, {
    fields: [reviews.customerId],
    references: [users.id],
  }),
}));
