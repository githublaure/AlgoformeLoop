import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { StatsResponse } from "@/types/stats";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export function StatsOverview() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: stats, isLoading } = useQuery<StatsResponse>({
    queryKey: ['/api/stats'],
  });
  const { data: settings } = useQuery<{ budgetCap: number | string }>({
    queryKey: ['/api/settings'],
  });

  const [budgetInput, setBudgetInput] = useState("");

  const budgetCap = Number(settings?.budgetCap ?? stats?.budgetCap ?? 0);
  const budgetGap = Number(stats?.budgetGap ?? 0);

  useEffect(() => {
    setBudgetInput(budgetCap ? budgetCap.toFixed(0) : "0");
  }, [budgetCap]);

  const updateBudget = useMutation({
    mutationFn: async () => {
      const parsed = Number(budgetInput);
      if (!Number.isFinite(parsed) || parsed < 0) {
        throw new Error("Le budget cible doit être un nombre positif.");
      }
      const response = await apiRequest("PUT", "/api/settings/budget", {
        budgetCap: parsed,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/settings'], data);
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Budget cible mis à jour",
        description: "Votre budget cible a été enregistré.",
      });
    },
    onError: (error) => {
      toast({
        title: "Budget invalide",
        description: error instanceof Error ? error.message : "Impossible d'enregistrer le budget.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="pigeon-card p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      <div className="pigeon-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Coût mensuel</p>
            <p className="text-2xl font-bold" style={{ color: 'hsl(258, 71%, 65%)' }}>
              €{stats?.totalMonthlyCost || '0.00'}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
              <span>Budget cible:</span>
              <div className="flex items-center gap-2">
                <span>€</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={budgetInput}
                  onChange={(event) => setBudgetInput(event.target.value)}
                  className="h-7 w-20 rounded-md border border-gray-200 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-300"
                  aria-label="Budget cible"
                />
                <Button
                  size="sm"
                  type="button"
                  onClick={() => updateBudget.mutate()}
                  disabled={updateBudget.isPending}
                  className="h-7 px-2 text-[11px] pigeon-button-secondary"
                >
                  {updateBudget.isPending ? "..." : "OK"}
                </Button>
              </div>
              <span>
                {budgetGap > 0 ? `(-${budgetGap.toFixed(2)} à réduire)` : "(ok)"}
              </span>
            </div>
          </div>
          <img
            src="/pigeon1.png"
            alt=""
            className="w-12 h-12 object-contain opacity-70 grayscale brightness-0"
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="pigeon-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Abonnements actifs</p>
            <p className="text-2xl font-bold" style={{ color: 'hsl(162, 64%, 36%)' }}>
              {stats?.activeSubscriptions || 0}
            </p>
            <p className="text-xs text-gray-600 mt-1">{stats?.upcomingRenewals || 0} renouvellements à venir</p>
          </div>
          <img
            src="/pigeon1.png"
            alt=""
            className="w-12 h-12 object-contain opacity-70 grayscale brightness-0"
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="pigeon-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Essais gratuits</p>
            <p className="text-2xl font-bold" style={{ color: 'hsl(42, 96%, 70%)' }}>
              {stats?.trialCount || 0}
            </p>
            <p className="text-xs text-gray-600 mt-1">{stats?.trialsEnding || 0} finissent sous 7 jours</p>
          </div>
          <img
            src="/pigeon1.png"
            alt=""
            className="w-12 h-12 object-contain opacity-70 grayscale brightness-0"
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="pigeon-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Risque d'arnaque</p>
            <p className="text-2xl font-bold" style={{ color: 'hsl(10, 72%, 61%)' }}>
              €{stats?.suspectMonthly || '0.00'}
            </p>
            <p className="text-xs text-gray-600 mt-1">Perte estimée (peu utilisé): €{stats?.wastedEstimate || '0.00'}</p>
            <p className="text-xs text-gray-600">{stats?.suspectCount || 0} abonnements suspects</p>
          </div>
          <img
            src="/pigeon1.png"
            alt=""
            className="w-12 h-12 object-contain opacity-70 grayscale brightness-0"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}
