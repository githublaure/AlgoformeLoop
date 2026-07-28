import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { subscriptions, userSettings, users, voiceReminders, type InsertSubscription } from "@shared/schema";

export const DEMO_ACCOUNT = { name: "Camille Démo", email: "demo@pigeonsub.fr" } as const;

const dateFromNow = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(10, 0, 0, 0);
  return date;
};

const monthKey = (offset: number) => {
  const date = new Date();
  date.setMonth(date.getMonth() + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

/** A varied data set that exercises the dashboard filters, stats and alerts. */
export function buildDemoSubscriptions(userId: number): InsertSubscription[] {
  return [
    { userId, name: "Netflix Premium", price: "19.99", frequency: "monthly", category: "entertainment", categoryColor: "#e50914", usageFrequency: "very_used", nextRenewal: dateFromNow(2), rating: 5, note: "Compte famille — très utilisé", isActive: true },
    { userId, name: "Spotify Duo", price: "14.99", frequency: "monthly", category: "music", categoryColor: "#22c55e", usageFrequency: "very_used", nextRenewal: dateFromNow(12), rating: 4, note: "Playlist partagée", isActive: true },
    { userId, name: "Adobe Creative Cloud", price: "35.99", frequency: "monthly", category: "design", categoryColor: "#f97316", usageFrequency: "used", nextRenewal: dateFromNow(6), safetyDate: dateFromNow(3), useSafetyDate: true, rating: 3, note: "Date de sécurité avant le renouvellement", isActive: true },
    { userId, name: "Dropbox Plus", price: "11.99", frequency: "monthly", category: "cloud", categoryColor: "#3b82f6", usageFrequency: "rarely_used", nextRenewal: dateFromNow(4), rating: 1, isSuspect: true, isFlagged: true, note: "Doublon possible avec Google Drive", isActive: true },
    { userId, name: "Notion Plus", price: "96.00", frequency: "yearly", category: "productivity", categoryColor: "#111827", usageFrequency: "used", nextRenewal: dateFromNow(45), rating: 4, note: "Facturation annuelle", isActive: true },
    { userId, name: "Duolingo Super", price: "8.99", frequency: "monthly", category: "other", categoryColor: "#84cc16", usageFrequency: "used", nextRenewal: dateFromNow(9), trialEndsAt: dateFromNow(5), isTrial: true, rating: null, note: "Essai gratuit en cours", isActive: true },
    { userId, name: "Headspace", price: "4.99", frequency: "weekly", category: "other", categoryColor: "#f59e0b", usageFrequency: "rarely_used", nextRenewal: dateFromNow(-3), rating: 2, isSuspect: true, note: "Renouvellement en retard à vérifier", isActive: true },
    { userId, name: "Affinity Designer", price: "74.99", frequency: "lifetime", category: "design", categoryColor: "#6366f1", usageFrequency: "very_used", nextRenewal: null, purchaseDate: dateFromNow(-120), rating: 5, note: "Achat à vie", isActive: true },
    { userId, name: "Salle de sport", price: "29.90", frequency: "monthly", category: "other", categoryColor: "#ec4899", usageFrequency: "rarely_used", nextRenewal: null, rating: 2, note: "Date de prélèvement inconnue", isActive: true },
    { userId, name: "Ancien antivirus", price: "49.99", frequency: "yearly", category: "productivity", categoryColor: "#64748b", usageFrequency: "rarely_used", nextRenewal: dateFromNow(180), rating: 1, note: "Abonnement résilié et archivé", isActive: false },
  ];
}

export async function ensureDemoAccount(db: any) {
  let [user] = await db.select().from(users).where(eq(users.email, DEMO_ACCOUNT.email));
  if (!user) {
    // Login is only available through the dedicated endpoint; no shared password is exposed.
    const password = `demo-disabled-${randomUUID()}`;
    [user] = await db.insert(users).values({ ...DEMO_ACCOUNT, password }).returning();
  }

  const existing = await db.select({ id: subscriptions.id }).from(subscriptions).where(eq(subscriptions.userId, user.id));
  if (existing.length === 0) {
    const created = await db.insert(subscriptions).values(buildDemoSubscriptions(user.id)).returning();
    const netflix = created.find((item: { name: string }) => item.name === "Netflix Premium");
    const trial = created.find((item: { name: string }) => item.name === "Duolingo Super");
    const reminders = [
      netflix && { subscriptionId: netflix.id, reminderType: "renewal", audioUrl: null },
      trial && { subscriptionId: trial.id, reminderType: "trial_ending", audioUrl: null },
    ].filter(Boolean);
    if (reminders.length) await db.insert(voiceReminders).values(reminders);
  }

  const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, user.id));
  if (!settings) {
    await db.insert(userSettings).values({ userId: user.id, budgetCap: "135.00", monthlyOverrides: { [monthKey(1)]: 120, [monthKey(2)]: 150 } });
  }
  return user;
}
