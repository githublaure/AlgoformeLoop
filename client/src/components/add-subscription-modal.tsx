import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { insertSubscriptionSchema, type Subscription } from "@shared/schema";
import { format } from "date-fns";

interface AddSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription?: Subscription;
}

const formSchema = insertSubscriptionSchema.extend({
  nextRenewal: z.string().min(1, "La date de renouvellement est requise"),
});

type FormData = z.infer<typeof formSchema>;

type CategoryOption = {
  value: string;
  label: string;
  color: string;
};

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
  bgColor: "#4b5563",
  isActive: true,
  isTrial: false,
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
  const [categoryColor, setCategoryColor] = useState<string>(defaultValues.bgColor);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const isEditing = Boolean(subscription);

  const resetForm = () => {
    form.reset(defaultValues);
    setSelectedUsage(defaultValues.usageFrequency);
    setCategoryColor(defaultValues.bgColor);
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
        return [
          ...prev,
          {
            value: subscription.category,
            label: subscription.category,
            color: subscription.bgColor || defaultValues.bgColor,
          },
        ];
      });

      form.reset({
        ...subscription,
        price: subscription.price?.toString() ?? "",
        nextRenewal: formatDateForInput(subscription.nextRenewal),
        bgColor: subscription.bgColor || defaultValues.bgColor,
        iconClass: subscription.iconClass || defaultValues.iconClass,
      });

      setSelectedUsage(subscription.usageFrequency);
      setCategoryColor(subscription.bgColor || defaultValues.bgColor);
    } else {
      resetForm();
    }
  }, [subscription, isOpen, form]);

  const createSubscription = useMutation({
    mutationFn: async (data: FormData) => {
      const subscriptionData = {
        ...data,
        nextRenewal: new Date(data.nextRenewal),
      };
      const response = await apiRequest(
        "POST",
        "/api/subscriptions",
        subscriptionData,
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Abonnement ajouté!",
        description: "Votre nouvel abonnement a été ajouté avec succès.",
      });
      resetForm();
      onClose();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'abonnement.",
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
    if (isEditing) {
      updateSubscription.mutate(data);
    } else {
      createSubscription.mutate(data);
    }
  };

  const handleUsageSelect = (usage: string) => {
    setSelectedUsage(usage);
    form.setValue("usageFrequency", usage);
  };

  const handleCategorySelect = (value: string, onChange: (value: string) => void) => {
    onChange(value);
    const selectedCategory = categories.find((cat) => cat.value === value);
    const color = selectedCategory?.color || defaultValues.bgColor;
    setCategoryColor(color);
    form.setValue("bgColor", color);
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
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
                      <span className="absolute left-3 top-2 text-gray-500">
                        €
                      </span>
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
