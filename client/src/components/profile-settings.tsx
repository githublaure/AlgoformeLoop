
import React, { useState } from 'react';
import { useAuth } from './auth-provider';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useToast } from '../hooks/use-toast';

export function ProfileSettings() {
  const { user, changePassword, isLoading, error } = useAuth();
  const { toast } = useToast();
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwords.new !== passwords.confirm) {
      toast({
        title: "Erreur",
        description: "Les nouveaux mots de passe ne correspondent pas",
        variant: "destructive",
      });
      return;
    }

    if (passwords.new.length < 6) {
      toast({
        title: "Erreur",
        description: "Le nouveau mot de passe doit contenir au moins 6 caractères",
        variant: "destructive",
      });
      return;
    }

    try {
      await changePassword(passwords.current, passwords.new);
      if (!error) {
        toast({
          title: "Succès",
          description: "Mot de passe modifié avec succès",
        });
        setPasswords({ current: '', new: '', confirm: '' });
      }
    } catch (err) {
      toast({
        title: "Erreur",
        description: error || "Erreur lors de la modification du mot de passe",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Paramètres du profil</CardTitle>
        <CardDescription>
          Gérez vos informations personnelles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informations utilisateur */}
        <div className="space-y-2">
          <Label>Nom</Label>
          <Input value={user?.name || ''} disabled />
        </div>
        
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={user?.email || ''} disabled />
        </div>

        {/* Changement de mot de passe */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="text-lg font-semibold">Changer le mot de passe</h3>
          
          <div className="space-y-2">
            <Label htmlFor="current">Mot de passe actuel</Label>
            <Input
              id="current"
              name="current"
              type="password"
              value={passwords.current}
              onChange={handlePasswordChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new">Nouveau mot de passe</Label>
            <Input
              id="new"
              name="new"
              type="password"
              value={passwords.new}
              onChange={handlePasswordChange}
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">Confirmer le nouveau mot de passe</Label>
            <Input
              id="confirm"
              name="confirm"
              type="password"
              value={passwords.confirm}
              onChange={handlePasswordChange}
              required
              minLength={6}
            />
          </div>

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full pigeon-button-primary"
          >
            {isLoading ? 'Modification...' : 'Modifier le mot de passe'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
