import type { Subscription } from "./schema";

/**
 * Détermine si un abonnement doit être considéré comme "pigeonné" selon sa note.
 * Un abonnement est classé comme pigeonné si sa note en étoiles est faible
 * (2 étoiles ou moins, y compris aucune note).
 */
export function isPigeoned(subscription: Subscription): boolean {
  const rating = subscription.rating ?? 0;
  return rating <= 2;
}
