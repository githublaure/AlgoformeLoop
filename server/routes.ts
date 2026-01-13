import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSubscriptionSchema, insertVoiceReminderSchema, users } from "@shared/schema";
// db is imported lazily inside functions to avoid requiring DATABASE_URL during tests
import { eq, sql } from "drizzle-orm";
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

let schemaReady = false;

async function backfillOrphanSubscriptions(userId: number) {
  // Ré-associe les abonnements historiques sans user_id à l'utilisateur courant
  const { db } = await import('./db');
  await db.execute(sql`
    UPDATE "subscriptions"
    SET "user_id" = ${userId}
    WHERE "user_id" IS NULL
  `);
}

async function ensureSchema() {
  if (schemaReady) return;
  const { db } = await import('./db');

  // Users table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "users" (
      "id" serial PRIMARY KEY,
      "name" text NOT NULL,
      "email" text NOT NULL UNIQUE,
      "password" text NOT NULL,
      "created_at" timestamp DEFAULT now()
    );
  `);

  // Subscriptions table with user relation
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "subscriptions" (
      "id" serial PRIMARY KEY,
      "user_id" integer REFERENCES "users"("id"),
      "name" text NOT NULL,
      "price" numeric(10, 2) NOT NULL,
      "frequency" text NOT NULL,
      "category" text NOT NULL,
      "category_color" text DEFAULT '#7c3aed',
      "usage_frequency" text NOT NULL,
      "next_renewal" timestamp,
      "icon_class" text,
      "bg_color" text,
      "note" text,
      "rating" integer,
      "is_suspect" boolean DEFAULT false,
      "is_active" boolean DEFAULT true,
      "is_trial" boolean DEFAULT false,
      "trial_ends_at" timestamp,
      "purchase_date" timestamp,
      "created_at" timestamp DEFAULT now()
    );
  `);

  // User settings table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "user_settings" (
      "id" serial PRIMARY KEY,
      "user_id" integer REFERENCES "users"("id") UNIQUE NOT NULL,
      "budget_cap" numeric(10, 2) DEFAULT 100,
      "created_at" timestamp DEFAULT now()
    );
  `);

  // Ensure user_id column exists when table already present without migration
  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscriptions' AND column_name = 'user_id'
      ) THEN
        ALTER TABLE "subscriptions" ADD COLUMN "user_id" integer REFERENCES "users"("id");
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscriptions' AND column_name = 'category_color'
      ) THEN
        ALTER TABLE "subscriptions" ADD COLUMN "category_color" text DEFAULT '#7c3aed';
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscriptions' AND column_name = 'icon_class'
      ) THEN
        ALTER TABLE "subscriptions" ADD COLUMN "icon_class" text;
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscriptions' AND column_name = 'bg_color'
      ) THEN
        ALTER TABLE "subscriptions" ADD COLUMN "bg_color" text;
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscriptions' AND column_name = 'note'
      ) THEN
        ALTER TABLE "subscriptions" ADD COLUMN "note" text;
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscriptions' AND column_name = 'rating'
      ) THEN
        ALTER TABLE "subscriptions" ADD COLUMN "rating" integer;
      END IF;
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscriptions'
          AND column_name = 'rating'
          AND column_default IS NOT NULL
      ) THEN
        ALTER TABLE "subscriptions" ALTER COLUMN "rating" DROP DEFAULT;
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscriptions' AND column_name = 'is_suspect'
      ) THEN
        ALTER TABLE "subscriptions" ADD COLUMN "is_suspect" boolean DEFAULT false;
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscriptions' AND column_name = 'is_active'
      ) THEN
        ALTER TABLE "subscriptions" ADD COLUMN "is_active" boolean DEFAULT true;
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscriptions' AND column_name = 'is_trial'
      ) THEN
        ALTER TABLE "subscriptions" ADD COLUMN "is_trial" boolean DEFAULT false;
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscriptions' AND column_name = 'trial_ends_at'
      ) THEN
        ALTER TABLE "subscriptions" ADD COLUMN "trial_ends_at" timestamp;
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscriptions' AND column_name = 'purchase_date'
      ) THEN
        ALTER TABLE "subscriptions" ADD COLUMN "purchase_date" timestamp;
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscriptions' AND column_name = 'created_at'
      ) THEN
        ALTER TABLE "subscriptions" ADD COLUMN "created_at" timestamp DEFAULT now();
      END IF;
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscriptions'
          AND column_name = 'next_renewal'
          AND is_nullable = 'NO'
      ) THEN
        ALTER TABLE "subscriptions" ALTER COLUMN "next_renewal" DROP NOT NULL;
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_settings' AND column_name = 'budget_cap'
      ) THEN
        ALTER TABLE "user_settings" ADD COLUMN "budget_cap" numeric(10, 2) DEFAULT 100;
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_settings' AND column_name = 'created_at'
      ) THEN
        ALTER TABLE "user_settings" ADD COLUMN "created_at" timestamp DEFAULT now();
      END IF;
    END $$;
  `);

  // Voice reminders table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "voice_reminders" (
      "id" serial PRIMARY KEY,
      "subscription_id" integer REFERENCES "subscriptions"("id"),
      "audio_url" text,
      "reminder_type" text NOT NULL,
      "created_at" timestamp DEFAULT now()
    );
  `);

  schemaReady = true;
}

// Configuration email
const hasEmailConfig = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

const emailTransporter = hasEmailConfig
  ? nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
      debug: true, // Active les logs de debug
    })
  : null;

// Vérifier la configuration email au démarrage
if (emailTransporter) {
  emailTransporter.verify((error) => {
    if (error) {
      console.log("❌ Erreur de configuration email:", error);
      console.log("📧 Variables EMAIL_USER et EMAIL_PASS manquantes ou incorrectes");
    } else {
      console.log("✅ Configuration email OK");
    }
  });
} else {
  console.log("📧 Configuration email désactivée - variables manquantes");
}

// Fonction pour envoyer un email
async function sendResetEmail(email: string, resetToken: string, req: any) {
  const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;

  if (!emailTransporter) {
    console.log("📧 Impossible d'envoyer l'email de réinitialisation: configuration manquante");
    return false;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER || "noreply@pigeonsub.com",
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
  // Skip schema creation in test env to avoid requiring DATABASE_URL
  if (process.env.NODE_ENV !== 'test') await ensureSchema();

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      await ensureSchema();
      const { db } = await import('./db');

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
      console.error("Erreur lors de l'inscription:", error);
      res.status(500).json({ message: "Erreur lors de l'inscription" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      await ensureSchema();
      const { db } = await import('./db');

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
      console.error("Erreur lors de la connexion:", error);
      res.status(500).json({ message: "Erreur lors de la connexion" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    try {
      await ensureSchema();
      const { db } = await import('./db');

      const [user] = await db.select().from(users).where(eq(users.id, req.user.id));
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      res.json({ id: user.id, name: user.name, email: user.email });
    } catch (error) {
      console.error("Erreur lors de la récupération du profil:", error);
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

      const { db } = await import('./db');
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

      const { db } = await import('./db');
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

      const { db } = await import('./db');
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
  app.get("/api/subscriptions", authenticateToken, async (req: any, res) => {
    try {
      await ensureSchema();
      const includeArchived = normalizeBoolean(req.query.includeArchived, false);
      const subscriptions = await storage.getSubscriptions(req.user.id, includeArchived);
      res.json(subscriptions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  app.get("/api/subscriptions/:id", authenticateToken, async (req: any, res) => {
    try {
      await ensureSchema();
      const id = parseInt(req.params.id);
      const subscription = await storage.getSubscription(id, req.user.id);
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      res.json(subscription);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  app.post("/api/subscriptions", authenticateToken, async (req: any, res) => {
    const createOnce = async () => {
      await ensureSchema();
      const body = {
        ...req.body,
        price: req.body.price !== undefined ? String(req.body.price) : undefined,
        rating: req.body.rating === null
          ? null
          : req.body.rating !== undefined
            ? Number(req.body.rating)
            : undefined,
        nextRenewal: req.body.nextRenewal === null
          ? null
          : req.body.nextRenewal
            ? new Date(req.body.nextRenewal)
            : undefined,
        purchaseDate: req.body.purchaseDate === null
          ? null
          : req.body.purchaseDate
            ? new Date(req.body.purchaseDate)
            : undefined,
        trialEndsAt: req.body.trialEndsAt ? new Date(req.body.trialEndsAt) : undefined,
        isSuspect: normalizeBoolean(req.body.isSuspect, false),
        isTrial: normalizeBoolean(req.body.isTrial, false),
        isActive: normalizeBoolean(req.body.isActive, true),
      };
      // Toujours associer l'abonnement à l'utilisateur authentifié, même si le client
      // n'envoie pas explicitement l'identifiant. Sans cela, l'abonnement resterait
      // orphelin et ne remonterait pas dans le dashboard filtré par userId.
      const validatedData = insertSubscriptionSchema.parse({ ...body, userId: req.user.id });
      const subscription = await storage.createSubscription(validatedData);

      // Sécurise la réponse afin que le client récupère bien l'association utilisateur
      // nécessaire à l'affichage.
      res.status(201).json({ ...subscription, userId: req.user.id });
    };

    try {
      await createOnce();
    } catch (error: any) {
      // Si la base est en retard sur la création de colonnes, on re-synchronise le schéma
      // puis on retente l'insertion une seule fois pour éviter une boucle infinie.
      if (error?.code === "42703") {
        console.warn("Column missing during insert, re-running schema sync...");
        schemaReady = false;
        await ensureSchema();
        await createOnce();
        return;
      }

      console.error("Subscription creation error:", error);
      res.status(400).json({ message: "Invalid subscription data", error });
    }
  });

  app.put("/api/subscriptions/:id", authenticateToken, async (req: any, res) => {
    try {
      await ensureSchema();
      const id = parseInt(req.params.id);
      const body = {
        ...req.body,
        price: req.body.price !== undefined ? String(req.body.price) : undefined,
        rating: req.body.rating === null
          ? null
          : req.body.rating !== undefined
            ? Number(req.body.rating)
            : undefined,
        nextRenewal: req.body.nextRenewal === null
          ? null
          : req.body.nextRenewal
            ? new Date(req.body.nextRenewal)
            : undefined,
        purchaseDate: req.body.purchaseDate === null
          ? null
          : req.body.purchaseDate
            ? new Date(req.body.purchaseDate)
            : undefined,
        trialEndsAt: req.body.trialEndsAt ? new Date(req.body.trialEndsAt) : undefined,
        isSuspect: normalizeBoolean(req.body.isSuspect),
        isTrial: normalizeBoolean(req.body.isTrial),
        isActive: normalizeBoolean(req.body.isActive),
      };
      const validatedData = insertSubscriptionSchema.partial().parse(body);
      delete (validatedData as any).userId;
      const subscription = await storage.updateSubscription(id, req.user.id, validatedData);
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      res.json({ ...subscription, userId: req.user.id });
    } catch (error) {
      res.status(400).json({ message: "Invalid subscription data", error });
    }
  });

  app.delete("/api/subscriptions/:id", authenticateToken, async (req: any, res) => {
    try {
      await ensureSchema();
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteSubscription(id, req.user.id);
      if (!deleted) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete subscription" });
    }
  });

  app.get("/api/subscriptions/upcoming/:days", authenticateToken, async (req: any, res) => {
    try {
      await ensureSchema();
      const days = parseInt(req.params.days) || 7;
      const subscriptions = await storage.getUpcomingRenewals(days, req.user.id);
      res.json(subscriptions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch upcoming renewals" });
    }
  });

  // User settings routes
  app.get("/api/settings", authenticateToken, async (req: any, res) => {
    try {
      await ensureSchema();
      const settings = await storage.getUserSettings(req.user.id);
      const fallbackBudget = parseFloat(process.env.SUBSCRIPTION_BUDGET || "100");
      res.json({
        budgetCap: settings?.budgetCap ?? fallbackBudget,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put("/api/settings/budget", authenticateToken, async (req: any, res) => {
    try {
      await ensureSchema();
      const rawBudget = req.body?.budgetCap;
      const parsed = Number(rawBudget);
      if (!Number.isFinite(parsed) || parsed < 0) {
        return res.status(400).json({ message: "Invalid budget cap" });
      }
      const saved = await storage.setUserBudgetCap(req.user.id, parsed.toFixed(2));
      res.json({ budgetCap: saved.budgetCap });
    } catch (error) {
      res.status(500).json({ message: "Failed to update budget cap" });
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

  app.get("/api/voice/reminders", async (_req, res) => {
    try {
      const reminders = await storage.getVoiceReminders();
      res.json(reminders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch voice reminders" });
    }
  });

  // Stats endpoint
  app.get("/api/stats", authenticateToken, async (req: any, res) => {
    try {
      // Skip schema creation in tests
      if (process.env.NODE_ENV !== 'test') await ensureSchema();
      const includeArchived = normalizeBoolean(req.query.includeArchived, false);
      const includeLifetime = normalizeBoolean(req.query.includeLifetime, false);
      const subscriptions = await storage.getSubscriptions(req.user.id, includeArchived);
      const upcomingRenewals = await storage.getUpcomingRenewals(7, req.user.id);
      const trials = subscriptions.filter(sub => sub.isTrial);

      const normalizeToMonthly = (sub: any) => {
        const price = parseFloat(sub.price);
        if (!Number.isFinite(price)) return 0;
        if (sub.frequency === 'yearly') return price / 12;
        if (sub.frequency === 'weekly') return (price * 52) / 12;
        if (sub.frequency === 'lifetime') {
          if (!includeLifetime) return 0;
          if (!sub.purchaseDate) return 0;
          const purchaseDate = new Date(sub.purchaseDate);
          if (Number.isNaN(purchaseDate.getTime())) return 0;
          const cutoff = new Date(purchaseDate);
          cutoff.setFullYear(cutoff.getFullYear() + 1);
          if (new Date() >= cutoff) return 0;
          return price / 12;
        }
        return price;
      };

      const monthlyTotal = subscriptions
        .reduce((sum, sub) => sum + normalizeToMonthly(sub), 0);

      // Consider only suspect subscriptions that are not marked as 'very_used'
      const suspectTotal = subscriptions
        .filter(sub => sub.isSuspect && sub.usageFrequency !== 'very_used')
        .reduce((sum, sub) => sum + normalizeToMonthly(sub), 0);

      const suspectCount = subscriptions.filter(sub => sub.isSuspect && sub.usageFrequency !== 'very_used').length;

      const wastedEstimate = subscriptions
        .filter(sub => sub.usageFrequency === 'rarely_used')
        .reduce((sum, sub) => sum + normalizeToMonthly(sub), 0);

      const categoryTotals = subscriptions.reduce<Record<string, number>>((acc, sub) => {
        const monthly = normalizeToMonthly(sub);
        acc[sub.category] = (acc[sub.category] || 0) + monthly;
        return acc;
      }, {});

      const usageBreakdown = subscriptions.reduce<Record<string, number>>((acc, sub) => {
        acc[sub.usageFrequency] = (acc[sub.usageFrequency] || 0) + 1;
        return acc;
      }, { very_used: 0, used: 0, rarely_used: 0 });

      const settings = await storage.getUserSettings(req.user.id);
      const budgetCap = Number(settings?.budgetCap ?? process.env.SUBSCRIPTION_BUDGET ?? '100');
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
        budgetGap: budgetGap.toFixed(2),
        suspectCount,
        categoryTotals,
        usageBreakdown
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
