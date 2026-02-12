import type { Subscription } from "@shared/schema";

export interface MonthlyStats {
  month: string;
  monthKey: string;
  budget: number;
  monthlyCost: number;
  budgetGap: number;
  monthlyPeak: boolean;
  gapPeak: boolean;
}

export function computeMonthlyStats(
  subscriptions: Subscription[],
  defaultBudget: number,
  budgetOverrides: Record<string, number>,
  includeProrata: boolean
): MonthlyStats[] {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const isFinitePrice = (price: string | number | null | undefined) => {
    const parsed = Number(price);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const getMonthlyCost = (sub: Subscription, monthDate: Date) => {
    const price = isFinitePrice(sub.price);
    if (!price) return 0;
    const rawFrequency = String(sub.frequency ?? "").toLowerCase();
    const normalizedFrequency = rawFrequency.normalize("NFD").replace(/\p{Diacritic}/gu, "");
    const isLifetime =
      rawFrequency === "lifetime" ||
      normalizedFrequency.includes("lifetime") ||
      normalizedFrequency.includes("life time") ||
      normalizedFrequency.includes("acces a vie") ||
      normalizedFrequency.includes("access a vie");
    const isYearly =
      rawFrequency === "yearly" ||
      normalizedFrequency.includes("annuel") ||
      normalizedFrequency === "an" ||
      normalizedFrequency.includes("annee");
    const isWeekly =
      rawFrequency === "weekly" ||
      normalizedFrequency.includes("hebdomadaire") ||
      normalizedFrequency.includes("semaine");

    if (isYearly) {
      return includeProrata ? price / 12 : price;
    }
    if (isWeekly) {
      return (price * 52) / 12;
    }
    if (isLifetime) {
      if (!includeProrata) return 0;
      const rawPurchaseDate = sub.purchaseDate ?? sub.createdAt ?? null;
      if (!rawPurchaseDate) return 0;
      const purchaseDate = new Date(rawPurchaseDate);
      if (Number.isNaN(purchaseDate.getTime())) return 0;
      const cutoff = new Date(purchaseDate);
      cutoff.setFullYear(cutoff.getFullYear() + 1);
      if (monthDate < purchaseDate || monthDate >= cutoff) return 0;
      return price / 12;
    }
    return price;
  };

  const data = Array.from({ length: 12 }, (_, index) => {
    const monthDate = new Date(start.getFullYear(), start.getMonth() + index, 1);
    const monthKey = formatMonthKey(monthDate);
    const budgetForMonth = Number(budgetOverrides[monthKey] ?? defaultBudget);
    const monthlyCost = subscriptions.reduce(
      (sum, sub) => sum + getMonthlyCost(sub, monthDate),
      0
    );
    const budgetGap = Math.max(monthlyCost - budgetForMonth, 0);
    return {
      month: formatMonthLabel.format(monthDate),
      monthKey,
      budget: Number(budgetForMonth.toFixed(2)),
      monthlyCost: Number(monthlyCost.toFixed(2)),
      budgetGap: Number(budgetGap.toFixed(2)),
    };
  });

  const monthlyPeak = Math.max(...data.map((item) => item.monthlyCost), 0);
  const gapPeak = Math.max(...data.map((item) => item.budgetGap), 0);
  const monthlyPeakIndex = monthlyPeak > 0 ? data.findIndex((item) => item.monthlyCost === monthlyPeak) : -1;
  const gapPeakIndex = gapPeak > 0 ? data.findIndex((item) => item.budgetGap === gapPeak) : -1;

  return data.map((item, index) => ({
    ...item,
    monthlyPeak: index === monthlyPeakIndex,
    gapPeak: index === gapPeakIndex,
  }));
}

const formatMonthLabel = new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit" });

const formatMonthKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
};