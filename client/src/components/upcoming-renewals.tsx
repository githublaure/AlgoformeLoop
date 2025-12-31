import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Subscription } from "@shared/schema";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface UpcomingRenewalsProps {
  onEdit?: (subscription: Subscription) => void;
}

export function UpcomingRenewals({ onEdit }: UpcomingRenewalsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: renewals = [], isLoading } = useQuery<Subscription[]>({
    queryKey: ['/api/subscriptions/upcoming/7'],
  });

  const generateRenewalAlert = useMutation({
    mutationFn: async ({ subscription }: { subscription: Subscription }) => {
      const renewalDate = format(new Date(subscription.nextRenewal), "EEEE d MMMM", { locale: fr });
      const text = `Attention ! ${subscription.name} se renouvelle ${renewalDate} pour ${subscription.price} euros par ${subscription.frequency === 'monthly' ? 'mois' : 'an'}.`;
      
      const response = await apiRequest("POST", "/api/voice/generate", {
        subscriptionId: subscription.id,
        reminderType: "renewal_alert",
        text
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.audioUrl && data.audioUrl.startsWith('data:audio')) {
        const audio = new Audio(data.audioUrl);
        audio.play().catch(() => {
          toast({
            title: "Erreur de lecture",
            description: "Impossible de lire le fichier audio.",
            variant: "destructive",
          });
        });
      }
      toast({
        title: "Rappel vocal généré!",
        description: "L'alerte de renouvellement est en cours de lecture.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de générer l'alerte vocale.",
        variant: "destructive",
      });
    }
  });

  const getUsageBadgeClass = (usage: string) => {
    switch (usage) {
      case 'very_used':
        return 'pigeon-badge-very-used';
      case 'used':
        return 'pigeon-badge-used';
      case 'rarely_used':
        return 'pigeon-badge-rarely-used';
      default:
        return 'pigeon-badge-used';
    }
  };

  const getUsageLabel = (usage: string) => {
    switch (usage) {
      case 'very_used':
        return 'Très utilisé';
      case 'used':
        return 'Utilisé';
      case 'rarely_used':
        return 'Peu utilisé';
      default:
        return 'Utilisé';
    }
  };

  const iconClass = 'fas fa-dove';

  const deleteSubscription = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/subscriptions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions/upcoming/7'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Abonnement supprimé",
        description: "Le renouvellement a été retiré de la liste.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'abonnement.",
        variant: "destructive",
      });
    }
  });

  const formatRenewalDate = (date: Date) => {
    const now = new Date();
    const renewal = new Date(date);
    const diffTime = renewal.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays === 1) return 'Demain';
    return `Dans ${diffDays} jours`;
  };

  if (isLoading) {
    return (
      <div className="pigeon-card mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold flex items-center">
            <i className="fas fa-calendar-check mr-2" style={{ color: 'hsl(258, 71%, 65%)' }}></i>
            Prochains renouvellements
          </h2>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pigeon-card mb-8">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold flex items-center">
          <i className="fas fa-calendar-check mr-2" style={{ color: 'hsl(258, 71%, 65%)' }}></i>
          Prochains renouvellements
        </h2>
      </div>
      <div className="p-6">
        {renewals.length === 0 ? (
          <p className="text-gray-600 text-center py-4">Aucun renouvellement prévu dans les 7 prochains jours</p>
        ) : (
          <div className="space-y-4">
            {renewals.map((subscription) => {
              const daysUntil = Math.ceil((new Date(subscription.nextRenewal).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              const { backgroundColor, borderColor, urgencyBadge } = getRenewalStyles(subscription, daysUntil);

              return (
                <div
                  key={subscription.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                  style={{ backgroundColor, borderColor }}
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${subscription.categoryColor ? '' : 'bg-gray-600'}`}
                      style={{ backgroundColor: subscription.categoryColor || subscription.bgColor || undefined }}
                    >
                      <i className={`${iconClass} text-white`}></i>
                    </div>
                    <div>
                      <h3 className="font-medium">{subscription.name}</h3>
                      <p className="text-sm text-gray-600">
                        {formatRenewalDate(subscription.nextRenewal)} • €{subscription.price}/{subscription.frequency === 'monthly' ? 'mois' : 'an'}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs items-center">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 ${urgencyBadge.className}`}>
                          {urgencyBadge.text}
                        </span>
                        {subscription.isSuspect && (
                          <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">Suspect</span>
                        )}
                        {subscription.isTrial && (
                          <span className="rounded-full bg-yellow-100 px-3 py-1 text-yellow-700">
                            Essai gratuit
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={getUsageBadgeClass(subscription.usageFrequency)}>
                      {getUsageLabel(subscription.usageFrequency)}
                    </span>
                    <button
                      onClick={() => generateRenewalAlert.mutate({ subscription })}
                      disabled={generateRenewalAlert.isPending}
                      className="hover:opacity-70 transition-opacity disabled:opacity-50"
                      style={{ color: 'hsl(258, 71%, 65%)' }}
                    >
                      {generateRenewalAlert.isPending ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fas fa-volume-up"></i>
                      )}
                    </button>
                    {onEdit && (
                      <button
                        onClick={() => onEdit(subscription)}
                        className="hover:opacity-70 transition-opacity"
                        style={{ color: 'hsl(258, 71%, 65%)' }}
                        aria-label={`Modifier ${subscription.name}`}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                    )}
                    <button
                      onClick={() => deleteSubscription.mutate(subscription.id)}
                      className="hover:opacity-70 transition-opacity disabled:opacity-50"
                      style={{ color: 'hsl(10, 72%, 61%)' }}
                      disabled={deleteSubscription.isPending}
                      aria-label={`Supprimer ${subscription.name}`}
                    >
                      {deleteSubscription.isPending ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-trash"></i>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
