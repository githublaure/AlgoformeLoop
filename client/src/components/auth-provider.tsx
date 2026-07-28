
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface User {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email?: string, password?: string) => Promise<void>;
  loginDemo: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const refreshAuthedQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
    queryClient.invalidateQueries({ queryKey: ['/api/subscriptions/upcoming/7'] });
    queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
  };

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        localStorage.removeItem('authToken');
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('authToken');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email = "", password = "") => {
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        setUser(data.user);
        refreshAuthedQueries();
      } else {
        setError(data.message || 'Erreur de connexion');
      }
    } catch (error) {
      setError('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        setUser(data.user);
        refreshAuthedQueries();
      } else {
        setError(data.message || 'Erreur d\'inscription');
      }
    } catch (error) {
      setError('Erreur d\'inscription');
    } finally {
      setIsLoading(false);
    }
  };

  const loginDemo = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/demo-login', { method: 'POST' });
      // A stale Replit backend can return its HTML 404 page while Vite has already
      // hot-reloaded this client. Do not let JSON parsing hide the useful HTTP status.
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        setUser(data.user);
        refreshAuthedQueries();
      } else {
        setError(
          data.message ||
          (response.status === 404
            ? "Le serveur n'est pas encore à jour. Redémarrez l'application Replit puis réessayez."
            : `Impossible d'ouvrir le compte démo (erreur ${response.status})`)
        );
      }
    } catch (_error) {
      setError("Impossible d'ouvrir le compte démo");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    setError(null);
    queryClient.clear();
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    setError(null);
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Erreur lors de la modification du mot de passe');
      }
    } catch (error) {
      setError('Erreur lors de la modification du mot de passe');
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Erreur lors de l\'envoi du lien de réinitialisation');
      }
    } catch (error) {
      setError('Erreur lors de l\'envoi du lien de réinitialisation');
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, newPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Erreur lors de la réinitialisation du mot de passe');
      }
    } catch (error) {
      setError('Erreur lors de la réinitialisation du mot de passe');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    loginDemo,
    register,
    logout,
    changePassword,
    forgotPassword,
    resetPassword,
    isLoading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
