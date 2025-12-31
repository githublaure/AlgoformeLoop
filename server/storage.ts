import { subscriptions, voiceReminders, type Subscription, type InsertSubscription, type VoiceReminder, type InsertVoiceReminder } from "@shared/schema";
import { db } from "./db";
import { and, eq, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Subscription methods
  getSubscriptions(userId?: number): Promise<Subscription[]>;
  getSubscription(id: number, userId?: number): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(
    id: number,
    userId: number,
    subscription: Partial<InsertSubscription>
  ): Promise<Subscription | undefined>;
  deleteSubscription(id: number, userId: number): Promise<boolean>;
  getUpcomingRenewals(days: number, userId: number): Promise<Subscription[]>;
  
  // Voice reminder methods
  getVoiceReminders(): Promise<VoiceReminder[]>;
  createVoiceReminder(reminder: InsertVoiceReminder): Promise<VoiceReminder>;
  getVoiceRemindersBySubscription(subscriptionId: number): Promise<VoiceReminder[]>;
}

export class MemStorage implements IStorage {
  private subscriptions: Map<number, Subscription>;
  private voiceReminders: Map<number, VoiceReminder>;
  private currentSubscriptionId: number;
  private currentVoiceReminderId: number;

  constructor() {
    this.subscriptions = new Map();
    this.voiceReminders = new Map();
    this.currentSubscriptionId = 1;
    this.currentVoiceReminderId = 1;
    
    // Initialize with some sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const sampleSubscriptions = [
      {
        userId: 1,
        name: "Netflix Premium",
        price: "15.99",
        frequency: "monthly",
        category: "entertainment",
        categoryColor: "#a855f7",
        usageFrequency: "very_used",
        nextRenewal: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
        iconClass: "fas fa-dove",
        bgColor: "#a855f7",
        note: "A partager avec la famille",
        rating: 5,
        isSuspect: false,
        isActive: true,
        isTrial: false,
        trialEndsAt: null,
        createdAt: new Date(),
      },
      {
        userId: 1,
        name: "Spotify Premium",
        price: "9.99",
        frequency: "monthly",
        category: "music",
        categoryColor: "#22c55e",
        usageFrequency: "very_used",
        nextRenewal: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
        iconClass: "fas fa-dove",
        bgColor: "#22c55e",
        note: "Indispensable au quotidien",
        rating: 4,
        isSuspect: false,
        isActive: true,
        isTrial: false,
        trialEndsAt: null,
        createdAt: new Date(),
      },
      {
        userId: 1,
        name: "Dropbox Plus",
        price: "9.99",
        frequency: "monthly",
        category: "cloud",
        categoryColor: "#3b82f6",
        usageFrequency: "rarely_used",
        nextRenewal: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        iconClass: "fas fa-dove",
        bgColor: "#3b82f6",
        note: "A surveiller, peu utilisé",
        rating: 2,
        isSuspect: true,
        isActive: true,
        isTrial: false,
        trialEndsAt: null,
        createdAt: new Date(),
      },
      {
        userId: 1,
        name: "Adobe Creative Cloud",
        price: "22.99",
        frequency: "monthly",
        category: "design",
        categoryColor: "#f97316",
        usageFrequency: "very_used",
        nextRenewal: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
        iconClass: "fas fa-dove",
        bgColor: "#f97316",
        note: "Essai en cours sur un nouveau pack",
        rating: 3,
        isSuspect: false,
        isActive: true,
        isTrial: true,
        trialEndsAt: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      }
    ];

