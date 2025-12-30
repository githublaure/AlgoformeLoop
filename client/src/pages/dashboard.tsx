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

export default function Dashboard() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [ratingFilter, setRatingFilter] = useState<string>("all");

  const { data: subscriptions = [], isLoading } = useQuery<Subscription[]>({
    queryKey: ['/api/subscriptions'],
  });

  const trials = subscriptions.filter((subscription) => subscription.isTrial);
  const suspects = subscriptions.filter((subscription) => subscription.isSuspect);
  const filteredSubscriptions = subscriptions.filter((subscription) => {
    if (ratingFilter === "all") return true;
    const ratingValue = Number(ratingFilter);
    return (subscription.rating ?? 0) >= ratingValue;
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
            <StatsOverview />

            <UpcomingRenewals />

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
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-600">Filtrer par note</label>
                    <select
                      className="rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
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
          </div>
        </div>
      </div>

      <AddSubscriptionModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        subscription={editingSubscription}
      />
    </div>
    </LoginGuard>
  );
}