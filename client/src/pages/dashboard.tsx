import React from 'react'
import { Header } from "../components/header";
import { Sidebar } from "../components/sidebar";
import { StatsOverview } from "../components/stats-overview";
import { UpcomingRenewals } from "../components/upcoming-renewals";
import { SubscriptionCard } from "../components/subscription-card";
import { AddSubscriptionModal } from "../components/add-subscription-modal";
import { OfferReminders } from "../components/offer-reminders";
import { LoginGuard } from "../components/login-guard";
import { MonthlyBudgetChart } from "../components/MonthlyBudgetChart";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Subscription } from "@shared/schema";
import { isPigeoned } from "@shared/subscription-utils";

export default function Dashboard() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [pigeonFilter, setPigeonFilter] = useState<string>("all");
  const [upcomingFilter, setUpcomingFilter] = useState<string>("all");
  const [sortMode, setSortMode] = useState<"default" | "category-color" | "price-asc" | "price-desc">("default");

  const [includeArchived, setIncludeArchived] = useState<boolean>(false);
  const [includeProrata, setIncludeProrata] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("statistics");
  const filterSelectClass =
    "appearance-none rounded-md border border-gray-200 bg-white px-3 py-2 pr-10 text-sm text-gray-700 shadow-sm transition focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-300";
  const filterSelectStyle = {
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%235b6472' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 8 10 12 14 8'/%3E%3C/svg%3E\")",
    backgroundPosition: "right 0.75rem center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "14px 14px",
  };

  const { data: subscriptions = [], isLoading } = useQuery<Subscription[]>({
    queryKey: ['/api/subscriptions', { includeArchived }],
  });

  const trials = subscriptions.filter((subscription) => subscription.isTrial);
  const suspects = subscriptions.filter((subscription) => subscription.isSuspect);
  const flagged = subscriptions.filter((subscription) => subscription.isFlagged);

  const filteredSubscriptions = subscriptions.filter((subscription) => {
    if (!includeArchived && !subscription.isActive) return false;

    // Rating filter
    if (ratingFilter !== "all") {
      const ratingValue = Number(ratingFilter);
      if ((subscription.rating ?? 0) < ratingValue) return false;
    }

    // Pigeon filter: all | pigeon | not-pigeon | scam (basé sur la note ou le flag suspect)
    if (pigeonFilter === 'pigeon' && !isPigeoned(subscription)) return false;
    if (pigeonFilter === 'not-pigeon' && isPigeoned(subscription)) return false;
    if (pigeonFilter === 'scam' && !subscription.isSuspect) return false;
    if (pigeonFilter === 'flagged' && !subscription.isFlagged) return false;

    // Upcoming filter
    if (upcomingFilter !== 'all') {
      if (upcomingFilter === 'lifetime') {
        return subscription.frequency === 'lifetime';
      }
      if (upcomingFilter === 'unknown') {
        return !subscription.nextRenewal && subscription.frequency !== 'lifetime';
      }
      if (!subscription.nextRenewal) {
        return false;
      }
      const now = new Date();
      const next = new Date(subscription.nextRenewal);
      const days = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (upcomingFilter === '7' && (days < 0 || days > 7)) return false;
      if (upcomingFilter === '30' && (days < 0 || days > 30)) return false;
      if (upcomingFilter === 'overdue' && days >= 0) return false;
    }

    return true;
  });



  const sortedSubscriptions = [...filteredSubscriptions].sort((a, b) => {
    if (sortMode === "category-color") {
      return (a.categoryColor || a.bgColor || "").localeCompare(b.categoryColor || b.bgColor || "");
    }
    if (sortMode === "price-asc") {
      return Number(a.price) - Number(b.price);
    }
    if (sortMode === "price-desc") {
      return Number(b.price) - Number(a.price);
    }
    return 0;
  });

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingSubscription(null);
  };

  return (
    <LoginGuard>
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(210, 17%, 98%)' }}>
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Sidebar onAddSubscription={() => {
              setEditingSubscription(null);
              setIsAddModalOpen(true);
            }} />
          </div>

          <div className="lg:col-span-3">
            <div className="flex border-b border-gray-200 mb-6">
              <button
                onClick={() => setActiveTab("statistics")}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === "statistics"
                    ? "border-b-2 border-purple-500 text-purple-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Statistiques
              </button>
              <button
                onClick={() => setActiveTab("subscriptions")}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === "subscriptions"
                    ? "border-b-2 border-purple-500 text-purple-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Abonnements
              </button>
            </div>

            {activeTab === "statistics" && (
              <>
                <StatsOverview />
                <div className="pigeon-card p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">Paramètres du graphique</h2>
                      <p className="text-sm text-gray-600">Activez le prorata pour répartir les coûts annuels mensuellement.</p>
                    </div>
                    <label className="flex items-center gap-2">
                      <span className="text-sm">Prorata</span>
                      <input
                        type="checkbox"
                        checked={includeProrata}
                        onChange={(e) => setIncludeProrata(e.target.checked)}
                        className="rounded"
                      />
                    </label>
                  </div>
                </div>
                <MonthlyBudgetChart subscriptions={subscriptions} includeProrata={includeProrata} />
              </>
            )}

            {activeTab === "subscriptions" && (
              <>
                <UpcomingRenewals onEdit={(selected) => {
                  setEditingSubscription(selected);
                  setIsAddModalOpen(true);
                }} />

                <OfferReminders />

                <div id="essais-gratuits" className="pigeon-card mb-6">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <i className="fas fa-feather" style={{ color: 'hsl(42, 96%, 70%)' }}></i>
                    Essais gratuits
                  </h2>
                  <button
                    onClick={() => {
                      setEditingSubscription(null);
                      setIsAddModalOpen(true);
                    }}
                    className="pigeon-button-primary px-4 py-2 rounded-lg"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Ajouter
                  </button>
                </div>
              </div>
              <div className="p-6">
                {isLoading ? (
                  <div className="text-center py-8">
                    <i className="fas fa-spinner fa-spin text-2xl" style={{ color: 'hsl(258, 71%, 65%)' }}></i>
                    <p className="mt-2 text-gray-600">Chargement des essais gratuits...</p>
                  </div>
                ) : trials.length === 0 ? (
                  <p className="text-gray-600 text-center">Aucun essai gratuit en cours</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {trials.map((subscription) => (
                      <SubscriptionCard
                        key={subscription.id}
                        subscription={subscription}
                        onEdit={(selected) => {
                          setEditingSubscription(selected);
                          setIsAddModalOpen(true);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div id="suspects" className="pigeon-card mb-6">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <i className="fas fa-exclamation-triangle text-red-500"></i>
                    Abonnements suspects
                  </h2>
                  <button
                    onClick={() => {
                      setEditingSubscription(null);
                      setIsAddModalOpen(true);
                    }}
                    className="pigeon-button-primary px-4 py-2 rounded-lg"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Ajouter
                  </button>
                </div>
              </div>
              <div className="p-6">
                {isLoading ? (
                  <div className="text-center py-8">
                    <i className="fas fa-spinner fa-spin text-2xl" style={{ color: 'hsl(258, 71%, 65%)' }}></i>
                    <p className="mt-2 text-gray-600">Chargement des abonnements suspects...</p>
                  </div>
                ) : suspects.length === 0 ? (
                  <p className="text-gray-600 text-center">Aucun abonnement suspect identifié</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {suspects.map((subscription) => (
                      <SubscriptionCard
                        key={subscription.id}
                        subscription={subscription}
                        onEdit={(selected) => {
                          setEditingSubscription(selected);
                          setIsAddModalOpen(true);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div id="flagged" className="pigeon-card mb-6">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <i className="fas fa-triangle-exclamation" style={{ color: 'hsl(10, 72%, 61%)' }}></i>
                    Abonnements flaggés
                  </h2>
                  <button
                    onClick={() => {
                      setEditingSubscription(null);
                      setIsAddModalOpen(true);
                    }}
                    className="pigeon-button-primary px-4 py-2 rounded-lg"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Ajouter
                  </button>
                </div>
              </div>
              <div className="p-6">
                {isLoading ? (
                  <div className="text-center py-8">
                    <i className="fas fa-spinner fa-spin text-2xl" style={{ color: 'hsl(258, 71%, 65%)' }}></i>
                    <p className="mt-2 text-gray-600">Chargement des abonnements flaggés...</p>
                  </div>
                ) : flagged.length === 0 ? (
                  <p className="text-gray-600 text-center">Aucun abonnement flaggé</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {flagged.map((subscription) => (
                      <SubscriptionCard
                        key={subscription.id}
                        subscription={subscription}
                        onEdit={(selected) => {
                          setEditingSubscription(selected);
                          setIsAddModalOpen(true);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* All Subscriptions */}
            <div className="pigeon-card">
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <h2 className="text-lg font-semibold">Tous les abonnements</h2>
                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto md:justify-end">
                    <label className="text-sm text-gray-600">Filtrer par note</label>
                    <select
                      className={filterSelectClass}
                      style={filterSelectStyle}
                      value={ratingFilter}
                      onChange={(event) => setRatingFilter(event.target.value)}
                    >
                      <option value="all">Toutes les notes</option>
                      <option value="5">5 étoiles</option>
                      <option value="4">4 étoiles et plus</option>
                      <option value="3">3 étoiles et plus</option>
                      <option value="2">2 étoiles et plus</option>
                      <option value="1">1 étoile et plus</option>
                    </select>

                    <label className="text-sm text-gray-600">Type</label>
                    <select
                      className={filterSelectClass}
                      style={filterSelectStyle}
                      value={pigeonFilter}
                      onChange={(e) => setPigeonFilter(e.target.value)}
                    >
                      <option value="all">Tous</option>
                      <option value="pigeon">Pigeonné</option>
                      <option value="not-pigeon">Non pigeonné</option>
                      <option value="scam">Arnaques</option>
                      <option value="flagged">Flaggés</option>
                    </select>

                    <label className="text-sm text-gray-600">Renouvellement</label>
                    <select
                      className={filterSelectClass}
                      style={filterSelectStyle}
                      value={upcomingFilter}
                      onChange={(e) => setUpcomingFilter(e.target.value)}
                    >
                      <option value="all">Tous</option>
                      <option value="7">Sous 7 jours</option>
                      <option value="30">Sous 30 jours</option>
                      <option value="overdue">Échu</option>
                      <option value="unknown">Je ne sais pas</option>
                      <option value="lifetime">Accès à vie</option>
                    </select>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSortMode((prev) => (prev === "category-color" ? "default" : "category-color"))}
                        className={`rounded-md border px-3 py-2 text-sm ${sortMode === "category-color" ? "border-purple-400 bg-purple-50 text-purple-700" : "border-gray-200 text-gray-600"}`}
                        title="Trier par couleur de catégorie"
                      >
                        <i className="fas fa-palette"></i>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSortMode((prev) => (prev === "price-asc" ? "price-desc" : "price-asc"))}
                        className={`rounded-md border px-3 py-2 text-sm ${sortMode === "price-asc" || sortMode === "price-desc" ? "border-purple-400 bg-purple-50 text-purple-700" : "border-gray-200 text-gray-600"}`}
                        title="Trier par prix"
                      >
                        <i className="fas fa-dollar-sign"></i>
                        <span className="ml-1 text-xs">{sortMode === "price-desc" ? "↓" : "↑"}</span>
                      </button>
                    </div>

                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        className="form-checkbox h-4 w-4 text-purple-600"
                        checked={includeArchived}
                        onChange={(e) => setIncludeArchived(e.target.checked)}
                      />
                      Inclure archivés
                    </label>

                    <button
                      onClick={() => {
                        setEditingSubscription(null);
                        setIsAddModalOpen(true);
                      }}
                      className="pigeon-button-primary px-4 py-2 rounded-lg"
                    >
                      <i className="fas fa-plus mr-2"></i>
                      Ajouter
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {isLoading ? (
                  <div className="text-center py-8">
                    <i className="fas fa-spinner fa-spin text-2xl" style={{ color: 'hsl(258, 71%, 65%)' }}></i>
                    <p className="mt-2 text-gray-600">Chargement des abonnements...</p>
                  </div>
                ) : filteredSubscriptions.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-inbox text-4xl text-gray-400 mb-4"></i>
                    <p className="text-gray-600">Aucun abonnement ne correspond à ce filtre</p>
                    <button
                      onClick={() => {
                        setEditingSubscription(null);
                        setIsAddModalOpen(true);
                      }}
                      className="pigeon-button-primary px-4 py-2 rounded-lg mt-4"
                    >
                      Ajouter votre premier abonnement
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sortedSubscriptions.map((subscription) => (
                      <SubscriptionCard
                        key={subscription.id}
                        subscription={subscription}
                        onEdit={(sub) => {
                          setEditingSubscription(sub);
                          setIsAddModalOpen(true);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
            )}
          </div>
        </div>
      </div>

      <AddSubscriptionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingSubscription(null);
        }}
        subscription={editingSubscription || undefined}
      />
    </div>
    </LoginGuard>
  );
}
