import type { Subscription } from "./schema";

/**
 * Détermine si un abonnement doit être considéré comme "pigeonné".
 * Un abonnement est classé comme pigeonné s'il est explicitement marqué suspect
 * ou si sa note en étoiles est faible (2 étoiles ou moins, y compris aucune note).
 */
export function isPigeoned(subscription: Subscription): boolean {
  const rating = subscription.rating ?? 0;
  return (subscription.isSuspect ?? false) || rating <= 2;
}
