BEGIN;

-- Ensure the user exists (create if not exists)
INSERT INTO users (name, email, password)
SELECT 'yoopiyo', 'yoopiyo@example.com', 'changeme_hashed_placeholder'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'yoopiyo@example.com');

-- If you ran the previous insert, replace the placeholder password with a secure one
-- (or create the user manually via your admin tools). The script above only
-- ensures a record exists so we can associate orphan subscriptions.

-- Assign orphan subscriptions (user_id IS NULL) to the 'yoopiyo' account
UPDATE subscriptions
SET user_id = (
  SELECT id FROM users WHERE email = 'yoopiyo@example.com' LIMIT 1
)
WHERE user_id IS NULL;

COMMIT;

-- Notes:
-- 1) The SQL above will create a user with a placeholder password. Replace it by
--    running an UPDATE to set a hashed password or create the user with your usual signup flow.
-- 2) Run this migration in a safe environment (backup DB before running if unsure).
