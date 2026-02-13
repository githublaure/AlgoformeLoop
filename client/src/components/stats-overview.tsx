import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { StatsResponse } from "@/types/stats";
import type { Subscription } from "@shared/schema";
import { getPriceSuffix } from "@shared/subscription-utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const INCLUDE_LIFETIME_STORAGE_KEY = "pigeon-include-lifetime";

type StatsCardKey = "cost" | "active" | "trial" | "suspect";

export function StatsOverview() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [includeLifetime, setIncludeLifetime] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(INCLUDE_LIFETIME_STORAGE_KEY) === "true";
  });
  const { data: stats, isLoading } = useQuery<StatsResponse>({
    queryKey: ['/api/stats', { includeLifetime }],
    queryFn: async ({ queryKey }) => {
      const [, params] = queryKey;
      const includeLifetimeParam =
        typeof params === "object" &&
        params !== null &&
        Boolean((params as { includeLifetime?: boolean }).includeLifetime);
      const response = await apiRequest(
        "GET",
        `/api/stats?includeLifetime=${includeLifetimeParam ? "true" : "false"}`
      );
      return response.json();
    },
    staleTime: 0,
    refetchOnMount: "always",
  });
  const { data: settings } = useQuery<{ budgetCap: number | string }>({
    queryKey: ['/api/settings'],
  });
  const { data: subscriptions = [] } = useQuery<Subscription[]>({
    queryKey: ['/api/subscriptions'],
  });

  const [budgetInput, setBudgetInput] = useState("");

  const budgetCap = Number(settings?.budgetCap ?? stats?.budgetCap ?? 0);


  const normalizeToMonthly = (sub: Subscription) => {
    const price = Number(sub.price);
    if (!Number.isFinite(price)) return 0;

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
      return includeLifetime ? price / 12 : 0;
    }
    if (isWeekly) {
      return (price * 52) / 12;
    }
    if (isLifetime) {
      if (!includeLifetime) return 0;
      const rawPurchaseDate = sub.purchaseDate ?? sub.createdAt ?? null;
      if (!rawPurchaseDate) return 0;
      const purchaseDate = new Date(rawPurchaseDate);
      if (Number.isNaN(purchaseDate.getTime())) return 0;
      const cutoff = new Date(purchaseDate);
      cutoff.setFullYear(cutoff.getFullYear() + 1);
      if (new Date() >= cutoff) return 0;
      return price / 12;
    }

    return price;
  };

  const activeSubscriptionsFallback = subscriptions.filter((sub) => sub.isActive).length;
  const trialCountFallback = subscriptions.filter((sub) => sub.isTrial).length;
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const trialsEndingFallback = subscriptions.filter(
    (sub) =>
      sub.isTrial &&
      sub.trialEndsAt &&
      new Date(sub.trialEndsAt).getTime() <= now + sevenDays,
  ).length;
  const monthlyCostFallback = subscriptions.reduce((sum, sub) => sum + normalizeToMonthly(sub), 0);
  const suspectSubscriptionsFallback = subscriptions.filter(
    (sub) => sub.isSuspect && sub.usageFrequency !== "very_used",
  );
  const suspectMonthlyFallback = suspectSubscriptionsFallback.reduce(
    (sum, sub) => sum + normalizeToMonthly(sub),
    0,
  );
  const wastedEstimateFallback = subscriptions
    .filter((sub) => sub.usageFrequency === "rarely_used")
    .reduce((sum, sub) => sum + normalizeToMonthly(sub), 0);
  const upcomingRenewalsFallback = subscriptions.filter((sub) => {
    if (!sub.isActive) return false;
    const reminderDate = sub.useSafetyDate && sub.safetyDate ? sub.safetyDate : sub.nextRenewal;
    if (!reminderDate) return false;
    const time = new Date(reminderDate).getTime();
    return Number.isFinite(time) && time >= now && time <= now + sevenDays;
  }).length;

  const statsTotalMonthlyCost = stats?.totalMonthlyCost !== undefined ? Number(stats.totalMonthlyCost) : null;
  const statsActiveSubscriptions = stats?.activeSubscriptions;
  const statsLooksBroken =
    Boolean(stats) &&
    subscriptions.length > 0 &&
    (Number(statsActiveSubscriptions ?? 0) === 0 || Number(statsTotalMonthlyCost ?? 0) === 0);

  const totalMonthlyCost =
    !statsLooksBroken && statsTotalMonthlyCost !== null ? statsTotalMonthlyCost : monthlyCostFallback;
  const activeSubscriptions =
    !statsLooksBroken && statsActiveSubscriptions !== undefined
      ? statsActiveSubscriptions
      : activeSubscriptionsFallback;
  const trialCount = !statsLooksBroken && stats?.trialCount !== undefined ? stats.trialCount : trialCountFallback;
  const trialsEnding =
    !statsLooksBroken && stats?.trialsEnding !== undefined ? stats.trialsEnding : trialsEndingFallback;
  const suspectMonthly =
    !statsLooksBroken && stats?.suspectMonthly !== undefined
      ? Number(stats.suspectMonthly)
      : suspectMonthlyFallback;
  const wastedEstimate =
    !statsLooksBroken && stats?.wastedEstimate !== undefined
      ? Number(stats.wastedEstimate)
      : wastedEstimateFallback;
  const suspectCount =
    !statsLooksBroken && stats?.suspectCount !== undefined ? stats.suspectCount : suspectSubscriptionsFallback.length;
  const upcomingRenewals =
    !statsLooksBroken && stats?.upcomingRenewals !== undefined ? stats.upcomingRenewals : upcomingRenewalsFallback;

  const budgetGap = Math.max(totalMonthlyCost - budgetCap, 0);

  useEffect(() => {
    setBudgetInput(budgetCap ? budgetCap.toFixed(0) : "0");
  }, [budgetCap]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(INCLUDE_LIFETIME_STORAGE_KEY, String(includeLifetime));
    window.dispatchEvent(new Event("pigeon-include-lifetime-change"));
  }, [includeLifetime]);

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
  }, [includeLifetime, queryClient]);

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


  const getCardSubscriptions = (card: StatsCardKey) => {
    if (card === "trial") return subscriptions.filter((sub) => sub.isTrial);
    if (card === "suspect") return subscriptions.filter((sub) => sub.isSuspect);
    if (card === "active") return subscriptions.filter((sub) => sub.isActive);
    return subscriptions.filter((sub) => sub.isActive);
  };

  const [mobileDetailsCard, setMobileDetailsCard] = useState<StatsCardKey | null>(null);

  const renderSubscriptionList = (card: StatsCardKey) => {
    const items = getCardSubscriptions(card);
    return (
      <>
        {items.length === 0 ? (
          <p className="text-xs text-gray-500">Aucun abonnement pour cet indicateur.</p>
        ) : (
          <ul className="text-xs space-y-1 max-h-56 overflow-y-auto">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2 border-b pb-1">
                <span className="truncate">{item.name}</span>
                <span className="text-gray-500">€{Number(item.price).toFixed(2)}{getPriceSuffix(item.frequency)}</span>
              </li>
            ))}
          </ul>
        )}
      </>
    );
  };

  const renderPigeonHover = (card: StatsCardKey) => {
    return (
      <>
        <div className="hidden sm:block">
          <HoverCard>
            <HoverCardTrigger asChild>
              <img
                src="/pigeon1.png"
                alt="Voir les abonnements correspondants"
                className="absolute right-6 top-6 w-12 h-12 object-contain opacity-70 grayscale brightness-0 cursor-pointer"
              />
            </HoverCardTrigger>
            <HoverCardContent className="w-72">
              <p className="text-sm font-semibold mb-2">Abonnements correspondants</p>
              {renderSubscriptionList(card)}
            </HoverCardContent>
          </HoverCard>
        </div>
        <button
          type="button"
          className="sm:hidden absolute right-4 top-4"
          onClick={() => setMobileDetailsCard(card)}
          aria-label="Voir les abonnements correspondants"
        >
          <img
            src="/pigeon1.png"
            alt=""
            className="w-10 h-10 object-contain opacity-70 grayscale brightness-0"
            aria-hidden="true"
          />
        </button>
      </>
    );
  };

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
        <div className="relative pr-16">
          <div>
            <p className="text-sm text-gray-600">Coût mensuel</p>
            <p className="text-2xl font-bold" style={{ color: 'hsl(258, 71%, 65%)' }}>
              €{totalMonthlyCost.toFixed(2)}
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
                {budgetGap > 0 ? `(-${budgetGap.toFixed(2)} à réduire)` : "(OK)"}
              </span>
              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                <Switch
                  checked={includeLifetime}
                  onCheckedChange={setIncludeLifetime}
                  aria-label="Inclure les accès à vie"
                />
                <span>Inclure annuel + accès à vie (1ère année)</span>
              </div>
            </div>
          </div>
          {renderPigeonHover("cost")}
        </div>
      </div>

      <div className="pigeon-card p-6">
        <div className="relative pr-16">
          <div>
            <p className="text-sm text-gray-600">Abonnements actifs</p>
            <p className="text-2xl font-bold" style={{ color: 'hsl(162, 64%, 36%)' }}>
              {activeSubscriptions}
            </p>
            <p className="text-xs text-gray-600 mt-1">{upcomingRenewals} renouvellements à venir</p>
          </div>
          {renderPigeonHover("active")}
        </div>
      </div>

      <div className="pigeon-card p-6">
        <div className="relative pr-16">
          <div>
            <p className="text-sm text-gray-600">Essais gratuits</p>
            <p className="text-2xl font-bold" style={{ color: 'hsl(42, 96%, 70%)' }}>
              {trialCount}
            </p>
            <p className="text-xs text-gray-600 mt-1">{trialsEnding} finissent sous 7 jours</p>
          </div>
          {renderPigeonHover("trial")}
        </div>
      </div>

      <div className="pigeon-card p-6">
        <div className="relative pr-16">
          <div>
            <p className="text-sm text-gray-600">Risque d'arnaque</p>
            <p className="text-2xl font-bold" style={{ color: 'hsl(10, 72%, 61%)' }}>
              €{suspectMonthly.toFixed(2)}
            </p>
            <p className="text-xs text-gray-600 mt-1">Perte estimée (peu utilisé): €{wastedEstimate.toFixed(2)}</p>
            <p className="text-xs text-gray-600">{suspectCount} abonnements suspects</p>
          </div>
          {renderPigeonHover("suspect")}
        </div>
      </div>

      <Dialog open={mobileDetailsCard !== null} onOpenChange={(open) => !open && setMobileDetailsCard(null)}>
        <DialogContent className="sm:hidden max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>Abonnements correspondants</DialogTitle>
          </DialogHeader>
          {mobileDetailsCard ? renderSubscriptionList(mobileDetailsCard) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
