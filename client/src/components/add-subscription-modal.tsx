import { useEffect, useState } from "react";
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
  nextRenewal: z.string().min(1, "La date de renouvellement est requise"),
  trialEndsAt: z.string().optional(),
  categoryColor: z.string().optional(),
  note: z.string().optional(),
  rating: z.coerce.number().min(0).max(5).default(0),
  isSuspect: z.coerce.boolean().default(false),
  isTrial: z.coerce.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

type CategoryOption = {
  value: string;
  label: string;
  color: string;
};

const DEFAULT_BG_COLOR = "#4b5563";

const DEFAULT_CATEGORIES: CategoryOption[] = [
  { value: "entertainment", label: "Divertissement", color: "#7c3aed" },
  { value: "music", label: "Musique", color: "#16a34a" },
  { value: "productivity", label: "Productivité", color: "#0ea5e9" },
  { value: "design", label: "Design", color: "#f97316" },
  { value: "cloud", label: "Cloud", color: "#475569" },
  { value: "other", label: "Autre", color: "#6b7280" },
];

const defaultValues: FormData = {
  name: "",
  price: "",
  frequency: "monthly",
  category: "",
  usageFrequency: "used",
  nextRenewal: "",
  iconClass: "fas fa-dove",
  bgColor: DEFAULT_BG_COLOR,
  categoryColor: DEFAULT_BG_COLOR,
  isActive: true,
  isTrial: false,
  isSuspect: false,
  rating: 0,
  note: "",
};

export function AddSubscriptionModal({
  isOpen,
  onClose,
  subscription,
}: AddSubscriptionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUsage, setSelectedUsage] = useState<string>(defaultValues.usageFrequency);
  const [categories, setCategories] = useState<CategoryOption[]>(DEFAULT_CATEGORIES);
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [customCategoryColor, setCustomCategoryColor] = useState("#4b5563");
  const [categoryColor, setCategoryColor] = useState<string>(defaultValues.bgColor ?? DEFAULT_BG_COLOR);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const isTrial = form.watch("isTrial");

  const isEditing = Boolean(subscription);

  const resetForm = () => {
    form.reset(defaultValues);
    setSelectedUsage(defaultValues.usageFrequency);
    setCategoryColor(defaultValues.bgColor ?? DEFAULT_BG_COLOR);
    setCustomCategoryName("");
    setCustomCategoryColor("#4b5563");
  };

  const formatDateForInput = (date: string | Date) => {
    return format(new Date(date), "yyyy-MM-dd");
  };

  useEffect(() => {
    if (!isOpen) return;

    if (subscription) {
      setCategories((prev) => {
        if (prev.some((cat) => cat.value === subscription.category)) {
          return prev;
        }
        const color = subscription.bgColor ?? DEFAULT_BG_COLOR;
        return [
          ...prev,
          {
            value: subscription.category,
            label: subscription.category,
            color,
          },
        ];
      });

      form.reset({
        ...subscription,
        price: subscription.price?.toString() ?? "",
        nextRenewal: formatDateForInput(subscription.nextRenewal),
        bgColor: subscription.bgColor ?? DEFAULT_BG_COLOR,
        iconClass: subscription.iconClass || defaultValues.iconClass,
        rating: subscription.rating ?? 0,
        isSuspect: subscription.isSuspect ?? false,
        note: subscription.note ?? "",
        categoryColor: subscription.categoryColor ?? subscription.bgColor ?? DEFAULT_BG_COLOR,
        trialEndsAt: subscription.trialEndsAt ? formatDateForInput(subscription.trialEndsAt) : undefined,
        isTrial: subscription.isTrial ?? false,
      });

      setSelectedUsage(subscription.usageFrequency);
      setCategoryColor(subscription.bgColor ?? DEFAULT_BG_COLOR);
    } else {
      resetForm();
    }
  }, [subscription, isOpen, form]);

  const createSubscription = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        price: String(data.price ?? ""),
        iconClass: "fas fa-dove",
        bgColor: data.categoryColor || data.bgColor,
        rating: Number(data.rating) || 0,
        isSuspect: Boolean(data.isSuspect),
        nextRenewal: new Date(data.nextRenewal),
        trialEndsAt: data.trialEndsAt ? new Date(data.trialEndsAt) : null,
      };

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
      const subscriptionData = {
        ...data,
        nextRenewal: new Date(data.nextRenewal),
      };
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
    const normalizedData: FormData = {
      ...data,
      usageFrequency: data.usageFrequency || selectedUsage || defaultValues.usageFrequency,
      category: data.category || "other",
      price: (data.price ?? "").toString(),
      rating: data.rating ?? 0,
      categoryColor: data.categoryColor || data.bgColor || DEFAULT_BG_COLOR,
      bgColor: data.categoryColor || data.bgColor || DEFAULT_BG_COLOR,
      note: data.note?.trim() ?? "",
      trialEndsAt: data.isTrial ? data.trialEndsAt : undefined,
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

    setCategories((prev) => {
      if (prev.some((cat) => cat.value.toLowerCase() === normalized)) return prev;
      return [...prev, newCategory];
    });

    form.setValue("category", name);
    form.setValue("bgColor", customCategoryColor);
    form.setValue("categoryColor", customCategoryColor);
    setCategoryColor(customCategoryColor);
    setCustomCategoryName("");
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
    const currentRating = form.watch("rating") ?? 0;

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
              aria-label={`Noter ${star} étoiles`}
            >
              <Star
                className={`h-5 w-5 ${isActive ? "text-yellow-400" : "text-gray-300"}`}
                fill={isActive ? "currentColor" : "none"}
              />
            </button>
          );
        })}
        <span className="ml-2 text-xs text-gray-600">{currentRating}/5</span>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifier l'abonnement" : "Ajouter un abonnement"}</DialogTitle>
        </DialogHeader>

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
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
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
                    {renderStars()}
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
      </DialogContent>
    </Dialog>
  );
}
