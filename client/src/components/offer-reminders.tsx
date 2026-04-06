import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type OfferReminder = {
  id: number;
  appName: string;
  link: string;
  images: string[];
  validFrom: string;
  validTo: string;
  duration: string;
  coupon: string;
};

type OfferReminderStored = Omit<OfferReminder, "images"> & {
  images?: unknown;
  image?: unknown;
};

const STORAGE_KEY = "pigeon-offer-reminders";

const emptyForm = (): Omit<OfferReminder, "id"> => ({
  appName: "",
  link: "",
  images: [],
  validFrom: "",
  validTo: "",
  duration: "",
  coupon: "",
});

const parseImages = (images: unknown, fallbackImage: unknown): string[] => {
  if (Array.isArray(images)) {
    return images.filter((item): item is string => typeof item === "string" && item.length > 0);
  }

  if (typeof images === "string" && images.length > 0) {
    return [images];
  }

  if (typeof fallbackImage === "string" && fallbackImage.length > 0) {
    return [fallbackImage];
  }

  return [];
};

const normalizeOffer = (raw: OfferReminderStored): OfferReminder => ({
  id: typeof raw.id === "number" ? raw.id : Date.now(),
  appName: typeof raw.appName === "string" ? raw.appName : "",
  link: typeof raw.link === "string" ? raw.link : "",
  images: parseImages(raw.images, raw.image),
  validFrom: typeof raw.validFrom === "string" ? raw.validFrom : "",
  validTo: typeof raw.validTo === "string" ? raw.validTo : "",
  duration: typeof raw.duration === "string" ? raw.duration : "",
  coupon: typeof raw.coupon === "string" ? raw.coupon : "",
});

const loadOffers = (): OfferReminder[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((offer) => normalizeOffer(offer));
  } catch {
    return [];
  }
};

const compressImage = (file: File, maxWidth = 1024, quality = 0.65) =>
  new Promise<string>((resolve, reject) => {
    const image = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      image.src = String(reader.result || "");
    };
    reader.onerror = () => reject(new Error("Impossible de lire l'image"));

    image.onload = () => {
      const ratio = Math.min(1, maxWidth / image.width);
      const width = Math.round(image.width * ratio);
      const height = Math.round(image.height * ratio);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas non disponible"));
        return;
      }

      ctx.drawImage(image, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve(dataUrl);
    };

    image.onerror = () => reject(new Error("Image invalide"));
    reader.readAsDataURL(file);
  });

export function OfferReminders() {
  const [offers, setOffers] = useState<OfferReminder[]>(loadOffers);
  const [form, setForm] = useState<Omit<OfferReminder, "id">>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

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

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
  };

  const startEdit = (offer: OfferReminder) => {
    setForm({
      appName: offer.appName,
      link: offer.link,
      images: offer.images,
      validFrom: offer.validFrom,
      validTo: offer.validTo,
      duration: offer.duration,
      coupon: offer.coupon,
    });
    setEditingId(offer.id);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    try {
      const compressed = await Promise.all(files.map((file) => compressImage(file)));
      setForm((current) => ({
        ...current,
        images: [...current.images, ...compressed].slice(0, 8),
      }));
    } finally {
      event.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    setForm((current) => ({
      ...current,
      images: current.images.filter((_, imageIndex) => imageIndex !== index),
    }));
  };

  const submit = () => {
    if (!form.appName.trim()) return;

    if (editingId !== null) {
      save(
        offers.map((offer) =>
          offer.id === editingId
            ? {
                ...offer,
                ...form,
              }
            : offer,
        ),
      );
      resetForm();
      return;
    }

    save([...offers, { ...form, id: Date.now() }]);
    resetForm();
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
          <Input placeholder="Coupon" value={form.coupon} onChange={(e) => setForm({ ...form, coupon: e.target.value })} />
          <Input type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} />
          <Input type="date" value={form.validTo} onChange={(e) => setForm({ ...form, validTo: e.target.value })} />
          <Input placeholder="Durée (ex: 3 mois gratuits)" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
          <Input type="file" accept="image/*" multiple onChange={handleImageUpload} className="md:col-span-2" />
        </div>

        {form.images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {form.images.map((image, index) => (
              <div key={`${image.slice(0, 32)}-${index}`} className="relative">
                <img src={image} alt={`Offre ${index + 1}`} className="h-16 w-16 rounded border object-cover" />
                <button
                  type="button"
                  className="absolute -top-2 -right-2 rounded-full border bg-white px-1 text-[10px] text-red-600"
                  onClick={() => removeImage(index)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Button type="button" onClick={submit} className="pigeon-button-primary">
            {editingId === null ? "Ajouter un reminder d'offre" : "Mettre à jour l'offre"}
          </Button>
          {editingId !== null && (
            <Button type="button" variant="outline" onClick={resetForm}>
              Annuler l'édition
            </Button>
          )}
        </div>

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
                  {offer.link && (
                    <a className="text-xs text-purple-600 underline" href={offer.link} target="_blank" rel="noreferrer">
                      Voir l'offre
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {offer.images[0] && <img src={offer.images[0]} alt={offer.appName} className="h-14 w-14 rounded border object-cover" />}
                  {offer.images.length > 1 && <span className="text-xs text-gray-500">+{offer.images.length - 1}</span>}
                  <button className="text-xs text-purple-600" onClick={() => startEdit(offer)}>
                    Éditer
                  </button>
                  <button className="text-xs text-red-600" onClick={() => save(offers.filter((item) => item.id !== offer.id))}>
                    Supprimer
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
