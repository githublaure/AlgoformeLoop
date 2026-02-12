import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Subscription } from "@shared/schema";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { createSubscriptionCalendarEvent, downloadCalendarEvent } from "@/lib/calendar";
import { getFrequencySuffix, getPriceSuffix, isPigeoned } from "@shared/subscription-utils";
import { Switch } from "@/components/ui/switch";

interface UpcomingRenewalsProps {
  onEdit?: (subscription: Subscription) => void;
}

export function UpcomingRenewals({ onEdit }: UpcomingRenewalsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: renewals = [], isLoading } = useQuery<Subscription[]>({
    queryKey: ['/api/subscriptions/upcoming/7'],
  });

  const getReminderDate = (subscription: Subscription) =>
    subscription.useSafetyDate && subscription.safetyDate ? subscription.safetyDate : subscription.nextRenewal;

  const generateRenewalAlert = useMutation({
    mutationFn: async ({ subscription }: { subscription: Subscription }) => {
      const reminderDate = getReminderDate(subscription);
      if (!reminderDate) {
        throw new Error("Date de rappel inconnue");
      }
      const renewalDate = format(new Date(reminderDate), "EEEE d MMMM", { locale: fr });
      const text = `Attention ! ${subscription.name} se renouvelle ${renewalDate} pour ${subscription.price} euros ${getFrequencySuffix(subscription.frequency)}.`;
      
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

  const handleAddToCalendar = (subscription: Subscription) => {
    const reminderDate = getReminderDate(subscription);
    if (!reminderDate) {
      toast({
        title: "Date inconnue",
        description: "Ajoutez une date de renouvellement ou de sûreté pour exporter.",
        variant: "destructive",
      });
      return;
    }
    try {
      const icsContent = createSubscriptionCalendarEvent({ ...subscription, nextRenewal: reminderDate });
      downloadCalendarEvent(`renouvellement-${subscription.name}.ics`, icsContent);
      toast({
        title: "Rappel ajouté au calendrier",
        description: `${subscription.name} a été exporté en événement .ics`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer l'événement calendrier.",
        variant: "destructive",
      });
    }
  };

  const getRenewalStyles = (subscription: Subscription, daysUntil: number) => {
    const baseColor = subscription.categoryColor || subscription.bgColor || '#f8fafc';
    let backgroundColor = baseColor;
    let borderColor = '#e5e7eb';

    const urgencyBadge = {
      text: daysUntil > 1 ? `Dans ${daysUntil} jours` : daysUntil === 1 ? 'Demain' : "Aujourd'hui",
      className: 'bg-green-100 text-green-700',
    };

    if (daysUntil <= 0) {
      backgroundColor = '#fef2f2';
      borderColor = '#ef4444';
      urgencyBadge.className = 'bg-red-100 text-red-700';
    } else if (daysUntil <= 3) {
      backgroundColor = '#fff7ed';
      borderColor = '#fb923c';
      urgencyBadge.className = 'bg-orange-100 text-orange-700';
    }

    return { backgroundColor, borderColor, urgencyBadge };
  };


  const updateReminderMode = useMutation({
    mutationFn: async ({ id, useSafetyDate }: { id: number; useSafetyDate: boolean }) => {
      await apiRequest("PUT", `/api/subscriptions/${id}`, { useSafetyDate });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions/upcoming/7'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
  });

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

  const formatRenewalDate = (date: Date | null) => {
    if (!date) return "Date inconnue";
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
              const reminderDate = getReminderDate(subscription);
              if (!reminderDate) return null;
              const daysUntil = Math.ceil((new Date(reminderDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              const { backgroundColor, borderColor, urgencyBadge } = getRenewalStyles(subscription, daysUntil);
              const flaggedSuspect = subscription.isSuspect ?? false;
              const ratedPigeoned = isPigeoned(subscription);

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
                      <div className="flex items-center">
                        <h3 className="font-medium">{subscription.name}</h3>
                        {(flaggedSuspect || ratedPigeoned) && (
                          <div className="ml-2 flex items-center space-x-1">
                            {flaggedSuspect && (
                              <img
                                src="/pigeon3.png"
                                alt="Abonnement suspect"
                                role="img"
                                aria-label="pigeon-suspect"
                                className="w-6 h-6"
                              />
                            )}
                            {ratedPigeoned && (
                              <img
                                src="/pigeon2.png"
                                alt="Abonnement pigeonné"
                                role="img"
                                aria-label="pigeon-pigeonned"
                                className="w-6 h-6"
                              />
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {formatRenewalDate(reminderDate)} • €{subscription.price}{getPriceSuffix(subscription.frequency)}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs items-center">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 ${urgencyBadge.className}`}>
                          {urgencyBadge.text}
                        </span>
                        {flaggedSuspect && (
                          <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">Suspect</span>
                        )}
                        {ratedPigeoned && (
                          <span className="rounded-full bg-orange-100 px-3 py-1 text-orange-700">Pigeonné</span>
                        )}
                        {subscription.useSafetyDate && subscription.safetyDate && (
                          <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">
                            Rappel sur date de sûreté
                          </span>
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
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span>Date de sûreté</span>
                      <Switch
                        checked={Boolean(subscription.useSafetyDate)}
                        disabled={!subscription.safetyDate || updateReminderMode.isPending}
                        onCheckedChange={(checked) =>
                          updateReminderMode.mutate({ id: subscription.id, useSafetyDate: checked })
                        }
                      />
                    </div>
                    <button
                      onClick={() => handleAddToCalendar(subscription)}
                      className="hover:opacity-70 transition-opacity"
                      style={{ color: 'hsl(42, 96%, 70%)' }}
                      aria-label={`Ajouter ${subscription.name} au calendrier`}
                    >
                      <i className="fas fa-calendar-plus"></i>
                    </button>
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
