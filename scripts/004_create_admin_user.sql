-- Create a default admin user for initial setup
-- Username: admin
-- Password: admin123
-- This should be changed after first login

-- Insert admin user directly (bypassing trigger since we're setting up manually)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@surgery-system.local',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"username":"admin","first_name":"Admin","last_name":"User","is_admin":true}',
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
)
ON CONFLICT DO NOTHING;

-- Get the user ID and insert profile
DO $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id FROM auth.users WHERE email = 'admin@surgery-system.local';
  
  IF user_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, username, first_name, last_name, is_admin)
    VALUES (user_id, 'admin', 'Admin', 'User', TRUE)
    ON CONFLICT (id) DO UPDATE
    SET is_admin = TRUE;
  END IF;
END $$;