    sampleSubscriptions.forEach(sub => {
      const subscription: Subscription = { ...sub, id: this.currentSubscriptionId++ };
      this.subscriptions.set(subscription.id, subscription);
    });
  }

  async getSubscriptions(userId?: number): Promise<Subscription[]> {
    return Array.from(this.subscriptions.values()).filter(sub => {
      if (!sub.isActive) return false;
      if (userId === undefined) return true;
      return sub.userId === userId || sub.userId === null;
    });
  }

  async getSubscription(id: number, userId?: number): Promise<Subscription | undefined> {
    const subscription = this.subscriptions.get(id);
    if (!subscription) return undefined;
    if (userId === undefined) return subscription;
    return subscription.userId === userId ? subscription : undefined;
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const id = this.currentSubscriptionId++;
    const subscription: Subscription = {
      ...insertSubscription,
      id,
      userId: insertSubscription.userId ?? null,
      note: insertSubscription.note ?? null,
      categoryColor: insertSubscription.categoryColor ?? null,
      iconClass: insertSubscription.iconClass ?? null,
      bgColor: insertSubscription.bgColor ?? null,
      rating: insertSubscription.rating ?? 0,
      trialEndsAt: insertSubscription.trialEndsAt ?? null,
      isSuspect: insertSubscription.isSuspect ?? false,
      isTrial: insertSubscription.isTrial ?? false,
      isActive: insertSubscription.isActive ?? true,
      createdAt: new Date()
    };
    this.subscriptions.set(id, subscription);
    return subscription;
  }

  async updateSubscription(
    id: number,
    userId: number,
    updates: Partial<InsertSubscription>
  ): Promise<Subscription | undefined> {
    const existing = this.subscriptions.get(id);
    if (!existing || existing.userId !== userId) return undefined;

    const updated: Subscription = {
      ...existing,
      ...updates,
      note: updates.note ?? existing.note ?? null,
      rating: updates.rating ?? existing.rating ?? 0,
      categoryColor: updates.categoryColor ?? existing.categoryColor ?? null,
      iconClass: updates.iconClass ?? existing.iconClass ?? null,
      bgColor: updates.bgColor ?? existing.bgColor ?? null,
      trialEndsAt: updates.trialEndsAt ?? existing.trialEndsAt ?? null,
      isSuspect: updates.isSuspect ?? existing.isSuspect ?? false,
      isTrial: updates.isTrial ?? existing.isTrial ?? false,
      isActive: updates.isActive ?? existing.isActive ?? true,
    };
    this.subscriptions.set(id, updated);
    return updated;
  }

  async deleteSubscription(id: number, userId: number): Promise<boolean> {
    const existing = this.subscriptions.get(id);
    if (!existing || existing.userId !== userId) return false;
    return this.subscriptions.delete(id);
  }

  async getUpcomingRenewals(days: number, userId: number): Promise<Subscription[]> {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const cutoffDate = new Date();
    cutoffDate.setHours(23, 59, 59, 999);
    cutoffDate.setDate(cutoffDate.getDate() + days);
    return Array.from(this.subscriptions.values())
      .filter(sub =>
        sub.isActive &&
        sub.userId === userId &&
        sub.nextRenewal >= now &&
        sub.nextRenewal <= cutoffDate
      )
      .sort((a, b) => a.nextRenewal.getTime() - b.nextRenewal.getTime());
  }

  async getVoiceReminders(): Promise<VoiceReminder[]> {
    return Array.from(this.voiceReminders.values());
  }

  async createVoiceReminder(insertReminder: InsertVoiceReminder): Promise<VoiceReminder> {
    const id = this.currentVoiceReminderId++;
    const reminder: VoiceReminder = {
      ...insertReminder,
      id,
      subscriptionId: insertReminder.subscriptionId ?? null,
      audioUrl: insertReminder.audioUrl ?? null,
      createdAt: new Date()
    };
    this.voiceReminders.set(id, reminder);
    return reminder;
  }

  async getVoiceRemindersBySubscription(subscriptionId: number): Promise<VoiceReminder[]> {
    return Array.from(this.voiceReminders.values())
      .filter(reminder => reminder.subscriptionId === subscriptionId);
  }
}

export class DatabaseStorage implements IStorage {
  async getSubscriptions(userId?: number): Promise<Subscription[]> {
    const conditions = [eq(subscriptions.isActive, true)];
    if (userId !== undefined) {
      conditions.push(eq(subscriptions.userId, userId));
    }

    return await db
      .select()
      .from(subscriptions)
      .where(conditions.length > 1 ? and(...conditions) : conditions[0]);
  }

  async getSubscription(id: number, userId?: number): Promise<Subscription | undefined> {
    const filters = [eq(subscriptions.id, id)];
    if (userId !== undefined) {
      filters.push(eq(subscriptions.userId, userId));
    }

    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(filters.length > 1 ? and(...filters) : filters[0]);
    return subscription || undefined;
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db
      .insert(subscriptions)
      .values(insertSubscription)
      .returning();
    return subscription;
  }

  async updateSubscription(
    id: number,
    userId: number,
    updates: Partial<InsertSubscription>
  ): Promise<Subscription | undefined> {
    const [subscription] = await db
      .update(subscriptions)
      .set(updates)
      .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, userId)))
      .returning();
    return subscription || undefined;
  }

  async deleteSubscription(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(subscriptions)
      .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getUpcomingRenewals(days: number, userId: number): Promise<Subscription[]> {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    endDate.setDate(endDate.getDate() + days);

    return await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.isActive, true),
          eq(subscriptions.userId, userId),
          gte(subscriptions.nextRenewal, startDate),
          lte(subscriptions.nextRenewal, endDate),
        )
      )
      .orderBy(subscriptions.nextRenewal);
  }

  async getVoiceReminders(): Promise<VoiceReminder[]> {
    return await db.select().from(voiceReminders);
  }

  async createVoiceReminder(insertReminder: InsertVoiceReminder): Promise<VoiceReminder> {
    const [reminder] = await db
      .insert(voiceReminders)
      .values(insertReminder)
      .returning();
    return reminder;
  }

  async getVoiceRemindersBySubscription(subscriptionId: number): Promise<VoiceReminder[]> {
    return await db
      .select()
      .from(voiceReminders)
      .where(eq(voiceReminders.subscriptionId, subscriptionId));
  }
}

export const storage = new DatabaseStorage();
