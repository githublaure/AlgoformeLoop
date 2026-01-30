
import React from 'react';
import { useAuth } from './auth-provider';

export function CustomBanner() {
  const { user } = useAuth();
  const userName = user?.name || 'Invité';

  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-6 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 min-w-[3.5rem] shrink-0 aspect-square rounded-full overflow-hidden flex items-center justify-center bg-white/20 backdrop-blur-sm sm:h-16 sm:w-16 sm:min-w-[4rem]">
            <img
              src="/pigeon2.png"
              alt="Pigeon qui fait une pirouette"
              className="h-11 w-11 object-contain animate-[spin_6s_linear_infinite] sm:h-12 sm:w-12"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{userName}</h1>
            <p className="text-sm opacity-90">Bienvenue sur PigeonSub</p>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-sm opacity-75">Gérez vos abonnements intelligemment</p>
        </div>
      </div>
    </div>
  );
}
