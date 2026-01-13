import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { StatsOverview } from "@/components/stats-overview";
import { LoginGuard } from "@/components/login-guard";
import { useQuery } from "@tanstack/react-query";
import type { Subscription } from "@shared/schema";
import { getPriceSuffix } from "@shared/subscription-utils";
import type { StatsResponse } from "@/types/stats";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="pigeon-card p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <i className="fas fa-chart-pie" style={{ color: "hsl(258, 71%, 65%)" }}></i>
                    Répartition par catégorie
                  </h2>
                  {categoryEntries.length === 0 ? (
                    <p className="text-gray-600 text-sm">Aucune donnée de catégorie pour le moment.</p>
                  ) : (
                    <div className="space-y-3">
                      {categoryEntries.map(([category, value]) => (
                        <div key={category}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="capitalize">{category}</span>
                            <span className="font-medium">€{value.toFixed(2)}/mois</span>
                          </div>
                          <Progress value={Math.min(100, (value / (stats?.budgetCap || 1)) * 100)} className="h-2" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pigeon-card p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <i className="fas fa-signal" style={{ color: "hsl(162, 64%, 36%)" }}></i>
                    Usage des abonnements
                  </h2>
                  <div className="space-y-3">
                    {Object.entries(stats?.usageBreakdown || {}).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between border rounded-lg p-3 bg-gray-50">
                        <div>
                          <p className="font-medium">{usageLabels[key] || key}</p>
                          <p className="text-xs text-gray-600">{value} abonnement(s)</p>
                        </div>
                        <span className="text-sm font-semibold" style={{ color: "hsl(258, 71%, 65%)" }}>
                          {stats?.activeSubscriptions ? Math.round((value / stats.activeSubscriptions) * 100) : 0}%
                        </span>
                      </div>
                    ))}
                  </div>
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
    </LoginGuard>
  );
}
