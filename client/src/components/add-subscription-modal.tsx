import React, { useCallback, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Star } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { insertSubscriptionSchema, type Subscription } from "@shared/schema";
import { format } from "date-fns";

interface AddSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription?: Subscription;
}

const formSchema = insertSubscriptionSchema.extend({
  price: z.preprocess(
    (value) =>
      typeof value === "number" ? value.toString() : typeof value === "string" ? value.trim() : "",
    z.string().min(1, "Le prix est requis"),
  ),
  nextRenewal: z.string().optional(),
  trialEndsAt: z.string().optional(),
  safetyDate: z.string().optional(),
  categoryColor: z.string().optional(),
  note: z.string().optional(),
  rating: z.coerce.number().min(0).max(5).nullable().optional(),
  purchaseDate: z.string().optional(),
  purchaseProofImages: z.array(z.string()).default([]),
  unsubscribeProofImages: z.array(z.string()).default([]),
  isSuspect: z.coerce.boolean().default(false),
  useSafetyDate: z.coerce.boolean().default(false),
  isTrial: z.coerce.boolean().default(false),
  renewalUnknown: z.coerce.boolean().default(false),
}).superRefine((data, ctx) => {
  if (!data.renewalUnknown && data.frequency !== "lifetime" && !data.nextRenewal) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["nextRenewal"],
      message: "La date de renouvellement est requise",
    });
  }
});

type FormData = z.infer<typeof formSchema>;

type CategoryOption = {
  value: string;
  label: string;
  color: string;
};

const DEFAULT_BG_COLOR = "#4b5563";
const DEFAULT_CATEGORY = "other";
const CUSTOM_CATEGORIES_STORAGE_KEY = "pigeon-custom-categories";

const DEFAULT_CATEGORIES: CategoryOption[] = [
  { value: "entertainment", label: "Divertissement", color: "#7c3aed" },
  { value: "music", label: "Musique", color: "#16a34a" },
  { value: "productivity", label: "Productivité", color: "#0ea5e9" },
  { value: "design", label: "Design", color: "#f97316" },
  { value: "cloud", label: "Cloud", color: "#475569" },
  { value: "other", label: "Autre", color: "#6b7280" },
];

const isDefaultCategory = (value: string) =>
  DEFAULT_CATEGORIES.some((category) => category.value === value);

const getCategoryColor = (value: string) =>
  DEFAULT_CATEGORIES.find((category) => category.value === value)?.color ?? DEFAULT_BG_COLOR;

const loadCustomCategories = () => {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(CUSTOM_CATEGORIES_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item.value === "string")
      .map((item) => ({
        value: String(item.value),
        label: String(item.label ?? item.value),
        color: String(item.color ?? DEFAULT_BG_COLOR),
      }));
  } catch {
    return [];
  }
};

const defaultValues: FormData = {
  name: "",
  price: "",
  frequency: "monthly",
  category: DEFAULT_CATEGORY,
  usageFrequency: "used",
  nextRenewal: "",
  renewalUnknown: false,
  iconClass: "fas fa-dove",
  bgColor: DEFAULT_BG_COLOR,
  categoryColor: DEFAULT_BG_COLOR,
  isActive: true,
  isTrial: false,
  isSuspect: false,
  rating: null,
  note: "",
  purchaseDate: "",
  safetyDate: "",
  purchaseProofImages: [],
  unsubscribeProofImages: [],
  useSafetyDate: false,
};

