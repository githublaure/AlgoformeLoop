import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type OfferReminder = {
  id: number;
  appName: string;
  link: string;
  image: string;
  validFrom: string;
  validTo: string;
  duration: string;
  coupon: string;
};

const STORAGE_KEY = "pigeon-offer-reminders";

const loadOffers = (): OfferReminder[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export function OfferReminders() {
  const [offers, setOffers] = useState<OfferReminder[]>(loadOffers);
  const [form, setForm] = useState<Omit<OfferReminder, "id">>({
    appName: "",
    link: "",
    image: "",
    validFrom: "",
    validTo: "",
    duration: "",
    coupon: "",
  });

  const sortedOffers = useMemo(
    () => [...offers].sort((a, b) => (a.validTo || "").localeCompare(b.validTo || "")),
    [offers],
  );

  const save = (next: OfferReminder[]) => {
    setOffers(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  };

  return (
    <div className="pigeon-card mb-6">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <i className="fas fa-feather" style={{ color: "hsl(258, 71%, 65%)" }}></i>
          Replume ton pigeon (offres à tester)
        </h2>
      </div>
      <div className="p-6 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input placeholder="App / service" value={form.appName} onChange={(e) => setForm({ ...form, appName: e.target.value })} />
          <Input placeholder="Lien de l'offre" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
          <Input placeholder="Image (URL)" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
          <Input placeholder="Coupon" value={form.coupon} onChange={(e) => setForm({ ...form, coupon: e.target.value })} />
          <Input type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} />
          <Input type="date" value={form.validTo} onChange={(e) => setForm({ ...form, validTo: e.target.value })} />
          <Input placeholder="Durée (ex: 3 mois gratuits)" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
        </div>
        <Button
          type="button"
          onClick={() => {
            if (!form.appName.trim()) return;
            save([...offers, { ...form, id: Date.now() }]);
            setForm({ appName: "", link: "", image: "", validFrom: "", validTo: "", duration: "", coupon: "" });
          }}
          className="pigeon-button-primary"
        >
          Ajouter un reminder d'offre
        </Button>

        <div className="space-y-3">
          {sortedOffers.length === 0 ? (
            <p className="text-sm text-gray-600">Aucune offre enregistrée pour le moment.</p>
          ) : (
            sortedOffers.map((offer) => (
              <div key={offer.id} className="rounded-lg border p-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{offer.appName}</p>
                  <p className="text-xs text-gray-600">Valable du {offer.validFrom || "?"} au {offer.validTo || "?"}</p>
                  {offer.duration && <p className="text-xs text-gray-600">Durée: {offer.duration}</p>}
                  {offer.coupon && <p className="text-xs text-gray-600">Coupon: {offer.coupon}</p>}
                  {offer.link && <a className="text-xs text-purple-600 underline" href={offer.link} target="_blank" rel="noreferrer">Voir l'offre</a>}
                </div>
                <div className="flex items-center gap-2">
                  {offer.image && <img src={offer.image} alt={offer.appName} className="h-14 w-14 rounded border object-cover" />}
                  <button className="text-xs text-red-600" onClick={() => save(offers.filter((item) => item.id !== offer.id))}>Supprimer</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
