
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { Progress } from '@/components/ui/progress';

export default function Demo() {
  const [, setLocation] = useLocation();
  const [activeDemo, setActiveDemo] = useState('overview');

  const pigeonImages = [
    { src: '/pigeon1.png', title: 'Pigeon Élégant', description: 'Expert en gestion financière' },
    { src: '/pigeon2.png', title: 'Pigeon Moderne', description: 'Maître des notifications' },
    { src: '/pigeon3.png', title: 'Pigeon Zen', description: 'Spécialiste de l\'organisation' },
    { src: '/pigeon4.png', title: 'Pigeon Chef', description: 'Leader des statistiques' }
  ];

  // Données de démonstration simulées
  const mockSubscriptions = [
    { name: 'Netflix Premium', price: 15.99, category: 'entertainment', usage: 'very_used', renewsIn: 3, color: 'bg-red-600' },
    { name: 'Spotify Premium', price: 9.99, category: 'music', usage: 'very_used', renewsIn: 12, color: 'bg-green-600' },
    { name: 'Dropbox Plus', price: 9.99, category: 'cloud', usage: 'rarely_used', renewsIn: 25, color: 'bg-blue-500' },
    { name: 'Adobe Creative', price: 22.99, category: 'design', usage: 'very_used', renewsIn: 8, color: 'bg-orange-600' }
  ];

  const totalMonthlyCost = mockSubscriptions.reduce((sum, sub) => sum + sub.price, 0);
  const underusedSubs = mockSubscriptions.filter(sub => sub.usage === 'rarely_used');

  const renderDashboardDemo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Coût Total/Mois</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalMonthlyCost.toFixed(2)}€</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Abonnements Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockSubscriptions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Renouvellements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">2</div>
            <p className="text-xs text-gray-500">dans 7 jours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Économies Potentielles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{underusedSubs.reduce((sum, sub) => sum + sub.price, 0).toFixed(2)}€</div>
            <p className="text-xs text-gray-500">abonnements peu utilisés</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Mes Abonnements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockSubscriptions.map((sub, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full ${sub.color} flex items-center justify-center`}>
                    <span className="text-white text-xs font-bold">{sub.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h4 className="font-medium">{sub.name}</h4>
                    <p className="text-sm text-gray-500">Renouvellement dans {sub.renewsIn} jours</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{sub.price}€</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    sub.usage === 'very_used' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {sub.usage === 'very_used' ? 'Très utilisé' : 'Peu utilisé'}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analyse des Dépenses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Divertissement</span>
                <span>15.99€</span>
              </div>
              <Progress value={28} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Design</span>
                <span>22.99€</span>
              </div>
              <Progress value={40} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Musique</span>
                <span>9.99€</span>
              </div>
              <Progress value={17} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Cloud</span>
                <span>9.99€</span>
              </div>
              <Progress value={17} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderNotificationsDemo = () => (
    <div className="space-y-4">
      <Card className="border-l-4 border-l-orange-500">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <i className="fas fa-exclamation-triangle text-orange-600"></i>
            </div>
            <div>
              <h4 className="font-semibold">Renouvellement dans 3 jours</h4>
              <p className="text-sm text-gray-600">Netflix Premium - 15.99€</p>
              <p className="text-xs text-gray-500">Rappel vocal disponible</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-l-4 border-l-red-500">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <i className="fas fa-chart-line-down text-red-600"></i>
            </div>
            <div>
              <h4 className="font-semibold">Abonnement peu utilisé détecté</h4>
              <p className="text-sm text-gray-600">Dropbox Plus - Économisez 9.99€/mois</p>
              <p className="text-xs text-gray-500">Dernière utilisation: il y a 2 mois</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <i className="fas fa-microphone text-blue-600"></i>
            </div>
            <div>
              <h4 className="font-semibold">Rappel vocal généré</h4>
              <p className="text-sm text-gray-600">Adobe Creative Cloud - Renouvellement le 15 janvier</p>
              <audio controls className="mt-2 w-full">
                <source src="#" type="audio/mpeg" />
                Votre navigateur ne supporte pas l'audio.
              </audio>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* En-tête de la démo */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-4">
            <img src="/pigeongangsta.png" alt="PigeonSub" className="w-16 h-16 mr-4" />
            <h1 className="text-4xl font-bold" style={{ color: 'hsl(258, 71%, 65%)' }}>
              PigeonSub Demo
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-8">
            Découvrez toutes les fonctionnalités de votre gestionnaire d'abonnements
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={() => setLocation('/')}
              className="pigeon-button-primary px-6 py-3 text-lg"
            >
              Commencer maintenant
            </Button>
            <Button 
              variant="outline"
              onClick={() => setLocation('/')}
              className="px-6 py-3 text-lg"
            >
              Se connecter
            </Button>
          </div>
        </div>

        {/* Navigation de la démo */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-2 bg-white rounded-lg p-1 shadow-sm">
            <Button
              variant={activeDemo === 'overview' ? 'default' : 'ghost'}
              onClick={() => setActiveDemo('overview')}
              className="px-4 py-2"
            >
              Tableau de bord
            </Button>
            <Button
              variant={activeDemo === 'notifications' ? 'default' : 'ghost'}
              onClick={() => setActiveDemo('notifications')}
              className="px-4 py-2"
            >
              Notifications
            </Button>
            <Button
              variant={activeDemo === 'team' ? 'default' : 'ghost'}
              onClick={() => setActiveDemo('team')}
              className="px-4 py-2"
            >
              Notre équipe
            </Button>
          </div>
        </div>

        {/* Contenu de la démo */}
        <div className="mb-12">
          {activeDemo === 'overview' && renderDashboardDemo()}
          {activeDemo === 'notifications' && renderNotificationsDemo()}
          {activeDemo === 'team' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {pigeonImages.map((pigeon, index) => (
                <Card key={index} className="hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="w-32 h-32 rounded-full border-4 border-purple-200 overflow-hidden flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
                        <img 
                          src={pigeon.src} 
                          alt={pigeon.title}
                          className="w-28 h-28 object-contain hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    </div>
                    <CardTitle className="text-lg" style={{ color: 'hsl(258, 71%, 65%)' }}>
                      {pigeon.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center">
                      {pigeon.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Section fonctionnalités */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4" 
                   style={{ backgroundColor: 'hsl(258, 71%, 65%)' }}>
                <i className="fas fa-calendar-alt text-white"></i>
              </div>
              <CardTitle>Gestion Intelligente</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Suivez automatiquement tous vos abonnements avec des notifications personnalisées et des analyses d'utilisation.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4" 
                   style={{ backgroundColor: 'hsl(258, 71%, 65%)' }}>
                <i className="fas fa-microphone text-white"></i>
              </div>
              <CardTitle>Rappels Vocaux</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Générez des rappels vocaux personnalisés pour ne jamais oublier un renouvellement important.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4" 
                   style={{ backgroundColor: 'hsl(258, 71%, 65%)' }}>
                <i className="fas fa-piggy-bank text-white"></i>
              </div>
              <CardTitle>Optimisation Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Identifiez les abonnements sous-utilisés et optimisez votre budget avec nos analyses avancées.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Section témoignages */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-8" style={{ color: 'hsl(258, 71%, 65%)' }}>
            Ce que disent nos utilisateurs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <img src="/pigeon1.png" alt="Témoignage" className="w-12 h-12 rounded-full mr-4" />
                  <div>
                    <h4 className="font-semibold">Pierre Pigeon</h4>
                    <p className="text-sm text-gray-500">Économise 120€/mois</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">
                  "Grâce à PigeonSub, j'ai identifié 5 abonnements que j'avais complètement oubliés. Les rappels vocaux sont géniaux !"
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <img src="/pigeon3.png" alt="Témoignage" className="w-12 h-12 rounded-full mr-4" />
                  <div>
                    <h4 className="font-semibold">Marie Colombe</h4>
                    <p className="text-sm text-gray-500">15 abonnements gérés</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">
                  "L'interface est parfaite et les statistiques m'aident vraiment à mieux gérer mon budget. Je recommande à 100% !"
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
