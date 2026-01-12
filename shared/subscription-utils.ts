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

export const FREQUENCY_LABELS: Record<string, string> = {
  monthly: "mois",
  yearly: "an",
  weekly: "semaine",
  lifetime: "accès à vie",
};

export function getFrequencyLabel(frequency?: string): string {
  if (!frequency) return "";
  return FREQUENCY_LABELS[frequency] ?? frequency;
}

export function getFrequencySuffix(frequency?: string): string {
  if (!frequency) return "";
  if (frequency === "lifetime") return "accès à vie";
  return `par ${getFrequencyLabel(frequency)}`;
}

export function getPriceSuffix(frequency?: string): string {
  if (!frequency) return "";
  if (frequency === "lifetime") return " (accès à vie)";
  return `/${getFrequencyLabel(frequency)}`;
}
