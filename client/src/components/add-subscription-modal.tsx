import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { insertSubscriptionSchema } from "@shared/schema";

interface AddSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = insertSubscriptionSchema.extend({
  nextRenewal: z.string().min(1, "La date de renouvellement est requise"),
});

type FormData = z.infer<typeof formSchema>;

export function AddSubscriptionModal({ isOpen, onClose }: AddSubscriptionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUsage, setSelectedUsage] = useState<string>("");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      price: "",
      frequency: "monthly",
      category: "",
      usageFrequency: "used",
      nextRenewal: "",
      iconClass: "fas fa-cube",
      bgColor: "bg-gray-600",
      isActive: true,
      isTrial: false,
    },
  });

  const createSubscription = useMutation({
    mutationFn: async (data: FormData) => {
      const subscriptionData = {
        ...data,
        nextRenewal: new Date(data.nextRenewal),
      };
      const response = await apiRequest("POST", "/api/subscriptions", subscriptionData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Abonnement ajouté!",
        description: "Votre nouvel abonnement a été ajouté avec succès.",
      });
      form.reset();
      setSelectedUsage("");
      onClose();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'abonnement.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: FormData) => {
    createSubscription.mutate(data);
  };

  const handleUsageSelect = (usage: string) => {
    setSelectedUsage(usage);
    form.setValue("usageFrequency", usage);
  };

  const getUsageButtonClass = (usage: string) => {
    const baseClass = "px-3 py-2 text-xs rounded-lg transition-colors";
    const isSelected = selectedUsage === usage;
    
    switch (usage) {
      case 'very_used':
        return `${baseClass} ${isSelected ? 'ring-2 ring-offset-2 ring-gray-400' : ''} pigeon-button-secondary`;
      case 'used':
        return `${baseClass} ${isSelected ? 'ring-2 ring-offset-2 ring-gray-400' : ''} pigeon-button-secondary`;
      case 'rarely_used':
        return `${baseClass} ${isSelected ? 'ring-2 ring-offset-2 ring-gray-400' : ''} bg-red-500 hover:bg-red-600 text-white`;
      default:
        return baseClass;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un abonnement</DialogTitle>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner la catégorie" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="entertainment">Divertissement</SelectItem>
                      <SelectItem value="music">Musique</SelectItem>
                      <SelectItem value="productivity">Productivité</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="cloud">Cloud</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
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
                  onClick={() => handleUsageSelect('very_used')}
                  className={getUsageButtonClass('very_used')}
                >
                  Très utilisé
                </button>
                <button 
                  type="button" 
                  onClick={() => handleUsageSelect('used')}
                  className={getUsageButtonClass('used')}
                >
                  Utilisé
                </button>
                <button 
                  type="button" 
                  onClick={() => handleUsageSelect('rarely_used')}
                  className={getUsageButtonClass('rarely_used')}
                >
                  Rarement
                </button>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={createSubscription.isPending}
                className="flex-1 pigeon-button-primary"
              >
                {createSubscription.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Ajout...
                  </>
                ) : (
                  "Ajouter"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
