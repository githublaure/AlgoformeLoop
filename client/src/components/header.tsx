import { useAuth } from './auth-provider';

export function Header() {
  const { user, isAuthenticated, login, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            {/* Cartoon pigeon mascot */}
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center" style={{ backgroundColor: 'hsl(258, 71%, 65%)' }}>
              <img src="/pigeongangsta.png" alt="PigeonSub mascot" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'hsl(258, 71%, 65%)' }}>PigeonSub</h1>
              <p className="text-xs text-gray-500 italic">"Comment être un pigeon... et s'en sortir"</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <i className="fas fa-volume-up" style={{ color: 'hsl(258, 71%, 65%)' }}></i>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <i className="fas fa-bell text-gray-400"></i>
            </button>
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">Bonjour, {user?.name}</span>
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
                  onClick={logout}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <button
                onClick={login}
                className="pigeon-button-primary px-4 py-2 rounded-lg text-sm"
              >
                Se connecter
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
