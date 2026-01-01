ALTER TABLE "subscriptions" ADD COLUMN "user_id" integer REFERENCES "users"("id");
CREATE INDEX IF NOT EXISTS "subscriptions_user_idx" ON "subscriptions" ("user_id");
