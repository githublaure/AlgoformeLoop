
import React, { useState } from 'react';
import { useAuth } from './auth-provider';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface LoginGuardProps {
  children: React.ReactNode;
}

export function LoginGuard({ children }: LoginGuardProps) {
  const { isAuthenticated, isLoading, login, register, error } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
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
    
    if (isLogin) {
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
                {!isLogin && (
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

                {error && (
                  <div className="text-red-600 text-sm text-center">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full pigeon-button-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      {isLogin ? 'Connexion...' : 'Inscription...'}
                    </>
                  ) : (
                    isLogin ? 'Se connecter' : 'S\'inscrire'
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-sm text-gray-600 hover:text-gray-800 underline"
                  >
                    {isLogin 
                      ? 'Pas de compte ? Inscrivez-vous' 
                      : 'Déjà un compte ? Connectez-vous'
                    }
                  </button>
                </div>
              </form>

              <div className="mt-6 pt-6 border-t">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Démo avec les images pigeon :</h3>
                  <a 
                    href="#demo" 
                    className="text-sm text-purple-600 hover:text-purple-800 underline"
                  >
                    Voir la démo
                  </a>
                </div>
                <div className="flex space-x-2 justify-center">
                  <img src="/pigeon1.png" alt="Pigeon 1" className="w-12 h-12 object-contain" />
                  <img src="/pigeon2.png" alt="Pigeon 2" className="w-12 h-12 object-contain" />
                  <img src="/pigeon3.png" alt="Pigeon 3" className="w-12 h-12 object-contain" />
                  <img src="/pigeon4.png" alt="Pigeon 4" className="w-12 h-12 object-contain" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
