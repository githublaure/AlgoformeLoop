
import React from 'react';

export function CustomBanner() {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-6 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Large pigeon icon */}
          <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center bg-white/20 backdrop-blur-sm">
            <img src="/pigeongangsta.png" alt="PigeonSub mascot" className="w-12 h-12 object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">PigeonSub</h1>
            <p className="text-sm opacity-90">"Comment être un pigeon... et s'en sortir"</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm opacity-75">Gérez vos abonnements intelligemment</p>
        </div>
      </div>
    </div>
  );
}
