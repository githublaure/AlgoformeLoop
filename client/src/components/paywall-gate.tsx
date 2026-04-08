import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Lock, Zap, CheckCircle, Loader2, Eye } from "lucide-react";
import { usePremium } from "@/hooks/use-premium";
import type { ReactNode } from "react";

const PAYWALL_ENFORCE = import.meta.env.VITE_PAYWALL_ENFORCE === "true";

interface PaywallGateProps {
  children: ReactNode;
  feature: string;
  description: string;
  highlights?: string[];
}

export function PaywallGate({ children, feature, description, highlights = [] }: PaywallGateProps) {
  const { isPremium, isLoading } = usePremium();
  const [, navigate] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isPremium) {
    return <>{children}</>;
  }

  if (!PAYWALL_ENFORCE) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-sm text-primary">
          <Eye className="w-4 h-4 shrink-0" />
          <span className="font-medium">Aperçu MVP</span>
          <span className="text-muted-foreground font-normal">— {feature} sera réservé à Pigeon Pro au lancement</span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-7 text-xs text-primary hover:text-primary"
            onClick={() => navigate("/pricing")}
          >
            <Zap className="w-3 h-3 mr-1" />
            Voir les tarifs
          </Button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute inset-0 z-10 backdrop-blur-sm bg-white/60 dark:bg-black/60 rounded-xl flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto px-6 py-8">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-7 h-7 text-primary" />
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2">Fonctionnalité Pro</h3>
          <p className="text-muted-foreground text-sm mb-4">{description}</p>
          {highlights.length > 0 && (
            <ul className="text-sm space-y-1 mb-5 text-left">
              {highlights.map((h) => (
                <li key={h} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          )}
          <Button
            className="w-full"
            onClick={() => navigate("/pricing")}
          >
            <Zap className="w-4 h-4 mr-2" />
            Passer à Pigeon Pro
          </Button>
        </div>
      </div>
      <div className="pointer-events-none select-none opacity-30 blur-[1px]">
        {children}
      </div>
    </div>
  );
}

export function PremiumBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
      <Zap className="w-3 h-3" />
      Pro
    </span>
  );
}
