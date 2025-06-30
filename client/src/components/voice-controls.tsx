import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function VoiceControls() {
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const generateVoiceMutation = useMutation({
    mutationFn: async ({ text, reminderType }: { text: string; reminderType: string }) => {
      const response = await apiRequest("POST", "/api/voice/generate", {
        subscriptionId: 1, // Default for general reminders
        reminderType,
        text
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.audioUrl && data.audioUrl.startsWith('data:audio')) {
        playAudio(data.audioUrl);
      }
      toast({
        title: "Rappel vocal généré!",
        description: "Votre rappel vocal est prêt à être lu.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de générer le rappel vocal. Vérifiez votre clé API ElevenLabs.",
        variant: "destructive",
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
    const text = "Voici votre revue mensuelle des abonnements. Vous avez 12 abonnements actifs pour un total de 127 euros 42 par mois.";
    generateVoiceMutation.mutate({ text, reminderType: "monthly_review" });
  };

  const handleUpcomingReminders = () => {
    const text = "Attention ! Netflix Premium se renouvelle demain pour 15 euros 99. Dropbox Plus se renouvelle dans 3 jours pour 9 euros 99.";
    generateVoiceMutation.mutate({ text, reminderType: "upcoming_reminders" });
  };

  const handleLastAlert = () => {
    const text = "Dernier rappel : Netflix Premium se renouvelle demain pour 15 euros 99. N'oubliez pas de vérifier votre utilisation.";
    generateVoiceMutation.mutate({ text, reminderType: "last_alert" });
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
            <span className="text-sm">Netflix - Renouvellement demain</span>
          </div>
        </div>
      </div>
    </div>
  );
}
