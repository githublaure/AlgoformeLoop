import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Subscription } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { computeMonthlyStats, type MonthlyStats } from "@/utils/computeMonthlyStats";

const PigeonMonthlyIcon = () => (
  <img src="/pigeon2.png" alt="" className="h-4 w-4 object-contain" aria-hidden="true" />
);

const PigeonGapIcon = () => (
  <img src="/pigeon3.png" alt="" className="h-4 w-4 object-contain" aria-hidden="true" />
);

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

type MonthlyBudgetsResponse = {
  defaultBudget: number;
  months: string[];
  monthlyBudgets: Record<string, number | null>;
};

interface MonthlyBudgetChartProps {
  subscriptions: Subscription[];
  includeProrata: boolean;
}

export function MonthlyBudgetChart({ subscriptions, includeProrata }: MonthlyBudgetChartProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const startMonthKey = (() => {
    const date = new Date();
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    return `${year}-${month}`;
  })();

  const { data: monthlyBudgetsData, refetch: refetchMonthlyBudgets } = useQuery<MonthlyBudgetsResponse>({
    queryKey: ["/api/settings/budgets", { startMonthKey }],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/settings/budgets?start=${startMonthKey}&months=12`
      );
      return response.json();
    },
  });

  const { data: settings } = useQuery<{ budgetCap: number | string }>({
    queryKey: ['/api/settings'],
  });

  const [monthlyBudgetDrafts, setMonthlyBudgetDrafts] = useState<Record<string, string>>({});

  const defaultBudget = Number(settings?.budgetCap ?? 100);
  const budgetOverrides = monthlyBudgetsData?.monthlyBudgets ?? {};

  const monthlyChartData = computeMonthlyStats(
    subscriptions,
    defaultBudget,
    budgetOverrides,
    includeProrata
  );

  useEffect(() => {
    if (!monthlyBudgetsData) return;
    const drafts = monthlyBudgetsData.months.reduce<Record<string, string>>((acc, monthKey) => {
      const budget = monthlyBudgetsData.monthlyBudgets?.[monthKey];
      acc[monthKey] = budget !== null && budget !== undefined ? String(budget) : "";
      return acc;
    }, {});
    setMonthlyBudgetDrafts(drafts);
  }, [monthlyBudgetsData]);

  const saveMonthlyBudgets = useMutation({
    mutationFn: async (payload: { budgets: { month: string; amount: string | null }[] }) => {
      const response = await apiRequest("PUT", "/api/settings/budgets", payload);
      return response.json();
    },
    onSuccess: async () => {
      await refetchMonthlyBudgets();
      toast({
        title: "Budgets mensuels mis à jour",
        description: "Les budgets par mois ont été enregistrés.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur budget mensuel",
        description: error instanceof Error ? error.message : "Impossible d'enregistrer les budgets.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="pigeon-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <i className="fas fa-chart-line" style={{ color: "hsl(258, 71%, 65%)" }}></i>
            Évolution mensuelle
          </h2>
          <p className="text-sm text-gray-600">
            Coûts mensuels vs gap budget — prorata {includeProrata ? "activé" : "désactivé"}.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <img src="/pigeon1.png" alt="" className="h-6 w-6 object-contain" aria-hidden="true" />
          <span>Pic mensuel repéré</span>
        </div>
      </div>
      <div className="mt-6 h-72">
        <ChartContainer
          config={{
            monthlyCost: {
              label: "Coûts mensuels",
              color: "hsl(258, 71%, 65%)",
              icon: PigeonMonthlyIcon,
            },
            budget: {
              label: "Budget mensuel",
              color: "hsl(210, 12%, 60%)",
            },
            budgetGap: {
              label: "Gap budget",
              color: "hsl(10, 72%, 61%)",
              icon: PigeonGapIcon,
            },
          }}
          className="h-full w-full"
        >
          <LineChart data={monthlyChartData} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="4 4" />
            <XAxis dataKey="month" tickMargin={8} />
            <YAxis
              tickFormatter={(value) => currencyFormatter.format(Number(value))}
              width={72}
            />
            <ChartTooltip
              cursor={{ stroke: "var(--color-monthlyCost)", strokeWidth: 1 }}
              content={
                <ChartTooltipContent
                  formatter={(value, name) => {
                    const label =
                      name === "monthlyCost"
                        ? "Coûts mensuels"
                        : name === "budget"
                          ? "Budget mensuel"
                          : "Gap budget";
                    return (
                      <div className="flex w-full justify-between gap-4">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-mono font-medium text-foreground">
                          {currencyFormatter.format(Number(value))}
                        </span>
                      </div>
                    );
                  }}
                  nameKey="name"
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              dataKey="budget"
              type="monotone"
              stroke="var(--color-budget)"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
            />
            <Line
              dataKey="monthlyCost"
              type="monotone"
              stroke="var(--color-monthlyCost)"
              strokeWidth={2}
              dot={(props) =>
                props.payload?.monthlyPeak ? (
                  <image
                    href="/pigeon2.png"
                    x={props.cx - 12}
                    y={props.cy - 12}
                    width={24}
                    height={24}
                  />
                ) : (
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={3}
                    fill="var(--color-monthlyCost)"
                    stroke="#fff"
                    strokeWidth={1}
                  />
                )
              }
              activeDot={{ r: 4 }}
            />
            <Line
              dataKey="budgetGap"
              type="monotone"
              stroke="var(--color-budgetGap)"
              strokeWidth={2}
              strokeDasharray="3 3"
              dot={(props) =>
                props.payload?.gapPeak ? (
                  <image
                    href="/pigeon3.png"
                    x={props.cx - 12}
                    y={props.cy - 12}
                    width={24}
                    height={24}
                  />
                ) : (
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={3}
                    fill="var(--color-budgetGap)"
                    stroke="#fff"
                    strokeWidth={1}
                  />
                )
              }
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ChartContainer>
      </div>
    </div>
  );
}