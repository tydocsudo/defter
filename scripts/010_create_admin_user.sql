-- Create admin user in profiles table
-- Password is stored as plain text (admin123)

INSERT INTO profiles (id, username, password, first_name, last_name, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin',
  'admin123',
  'Admin',
  'User',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (username) DO UPDATE SET
  password = EXCLUDED.password,
  is_admin = true,
  updated_at = NOW();
