import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSubscriptionSchema, insertVoiceReminderSchema } from "@shared/schema";
import { generateVoiceReminder } from "./services/voice";

export async function registerRoutes(app: Express): Promise<Server> {
  // Subscription routes
  app.get("/api/subscriptions", async (req, res) => {
    try {
      const subscriptions = await storage.getSubscriptions();
      res.json(subscriptions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  app.get("/api/subscriptions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const subscription = await storage.getSubscription(id);
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      res.json(subscription);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  app.post("/api/subscriptions", async (req, res) => {
    try {
      const validatedData = insertSubscriptionSchema.parse(req.body);
      const subscription = await storage.createSubscription(validatedData);
      res.status(201).json(subscription);
    } catch (error) {
      res.status(400).json({ message: "Invalid subscription data", error });
    }
  });

  app.put("/api/subscriptions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertSubscriptionSchema.partial().parse(req.body);
      const subscription = await storage.updateSubscription(id, validatedData);
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      res.json(subscription);
    } catch (error) {
      res.status(400).json({ message: "Invalid subscription data", error });
    }
  });

  app.delete("/api/subscriptions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteSubscription(id);
      if (!deleted) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete subscription" });
    }
  });

  app.get("/api/subscriptions/upcoming/:days", async (req, res) => {
    try {
      const days = parseInt(req.params.days) || 7;
      const subscriptions = await storage.getUpcomingRenewals(days);
      res.json(subscriptions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch upcoming renewals" });
    }
  });

  // Voice reminder routes
  app.post("/api/voice/generate", async (req, res) => {
    try {
      const { subscriptionId, reminderType, text } = req.body;
      
      if (!subscriptionId || !reminderType || !text) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const audioUrl = await generateVoiceReminder(text);
      
      const reminder = await storage.createVoiceReminder({
        subscriptionId,
        reminderType,
        audioUrl
      });

      res.json(reminder);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate voice reminder", error });
    }
  });

  app.get("/api/voice/reminders/:subscriptionId", async (req, res) => {
    try {
      const subscriptionId = parseInt(req.params.subscriptionId);
      const reminders = await storage.getVoiceRemindersBySubscription(subscriptionId);
      res.json(reminders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch voice reminders" });
    }
  });

  // Stats endpoint
  app.get("/api/stats", async (req, res) => {
    try {
      const subscriptions = await storage.getSubscriptions();
      const upcomingRenewals = await storage.getUpcomingRenewals(7);
      const trials = subscriptions.filter(sub => sub.isTrial);
      
      const monthlyTotal = subscriptions
        .filter(sub => sub.frequency === 'monthly')
        .reduce((sum, sub) => sum + parseFloat(sub.price), 0);
      
      const yearlyTotal = subscriptions
        .filter(sub => sub.frequency === 'yearly')
        .reduce((sum, sub) => sum + parseFloat(sub.price) / 12, 0);

      const totalMonthlyCost = monthlyTotal + yearlyTotal;

      res.json({
        totalMonthlyCost: totalMonthlyCost.toFixed(2),
        activeSubscriptions: subscriptions.length,
        upcomingRenewals: upcomingRenewals.length,
        trialsEnding: trials.filter(t => t.trialEndsAt && t.trialEndsAt <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
