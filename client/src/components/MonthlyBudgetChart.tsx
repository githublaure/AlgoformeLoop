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

  const { data: settings } = useQuery({
    queryKey: ['/api/settings'],
  });

  const defaultBudget = Number(settings?.budgetCap ?? 100);
  const monthlyOverrides = settings?.monthlyOverrides ?? {};

  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    date.setMonth(date.getMonth() + i);
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit" }).format(date)
    };
  });

  const monthlyChartData = computeMonthlyStats(
    subscriptions,
    defaultBudget,
    monthlyOverrides,
    includeProrata
  );

  useEffect(() => {
    const drafts = months.reduce<Record<string, string>>((acc, { key }) => {
      const budget = monthlyOverrides[key];
      acc[key] = budget !== null && budget !== undefined ? String(budget) : "";
      return acc;
    }, {});
    setMonthlyBudgetDrafts(drafts);
  }, [monthlyOverrides, months]);

  const saveMonthlyBudgets = useMutation({
    mutationFn: async (payload: { monthlyOverrides: Record<string, number> }) => {
      const response = await apiRequest("PATCH", "/api/settings/monthly-overrides", payload);
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
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
      <div className="mt-6 rounded-lg border border-gray-100 bg-gray-50/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-gray-700">Budgets par mois</p>
            <p className="text-xs text-gray-500">
              Laissez vide pour utiliser le budget par défaut (
              {currencyFormatter.format(defaultBudget)}
              ).
            </p>
          </div>
          <button
            type="button"
            className="pigeon-button-primary px-4 py-2 text-xs rounded-lg"
            onClick={() => {
              const newOverrides: Record<string, number> = {};
              months.forEach(({ key }) => {
                const value = monthlyBudgetDrafts[key];
                if (value !== "" && value !== undefined) {
                  newOverrides[key] = Number(value);
                }
              });
              saveMonthlyBudgets.mutate({ monthlyOverrides: newOverrides });
            }}
            disabled={saveMonthlyBudgets.isPending}
          >
            {saveMonthlyBudgets.isPending ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {months.map(({ key: monthKey, label: monthLabel }) => (
            <label key={monthKey} className="flex flex-col gap-1 text-xs text-gray-500">
              <span className="font-medium text-gray-600">{monthLabel}</span>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">
                  €
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={monthlyBudgetDrafts[monthKey] ?? ""}
                  onChange={(event) =>
                    setMonthlyBudgetDrafts((prev) => ({
                      ...prev,
                      [monthKey]: event.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-gray-200 bg-white py-1.5 pl-6 pr-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-300"
                  placeholder="—"
                />
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}