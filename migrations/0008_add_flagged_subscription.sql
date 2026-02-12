ALTER TABLE "subscriptions"
  ADD COLUMN IF NOT EXISTS "is_flagged" boolean DEFAULT false;
