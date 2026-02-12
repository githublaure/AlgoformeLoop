ALTER TABLE "subscriptions"
  ADD COLUMN IF NOT EXISTS "safety_date" timestamp,
  ADD COLUMN IF NOT EXISTS "purchase_proof_image" text,
  ADD COLUMN IF NOT EXISTS "unsubscribe_proof_image" text,
  ADD COLUMN IF NOT EXISTS "use_safety_date" boolean DEFAULT false;
