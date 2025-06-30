
import React from 'react';
import { useAuth } from './auth-provider';

interface LoginGuardProps {
  children: React.ReactNode;
}

export function LoginGuard({ children }: LoginGuardProps) {
  const { isAuthenticated, isLoading, login } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(210, 17%, 98%)' }}>
        <div className="text-center">
          <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'hsl(258, 71%, 65%)' }}>
            <img src="/pigeongangsta.png" alt="PigeonSub mascot" className="w-16 h-16 object-contain" />
          </div>
          <i className="fas fa-spinner fa-spin text-2xl mb-4" style={{ color: 'hsl(258, 71%, 65%)' }}></i>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(210, 17%, 98%)' }}>
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'hsl(258, 71%, 65%)' }}>
            <img src="/pigeongangsta.png" alt="PigeonSub mascot" className="w-20 h-20 object-contain" />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'hsl(258, 71%, 65%)' }}>
            PigeonSub
          </h1>
          <p className="text-gray-600 mb-8">
            "Comment être un pigeon... et s'en sortir"
          </p>
          <p className="text-gray-700 mb-6">
            Connectez-vous pour gérer vos abonnements intelligemment
          </p>
          <button
            onClick={login}
            className="pigeon-button-primary px-8 py-3 rounded-lg text-lg font-medium"
          >
            <i className="fab fa-github mr-3"></i>
            Se connecter avec Replit
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
