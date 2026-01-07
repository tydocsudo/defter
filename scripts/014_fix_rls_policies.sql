-- Fix RLS policies for salons and doctors to allow public read access
-- The issue is that RLS is enabled but the SELECT policies are too restrictive

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "salons_select_all" ON salons;
DROP POLICY IF EXISTS "doctors_select_all" ON doctors;

-- Create new permissive SELECT policies that allow everyone to read
CREATE POLICY "salons_select_all" ON salons
  FOR SELECT
  USING (true);  -- Allow all users to read salons

CREATE POLICY "doctors_select_all" ON doctors
  FOR SELECT
  USING (true);  -- Allow all users to read doctors

-- Verify RLS is enabled on both tables
ALTER TABLE salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
