import React, { useState, useRef } from 'react';
import { useAuth } from './auth-provider';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useLocation } from 'wouter';

interface LoginGuardProps {
  children: React.ReactNode;
}

export function LoginGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, login, register, forgotPassword, error } = useAuth();
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (showForgotPassword) {
      await forgotPassword(formData.email);
    } else if (isLogin) {
      await login(formData.email, formData.password);
    } else {
      await register(formData.name, formData.email, formData.password);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

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

    // Fonction pour détecter si un pixel fait partie du contour
    const isEdgePixel = (x: number, y: number) => {
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      
      // Si le pixel actuel n'est pas noir, vérifier les voisins
      if (r > 30 || g > 30 || b > 30) {
        return false;
      }
      
      // Vérifier les 8 pixels voisins
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          
          const nx = x + dx;
          const ny = y + dy;
          
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nIndex = (ny * width + nx) * 4;
            const nr = data[nIndex];
            const ng = data[nIndex + 1];
            const nb = data[nIndex + 2];
            
            // Si un voisin n'est pas noir, c'est un contour
            if (nr > 30 || ng > 30 || nb > 30) {
              return true;
            }
          }
        }
      }
      return false;
    };

    // Rendre le fond noir transparent mais préserver les contours
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Si le pixel est proche du noir
        if (r < 30 && g < 30 && b < 30) {
          // Vérifier si c'est un contour
          if (!isEdgePixel(x, y)) {
            data[i + 3] = 0; // Rendre transparent seulement si ce n'est pas un contour
          }
        }
      }
    }

    // Remettre les données modifiées
    ctx.putImageData(imageData, 0, 0);
    
    // Programmer la prochaine frame
    animationRef.current = requestAnimationFrame(processFrame);
  };

  const toggleTalkingPigeon = () => {
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(210, 17%, 98%)' }}>
        <div className="w-full max-w-md mx-auto p-8">
          <div className="text-center mb-8">
            <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'hsl(258, 71%, 65%)' }}>
              <img src="/pigeongangsta.png" alt="PigeonSub mascot" className="w-20 h-20 object-contain" />
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'hsl(258, 71%, 65%)' }}>
              PigeonSub
            </h1>
            <p className="text-gray-600">
              "Comment être un pigeon... et s'en sortir"
            </p>
            
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{isLogin ? 'Connexion' : 'Inscription'}</CardTitle>
              <CardDescription>
                {isLogin 
                  ? 'Connectez-vous pour gérer vos abonnements' 
                  : 'Créez votre compte pour commencer'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && !showForgotPassword && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Votre nom"
                      value={formData.name}
                      onChange={handleInputChange}
                      required={!isLogin}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="votre.email@exemple.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {!showForgotPassword && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                )}

                {error && (
                  <div className="text-red-600 text-sm text-center">
                    {error}
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full pigeon-button-primary"
                >
                  {isLoading ? 'Chargement...' : 
                   (showForgotPassword ? 'Envoyer le lien' :
                    (isLogin ? 'Se connecter' : 'S\'inscrire'))}
                </Button>

                <div className="text-center space-y-2">
                  {!showForgotPassword && (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-sm underline block mx-auto"
                        style={{ color: 'hsl(258, 71%, 65%)' }}
                      >
                        {isLogin ? 'Créer un compte' : 'Déjà un compte ? Se connecter'}
                      </button>

                      {isLogin && (
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-sm underline block mx-auto"
                          style={{ color: 'hsl(258, 71%, 65%)' }}
                        >
                          Mot de passe oublié ?
                        </button>
                      )}
                    </>
                  )}

                  {showForgotPassword && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setFormData({ name: '', email: '', password: '' });
                      }}
                      className="text-sm underline"
                      style={{ color: 'hsl(258, 71%, 65%)' }}
                    >
                      Retour à la connexion
                    </button>
                  )}
                </div>
              </form>

              <div className="mt-6 pt-6 border-t">
                <div className="flex justify-between items-center mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation('/demo')}
                    className="text-sm w-full"
                  >
                    Voir la démo
                  </Button>
                </div>
                <div className="flex space-x-2 justify-center">
                  <img src="/pigeon1.png" alt="Pigeon 1" className="w-12 h-12 object-contain hover:scale-110 transition-transform cursor-pointer" onClick={() => setLocation('/demo')} />
                  <img src="/pigeon2.png" alt="Pigeon 2" className="w-12 h-12 object-contain hover:scale-110 transition-transform cursor-pointer" onClick={() => setLocation('/demo')} />
                  <img src="/pigeon3.png" alt="Pigeon 3" className="w-12 h-12 object-contain hover:scale-110 transition-transform cursor-pointer" onClick={() => setLocation('/demo')} />
                  <img src="/pigeon4.png" alt="Pigeon 4" className="w-12 h-12 object-contain hover:scale-110 transition-transform cursor-pointer" onClick={() => setLocation('/demo')} />
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">Cliquez sur un pigeon pour voir la démo</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pigeon parlant en bas à droite */}
        <div className="fixed bottom-4 right-4 z-50">
          <div className="relative">
            {/* Canvas pour la transparence du fond noir */}
            <canvas
              ref={canvasRef}
              className={`w-64 h-64 object-contain transition-transform duration-300 ${isTalking ? 'animate-pulse scale-105' : ''}`}
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
              loop
              onEnded={() => setIsTalking(false)}
              onLoadedData={setupVideoProcessing}
            >
              <source src="/pigeon_talking.mp4" type="video/mp4" />
            </video>

            {/* Image statique quand pas en lecture */}
            {!isTalking && (
              <img 
                src="/pigeongangsta.png" 
                alt="PigeonSub mascot" 
                className="w-64 h-64 object-contain rounded-xl shadow-lg" 
              />
            )}

            {/* Bouton de lecture et icône sonore */}
            {!isTalking && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div 
                  className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg"
                  onClick={toggleTalkingPigeon}
                >
                  <i className="fas fa-play text-white text-xl ml-1"></i>
                </div>
              </div>
            )}

            {/* Icône sonore */}
            <div className="absolute top-2 right-2 bg-green-500 rounded-full w-8 h-8 flex items-center justify-center shadow-md">
              <i className="fas fa-volume-up text-white text-sm"></i>
            </div>

            {/* Bouton pause pendant la lecture */}
            {isTalking && (
              <div className="absolute bottom-4 right-4">
                <div 
                  className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg"
                  onClick={toggleTalkingPigeon}
                >
                  <i className="fas fa-pause text-white"></i>
                </div>
              </div>
            )}
          </div>
          
          <div className="text-center mt-3">
            <p className="text-sm text-gray-600 font-medium">Cliquez pour écouter !</p>
            <p className="text-xs text-gray-400">🎵 Audio inclus</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}