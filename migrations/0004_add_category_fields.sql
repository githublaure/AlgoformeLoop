DO $$
BEGIN
  -- Add category_color column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'category_color'
  ) THEN
    ALTER TABLE "subscriptions" ADD COLUMN "category_color" text DEFAULT '#7c3aed';
  END IF;

  -- Add icon_class column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'icon_class'
  ) THEN
    ALTER TABLE "subscriptions" ADD COLUMN "icon_class" text;
  END IF;

  -- Add bg_color column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'bg_color'
  ) THEN
    ALTER TABLE "subscriptions" ADD COLUMN "bg_color" text;
  END IF;

  -- Add note column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'note'
  ) THEN
    ALTER TABLE "subscriptions" ADD COLUMN "note" text;
  END IF;
END $$;
