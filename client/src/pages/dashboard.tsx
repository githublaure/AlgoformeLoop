import React from 'react'
import { Header } from "../components/header";
import { Sidebar } from "../components/sidebar";
import { StatsOverview } from "../components/stats-overview";
import { UpcomingRenewals } from "../components/upcoming-renewals";
import { SubscriptionCard } from "../components/subscription-card";
import { AddSubscriptionModal } from "../components/add-subscription-modal";
import { LoginGuard } from "../components/login-guard";
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

  const [includeArchived, setIncludeArchived] = useState<boolean>(false);
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

  const filteredSubscriptions = subscriptions.filter((subscription) => {
    if (!includeArchived && !subscription.isActive) return false;

    // Rating filter
    if (ratingFilter !== "all") {
      const ratingValue = Number(ratingFilter);
      if ((subscription.rating ?? 0) < ratingValue) return false;
    }

    // Pigeon filter: all | pigeon | not-pigeon (basé sur la note)
    if (pigeonFilter === 'pigeon' && !isPigeoned(subscription)) return false;
    if (pigeonFilter === 'not-pigeon' && isPigeoned(subscription)) return false;

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
            <div id="statistiques">
              <StatsOverview />
            </div>

            <UpcomingRenewals onEdit={(selected) => {
              setEditingSubscription(selected);
              setIsAddModalOpen(true);
            }} />

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
                    {filteredSubscriptions.map((subscription) => (
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
