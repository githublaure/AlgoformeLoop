import React from 'react';
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { LoginGuard } from "@/components/login-guard";
import { VoiceControls } from "@/components/voice-controls";
import { AddSubscriptionModal } from "@/components/add-subscription-modal";
import { PaywallGate } from "@/components/paywall-gate";
import { useQuery } from "@tanstack/react-query";
import type { VoiceReminder, Subscription } from "@shared/schema";
import { useState } from "react";

export default function VoiceRemindersPage() {
  const { data: reminders = [] } = useQuery<VoiceReminder[]>({ queryKey: ["/api/voice/reminders"] });
  const { data: subscriptions = [] } = useQuery<Subscription[]>({ queryKey: ["/api/subscriptions"] });
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);

  const playAudio = (audioUrl: string) => {
    if (currentAudio) {
      currentAudio.pause();
    }
    const audio = new Audio(audioUrl);
    setCurrentAudio(audio);
    audio.play().catch(() => {});
  };

  const withSubscriptionName = reminders.map((reminder) => ({
    ...reminder,
    subscriptionName: subscriptions.find((s) => s.id === reminder.subscriptionId)?.name,
  }));

  return (
    <LoginGuard>
      <div className="min-h-screen" style={{ backgroundColor: "hsl(210, 17%, 98%)" }}>
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <Sidebar
                onAddSubscription={() => {
                  setEditingSubscription(null);
                  setIsAddModalOpen(true);
                }}
              />
            </div>

            <div className="lg:col-span-3 space-y-8">
              <div>
                <p className="text-sm text-gray-600">Rappels générés</p>
                <h1 className="text-2xl font-semibold">Rappels vocaux</h1>
              </div>

              <PaywallGate
                feature="Rappels vocaux IA"
                description="Les rappels vocaux par IA (ElevenLabs) sont réservés aux abonnés Pigeon Pro."
                highlights={[
                  "Voix IA naturelle (Pierre Pigeon & Marie Colombe)",
                  "Rappels de renouvellement personnalisés",
                  "Bilan mensuel audio automatique",
                  "Alertes essais gratuits"
                ]}
              >
              <VoiceControls />

              <div className="pigeon-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <i className="fas fa-bell" style={{ color: "hsl(258, 71%, 65%)" }}></i>
                    Historique des rappels
                  </h2>
                  <span className="text-sm text-gray-600">{reminders.length} rappel(s)</span>
                </div>
                {reminders.length === 0 ? (
                  <p className="text-gray-600 text-sm">Aucun rappel vocal généré pour l'instant.</p>
                ) : (
                  <div className="space-y-3">
                    {withSubscriptionName.map((reminder) => (
                      <div key={reminder.id} className="border rounded-lg p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium capitalize">{reminder.reminderType.replace("_", " ")}</p>
                          <p className="text-xs text-gray-600">
                            {reminder.subscriptionName ? `Abonnement: ${reminder.subscriptionName}` : "Général"}
                          </p>
                          {reminder.createdAt && (
                            <p className="text-xs text-gray-500">
                              {new Date(reminder.createdAt as unknown as string).toLocaleString("fr-FR")}
                            </p>
                          )}
                        </div>
                        {reminder.audioUrl && (
                          <button
                            onClick={() => playAudio(reminder.audioUrl as string)}
                            className="pigeon-button-secondary px-3 py-1 rounded-lg text-sm"
                          >
                            Écouter
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              </PaywallGate>
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

    </LoginGuard>
  );
}
