import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSubscriptionSchema, insertVoiceReminderSchema, users } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { generateVoiceReminder } from "./services/voice";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";

const normalizeBoolean = (value: any, fallback?: boolean) => {
  if (value === undefined) return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return Boolean(value);
};

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";
type DbUser = typeof users.$inferSelect;

// Configuration email
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  },
  tls: {
    rejectUnauthorized: false
  },
  debug: true // Active les logs de debug
});

// Vérifier la configuration email au démarrage
emailTransporter.verify((error, success) => {
  if (error) {
    console.log('❌ Erreur de configuration email:', error);
    console.log('📧 Variables EMAIL_USER et EMAIL_PASS manquantes ou incorrectes');
  } else {
    console.log('✅ Configuration email OK');
  }
});

// Fonction pour envoyer un email
async function sendResetEmail(email: string, resetToken: string, req: any) {
  const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_USER || 'noreply@pigeonsub.com',
    to: email,
    subject: 'PigeonSub - Réinitialisation de votre mot de passe',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 20px;">
          <img src="https://your-domain.com/pigeongangsta.png" alt="PigeonSub" style="width: 80px; height: 80px;">
          <h1 style="color: hsl(258, 71%, 65%);">PigeonSub</h1>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
          <h2>Réinitialisation de votre mot de passe</h2>
          <p>Vous avez demandé à réinitialiser votre mot de passe pour votre compte PigeonSub.</p>
          <p>Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: hsl(258, 71%, 65%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Réinitialiser mon mot de passe
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
          </p>
        </div>
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>© 2024 PigeonSub - Gérez vos abonnements comme un pro</p>
        </div>
      </div>
    `
  };

  try {
    await emailTransporter.sendMail(mailOptions);
    console.log(`Email de réinitialisation envoyé à ${email}`);
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return false;
  }
}

// Middleware pour vérifier l'authentification
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token d\'accès requis' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: "Tous les champs sont requis" });
      }

      const [existingUser] = await db.select().from(users).where(eq(users.email, email));
      if (existingUser) {
        return res.status(409).json({ message: "Un compte avec cet email existe déjà" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const [created] = await db
        .insert(users)
        .values({ name, email, password: hashedPassword })
        .returning();

      const token = jwt.sign(
        { id: created.id, email: created.email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        token,
        user: { id: created.id, name: created.name, email: created.email }
      });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de l'inscription" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email et mot de passe requis" });
      }

      const [user] = await db.select().from(users).where(eq(users.email, email));
      if (!user) {
        return res.status(401).json({ message: "Email ou mot de passe incorrect" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Email ou mot de passe incorrect" });
      }

      // Créer le token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email }
      });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la connexion" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, req.user.id));
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      res.json({ id: user.id, name: user.name, email: user.email });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération du profil" });
    }
  });

  // Change password
  app.post("/api/auth/change-password", authenticateToken, async (req: any, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Mot de passe actuel et nouveau mot de passe requis" });
      }

      const [user] = await db.select().from(users).where(eq(users.id, req.user.id));
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      // Vérifier le mot de passe actuel
      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Mot de passe actuel incorrect" });
      }

      // Hasher le nouveau mot de passe
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await db
        .update(users)
        .set({ password: hashedNewPassword })
        .where(eq(users.id, user.id));

      res.json({ message: "Mot de passe modifié avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la modification du mot de passe" });
    }
  });

  // Forgot password - send reset email
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email requis" });
      }

      const [user] = await db.select().from(users).where(eq(users.email, email));
      if (!user) {
        // Pour des raisons de sécurité, on retourne toujours le même message
        return res.json({ message: "Si un compte avec cet email existe, un lien de réinitialisation a été envoyé" });
      }

      // Générer un token de réinitialisation
      const resetToken = jwt.sign(
        { id: user.id, email: user.email, type: 'password_reset' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Envoyer l'email de réinitialisation
      const emailSent = await sendResetEmail(email, resetToken, req);

      if (!emailSent) {
        console.log(`Fallback - Lien de réinitialisation pour ${email}: ${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`);
      }

      res.json({ message: "Si un compte avec cet email existe, un lien de réinitialisation a été envoyé" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de l'envoi du lien de réinitialisation" });
    }
  });

  // Reset password with token
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token et nouveau mot de passe requis" });
      }

      // Vérifier le token
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded.type !== 'password_reset') {
        return res.status(400).json({ message: "Token invalide" });
      }

      const [user] = await db.select().from(users).where(eq(users.id, decoded.id));
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, user.id));

      res.json({ message: "Mot de passe réinitialisé avec succès" });
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        return res.status(400).json({ message: "Le lien de réinitialisation a expiré" });
      }
      res.status(500).json({ message: "Erreur lors de la réinitialisation du mot de passe" });
    }
  });

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
      const body = {
        ...req.body,
        price: req.body.price !== undefined ? String(req.body.price) : undefined,
        rating: req.body.rating !== undefined ? Number(req.body.rating) : undefined,
        nextRenewal: req.body.nextRenewal ? new Date(req.body.nextRenewal) : undefined,
        trialEndsAt: req.body.trialEndsAt ? new Date(req.body.trialEndsAt) : undefined,
        isSuspect: normalizeBoolean(req.body.isSuspect, false),
        isTrial: normalizeBoolean(req.body.isTrial, false),
        isActive: normalizeBoolean(req.body.isActive, true),
      };
      const validatedData = insertSubscriptionSchema.parse(body);
      const subscription = await storage.createSubscription(validatedData);
      res.status(201).json(subscription);
    } catch (error) {
      console.error("Subscription creation error:", error);
      res.status(400).json({ message: "Invalid subscription data", error });
    }
  });

  app.put("/api/subscriptions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const body = {
        ...req.body,
        price: req.body.price !== undefined ? String(req.body.price) : undefined,
        rating: req.body.rating !== undefined ? Number(req.body.rating) : undefined,
        nextRenewal: req.body.nextRenewal ? new Date(req.body.nextRenewal) : undefined,
        trialEndsAt: req.body.trialEndsAt ? new Date(req.body.trialEndsAt) : undefined,
        isSuspect: normalizeBoolean(req.body.isSuspect),
        isTrial: normalizeBoolean(req.body.isTrial),
        isActive: normalizeBoolean(req.body.isActive),
      };
      const validatedData = insertSubscriptionSchema.partial().parse(body);
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
      const apiKey = (req.headers["x-elevenlabs-key"] as string | undefined)?.trim();

      if (!reminderType || !text) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const audioUrl = await generateVoiceReminder(text, apiKey);

      const reminder = await storage.createVoiceReminder({
        subscriptionId,
        reminderType,
        audioUrl
      });

      res.json(reminder);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate voice reminder";
      const status = message.includes("ElevenLabs API key") ? 400 : 500;
      res.status(status).json({ message });
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

      const normalizeToMonthly = (sub: any) => {
        const price = parseFloat(sub.price);
        if (sub.frequency === 'yearly') return price / 12;
        if (sub.frequency === 'weekly') return (price * 52) / 12;
        return price;
      };

      const monthlyTotal = subscriptions
        .reduce((sum, sub) => sum + normalizeToMonthly(sub), 0);

      const suspectTotal = subscriptions
        .filter(sub => sub.isSuspect)
        .reduce((sum, sub) => sum + normalizeToMonthly(sub), 0);

      const wastedEstimate = subscriptions
        .filter(sub => sub.usageFrequency === 'rarely_used')
        .reduce((sum, sub) => sum + normalizeToMonthly(sub), 0);

      const budgetCap = parseFloat(process.env.SUBSCRIPTION_BUDGET || '100');
      const budgetGap = Math.max(monthlyTotal - budgetCap, 0);

      res.json({
        totalMonthlyCost: monthlyTotal.toFixed(2),
        activeSubscriptions: subscriptions.length,
        upcomingRenewals: upcomingRenewals.length,
        trialsEnding: trials.filter(t => t.trialEndsAt && t.trialEndsAt <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length,
        trialCount: trials.length,
        suspectMonthly: suspectTotal.toFixed(2),
        wastedEstimate: wastedEstimate.toFixed(2),
        budgetCap,
        budgetGap: budgetGap.toFixed(2)
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}