-- Fix RLS policies for profiles table so users can be read
-- Drop old restrictive policy
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;

-- Create new policy that allows everyone to read all profiles
CREATE POLICY "profiles_select_all"
ON profiles
FOR SELECT
TO public
USING (true);

-- Allow users to update their own password
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

CREATE POLICY "profiles_update_own"
ON profiles
FOR UPDATE
TO public
USING (id = auth.uid() OR id IN (SELECT id FROM profiles WHERE username = current_user))
WITH CHECK (id = auth.uid() OR id IN (SELECT id FROM profiles WHERE username = current_user));
