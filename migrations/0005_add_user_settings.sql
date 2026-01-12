CREATE TABLE IF NOT EXISTS "user_settings" (
  "id" serial PRIMARY KEY,
  "user_id" integer REFERENCES "users"("id") UNIQUE NOT NULL,
  "budget_cap" numeric(10, 2) DEFAULT 100,
  "created_at" timestamp DEFAULT now()
);
