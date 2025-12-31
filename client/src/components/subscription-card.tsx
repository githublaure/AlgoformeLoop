import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { createSubscriptionCalendarEvent, downloadCalendarEvent } from "@/lib/calendar";
import type { Subscription } from "@shared/schema";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Archive, CalendarPlus, Pencil, Trash2 } from "lucide-react";

interface SubscriptionCardProps {
  subscription: Subscription;
  onEdit?: (subscription: Subscription) => void;
}

export function SubscriptionCard({ subscription, onEdit }: SubscriptionCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
        description: "L'abonnement a été supprimé avec succès.",
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

  const archiveSubscription = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", `/api/subscriptions/${subscription.id}` , { isActive: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions/upcoming/7'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Abonnement archivé",
        description: "L'abonnement a été classé dans vos abonnements passés.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'archiver l'abonnement.",
        variant: "destructive",
      });
    }
  });

  const generateReview = useMutation({
    mutationFn: async () => {
      const usageText = subscription.usageFrequency === 'very_used' ? 'très utilisé' :
                      subscription.usageFrequency === 'used' ? 'utilisé régulièrement' :
                      'peu utilisé';

      const numericPrice = Number(subscription.price);
      const priceDisplay = Number.isFinite(numericPrice)
        ? numericPrice.toFixed(2)
        : subscription.price;

      const text = `${subscription.name} coûte ${priceDisplay} euros par ${subscription.frequency === 'monthly' ? 'mois' : 'an'}. Ce service est ${usageText}. Le prochain renouvellement est prévu le ${format(new Date(subscription.nextRenewal), "d MMMM yyyy", { locale: fr })}.`;
      
      const response = await apiRequest("POST", "/api/voice/generate", {
        subscriptionId: subscription.id,
        reminderType: "subscription_review",
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
        title: "Revue vocale générée!",
        description: `La revue de ${subscription.name} est en cours de lecture.`,
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de générer la revue vocale.",
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
        return 'Rarement utilisé';
      default:
        return 'Utilisé';
    }
  };

  const renderRating = () => {
    const rating = subscription.rating ?? 0;
    if (!rating) return null;

    return (
      <div className="mt-2 flex items-center gap-1 text-sm">
        {[1, 2, 3, 4, 5].map((star) => (
          <i
            key={star}
            className={`fas fa-star ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            aria-hidden="true"
          ></i>
        ))}
        <span className="ml-2 text-gray-600">{rating}/5</span>
      </div>
    );
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      entertainment: "Divertissement",
      music: "Musique",
      productivity: "Productivité",
      design: "Design",
      cloud: "Cloud",
      other: "Autre"
    };
    return categories[category] || category;
  };

  const isHexColor = subscription.bgColor?.startsWith('#');

  const iconColor = subscription.categoryColor || subscription.bgColor;
  const iconClass = 'fas fa-dove';

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isHexColor ? '' : subscription.bgColor || 'bg-gray-600'
            }`}
            style={isHexColor ? { backgroundColor: subscription.bgColor } : undefined}
          >
            <i className={`${subscription.iconClass || 'fas fa-dove'} text-white`}></i>
          </div>
          <div>
            <h3 className="font-medium">{subscription.name}</h3>
            <p className="text-sm text-gray-600">{getCategoryLabel(subscription.category)}</p>
            {(subscription.isTrial || subscription.isSuspect) && (
              <div className="mt-1 flex flex-wrap gap-2 text-xs">
                {subscription.isTrial && (
                  <span className="rounded-full bg-yellow-100 px-3 py-1 text-yellow-700">
                    Essai gratuit
                  </span>
                )}
                {subscription.isSuspect && (
                  <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">
                    Risque d'arnaque
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => generateReview.mutate()}
          disabled={generateReview.isPending}
          className="text-gray-400 hover:opacity-70 transition-opacity disabled:opacity-50"
          style={{ color: generateReview.isPending ? 'hsl(42, 96%, 70%)' : 'hsl(258, 71%, 65%)' }}
        >
          {generateReview.isPending ? (
            <i className="fas fa-spinner fa-spin"></i>
          ) : (
            <i className="fas fa-volume-up"></i>
          )}
        </button>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <span className="text-lg font-semibold">
            €{Number.isFinite(Number(subscription.price))
              ? Number(subscription.price).toFixed(2)
              : subscription.price}
          </span>
          <span className="text-sm text-gray-600">/{subscription.frequency === 'monthly' ? 'mois' : 'an'}</span>
        </div>
        <span className={getUsageBadgeClass(subscription.usageFrequency)}>
          {getUsageLabel(subscription.usageFrequency)}
        </span>
      </div>
      
      <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
        <span>Prochain: {format(new Date(subscription.nextRenewal), "d MMM", { locale: fr })}</span>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit?.(subscription)}
            className="hover:opacity-70 transition-opacity"
            style={{ color: 'hsl(258, 71%, 65%)' }}
          >
            <i className="fas fa-edit"></i>
          </button>
          <button
            onClick={() => deleteSubscription.mutate(subscription.id)}
            disabled={deleteSubscription.isPending}
            className="hover:opacity-70 transition-opacity disabled:opacity-50 text-red-500"
            aria-label={`Supprimer ${subscription.name}`}
          >
            {deleteSubscription.isPending ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <Trash2 className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
      {renderRating()}
      {subscription.note && (
        <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
          <span className="font-medium">Note :</span> {subscription.note}
        </div>
      )}
    </div>
  );
}
