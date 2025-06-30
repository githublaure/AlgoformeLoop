
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocation } from 'wouter';
import { useToast } from '../hooks/use-toast';

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Récupérer le token depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('token');
    if (resetToken) {
      setToken(resetToken);
    } else {
      toast({
        title: "Erreur",
        description: "Token de réinitialisation manquant",
        variant: "destructive",
      });
      setLocation('/');
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      });
      return;
    }

    if (formData.newPassword.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: formData.newPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Votre mot de passe a été réinitialisé avec succès",
        });
        setLocation('/');
      } else {
        toast({
          title: "Erreur",
          description: data.message || "Erreur lors de la réinitialisation",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur de connexion au serveur",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/pigeongangsta.png" alt="PigeonSub" className="w-16 h-16" />
          </div>
          <CardTitle className="text-2xl font-bold" style={{ color: 'hsl(258, 71%, 65%)' }}>
            Nouveau mot de passe
          </CardTitle>
          <CardDescription>
            Choisissez un nouveau mot de passe sécurisé pour votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={handleInputChange}
                required
                placeholder="Entrez votre nouveau mot de passe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                placeholder="Confirmez votre nouveau mot de passe"
              />
            </div>
            <Button
              type="submit"
              className="w-full pigeon-button-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => setLocation('/')}
              className="text-sm"
            >
              Retour à la connexion
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
