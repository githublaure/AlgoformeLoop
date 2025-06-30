export function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            {/* Cartoon pigeon mascot placeholder */}
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'hsl(258, 71%, 65%)' }}>
              <i className="fas fa-dove text-white"></i>
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
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'hsl(258, 71%, 65%)' }}>
              <span className="text-white text-sm font-medium">U</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