export function AddSubscriptionModal({
  isOpen,
  onClose,
  subscription,
}: AddSubscriptionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUsage, setSelectedUsage] = useState<string>(defaultValues.usageFrequency);
  const [customCategories, setCustomCategories] = useState<CategoryOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>(DEFAULT_CATEGORIES);
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [customCategoryColor, setCustomCategoryColor] = useState("#4b5563");
  const [categoryColor, setCategoryColor] = useState<string>(defaultValues.bgColor ?? DEFAULT_BG_COLOR);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const isTrial = form.watch("isTrial");
  const renewalUnknown = form.watch("renewalUnknown");
  const selectedFrequency = form.watch("frequency");
  const isLifetime = selectedFrequency === "lifetime";

  const isEditing = Boolean(subscription);

  const resetForm = () => {
    form.reset(defaultValues);
    setSelectedUsage(defaultValues.usageFrequency);
    setCategoryColor(defaultValues.bgColor ?? DEFAULT_BG_COLOR);
    setCustomCategoryName("");
    setCustomCategoryColor("#4b5563");
  };

  const normalizePrice = (value: string | number | undefined | null) => {
    const asString =
      typeof value === "number"
        ? value.toString()
        : typeof value === "string"
          ? value
          : "";

    const cleaned = asString.replace(",", ".").replace(/[^0-9.]/g, "");
    if (!cleaned) return null;

    const numeric = Number.parseFloat(cleaned);
    if (!Number.isFinite(numeric)) return null;

    return numeric.toFixed(2);
  };

  const formatDateForInput = (date: string | Date) => {
    return format(new Date(date), "yyyy-MM-dd");
  };

  const parseStoredImages = (raw: string | null | undefined) => {
    if (!raw) return [] as string[];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string");
      }
      if (typeof parsed === "string") return [parsed];
    } catch {
      return [raw];
    }
    return [] as string[];
  };

  const encodeStoredImages = (images: string[]) => {
    if (!images.length) return null;
    return JSON.stringify(images);
  };

  const compressImage = (file: File, maxWidth = 1280, quality = 0.72) =>
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

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    field: "purchaseProofImages" | "unsubscribeProofImages",
  ) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    try {
      const compressed = await Promise.all(files.map((file) => compressImage(file)));
      const current = form.getValues(field) ?? [];
      const next = [...current, ...compressed].slice(0, 8);
      form.setValue(field, next, { shouldDirty: true });
    } catch {
      toast({
        title: "Erreur image",
        description: "Impossible de traiter une des images.",
        variant: "destructive",
      });
    } finally {
      event.target.value = "";
    }
  };

  const persistCustomCategories = useCallback((next: CategoryOption[]) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CUSTOM_CATEGORIES_STORAGE_KEY, JSON.stringify(next));
  }, []);

  const updateCustomCategories = useCallback(
    (updater: (prev: CategoryOption[]) => CategoryOption[]) => {
      setCustomCategories((prev) => {
        const next = updater(prev);
        persistCustomCategories(next);
        return next;
      });
    },
    [persistCustomCategories],
  );

  useEffect(() => {
    setCustomCategories(loadCustomCategories());
  }, []);

  useEffect(() => {
    setCategories([...DEFAULT_CATEGORIES, ...customCategories]);
  }, [customCategories]);

  useEffect(() => {
    if (!isOpen) return;

    if (subscription) {
      const catVal = subscription.category?.toString().trim();
      if (catVal && !isDefaultCategory(catVal)) {
        updateCustomCategories((prev) => {
          if (prev.some((cat) => cat.value === catVal)) return prev;
          const color = subscription.categoryColor ?? subscription.bgColor ?? DEFAULT_BG_COLOR;
          return [...prev, { value: catVal, label: catVal, color }];
        });
      }

      form.reset({
        ...subscription,
        category: subscription.category || DEFAULT_CATEGORY,
        price: subscription.price?.toString() ?? "",
        nextRenewal: subscription.nextRenewal ? formatDateForInput(subscription.nextRenewal) : "",
        safetyDate: subscription.safetyDate ? formatDateForInput(subscription.safetyDate) : "",
        renewalUnknown: !subscription.nextRenewal,
        bgColor: subscription.bgColor ?? DEFAULT_BG_COLOR,
        iconClass: subscription.iconClass || defaultValues.iconClass,
        rating: subscription.rating ?? null,
        purchaseDate: subscription.purchaseDate ? formatDateForInput(subscription.purchaseDate) : "",
        purchaseProofImages: parseStoredImages(subscription.purchaseProofImage),
        unsubscribeProofImages: parseStoredImages(subscription.unsubscribeProofImage),
        isSuspect: subscription.isSuspect ?? false,
        useSafetyDate: subscription.useSafetyDate ?? false,
        note: subscription.note ?? "",
        categoryColor: subscription.categoryColor ?? subscription.bgColor ?? DEFAULT_BG_COLOR,
        trialEndsAt: subscription.trialEndsAt ? formatDateForInput(subscription.trialEndsAt) : undefined,
        isTrial: subscription.isTrial ?? false,
      });

      setSelectedUsage(subscription.usageFrequency);
      setCategoryColor(subscription.categoryColor ?? subscription.bgColor ?? DEFAULT_BG_COLOR);
    } else {
      resetForm();
    }
  }, [subscription, isOpen, form, updateCustomCategories]);

  useEffect(() => {
    if (!isLifetime) return;
    form.setValue("renewalUnknown", true, { shouldDirty: true, shouldValidate: true });
    form.setValue("nextRenewal", "");
  }, [form, isLifetime]);

  useEffect(() => {
    if (!isLifetime) {
      form.setValue("purchaseDate", "");
    }
  }, [form, isLifetime]);

  const createSubscription = useMutation({
    mutationFn: async (data: FormData) => {
      const shouldClearRenewal = data.renewalUnknown || data.frequency === "lifetime";
      const payload = {
        ...data,
        price: String(data.price ?? ""),
        iconClass: "fas fa-dove",
        bgColor: data.categoryColor || data.bgColor,
        rating: data.rating ?? null,
        isSuspect: Boolean(data.isSuspect),
        nextRenewal: shouldClearRenewal ? null : new Date(data.nextRenewal ?? ""),
        safetyDate: data.safetyDate ? new Date(data.safetyDate) : null,
        purchaseDate: data.frequency === "lifetime" && data.purchaseDate
          ? new Date(data.purchaseDate)
          : null,
        trialEndsAt: data.isTrial && data.trialEndsAt ? new Date(data.trialEndsAt) : undefined,
      };
      delete (payload as Partial<FormData>).renewalUnknown;

      const response = subscription
        ? await apiRequest("PUT", `/api/subscriptions/${subscription.id}`, payload)
        : await apiRequest("POST", "/api/subscriptions", payload);

      return response.json() as Promise<Subscription>;
    },
    onSuccess: (savedSubscription) => {
      queryClient.setQueryData<Subscription[]>(["/api/subscriptions"], (existing) => {
        if (!existing) return [savedSubscription];

        const updated = existing.map((current) =>
          current.id === savedSubscription.id ? { ...current, ...savedSubscription } : current
        );

        const exists = updated.some((item) => item.id === savedSubscription.id);
        return exists ? updated : [...updated, savedSubscription];
      });

      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/upcoming/7"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: isEditing ? "Abonnement mis à jour" : "Abonnement ajouté!",
        description: isEditing
          ? "Les informations de l'abonnement ont été enregistrées."
          : "Votre nouvel abonnement a été ajouté avec succès.",
      });
      resetForm();
      onClose();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: isEditing
          ? "Impossible de mettre à jour l'abonnement."
          : "Impossible d'ajouter l'abonnement.",
        variant: "destructive",
      });
    },
  });

  const updateSubscription = useMutation({
    mutationFn: async (data: FormData) => {
      if (!subscription) return;
      const shouldClearRenewal = data.renewalUnknown || data.frequency === "lifetime";
      const subscriptionData = {
        ...data,
        nextRenewal: shouldClearRenewal ? null : new Date(data.nextRenewal ?? ""),
        safetyDate: data.safetyDate ? new Date(data.safetyDate) : null,
        purchaseDate: data.frequency === "lifetime" && data.purchaseDate
          ? new Date(data.purchaseDate)
          : null,
      };
      delete (subscriptionData as Partial<FormData>).renewalUnknown;
      const response = await apiRequest(
        "PUT",
        `/api/subscriptions/${subscription.id}`,
        subscriptionData,
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Abonnement mis à jour!",
        description: "Les informations de l'abonnement ont été sauvegardées.",
      });
      resetForm();
      onClose();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'abonnement.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    const normalizedPrice = normalizePrice(data.price);
    if (!normalizedPrice) {
      form.setError("price", { message: "Le prix doit être un nombre valide" });
      return;
    }

    const isLifetimeFrequency = data.frequency === "lifetime";
    const renewalUnknownValue = isLifetimeFrequency ? true : data.renewalUnknown;

    const normalizedData: FormData = {
      ...data,
      usageFrequency: data.usageFrequency || selectedUsage || defaultValues.usageFrequency,
      category: data.category || DEFAULT_CATEGORY,
      price: normalizedPrice,
      rating: data.rating ?? null,
      categoryColor: data.categoryColor || data.bgColor || DEFAULT_BG_COLOR,
      bgColor: data.categoryColor || data.bgColor || DEFAULT_BG_COLOR,
      note: data.note?.trim() ?? "",
      trialEndsAt: data.isTrial ? data.trialEndsAt : undefined,
      renewalUnknown: renewalUnknownValue,
      nextRenewal: renewalUnknownValue ? "" : data.nextRenewal,
      safetyDate: data.safetyDate,
      purchaseDate: isLifetimeFrequency ? data.purchaseDate : "",
      purchaseProofImage: encodeStoredImages(data.purchaseProofImages ?? []),
      unsubscribeProofImage: encodeStoredImages(data.unsubscribeProofImages ?? []),
      useSafetyDate: data.useSafetyDate ?? false,
    };

    if (isEditing) {
      updateSubscription.mutate(normalizedData);
    } else {
      createSubscription.mutate(normalizedData);
    }
  };

  const handleUsageSelect = (usage: string) => {
    setSelectedUsage(usage);
    form.setValue("usageFrequency", usage, { shouldValidate: true, shouldDirty: true });
  };

  const handleCategorySelect = (value: string, onChange: (value: string) => void) => {
    onChange(value);
    const selectedCategory = categories.find((cat) => cat.value === value);
    const color = selectedCategory?.color || DEFAULT_BG_COLOR;
    setCategoryColor(color);
    form.setValue("bgColor", color);
    form.setValue("categoryColor", color);
  };

  const handleAddCategory = () => {
    const name = customCategoryName.trim();
    if (!name) return;

    const normalized = name.toLowerCase();
    const newCategory = { value: name, label: name, color: customCategoryColor };

    updateCustomCategories((prev) => {
      if (prev.some((cat) => cat.value.toLowerCase() === normalized)) return prev;
      return [...prev, newCategory];
    });

    form.setValue("category", name);
    form.setValue("bgColor", customCategoryColor);
    form.setValue("categoryColor", customCategoryColor);
    setCategoryColor(customCategoryColor);
    setCustomCategoryName("");
  };

  const handleRenameCategory = (value: string, nextName: string) => {
    const trimmed = nextName.trim();
    if (!trimmed) return;
    updateCustomCategories((prev) => {
      if (prev.some((cat) => cat.value !== value && cat.value.toLowerCase() === trimmed.toLowerCase())) {
        return prev;
      }
      return prev.map((cat) =>
        cat.value === value ? { ...cat, value: trimmed, label: trimmed } : cat
      );
    });
    if (form.getValues("category") === value) {
      form.setValue("category", trimmed);
    }
  };

  const handleDeleteCategory = (value: string) => {
    updateCustomCategories((prev) => prev.filter((cat) => cat.value !== value));
    if (form.getValues("category") === value) {
      const fallback = DEFAULT_CATEGORY;
      const fallbackColor = getCategoryColor(fallback);
      form.setValue("category", fallback);
      form.setValue("bgColor", fallbackColor);
      form.setValue("categoryColor", fallbackColor);
      setCategoryColor(fallbackColor);
    }
  };

  const handleCustomCategoryColor = (value: string, color: string) => {
    updateCustomCategories((prev) =>
      prev.map((cat) => (cat.value === value ? { ...cat, color } : cat))
    );
    if (form.getValues("category") === value) {
      form.setValue("bgColor", color);
      form.setValue("categoryColor", color);
      setCategoryColor(color);
    }
  };

  const isSaving = createSubscription.isPending || updateSubscription.isPending;

  const getUsageButtonClass = (usage: string) => {
    const baseClass = "px-3 py-2 text-xs rounded-lg transition-colors";
    const isSelected = selectedUsage === usage;

    switch (usage) {
      case "very_used":
        return `${baseClass} ${isSelected ? "ring-2 ring-offset-2 ring-gray-400" : ""} pigeon-button-secondary`;
      case "used":
        return `${baseClass} ${isSelected ? "ring-2 ring-offset-2 ring-gray-400" : ""} pigeon-button-secondary`;
      case "rarely_used":
        return `${baseClass} ${isSelected ? "ring-2 ring-offset-2 ring-gray-400" : ""} bg-red-500 hover:bg-red-600 text-white`;
      default:
        return baseClass;
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const renderStars = () => {
    const ratingValue = form.watch("rating");
    const isUnrated = ratingValue === null || ratingValue === undefined;
    const currentRating = isUnrated ? 0 : ratingValue;

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = star <= currentRating;
          return (
            <button
              key={star}
              type="button"
              onClick={() => form.setValue("rating", star)}
              className="focus:outline-none"
              disabled={isUnrated}
              aria-label={`Noter ${star} étoiles`}
            >
              <Star
                className={`h-5 w-5 ${isActive ? "text-yellow-400" : "text-gray-300"}`}
                fill={isActive ? "currentColor" : "none"}
              />
            </button>
          );
        })}
        <span className="ml-2 text-xs text-gray-600">
          {isUnrated ? "Pas encore noté" : `${currentRating}/5`}
        </span>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md w-[95vw] sm:w-full max-h-[85vh] sm:max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifier l'abonnement" : "Ajouter un abonnement"}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-scroll overscroll-contain pr-2 pt-1 pigeon-scrollbar">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <input type="hidden" {...form.register("usageFrequency")} />
              <input type="hidden" {...form.register("bgColor")} />
              <input type="hidden" {...form.register("categoryColor")} />
              <input type="hidden" {...form.register("iconClass")} />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom du service</FormLabel>
                    <FormControl>
                      <Input placeholder="ex. Netflix" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prix</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">€</span>
                      <Input
                        type="number"
                        step="0.01"
                        className="pl-8"
                        placeholder="9.99"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fréquence</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner la fréquence" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="monthly">Mensuel</SelectItem>
                      <SelectItem value="yearly">Annuel</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      <SelectItem value="lifetime">Accès à vie</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isLifetime && (
              <FormField
                control={form.control}
                name="purchaseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date d'achat (optionnelle)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <p className="text-xs text-gray-600 mt-1">
                      Utilisée pour proratiser l'accès à vie sur la première année.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catégorie</FormLabel>
                  <Select
                    onValueChange={(value) => handleCategorySelect(value, field.onChange)}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner la catégorie" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          <div className="flex items-center justify-between w-full">
                            <span>{category.label}</span>
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="mt-2 text-xs text-gray-600 flex items-center space-x-2">
                    <span>Couleur associée :</span>
                    <span
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: categoryColor }}
                    />
                    <span className="flex items-center space-x-1">
                      <i className="fas fa-dove" style={{ color: "white" }}></i>
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium">Ajouter une catégorie personnalisée</p>
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder="Nom de la catégorie"
                        value={customCategoryName}
                        onChange={(e) => setCustomCategoryName(e.target.value)}
                      />
                      <Input
                        type="color"
                        className="p-1 w-16"
                        value={customCategoryColor}
                        onChange={(e) => setCustomCategoryColor(e.target.value)}
                      />
                      <Button type="button" variant="secondary" onClick={handleAddCategory}>
                        Ajouter
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Choisissez une couleur : le pigeon sur la carte d'abonnement l'utilisera automatiquement.
                    </p>
                  </div>

                  {customCategories.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium">Catégories personnalisées</p>
                      <div className="space-y-2">
                        {customCategories.map((category) => (
                          <div key={category.value} className="flex flex-wrap items-center gap-2 rounded-md border px-2 py-2">
                            <Input
                              className="h-8 flex-1 min-w-[140px]"
                              defaultValue={category.label}
                              onBlur={(event) => handleRenameCategory(category.value, event.target.value)}
                            />
                            <Input
                              type="color"
                              className="h-8 w-14 p-1"
                              value={category.color}
                              onChange={(event) => handleCustomCategoryColor(category.value, event.target.value)}
                              aria-label={`Couleur ${category.label}`}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              className="h-8 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleDeleteCategory(category.value)}
                            >
                              Supprimer
                            </Button>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">
                        Renommez une catégorie en quittant le champ ou supprimez-la si vous ne l'utilisez plus.
                      </p>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nextRenewal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date de renouvellement</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} disabled={renewalUnknown || isLifetime} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="safetyDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date de sûreté (optionnel)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <p className="text-xs text-gray-600">Rappel anticipé avant la vraie date de renouvellement.</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="renewalUnknown"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>Je ne sais pas</FormLabel>
                    <p className="text-xs text-gray-600">
                      Enregistrez l'abonnement sans date de renouvellement.
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (checked) {
                          form.setValue("nextRenewal", "");
                        }
                      }}
                      disabled={isLifetime}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fréquence d'utilisation
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleUsageSelect("very_used")}
                  className={getUsageButtonClass("very_used")}
                >
                  Très utilisé
                </button>
                <button
                  type="button"
                  onClick={() => handleUsageSelect("used")}
                  className={getUsageButtonClass("used")}
                >
                  Utilisé
                </button>
                <button
                  type="button"
                  onClick={() => handleUsageSelect("rarely_used")}
                  className={getUsageButtonClass("rarely_used")}
                >
                  Rarement
                </button>
              </div>
            </div>

            <div className="rounded-lg border p-3 space-y-3">
              <p className="text-sm font-medium">Preuves & justificatifs</p>
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
                Conseil : gardez aussi une copie locale (cloud, disque dur) de vos preuves d'achat et de désabonnement.
              </p>
              <FormField
                control={form.control}
                name="purchaseProofImages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preuves d'achat (images)</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Input type="file" accept="image/*" multiple onChange={(event) => handleImageUpload(event, "purchaseProofImages")} />
                        {field.value?.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {field.value.map((image: string, index: number) => (
                              <div key={index} className="relative">
                                <img src={image} alt={`Preuve d'achat ${index + 1}`} className="h-20 w-20 rounded border object-cover" />
                                <button type="button" className="absolute -top-2 -right-2 rounded-full bg-white border px-1 text-xs" onClick={() => form.setValue("purchaseProofImages", field.value.filter((_: string, i: number) => i !== index), { shouldDirty: true })}>×</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unsubscribeProofImages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preuves de désabonnement (images)</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Input type="file" accept="image/*" multiple onChange={(event) => handleImageUpload(event, "unsubscribeProofImages")} />
                        {field.value?.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {field.value.map((image: string, index: number) => (
                              <div key={index} className="relative">
                                <img src={image} alt={`Preuve de désabonnement ${index + 1}`} className="h-20 w-20 rounded border object-cover" />
                                <button type="button" className="absolute -top-2 -right-2 rounded-full bg-white border px-1 text-xs" onClick={() => form.setValue("unsubscribeProofImages", field.value.filter((_: string, i: number) => i !== index), { shouldDirty: true })}>×</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ajoutez une note sur l'abonnement (utilité, rappel de résiliation, etc.)"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rating"
              render={() => (
                <FormItem>
                  <FormLabel>Note en étoiles</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      {renderStars()}
                      <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                        <div>
                          <p className="text-xs font-medium text-gray-700">Pas encore de note</p>
                          <p className="text-[11px] text-gray-500">Désactivez pour attribuer une note.</p>
                        </div>
                        <Switch
                          checked={form.watch("rating") === null}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              form.setValue("rating", null, { shouldDirty: true });
                            } else if (form.getValues("rating") === null) {
                              form.setValue("rating", 0, { shouldDirty: true });
                            }
                          }}
                        />
                      </div>
                    </div>
                  </FormControl>
                  <p className="text-xs text-gray-600 mt-1">Aidez-vous à prioriser les abonnements suspects ou à surveiller.</p>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-3">
              <FormField
                control={form.control}
                name="isSuspect"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel>Marquer comme suspect</FormLabel>
                      <p className="text-xs text-gray-600">Utile pour les abonnements douteux ou à surveiller.</p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isTrial"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel>Essai gratuit</FormLabel>
                      <p className="text-xs text-gray-600">Affichera l'abonnement dans l'onglet "Essais gratuits".</p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel>Abonnement actif</FormLabel>
                      <p className="text-xs text-gray-600">Désactivez pour classer cet abonnement dans vos archives.</p>
                    </div>
                    <FormControl>
                      <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {isTrial && (
              <FormField
                control={form.control}
                name="trialEndsAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fin de l'essai gratuit</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 pigeon-button-primary"
                >
                  {isSaving ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      {isEditing ? "Mise à jour..." : "Ajout..."}
                    </>
                  ) : (
                    isEditing ? "Mettre à jour" : "Ajouter"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
