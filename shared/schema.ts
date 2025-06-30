import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  frequency: text("frequency").notNull(), // monthly, yearly, weekly
  category: text("category").notNull(),
  usageFrequency: text("usage_frequency").notNull(), // very_used, used, rarely_used
  nextRenewal: timestamp("next_renewal").notNull(),
  iconClass: text("icon_class"), // Font Awesome class for the icon
  bgColor: text("bg_color"), // Background color for the icon
  isActive: boolean("is_active").default(true),
  isTrial: boolean("is_trial").default(false),
  trialEndsAt: timestamp("trial_ends_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const voiceReminders = pgTable("voice_reminders", {
  id: serial("id").primaryKey(),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id),
  audioUrl: text("audio_url"),
  reminderType: text("reminder_type").notNull(), // renewal, review, trial_ending
  createdAt: timestamp("created_at").defaultNow(),
});

export const subscriptionsRelations = relations(subscriptions, ({ many }) => ({
  voiceReminders: many(voiceReminders),
}));

export const voiceRemindersRelations = relations(voiceReminders, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [voiceReminders.subscriptionId],
    references: [subscriptions.id],
  }),
}));

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
});

export const insertVoiceReminderSchema = createInsertSchema(voiceReminders).omit({
  id: true,
  createdAt: true,
});

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertVoiceReminder = z.infer<typeof insertVoiceReminderSchema>;
export type VoiceReminder = typeof voiceReminders.$inferSelect;

// Usage frequency options
export const USAGE_FREQUENCIES = {
  very_used: { label: "Très utilisé", color: "bg-secondary", textColor: "text-white" },
  used: { label: "Utilisé", color: "bg-secondary", textColor: "text-white" },
  rarely_used: { label: "Rarement utilisé", color: "bg-danger", textColor: "text-white" }
} as const;

// Subscription categories
export const CATEGORIES = {
  entertainment: "Divertissement",
  music: "Musique",
  productivity: "Productivité",
  design: "Design",
  cloud: "Cloud",
  other: "Autre"
} as const;

// Frequency options
export const FREQUENCIES = {
  monthly: "Mensuel",
  yearly: "Annuel",
  weekly: "Hebdomadaire"
} as const;
