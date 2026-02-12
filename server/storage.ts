import { subscriptions, userSettings, voiceReminders, type Subscription, type InsertSubscription, type VoiceReminder, type InsertVoiceReminder, type UserSettings } from "@shared/schema";
import { and, eq } from "drizzle-orm";
// Note: avoid importing `db` at module import time so tests that only
// exercise `MemStorage` don't require DATABASE_URL to be set.


export interface IStorage {
  // Subscription methods
  getSubscriptions(userId?: number, includeArchived?: boolean): Promise<Subscription[]>;
  getSubscription(id: number, userId?: number): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(
    id: number,
    userId: number,
    subscription: Partial<InsertSubscription>
  ): Promise<Subscription | undefined>;
  deleteSubscription(id: number, userId: number): Promise<boolean>;
  getUpcomingRenewals(days: number, userId: number): Promise<Subscription[]>;

  // User settings methods
  getUserSettings(userId: number): Promise<UserSettings | undefined>;
  setUserBudgetCap(userId: number, budgetCap: string): Promise<UserSettings>;
  setMonthlyOverrides(userId: number, overrides: Record<string, number>): Promise<UserSettings>;
  
  // Voice reminder methods
  getVoiceReminders(): Promise<VoiceReminder[]>;
  createVoiceReminder(reminder: InsertVoiceReminder): Promise<VoiceReminder>;
  getVoiceRemindersBySubscription(subscriptionId: number): Promise<VoiceReminder[]>;
}

export class MemStorage implements IStorage {
  private subscriptions: Map<number, Subscription>;
  private voiceReminders: Map<number, VoiceReminder>;
  private userSettings: Map<number, UserSettings>;
  private currentSubscriptionId: number;
  private currentVoiceReminderId: number;
  private currentUserSettingsId: number;

