import { subscriptions, voiceReminders, type Subscription, type InsertSubscription, type VoiceReminder, type InsertVoiceReminder } from "@shared/schema";
import { db } from "./db";
import { and, eq, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Subscription methods
  getSubscriptions(): Promise<Subscription[]>;
  getSubscription(id: number): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: number, subscription: Partial<InsertSubscription>): Promise<Subscription | undefined>;
  deleteSubscription(id: number): Promise<boolean>;
  getUpcomingRenewals(days: number): Promise<Subscription[]>;
  
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
        name: "Netflix Premium",
        price: "15.99",
        frequency: "monthly",
        category: "entertainment",
        usageFrequency: "very_used",
        nextRenewal: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
        iconClass: "fab fa-netflix",
        bgColor: "bg-red-600",
        isActive: true,
        isTrial: false,
        trialEndsAt: null,
        createdAt: new Date(),
      },
      {
        name: "Spotify Premium",
        price: "9.99",
        frequency: "monthly",
        category: "music",
        usageFrequency: "very_used",
        nextRenewal: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
        iconClass: "fab fa-spotify",
        bgColor: "bg-green-600",
        isActive: true,
        isTrial: false,
        trialEndsAt: null,
        createdAt: new Date(),
      },
      {
        name: "Dropbox Plus",
        price: "9.99",
        frequency: "monthly",
        category: "cloud",
        usageFrequency: "rarely_used",
        nextRenewal: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        iconClass: "fab fa-dropbox",
        bgColor: "bg-blue-500",
        isActive: true,
        isTrial: false,
        trialEndsAt: null,
        createdAt: new Date(),
      },
      {
        name: "Adobe Creative Cloud",
        price: "22.99",
        frequency: "monthly",
        category: "design",
        usageFrequency: "very_used",
        nextRenewal: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
        iconClass: "fab fa-adobe",
        bgColor: "bg-orange-600",
        isActive: true,
        isTrial: false,
        trialEndsAt: null,
        createdAt: new Date(),
      }
    ];

    sampleSubscriptions.forEach(sub => {
      const subscription: Subscription = { ...sub, id: this.currentSubscriptionId++ };
      this.subscriptions.set(subscription.id, subscription);
    });
  }

  async getSubscriptions(): Promise<Subscription[]> {
    return Array.from(this.subscriptions.values()).filter(sub => sub.isActive);
  }

  async getSubscription(id: number): Promise<Subscription | undefined> {
    return this.subscriptions.get(id);
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const id = this.currentSubscriptionId++;
    const subscription: Subscription = { 
      ...insertSubscription, 
      id,
      createdAt: new Date()
    };
    this.subscriptions.set(id, subscription);
    return subscription;
  }

  async updateSubscription(id: number, updates: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const existing = this.subscriptions.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.subscriptions.set(id, updated);
    return updated;
  }

  async deleteSubscription(id: number): Promise<boolean> {
    return this.subscriptions.delete(id);
  }

  async getUpcomingRenewals(days: number): Promise<Subscription[]> {
    const now = new Date();
    const cutoffDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return Array.from(this.subscriptions.values())
      .filter(sub => sub.isActive && sub.nextRenewal >= now && sub.nextRenewal <= cutoffDate)
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
  async getSubscriptions(): Promise<Subscription[]> {
    return await db.select().from(subscriptions);
  }

  async getSubscription(id: number): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
    return subscription || undefined;
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db
      .insert(subscriptions)
      .values(insertSubscription)
      .returning();
    return subscription;
  }

  async updateSubscription(id: number, updates: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const [subscription] = await db
      .update(subscriptions)
      .set(updates)
      .where(eq(subscriptions.id, id))
      .returning();
    return subscription || undefined;
  }

  async deleteSubscription(id: number): Promise<boolean> {
    const result = await db.delete(subscriptions).where(eq(subscriptions.id, id));
    return result.rowCount > 0;
  }

  async getUpcomingRenewals(days: number): Promise<Subscription[]> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.isActive, true),
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
