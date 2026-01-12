import type { Subscription } from "@shared/schema";

const formatDateToICS = (date: Date) => {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
};

const formatPrice = (price: any) => {
  if (typeof price === "number") return price.toFixed(2);
  if (typeof price === "string") return price;
  return `${price}`;
};

export function createSubscriptionCalendarEvent(subscription: Subscription) {
  if (!subscription.nextRenewal) {
    throw new Error("Date de renouvellement inconnue.");
  }
  const startDate = new Date(subscription.nextRenewal);
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 1);

  const dtStamp = formatDateToICS(new Date());
  const dtStart = formatDateToICS(startDate);
  const dtEnd = formatDateToICS(endDate);
  const amount = `${formatPrice(subscription.price)}€/${subscription.frequency === "monthly" ? "mois" : "an"}`;

  const description = `Renouvellement de ${subscription.name} pour ${amount}. Catégorie : ${subscription.category}.`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PigeonSub//Subscription Reminder//EN",
    "BEGIN:VEVENT",
    `UID:subscription-${subscription.id}-${Date.now()}@pigeonsub`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:Renouvellement ${subscription.name}`,
    `DESCRIPTION:${description}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

export function downloadCalendarEvent(filename: string, icsContent: string) {
  const blob = new Blob([icsContent], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
