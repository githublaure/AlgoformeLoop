export interface StatsResponse {
  totalMonthlyCost: string;
  activeSubscriptions: number;
  upcomingRenewals: number;
  trialsEnding: number;
  trialCount: number;
  suspectMonthly: string;
  wastedEstimate: string;
  budgetCap: number;
  budgetGap: string;
  suspectCount: number;
  usageBreakdown: Record<string, number>;
  categoryTotals: Record<string, number>;
}
