-- Ensure new rating column exists for subscription scoring
ALTER TABLE "subscriptions"
ADD COLUMN IF NOT EXISTS "rating" integer DEFAULT 0;

-- Backfill any NULL ratings to keep UI filtering working
UPDATE "subscriptions" SET "rating" = 0 WHERE "rating" IS NULL;