  constructor() {
    this.subscriptions = new Map();
    this.voiceReminders = new Map();
    this.userSettings = new Map();
    this.currentSubscriptionId = 1;
    this.currentVoiceReminderId = 1;
    this.currentUserSettingsId = 1;
    
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
        safetyDate: null,
        iconClass: "fas fa-dove",
        bgColor: "#a855f7",
        note: "A partager avec la famille",
        purchaseProofImage: null,
        unsubscribeProofImage: null,
        rating: 5,
        isSuspect: false,
        isFlagged: false,
        useSafetyDate: false,
        isActive: true,
        isTrial: false,
        trialEndsAt: null,
        purchaseDate: null,
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
        safetyDate: null,
        iconClass: "fas fa-dove",
        bgColor: "#22c55e",
        note: "Indispensable au quotidien",
        purchaseProofImage: null,
        unsubscribeProofImage: null,
        rating: 4,
        isSuspect: false,
        isFlagged: false,
        useSafetyDate: false,
        isActive: true,
        isTrial: false,
        trialEndsAt: null,
        purchaseDate: null,
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
        safetyDate: null,
        iconClass: "fas fa-dove",
        bgColor: "#3b82f6",
        note: "A surveiller, peu utilisé",
        purchaseProofImage: null,
        unsubscribeProofImage: null,
        rating: 2,
        isSuspect: true,
        isFlagged: false,
        useSafetyDate: false,
        isActive: true,
        isTrial: false,
        trialEndsAt: null,
        purchaseDate: null,
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
        safetyDate: null,
        iconClass: "fas fa-dove",
        bgColor: "#f97316",
        note: "Essai en cours sur un nouveau pack",
        purchaseProofImage: null,
        unsubscribeProofImage: null,
        rating: 3,
        isSuspect: false,
        isFlagged: false,
        useSafetyDate: false,
        isActive: true,
        isTrial: true,
        trialEndsAt: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        purchaseDate: null,
        createdAt: new Date(),
      }
    ];

    sampleSubscriptions.forEach(sub => {
      const subscription: Subscription = { ...sub, id: this.currentSubscriptionId++ };
      this.subscriptions.set(subscription.id, subscription);
    });
  }

  async getSubscriptions(userId?: number, includeArchived?: boolean): Promise<Subscription[]> {
    return Array.from(this.subscriptions.values()).filter(sub => {
      if (!includeArchived && !sub.isActive) return false;
      if (userId === undefined) return true;
      // Only return subscriptions belonging to the requested user
      return sub.userId === userId;
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
      purchaseProofImage: insertSubscription.purchaseProofImage ?? null,
      unsubscribeProofImage: insertSubscription.unsubscribeProofImage ?? null,
      categoryColor: insertSubscription.categoryColor ?? null,
      iconClass: insertSubscription.iconClass ?? null,
      bgColor: insertSubscription.bgColor ?? null,
      rating: insertSubscription.rating ?? null,
      nextRenewal: insertSubscription.nextRenewal ?? null,
      safetyDate: insertSubscription.safetyDate ?? null,
      trialEndsAt: insertSubscription.trialEndsAt ?? null,
      purchaseDate: insertSubscription.purchaseDate ?? null,
      isSuspect: insertSubscription.isSuspect ?? false,
      isFlagged: insertSubscription.isFlagged ?? false,
      useSafetyDate: insertSubscription.useSafetyDate ?? false,
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
      nextRenewal: updates.nextRenewal ?? existing.nextRenewal ?? null,
      safetyDate: updates.safetyDate ?? existing.safetyDate ?? null,
      note: updates.note ?? existing.note ?? null,
      purchaseProofImage: updates.purchaseProofImage ?? existing.purchaseProofImage ?? null,
      unsubscribeProofImage: updates.unsubscribeProofImage ?? existing.unsubscribeProofImage ?? null,
      rating: updates.rating !== undefined ? updates.rating : existing.rating ?? null,
      categoryColor: updates.categoryColor ?? existing.categoryColor ?? null,
      iconClass: updates.iconClass ?? existing.iconClass ?? null,
      bgColor: updates.bgColor ?? existing.bgColor ?? null,
      trialEndsAt: updates.trialEndsAt ?? existing.trialEndsAt ?? null,
      purchaseDate: updates.purchaseDate ?? existing.purchaseDate ?? null,
      isSuspect: updates.isSuspect ?? existing.isSuspect ?? false,
      isFlagged: updates.isFlagged ?? existing.isFlagged ?? false,
      useSafetyDate: updates.useSafetyDate ?? existing.useSafetyDate ?? false,
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
      .filter(sub => {
        const reminderDate = sub.useSafetyDate ? sub.safetyDate : sub.nextRenewal;
        return (
          sub.isActive &&
          sub.userId === userId &&
          Boolean(reminderDate) &&
          reminderDate! >= now &&
          reminderDate! <= cutoffDate
        );
      })
      .sort((a, b) => {
        const aDate = (a.useSafetyDate ? a.safetyDate : a.nextRenewal)!;
        const bDate = (b.useSafetyDate ? b.safetyDate : b.nextRenewal)!;
        return aDate.getTime() - bDate.getTime();
      });
  }

  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    return this.userSettings.get(userId);
  }

  async setUserBudgetCap(userId: number, budgetCap: string): Promise<UserSettings> {
    const existing = this.userSettings.get(userId);
    const updated: UserSettings = {
      id: existing?.id ?? this.currentUserSettingsId++,
      userId,
      budgetCap,
      monthlyOverrides: existing?.monthlyOverrides ?? {},
      createdAt: existing?.createdAt ?? new Date(),
    };
    this.userSettings.set(userId, updated);
    return updated;
  }

  async setMonthlyOverrides(userId: number, overrides: Record<string, number>): Promise<UserSettings> {
    const existing = this.userSettings.get(userId);
    const updated: UserSettings = {
      id: existing?.id ?? this.currentUserSettingsId++,
      userId,
      budgetCap: existing?.budgetCap ?? "100",
      monthlyOverrides: overrides,
      createdAt: existing?.createdAt ?? new Date(),
    };
    this.userSettings.set(userId, updated);
    return updated;
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
  async getSubscriptions(userId?: number, includeArchived?: boolean): Promise<Subscription[]> {
    const { db } = await import('./db');
    const conditions = [] as any[];
    if (!includeArchived) {
      conditions.push(eq(subscriptions.isActive, true));
    }
    if (userId !== undefined) {
      conditions.push(eq(subscriptions.userId, userId));
    }

    if (conditions.length === 0) {
      return await db.select().from(subscriptions);
    }

    return await db
      .select()
      .from(subscriptions)
      .where(conditions.length > 1 ? and(...conditions) : conditions[0]);
  }

  async getSubscription(id: number, userId?: number): Promise<Subscription | undefined> {
    const { db } = await import('./db');
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
    const { db } = await import('./db');
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
    const { db } = await import('./db');
    const [subscription] = await db
      .update(subscriptions)
      .set(updates)
      .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, userId)))
      .returning();
    return subscription || undefined;
  }

  async deleteSubscription(id: number, userId: number): Promise<boolean> {
    const { db } = await import('./db');
    const result = await db
      .delete(subscriptions)
      .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getUpcomingRenewals(days: number, userId: number): Promise<Subscription[]> {
    const { db } = await import('./db');
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    endDate.setDate(endDate.getDate() + days);

    const records = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.isActive, true),
          eq(subscriptions.userId, userId),
        )
      );

    return records
      .filter((sub) => {
        const reminderDate = sub.useSafetyDate ? sub.safetyDate : sub.nextRenewal;
        return Boolean(reminderDate && reminderDate >= startDate && reminderDate <= endDate);
      })
      .sort((a, b) => {
        const aDate = (a.useSafetyDate ? a.safetyDate : a.nextRenewal)!;
        const bDate = (b.useSafetyDate ? b.safetyDate : b.nextRenewal)!;
        return aDate.getTime() - bDate.getTime();
      });
  }

  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    const { db } = await import('./db');
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));
    return settings || undefined;
  }

  async setUserBudgetCap(userId: number, budgetCap: string): Promise<UserSettings> {
    const { db } = await import('./db');
    const [existing] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));

    if (existing) {
      const [updated] = await db
        .update(userSettings)
        .set({ budgetCap })
        .where(eq(userSettings.userId, userId))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(userSettings)
      .values({ userId, budgetCap, monthlyOverrides: {} })
      .returning();
    return created;
  }

  async getVoiceReminders(): Promise<VoiceReminder[]> {
    const { db } = await import('./db');
    return await db.select().from(voiceReminders);
  }

  async createVoiceReminder(insertReminder: InsertVoiceReminder): Promise<VoiceReminder> {
    const { db } = await import('./db');
    const [reminder] = await db
      .insert(voiceReminders)
      .values(insertReminder)
      .returning();
    return reminder;
  }

  async getVoiceRemindersBySubscription(subscriptionId: number): Promise<VoiceReminder[]> {
    const { db } = await import('./db');
    return await db
      .select()
      .from(voiceReminders)
      .where(eq(voiceReminders.subscriptionId, subscriptionId));
  }
}

export const storage: IStorage = process.env.NODE_ENV === 'test' ? new MemStorage() : new DatabaseStorage();
