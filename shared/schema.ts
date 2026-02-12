import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  budgetCap: decimal("budget_cap", { precision: 10, scale: 2 }).default("100"),
  monthlyOverrides: jsonb("monthly_overrides").default("{}"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  frequency: text("frequency").notNull(), // monthly, yearly, weekly
  category: text("category").notNull(),
  categoryColor: text("category_color").default("#7c3aed"),
  usageFrequency: text("usage_frequency").notNull(), // very_used, used, rarely_used
  nextRenewal: timestamp("next_renewal"),
  safetyDate: timestamp("safety_date"),
  iconClass: text("icon_class"), // Font Awesome class for the icon
  bgColor: text("bg_color"), // Background color for the icon
  note: text("note"),
  purchaseProofImage: text("purchase_proof_image"),
  unsubscribeProofImage: text("unsubscribe_proof_image"),
  rating: integer("rating"),
  isSuspect: boolean("is_suspect").default(false),
  isFlagged: boolean("is_flagged").default(false),
  useSafetyDate: boolean("use_safety_date").default(false),
  isActive: boolean("is_active").default(true),
  isTrial: boolean("is_trial").default(false),
  trialEndsAt: timestamp("trial_ends_at"),
  purchaseDate: timestamp("purchase_date"),
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

export const insertSubscriptionSchema = createInsertSchema(subscriptions)
  .omit({
    id: true,
    createdAt: true,
  })
  .partial({
    rating: true,
    nextRenewal: true,
    safetyDate: true,
    trialEndsAt: true,
    purchaseDate: true,
    purchaseProofImage: true,
    unsubscribeProofImage: true,
    useSafetyDate: true,
    isFlagged: true,
  })
  .extend({
    rating: z.number().nullable().optional(),
    nextRenewal: z.date().nullable().optional(),
    safetyDate: z.date().nullable().optional(),
    trialEndsAt: z.date().nullable().optional(),
    purchaseDate: z.date().nullable().optional(),
    purchaseProofImage: z.string().nullable().optional(),
    unsubscribeProofImage: z.string().nullable().optional(),
    useSafetyDate: z.boolean().optional(),
    isFlagged: z.boolean().optional(),
  });

export const insertVoiceReminderSchema = createInsertSchema(voiceReminders).omit({
  id: true,
  createdAt: true,
});

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertVoiceReminder = z.infer<typeof insertVoiceReminderSchema>;
export type VoiceReminder = typeof voiceReminders.$inferSelect;
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type UserSettings = typeof userSettings.$inferSelect;

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
  weekly: "Hebdomadaire",
  lifetime: "Accès à vie"
} as const;
