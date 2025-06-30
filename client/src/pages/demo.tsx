
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

export default function Demo() {
  const [, setLocation] = useLocation();

  const pigeonImages = [
    { src: '/pigeon1.png', title: 'Pigeon Élégant', description: 'Un pigeon sophistiqué qui sait gérer ses abonnements' },
    { src: '/pigeon2.png', title: 'Pigeon Moderne', description: 'Toujours à la pointe de la technologie' },
    { src: '/pigeon3.png', title: 'Pigeon Zen', description: 'Sérénité et organisation parfaite' },
    { src: '/pigeon4.png', title: 'Pigeon Chef', description: 'Le leader des pigeons organisés' }
  ];

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
            "Comment être un pigeon... et s'en sortir"
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={() => setLocation('/')}
              className="pigeon-button-primary px-6 py-3 text-lg"
            >
              Retour au tableau de bord
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.location.reload()}
              className="px-6 py-3 text-lg"
            >
              Se connecter
            </Button>
          </div>
        </div>

        {/* Galerie des pigeons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
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

        {/* Section fonctionnalités */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4" 
                   style={{ backgroundColor: 'hsl(258, 71%, 65%)' }}>
                <i className="fas fa-calendar-alt text-white"></i>
              </div>
              <CardTitle>Gestion des Abonnements</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Suivez tous vos abonnements en un seul endroit. Ne ratez plus jamais un renouvellement !
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4" 
                   style={{ backgroundColor: 'hsl(258, 71%, 65%)' }}>
                <i className="fas fa-chart-bar text-white"></i>
              </div>
              <CardTitle>Statistiques Avancées</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Analysez vos dépenses et optimisez votre budget avec nos graphiques détaillés.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4" 
                   style={{ backgroundColor: 'hsl(258, 71%, 65%)' }}>
                <i className="fas fa-bell text-white"></i>
              </div>
              <CardTitle>Notifications Intelligentes</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Recevez des alertes personnalisées avant chaque échéance importante.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Section témoignages */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold mb-8" style={{ color: 'hsl(258, 71%, 65%)' }}>
            Ce que disent nos pigeons
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <img src="/pigeon1.png" alt="Témoignage" className="w-12 h-12 rounded-full mr-4" />
                  <div>
                    <h4 className="font-semibold">Pierre Pigeon</h4>
                    <p className="text-sm text-gray-500">Utilisateur depuis 2024</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">
                  "Grâce à PigeonSub, je ne suis plus un pigeon ! Je maîtrise enfin tous mes abonnements."
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <img src="/pigeon3.png" alt="Témoignage" className="w-12 h-12 rounded-full mr-4" />
                  <div>
                    <h4 className="font-semibold">Marie Colombe</h4>
                    <p className="text-sm text-gray-500">Utilisatrice depuis 2024</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">
                  "Interface intuitive et fonctionnalités parfaites. Je recommande à tous les pigeons !"
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
