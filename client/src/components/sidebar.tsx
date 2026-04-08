import React from "react";
import { Link, useLocation } from "wouter";
import { VoiceControls } from "./voice-controls";

interface SidebarProps {
  onAddSubscription?: () => void;
}

export function Sidebar({ onAddSubscription }: SidebarProps) {
  const [location] = useLocation();

  const linkClass = (path: string) =>
    `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
      location === path
        ? "text-white pigeon-button-primary"
        : "text-gray-600 hover:bg-gray-100"
    }`;

  return (
    <div className="space-y-8 relative z-20">
      <nav className="space-y-2">
        <Link href="/">
          <a className={linkClass("/")}>
            <i className="fas fa-tachometer-alt"></i>
            <span>Tableau de bord</span>
          </a>
        </Link>
        <button
          type="button"
          onClick={onAddSubscription}
          className="w-full text-left flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <i className="fas fa-plus"></i>
          <span>Ajouter un abonnement</span>
        </button>
        <button
          type="button"
          onClick={() => {
            // Navigate to the dashboard and scroll to the trials section
            // Use a small timeout to allow route change to complete
            const tryScroll = () => {
              const el = document.getElementById('essais-gratuits');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
                return true;
              }
              return false;
            };

            // If we're already on the dashboard, just scroll
            if (location === '/') {
              tryScroll();
              return;
            }

            // Otherwise navigate to '/' and attempt to scroll shortly after
            (window as any).location = '/#essais-gratuits';
            setTimeout(tryScroll, 300);
          }}
          className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <i className="fas fa-calendar-alt"></i>
          <span>Essais gratuits</span>
        </button>
        <Link href="/stats">
          <a className={linkClass("/stats")}>
            <i className="fas fa-chart-pie"></i>
            <span>Statistiques</span>
          </a>
        </Link>
        <Link href="/voice-reminders">
          <a className={linkClass("/voice-reminders")}>
            <i className="fas fa-microphone"></i>
            <span>Rappels vocaux</span>
          </a>
        </Link>
        <Link href="/pricing">
          <a className={linkClass("/pricing")}>
            <i className="fas fa-credit-card"></i>
            <span>Tarifs & Abonnement</span>
          </a>
        </Link>
      </nav>

      <VoiceControls />
    </div>
  );
}
