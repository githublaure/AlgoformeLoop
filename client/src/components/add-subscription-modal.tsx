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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { insertSubscriptionSchema, type Subscription } from "@shared/schema";

interface AddSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription?: Subscription | null;
}

type CategoryOption = {
  value: string;
  label: string;
  color: string;
};

const defaultCategories: CategoryOption[] = [
  { value: "entertainment", label: "Divertissement", color: "#a855f7" },
  { value: "music", label: "Musique", color: "#22c55e" },
  { value: "productivity", label: "Productivité", color: "#06b6d4" },
  { value: "design", label: "Design", color: "#f97316" },
  { value: "cloud", label: "Cloud", color: "#3b82f6" },
  { value: "self_growth", label: "Développement personnel", color: "#f59e0b" },
  { value: "other", label: "Autre", color: "#6b7280" },
];

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

const defaultValues: FormData = {
  name: "",
  price: "",
  frequency: "monthly",
  category: "",
  categoryColor: "#7c3aed",
  usageFrequency: "used",
  nextRenewal: "",
  iconClass: "fas fa-dove",
  bgColor: "#7c3aed",
  isActive: true,
  isTrial: false,
  trialEndsAt: "",
  note: "",
  rating: 0,
  isSuspect: false,
};

export function AddSubscriptionModal({
  isOpen,
  onClose,
  subscription,
}: AddSubscriptionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUsage, setSelectedUsage] = useState<string>(defaultValues.usageFrequency);
  const [categories, setCategories] = useState<CategoryOption[]>(defaultCategories);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#8b5cf6");

  const isEditing = Boolean(subscription);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const rating = form.watch("rating");

  useEffect(() => {
    if (!isOpen) return;
    const stored = localStorage.getItem("pigeonsub.categories");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CategoryOption[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCategories(parsed);
        }
      } catch (error) {
        console.warn("Unable to parse stored categories", error);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (categories.length > 0) {
      localStorage.setItem("pigeonsub.categories", JSON.stringify(categories));
    }
  }, [categories]);

  useEffect(() => {
    if (subscription && isOpen) {
      const nextRenewal = subscription.nextRenewal
        ? new Date(subscription.nextRenewal).toISOString().split("T")[0]
        : "";
      const trialEndsAt = subscription.trialEndsAt
        ? new Date(subscription.trialEndsAt).toISOString().split("T")[0]
        : "";

      form.reset({
        name: subscription.name,
        price: subscription.price,
        frequency: subscription.frequency,
        category: subscription.category,
        usageFrequency: subscription.usageFrequency,
        nextRenewal,
        trialEndsAt,
        rating: subscription.rating ?? 0,
        isSuspect: subscription.isSuspect ?? false,
        isTrial: subscription.isTrial ?? false,
        note: subscription.note ?? "",
        categoryColor: subscription.categoryColor || subscription.bgColor || defaultValues.categoryColor,
        bgColor: subscription.categoryColor || subscription.bgColor || defaultValues.bgColor,
        iconClass: "fas fa-dove",
        isActive: subscription.isActive ?? true,
      });
      setSelectedUsage(subscription.usageFrequency);
    } else if (isOpen) {
      form.reset(defaultValues);
      setSelectedUsage(defaultValues.usageFrequency);
    }
  }, [subscription, isOpen, form]);

  const createOrUpdateSubscription = useMutation({
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
      form.reset(defaultValues);
      setSelectedUsage(defaultValues.usageFrequency);
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

  const onSubmit = (data: FormData) => {
    createOrUpdateSubscription.mutate(data);
  };

  const handleUsageSelect = (usage: string) => {
    setSelectedUsage(usage);
    form.setValue("usageFrequency", usage);
  };

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

  const renderStars = () => {
    return (
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            type="button"
            key={star}
            onClick={() => form.setValue("rating", star, { shouldValidate: true })}
            className="text-xl"
            aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
          >
            <Star
              size={22}
              className={
                star <= (rating || 0)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }
            />
            onClick={() => form.setValue("rating", star)}
            className="text-xl"
            aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
          >
            <i
              className={`fas fa-star ${star <= (rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
            ></i>
          </button>
        ))}
        <span className="text-sm text-gray-600">{rating ? `${rating}/5` : "Aucune note"}</span>
      </div>
    );
  };

  const handleCategorySelect = (value: string) => {
    const selected = categories.find((cat) => cat.value === value);
    form.setValue("category", value);
    if (selected) {
      form.setValue("categoryColor", selected.color);
      form.setValue("bgColor", selected.color);
    }
  };

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const value = slugify(newCategoryName);
    const newCategory: CategoryOption = {
      value,
      label: newCategoryName.trim(),
      color: newCategoryColor,
    };
    setCategories((prev) => {
      const filtered = prev.filter((cat) => cat.value !== value);
      return [...filtered, newCategory];
    });
    setNewCategoryName("");
    setNewCategoryColor("#8b5cf6");
  };

  const isTrial = form.watch("isTrial");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifier l'abonnement" : "Ajouter un abonnement"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleCategorySelect(value);
                    }}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner la catégorie" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          <div className="flex items-center space-x-2">
                            <span
                              className="inline-block h-3 w-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            ></span>
                            <span>{category.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="mt-3 space-y-2 rounded-lg border p-3">
                    <p className="text-sm text-gray-600">Ajouter une catégorie</p>
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder="Nom de la catégorie"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                      />
                      <Input
                        type="color"
                        className="h-10 w-16"
                        value={newCategoryColor}
                        onChange={(e) => setNewCategoryColor(e.target.value)}
                      />
                      <Button type="button" variant="outline" onClick={handleAddCategory}>
                        <i className="fas fa-plus mr-1" />
                        Ajouter
                      </Button>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Couleur de la catégorie</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-3">
                      <Input type="color" className="h-10 w-16" value={field.value} onChange={field.onChange} />
                      <span className="text-sm text-gray-600">Le pigeon s'affichera avec cette couleur.</span>
                    </div>
                  </FormControl>
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
                onClick={onClose}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={createOrUpdateSubscription.isPending}
                className="flex-1 pigeon-button-primary"
              >
                {createOrUpdateSubscription.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    {isEditing ? "Enregistrement..." : "Ajout..."}
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
