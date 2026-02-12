-- Add monthly_overrides column to user_settings
ALTER TABLE user_settings ADD COLUMN monthly_overrides jsonb DEFAULT '{}';