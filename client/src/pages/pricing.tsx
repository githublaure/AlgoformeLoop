import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2, ArrowLeft, Zap, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useEffect } from "react";

interface Price {
  id: string;
  unit_amount: number;
  currency: string;
  recurring: { interval: string; interval_count: number } | null;
}

interface Product {
  id: string;
  name: string;
  description: string;
  prices: Price[];
}

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount / 100);
}

function intervalLabel(interval: string) {
  if (interval === 'month') return '/mois';
  if (interval === 'year') return '/an';
  return '';
}

export default function PricingPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const searchParams = new URLSearchParams(window.location.search);
  const paymentStatus = searchParams.get('payment');

  useEffect(() => {
    if (paymentStatus === 'cancelled') {
      toast({
        title: "Paiement annulé",
        description: "Vous avez annulé le paiement. Vous pouvez réessayer à tout moment.",
        variant: "destructive",
      });
    }
  }, [paymentStatus]);

  const { data: productsData, isLoading: productsLoading } = useQuery<{ data: Product[] }>({
    queryKey: ['/api/stripe/products'],
  });

  const { data: subData } = useQuery<{ subscription: any }>({
    queryKey: ['/api/stripe/subscription'],
  });

  const checkoutMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const res = await apiRequest('POST', '/api/stripe/checkout', { priceId });
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de lancer le paiement. Veuillez vous connecter.",
        variant: "destructive",
      });
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/stripe/portal', {});
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'accéder au portail de facturation.",
        variant: "destructive",
      });
    },
  });

  const hasActiveSubscription = subData?.subscription != null;
  const products = productsData?.data ?? [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au tableau de bord
          </Button>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Zap className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">Pigeon Pro</h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Prenez le contrôle total de vos abonnements. Fini de vous faire plumer !
            </p>
          </div>
        </div>

        {hasActiveSubscription && (
          <Card className="mb-8 border-green-500 bg-green-50 dark:bg-green-950">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800 dark:text-green-200">Abonnement actif</p>
                    <p className="text-sm text-green-700 dark:text-green-300">Vous profitez de Pigeon Pro</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => portalMutation.mutate()}
                  disabled={portalMutation.isPending}
                  className="border-green-500 text-green-700"
                >
                  {portalMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CreditCard className="w-4 h-4 mr-2" />
                  )}
                  Gérer mon abonnement
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {productsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Aucun produit disponible pour le moment.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {products.map((product) =>
              product.prices.map((price) => {
                const isYearly = price.recurring?.interval === 'year';
                return (
                  <Card
                    key={price.id}
                    className={`relative ${isYearly ? 'border-primary shadow-lg shadow-primary/10' : ''}`}
                  >
                    {isYearly && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white">
                        Économisez 33%
                      </Badge>
                    )}
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {product.name}
                        {isYearly && <Badge variant="secondary">Annuel</Badge>}
                        {!isYearly && <Badge variant="outline">Mensuel</Badge>}
                      </CardTitle>
                      <CardDescription>{product.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-6">
                        <span className="text-4xl font-bold">
                          {formatPrice(price.unit_amount, price.currency)}
                        </span>
                        <span className="text-muted-foreground ml-1">
                          {price.recurring ? intervalLabel(price.recurring.interval) : ''}
                        </span>
                        {isYearly && (
                          <p className="text-sm text-muted-foreground mt-1">
                            soit {formatPrice(Math.round(price.unit_amount / 12), price.currency)}/mois
                          </p>
                        )}
                      </div>
                      <ul className="space-y-2">
                        {[
                          "Abonnements illimités",
                          "Rappels vocaux IA (ElevenLabs)",
                          "Statistiques avancées",
                          "Alertes de renouvellement",
                          "Preuves d'achat & désabonnement",
                          "Suivi des essais gratuits",
                        ].map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full"
                        size="lg"
                        variant={isYearly ? "default" : "outline"}
                        onClick={() => checkoutMutation.mutate(price.id)}
                        disabled={checkoutMutation.isPending || hasActiveSubscription}
                      >
                        {checkoutMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        {hasActiveSubscription ? "Déjà abonné" : "Commencer maintenant"}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })
            )}
          </div>
        )}

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Paiement sécurisé via Stripe. Annulez à tout moment.</p>
          <p className="mt-1">Les prix incluent la TVA applicable.</p>
        </div>
      </div>
    </div>
  );
}
