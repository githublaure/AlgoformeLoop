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

  const { data: subscriptions = [], isLoading } = useQuery<Subscription[]>({
    queryKey: ['/api/subscriptions'],
  });

  return (
    <LoginGuard>
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(210, 17%, 98%)' }}>
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Sidebar onAddSubscription={() => setIsAddModalOpen(true)} />
          </div>

          <div className="lg:col-span-3">
            <StatsOverview />

            <UpcomingRenewals />

            {/* All Subscriptions */}
            <div className="pigeon-card">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Tous les abonnements</h2>
                  <button 
                    onClick={() => setIsAddModalOpen(true)}
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
                    <p className="mt-2 text-gray-600">Chargement des abonnements...</p>
                  </div>
                ) : subscriptions.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-inbox text-4xl text-gray-400 mb-4"></i>
                    <p className="text-gray-600">Aucun abonnement trouvé</p>
                    <button 
                      onClick={() => setIsAddModalOpen(true)}
                      className="pigeon-button-primary px-4 py-2 rounded-lg mt-4"
                    >
                      Ajouter votre premier abonnement
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {subscriptions.map((subscription) => (
                      <SubscriptionCard key={subscription.id} subscription={subscription} />
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
        onClose={() => setIsAddModalOpen(false)} 
      />
    </div>
    </LoginGuard>
  );
}