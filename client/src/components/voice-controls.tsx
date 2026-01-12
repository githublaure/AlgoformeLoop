import React, { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Subscription } from "@shared/schema";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface VoiceRequestPayload {
  text: string;
  reminderType: string;
  subscriptionId?: number;
}

export function VoiceControls() {
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [lastAlert, setLastAlert] = useState<{ title: string; subtitle: string } | null>(null);
  const { toast } = useToast();

  const { data: subscriptions = [] } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions"],
  });

  const { data: upcomingRenewals = [] } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions/upcoming/7"],
  });

  const nextRenewal = useMemo(() => {
    return upcomingRenewals[0];
  }, [upcomingRenewals]);

  const speakFallback = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return true;
  };

  const generateVoiceMutation = useMutation({
    mutationFn: async ({ text, reminderType, subscriptionId }: VoiceRequestPayload) => {
      const response = await apiRequest("POST", "/api/voice/generate", {
        subscriptionId,
        reminderType,
        text
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      if (data.audioUrl && data.audioUrl.startsWith('data:audio')) {
        playAudio(data.audioUrl);
      } else if (!speakFallback(variables.text)) {
        toast({
          title: "Erreur de lecture",
          description: "Impossible de lire le rappel vocal.",
          variant: "destructive",
        });
        return;
      }

      if (variables.reminderType === "renewal_alert" && nextRenewal?.nextRenewal) {
        const renewalDate = format(new Date(nextRenewal.nextRenewal), "EEEE d MMMM", { locale: fr });
        setLastAlert({ title: nextRenewal.name, subtitle: `Renouvellement ${renewalDate}` });
      } else {
        setLastAlert({ title: "Rappel vocal généré", subtitle: variables.reminderType });
      }

      toast({
        title: "Rappel vocal généré!",
        description: "Votre rappel vocal est prêt à être lu.",
      });
    },
    onError: (error, variables) => {
      const fallbackWorked = speakFallback(variables.text);

      toast({
        title: "Erreur",
        description: fallbackWorked
          ? "Clé ElevenLabs manquante. Utilisation de la voix locale du navigateur."
          : "Impossible de générer le rappel vocal. Vérifiez votre clé API ElevenLabs.",
        variant: fallbackWorked ? "default" : "destructive",
      });
    }
  });

  const playAudio = (audioUrl: string) => {
    if (currentAudio) {
      currentAudio.pause();
    }
    
    const audio = new Audio(audioUrl);
    setCurrentAudio(audio);
    audio.play().catch(() => {
      toast({
        title: "Erreur de lecture",
        description: "Impossible de lire le fichier audio.",
        variant: "destructive",
      });
    });
  };

  const handleMonthlyReview = () => {
    const totalMonthly = subscriptions.reduce((sum, sub) => {
      const price = parseFloat(String(sub.price));
      if (sub.frequency === "yearly") {
        return sum + price / 12;
      }
      return sum + price;
    }, 0);

    const text = `Voici votre revue des abonnements. Vous avez ${subscriptions.length} abonnement${subscriptions.length > 1 ? 's' : ''} actifs pour un total mensuel de ${totalMonthly.toFixed(2)} euros.`;
    generateVoiceMutation.mutate({ text, reminderType: "monthly_review" });
  };

  const handleUpcomingReminders = () => {
    if (!nextRenewal?.nextRenewal) {
      toast({
        title: "Aucun renouvellement",
        description: "Aucun abonnement ne se renouvelle dans les prochains jours.",
      });
      return;
    }

    const renewalDate = format(new Date(nextRenewal.nextRenewal), "EEEE d MMMM", { locale: fr });
    const text = `Attention ! ${nextRenewal.name} se renouvelle ${renewalDate} pour ${nextRenewal.price} euros par ${nextRenewal.frequency === 'monthly' ? 'mois' : 'an'}.`;
    generateVoiceMutation.mutate({ text, reminderType: "upcoming_reminders", subscriptionId: nextRenewal.id });
  };

  const handleLastAlert = () => {
    if (!lastAlert && !nextRenewal) {
      toast({
        title: "Aucun rappel disponible",
        description: "Générez d'abord un rappel de renouvellement.",
      });
      return;
    }

    const target = lastAlert || (nextRenewal?.nextRenewal
      ? {
          title: nextRenewal.name,
          subtitle: `Renouvellement ${format(new Date(nextRenewal.nextRenewal), "EEEE d MMMM", { locale: fr })}`
        }
      : null);

    if (!target) return;

    const text = `${target.title} - ${target.subtitle}`;
    generateVoiceMutation.mutate({ text, reminderType: "last_alert", subscriptionId: nextRenewal?.id });
  };

  return (
    <div className="pigeon-card p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <i className="fas fa-microphone mr-2" style={{ color: 'hsl(258, 71%, 65%)' }}></i>
        Contrôles Vocaux
      </h3>
      <div className="space-y-4">
        <button 
          onClick={handleMonthlyReview}
          disabled={generateVoiceMutation.isPending}
          className="w-full pigeon-button-primary py-2 px-4 rounded-lg disabled:opacity-50"
        >
          {generateVoiceMutation.isPending ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Génération...
            </>
          ) : (
            <>
              <i className="fas fa-play mr-2"></i>
              Revue mensuelle
            </>
          )}
        </button>
        <button 
          onClick={handleUpcomingReminders}
          disabled={generateVoiceMutation.isPending}
          className="w-full pigeon-button-secondary py-2 px-4 rounded-lg disabled:opacity-50"
        >
          <i className="fas fa-calendar mr-2"></i>
          Prochains rappels
        </button>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Dernière alerte vocale:</p>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleLastAlert}
              disabled={generateVoiceMutation.isPending}
              className="hover:opacity-70 transition-opacity"
              style={{ color: 'hsl(258, 71%, 65%)' }}
            >
              <i className="fas fa-play-circle"></i>
            </button>
            <div className="text-sm text-gray-800">
              {lastAlert ? (
                <>
                  <div className="font-medium">{lastAlert.title}</div>
                  <div className="text-gray-600">{lastAlert.subtitle}</div>
                </>
              ) : nextRenewal?.nextRenewal ? (
                <>
                  <div className="font-medium">{nextRenewal.name}</div>
                  <div className="text-gray-600">
                    Renouvellement {format(new Date(nextRenewal.nextRenewal), "EEEE d MMMM", { locale: fr })}
                  </div>
                </>
              ) : (
                <div className="text-gray-600">Aucun rappel généré pour l'instant.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
