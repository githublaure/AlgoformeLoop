import { VoiceControls } from "./voice-controls";

export function Sidebar() {
  return (
    <div className="space-y-8">
      <nav className="space-y-2">
        <a href="#" className="flex items-center space-x-3 px-4 py-3 text-white rounded-lg pigeon-button-primary">
          <i className="fas fa-tachometer-alt"></i>
          <span>Tableau de bord</span>
        </a>
        <a href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <i className="fas fa-plus"></i>
          <span>Ajouter un abonnement</span>
        </a>
        <a href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <i className="fas fa-calendar-alt"></i>
          <span>Essais gratuits</span>
        </a>
        <a href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <i className="fas fa-chart-pie"></i>
          <span>Statistiques</span>
        </a>
        <a href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <i className="fas fa-microphone"></i>
          <span>Rappels vocaux</span>
        </a>
      </nav>
      
      <VoiceControls />
    </div>
  );
}
