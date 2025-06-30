
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

export default function Test() {
  const [, setLocation] = useLocation();
  const [isTalking, setIsTalking] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  const setupVideoProcessing = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  };

  const processFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.paused || video.ended) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dessiner la frame vidéo
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Obtenir les données d'image
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    // Fonction améliorée pour détecter les contours et éléments importants
    const shouldKeepPixel = (x: number, y: number) => {
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      
      // Garder tous les pixels qui ne sont pas du fond noir pur
      if (r > 25 || g > 25 || b > 25) {
        return true;
      }
      
      // Pour les pixels sombres, vérifier s'ils sont près d'éléments colorés
      const checkRadius = 2; // Rayon de vérification élargi
      for (let dy = -checkRadius; dy <= checkRadius; dy++) {
        for (let dx = -checkRadius; dx <= checkRadius; dx++) {
          if (dx === 0 && dy === 0) continue;
          
          const nx = x + dx;
          const ny = y + dy;
          
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nIndex = (ny * width + nx) * 4;
            const nr = data[nIndex];
            const ng = data[nIndex + 1];
            const nb = data[nIndex + 2];
            
            // Si un voisin proche a de la couleur, garder le pixel (contour)
            if (nr > 40 || ng > 40 || nb > 40) {
              return true;
            }
          }
        }
      }
      return false;
    };

    // Rendre transparent uniquement le fond noir pur
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Si le pixel est très noir ET qu'il n'est pas un contour
        if (r < 15 && g < 15 && b < 15 && !shouldKeepPixel(x, y)) {
          data[i + 3] = 0; // Rendre transparent
        } else if (r < 25 && g < 25 && b < 25) {
          // Pour les pixels légèrement sombres, les garder mais avec plus d'opacité
          data[i + 3] = Math.max(data[i + 3], 200);
        }
      }
    }

    // Remettre les données modifiées
    ctx.putImageData(imageData, 0, 0);
    
    // Programmer la prochaine frame
    animationRef.current = requestAnimationFrame(processFrame);
  };

  const toggleAIVideo = () => {
    if (videoRef.current) {
      if (isTalking) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      } else {
        // Enlever le mode muet pour activer le son
        videoRef.current.muted = false;
        videoRef.current.volume = 0.7; // Volume à 70%
        videoRef.current.play().then(() => {
          // Commencer le traitement des frames
          processFrame();
        }).catch(error => {
          console.log("Erreur de lecture audio:", error);
          // Si l'audio échoue, jouer quand même la vidéo en muet
          videoRef.current!.muted = true;
          videoRef.current!.play().then(() => {
            processFrame();
          });
        });
      }
      setIsTalking(!isTalking);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* En-tête de la page test */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-4">
            <img src="/pigeongangsta.png" alt="PigeonSub" className="w-16 h-16 mr-4" />
            <h1 className="text-4xl font-bold" style={{ color: 'hsl(258, 71%, 65%)' }}>
              Page Test - Démo AI
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-8">
            Découvrez notre démo IA interactive (1m44s)
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={() => setLocation('/')}
              className="pigeon-button-primary px-6 py-3 text-lg"
            >
              Retour au dashboard
            </Button>
            <Button 
              variant="outline"
              onClick={() => setLocation('/demo')}
              className="px-6 py-3 text-lg"
            >
              Voir la démo
            </Button>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle>À propos de cette démo</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Cette page de test présente une démonstration de notre technologie IA. 
                La vidéo en bas à droite montre les capacités de notre système d'intelligence artificielle
                intégré à PigeonSub pour une expérience utilisateur optimisée.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fonctionnalités démontrées</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Interface utilisateur intuitive</li>
                <li>• Gestion intelligente des abonnements</li>
                <li>• Analyse prédictive des coûts</li>
                <li>• Notifications personnalisées</li>
                <li>• Intégration IA avancée</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Section informative */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-8" style={{ color: 'hsl(258, 71%, 65%)' }}>
            Innovation & Technologie
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4" 
                     style={{ backgroundColor: 'hsl(258, 71%, 65%)' }}>
                  <i className="fas fa-robot text-white"></i>
                </div>
                <CardTitle>IA Intégrée</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Notre intelligence artificielle analyse vos habitudes de consommation pour optimiser vos abonnements.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4" 
                     style={{ backgroundColor: 'hsl(258, 71%, 65%)' }}>
                  <i className="fas fa-chart-line text-white"></i>
                </div>
                <CardTitle>Analyse Prédictive</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Prédiction des tendances de dépenses et recommandations personnalisées basées sur vos données.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4" 
                     style={{ backgroundColor: 'hsl(258, 71%, 65%)' }}>
                  <i className="fas fa-cog text-white"></i>
                </div>
                <CardTitle>Automatisation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Gestion automatique des renouvellements et optimisation continue de votre portefeuille d'abonnements.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Vidéo AI en bas à droite avec transparence */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="relative">
          {/* Canvas pour la transparence du fond noir */}
          <canvas
            ref={canvasRef}
            className={`w-80 h-64 object-contain transition-transform duration-300 ${isTalking ? 'animate-pulse scale-105' : ''}`}
            style={{ 
              borderRadius: '20px',
              boxShadow: '0 15px 35px rgba(0,0,0,0.15)',
              display: isTalking ? 'block' : 'none'
            }}
          />
          
          {/* Vidéo cachée pour le traitement */}
          <video
            ref={videoRef}
            className="hidden"
            onEnded={() => setIsTalking(false)}
            onLoadedData={setupVideoProcessing}
          >
            <source src="/test/ai_talking.mp4" type="video/mp4" />
          </video>

          {/* Aperçu statique quand pas en lecture */}
          {!isTalking && (
            <div className="w-80 h-64 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl shadow-lg flex items-center justify-center border-2 border-purple-200">
              <div className="text-center">
                <i className="fas fa-robot text-6xl mb-4" style={{ color: 'hsl(258, 71%, 65%)' }}></i>
                <p className="text-lg font-semibold text-gray-700">Démo IA</p>
                <p className="text-sm text-gray-500">1m44s</p>
              </div>
            </div>
          )}

          {/* Bouton de lecture */}
          {!isTalking && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div 
                className="w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg"
                onClick={toggleAIVideo}
              >
                <i className="fas fa-play text-white text-2xl ml-1"></i>
              </div>
            </div>
          )}

          {/* Icône sonore */}
          <div className="absolute top-2 right-2 bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center shadow-md">
            <i className="fas fa-volume-up text-white text-sm"></i>
          </div>

          {/* Bouton pause pendant la lecture */}
          {isTalking && (
            <div className="absolute bottom-4 right-4">
              <div 
                className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg"
                onClick={toggleAIVideo}
              >
                <i className="fas fa-pause text-white"></i>
              </div>
            </div>
          )}

          {/* Indicateur de durée */}
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
            1:44
          </div>
        </div>
        
        <div className="text-center mt-3">
          <p className="text-sm text-gray-600 font-medium">Cliquez pour voir la démo !</p>
          <p className="text-xs text-gray-400">🤖 Intelligence Artificielle</p>
        </div>
      </div>
    </div>
  );
}
