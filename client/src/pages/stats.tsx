import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { StatsOverview } from "@/components/stats-overview";
import { LoginGuard } from "@/components/login-guard";
import { MonthlyBudgetChart } from "@/components/MonthlyBudgetChart";
import { useQuery } from "@tanstack/react-query";
import type { Subscription } from "@shared/schema";
import { getPriceSuffix } from "@shared/subscription-utils";
import type { StatsResponse } from "@/types/stats";
import { Progress } from "@/components/ui/progress";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const INCLUDE_LIFETIME_STORAGE_KEY = "pigeon-include-lifetime";

const usageLabels: Record<string, string> = {
  very_used: "Très utilisé",
  used: "Utilisé",
  rarely_used: "Rarement utilisé",
};

export default function StatsPage() {
  const [includeLifetime, setIncludeLifetime] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(INCLUDE_LIFETIME_STORAGE_KEY) === "true";
  });
  const { data: stats } = useQuery<StatsResponse>({
    queryKey: ["/api/stats", { includeLifetime }],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/stats?includeLifetime=${includeLifetime ? "true" : "false"}`
      );
      return response.json();
    },
  });
  const { data: subscriptions = [] } = useQuery<Subscription[]>({ queryKey: ["/api/subscriptions"] });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== INCLUDE_LIFETIME_STORAGE_KEY) return;
      setIncludeLifetime(event.newValue === "true");
    };
    const handleLocalToggle = () => {
      setIncludeLifetime(window.localStorage.getItem(INCLUDE_LIFETIME_STORAGE_KEY) === "true");
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("pigeon-include-lifetime-change", handleLocalToggle);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("pigeon-include-lifetime-change", handleLocalToggle);
    };
  }, []);

  const trialSubscriptions = subscriptions.filter((sub) => sub.isTrial);
  // Exclude subscriptions that are marked as 'very_used' from the suspect list
  const suspectSubscriptions = subscriptions.filter((sub) => sub.isSuspect && sub.usageFrequency !== 'very_used');

  const categoryEntries = Object.entries(stats?.categoryTotals || {}).sort(([, a], [, b]) => b - a);
  const [mobileCategory, setMobileCategory] = useState<string | null>(null);
  const [mobileUsageKey, setMobileUsageKey] = useState<string | null>(null);

  const categoryLabels = useMemo(() => ({
    entertainment: "Divertissement",
    music: "Musique",
    productivity: "Productivité",
    design: "Design",
    cloud: "Cloud",
    other: "Autre",
  }), []);

  const getCategoryLabel = (category: string) => categoryLabels[category] || category;

  const getCategorySubscriptions = (category: string) =>
    subscriptions
      .filter((sub) => sub.category === category)
      .sort((a, b) => a.name.localeCompare(b.name));

  const getUsageSubscriptions = (usageKey: string) =>
    subscriptions
      .filter((sub) => sub.usageFrequency === usageKey)
      .sort((a, b) => a.name.localeCompare(b.name));

  const mobileCategoryLabel = mobileCategory ? getCategoryLabel(mobileCategory) : "";
  const mobileCategorySubscriptions = mobileCategory ? getCategorySubscriptions(mobileCategory) : [];
  const mobileUsageLabel = mobileUsageKey ? usageLabels[mobileUsageKey] || mobileUsageKey : "";
  const mobileUsageSubscriptions = mobileUsageKey ? getUsageSubscriptions(mobileUsageKey) : [];

  return (
    <LoginGuard>
      <div className="min-h-screen" style={{ backgroundColor: "hsl(210, 17%, 98%)" }}>
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <Sidebar />
            </div>

            <div className="lg:col-span-3 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Vue détaillée</p>
                  <h1 className="text-2xl font-semibold">Statistiques</h1>
                </div>
              </div>

              <StatsOverview />

              <MonthlyBudgetChart subscriptions={subscriptions} includeProrata={includeLifetime} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="pigeon-card p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <i className="fas fa-chart-pie" style={{ color: "hsl(258, 71%, 65%)" }}></i>
                    Répartition par catégorie
                  </h2>
                  {categoryEntries.length === 0 ? (
                    <p className="text-gray-600 text-sm">Aucune donnée de catégorie pour le moment.</p>
                  ) : (
                    <TooltipProvider delayDuration={100}>
                      <div className="space-y-3">
                        {categoryEntries.map(([category, value]) => {
                          const categorySubscriptions = getCategorySubscriptions(category);
                          const rowContent = (
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="capitalize">{getCategoryLabel(category)}</span>
                                <span className="font-medium">€{value.toFixed(2)}/mois</span>
                              </div>
                              <Progress
                                value={Math.min(100, (value / (stats?.budgetCap || 1)) * 100)}
                                className="h-2"
                              />
                            </div>
                          );

                          const subscriptionsList = (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold uppercase text-gray-500">
                                Abonnements ({categorySubscriptions.length})
                              </p>
                              {categorySubscriptions.length === 0 ? (
                                <p className="text-sm text-gray-600">Aucun abonnement dans cette catégorie.</p>
                              ) : (
                                <ul className="space-y-2">
                                  {categorySubscriptions.map((sub) => (
                                    <li key={sub.id} className="flex items-center justify-between gap-4 text-sm">
                                      <span className="font-medium text-gray-900">{sub.name}</span>
                                      <span className="text-gray-600">
                                        €{Number(sub.price).toFixed(2)}{getPriceSuffix(sub.frequency)}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          );

                          return (
                            <div key={category}>
                              <div className="hidden md:block">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="cursor-help">{rowContent}</div>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <div className="space-y-2">
                                      <p className="text-sm font-semibold">{getCategoryLabel(category)}</p>
                                      {subscriptionsList}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                              <button
                                type="button"
                                className="md:hidden w-full text-left"
                                onClick={() => setMobileCategory(category)}
                              >
                                {rowContent}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </TooltipProvider>
                  )}
                </div>

                <div className="pigeon-card p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <i className="fas fa-signal" style={{ color: "hsl(162, 64%, 36%)" }}></i>
                    Usage des abonnements
                  </h2>
                  <TooltipProvider delayDuration={100}>
                    <div className="space-y-3">
                      {Object.entries(stats?.usageBreakdown || {}).map(([key, value]) => {
                        const usageSubscriptions = getUsageSubscriptions(key);
                        const usageRow = (
                          <div className="flex items-center justify-between border rounded-lg p-3 bg-gray-50">
                            <div>
                              <p className="font-medium">{usageLabels[key] || key}</p>
                              <p className="text-xs text-gray-600">{value} abonnement(s)</p>
                            </div>
                            <span className="text-sm font-semibold" style={{ color: "hsl(258, 71%, 65%)" }}>
                              {stats?.activeSubscriptions ? Math.round((value / stats.activeSubscriptions) * 100) : 0}%
                            </span>
                          </div>
                        );

                        const usageList = (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase text-gray-500">
                              Abonnements ({usageSubscriptions.length})
                            </p>
                            {usageSubscriptions.length === 0 ? (
                              <p className="text-sm text-gray-600">Aucun abonnement pour cet usage.</p>
                            ) : (
                              <ul className="space-y-2">
                                {usageSubscriptions.map((sub) => (
                                  <li key={sub.id} className="flex items-center justify-between gap-4 text-sm">
                                    <span className="font-medium text-gray-900">{sub.name}</span>
                                    <span className="text-gray-600">
                                      €{Number(sub.price).toFixed(2)}{getPriceSuffix(sub.frequency)}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );

                        return (
                          <div key={key}>
                            <div className="hidden md:block">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="cursor-help">{usageRow}</div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <div className="space-y-2">
                                    <p className="text-sm font-semibold">{usageLabels[key] || key}</p>
                                    {usageList}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <button
                              type="button"
                              className="md:hidden w-full text-left"
                              onClick={() => setMobileUsageKey(key)}
                            >
                              {usageRow}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </TooltipProvider>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="pigeon-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <i className="fas fa-gift" style={{ color: "hsl(42, 96%, 70%)" }}></i>
                      Essais gratuits ({trialSubscriptions.length})
                    </h2>
                  </div>
                  {trialSubscriptions.length === 0 ? (
                    <p className="text-gray-600 text-sm">Aucun essai gratuit en cours.</p>
                  ) : (
                    <div className="space-y-3">
                      {trialSubscriptions.map((sub) => (
                        <div key={sub.id} className="border rounded-lg p-3 bg-yellow-50 border-yellow-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{sub.name}</p>
                              {sub.trialEndsAt && (
                                <p className="text-xs text-gray-600">
                                  Fin de l'essai: {new Date(sub.trialEndsAt).toLocaleDateString("fr-FR")}
                                </p>
                              )}
                            </div>
                            <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs text-yellow-700">Essai gratuit</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pigeon-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <i className="fas fa-skull-crossbones" style={{ color: "hsl(10, 72%, 61%)" }}></i>
                      Abonnements suspects ({suspectSubscriptions.length})
                    </h2>
                  </div>
                  {suspectSubscriptions.length === 0 ? (
                    <p className="text-gray-600 text-sm">Aucun abonnement suspect répertorié.</p>
                  ) : (
                    <div className="space-y-3">
                      {suspectSubscriptions.map((sub) => (
                        <div key={sub.id} className="border rounded-lg p-3 bg-red-50 border-red-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{sub.name}</p>
                              <p className="text-xs text-gray-600">
                                €{sub.price}{getPriceSuffix(sub.frequency)}
                              </p>
                            </div>
                            <span className="rounded-full bg-red-100 px-3 py-1 text-xs text-red-700">Risque d'arnaque</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Dialog open={mobileCategory !== null} onOpenChange={(open) => !open && setMobileCategory(null)}>
        <DialogContent className="max-w-sm w-[90vw]">
          <DialogHeader>
            <DialogTitle>Abonnements · {mobileCategoryLabel}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {mobileCategorySubscriptions.length === 0 ? (
              <p className="text-sm text-gray-600">Aucun abonnement dans cette catégorie.</p>
            ) : (
              <ul className="space-y-3">
                {mobileCategorySubscriptions.map((sub) => (
                  <li key={sub.id} className="flex items-center justify-between gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{sub.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{getCategoryLabel(sub.category)}</p>
                    </div>
                    <span className="text-gray-600">
                      €{Number(sub.price).toFixed(2)}{getPriceSuffix(sub.frequency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={mobileUsageKey !== null} onOpenChange={(open) => !open && setMobileUsageKey(null)}>
        <DialogContent className="max-w-sm w-[90vw]">
          <DialogHeader>
            <DialogTitle>Abonnements · {mobileUsageLabel}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {mobileUsageSubscriptions.length === 0 ? (
              <p className="text-sm text-gray-600">Aucun abonnement pour cet usage.</p>
            ) : (
              <ul className="space-y-3">
                {mobileUsageSubscriptions.map((sub) => (
                  <li key={sub.id} className="flex items-center justify-between gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{sub.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{usageLabels[sub.usageFrequency] || sub.usageFrequency}</p>
                    </div>
                    <span className="text-gray-600">
                      €{Number(sub.price).toFixed(2)}{getPriceSuffix(sub.frequency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </LoginGuard>
  );
}
