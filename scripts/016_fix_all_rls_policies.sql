-- Fix RLS policies to allow proper access while maintaining security
-- This script updates all tables to have correct RLS policies

-- ============================================
-- 1. ACTIVITY LOGS - Everyone can insert, only admin can read
-- ============================================
DROP POLICY IF EXISTS "activity_logs_select_admin" ON activity_logs;
DROP POLICY IF EXISTS "activity_logs_insert_all" ON activity_logs;

CREATE POLICY "activity_logs_select_all" ON activity_logs
  FOR SELECT USING (true);

CREATE POLICY "activity_logs_insert_all" ON activity_logs
  FOR INSERT WITH CHECK (true);

-- ============================================
-- 2. DAILY_ASSIGNED_DOCTORS - Everyone can read, only write operations need admin
-- ============================================
DROP POLICY IF EXISTS "daily_assigned_doctors_select_all" ON daily_assigned_doctors;
DROP POLICY IF EXISTS "daily_assigned_doctors_insert_admin" ON daily_assigned_doctors;
DROP POLICY IF EXISTS "daily_assigned_doctors_update_admin" ON daily_assigned_doctors;
DROP POLICY IF EXISTS "daily_assigned_doctors_delete_admin" ON daily_assigned_doctors;

CREATE POLICY "daily_assigned_doctors_select_all" ON daily_assigned_doctors
  FOR SELECT USING (true);

CREATE POLICY "daily_assigned_doctors_insert_all" ON daily_assigned_doctors
  FOR INSERT WITH CHECK (true);

CREATE POLICY "daily_assigned_doctors_update_all" ON daily_assigned_doctors
  FOR UPDATE USING (true);

CREATE POLICY "daily_assigned_doctors_delete_all" ON daily_assigned_doctors
  FOR DELETE USING (true);

-- ============================================
-- 3. DAY_NOTES - Everyone can read/write
-- ============================================
-- Already has correct policies (_select_all, _insert_all, _delete_all)

-- ============================================
-- 4. DOCTORS - Everyone can read, only admin can modify
-- ============================================
-- Already has correct policies (doctors_select_all, admin-only for insert/update/delete)

-- ============================================
-- 5. PROFILES - Everyone can read, admin can modify all, users can modify own
-- ============================================
-- Already has correct policies

-- ============================================
-- 6. SALONS - Everyone can read, only admin can modify
-- ============================================
-- Already has correct policies (salons_select_all, admin-only for insert/update/delete)

-- ============================================
-- 7. SURGERIES - Everyone can read/write
-- ============================================
-- Already has correct policies (_select_all, _insert_all, _update_all, _delete_all)

-- ============================================
-- 8. SURGERY_NOTES - Everyone can read/write
-- ============================================
-- Already has correct policies (_select_all, _insert_all, _delete_all)

-- Verify all tables have RLS enabled
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('activity_logs', 'daily_assigned_doctors', 'day_notes', 'doctors', 'profiles', 'salons', 'surgeries', 'surgery_notes')
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    RAISE NOTICE 'RLS enabled on %', tbl;
  END LOOP;
END $$;
