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

  const toggleTalkingPigeon = () => {
    if (videoRef.current) {
      if (isTalking) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      } else {
        videoRef.current.play();
      }
      setIsTalking(!isTalking);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(210, 17%, 98%)' }}>
        <div className="w-full max-w-md mx-auto p-8">
          <div className="text-center mb-8">
            <div 
              className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center mx-auto mb-6 cursor-pointer relative"
              style={{ backgroundColor: 'hsl(258, 71%, 65%)' }}
              onClick={toggleTalkingPigeon}
            >
              <video
                ref={videoRef}
                className={`w-20 h-20 object-cover transition-transform duration-300 ${isTalking ? 'animate-pulse scale-110' : 'hover:scale-105'}`}
                muted
                loop
                onEnded={() => setIsTalking(false)}
              >
                <source src="/pigeon_talking.mp4" type="video/mp4" />
                <img src="/pigeongangsta.png" alt="PigeonSub mascot" className="w-20 h-20 object-contain" />
              </video>
              {!isTalking && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <i className="fas fa-play text-white text-sm opacity-70"></i>
                </div>
              )}
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'hsl(258, 71%, 65%)' }}>
              PigeonSub
            </h1>
            <p className="text-gray-600">
              "Comment être un pigeon... et s'en sortir"
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Cliquez sur le pigeon pour l'entendre parler !
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
      </div>
    );
  }

  return <>{children}</>;
}