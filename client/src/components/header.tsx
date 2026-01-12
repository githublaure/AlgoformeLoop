import React from 'react';
import { useAuth } from './auth-provider';
import { ProfileSettings } from './profile-settings';

export function Header() {
  const { user, isAuthenticated, login, logout } = useAuth();
  const [showProfile, setShowProfile] = React.useState(false);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:h-16 sm:py-0">
          <div className="flex items-center gap-3">
            {/* Cartoon pigeon mascot */}
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center" style={{ backgroundColor: 'hsl(258, 71%, 65%)' }}>
              <img src="/pigeongangsta.png" alt="PigeonSub mascot" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'hsl(258, 71%, 65%)' }}>PigeonSub</h1>
              <p className="text-xs text-gray-500 italic">"Comment être un pigeon... et s'en sortir"</p>
            </div>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-4 sm:justify-end">
            {isAuthenticated ? (
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="text-sm text-gray-600">
                  Bonjour, {user?.name}
                </span>
                {user?.profileImage ? (
                  <img 
                    src={user.profileImage} 
                    alt={user.name} 
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'hsl(258, 71%, 65%)' }}>
                    <span className="text-white text-sm font-medium">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => setShowProfile(true)}
                  className="text-sm px-3 py-2 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <i className="fas fa-user mr-1"></i>
                  Profil
                </button>
                <button
                  onClick={logout}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors px-2 py-2"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <button
                onClick={() => login()}
                className="pigeon-button-primary px-4 py-2 rounded-lg text-sm"
              >
                Se connecter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal pour les paramètres du profil */}
      {showProfile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowProfile(false)}
        >
          <div
            className="bg-white p-6 rounded-lg max-w-md w-full mx-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Paramètres</h2>
              <button
                onClick={() => setShowProfile(false)}
                type="button"
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <ProfileSettings />
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowProfile(false)}
                className="pigeon-button-secondary px-4 py-2 rounded-lg text-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
