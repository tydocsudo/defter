-- Enable Row Level Security on all tables
-- This script enables RLS on all tables to resolve Supabase warnings

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on salons table
ALTER TABLE salons ENABLE ROW LEVEL SECURITY;

-- Enable RLS on doctors table
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- Enable RLS on surgeries table
ALTER TABLE surgeries ENABLE ROW LEVEL SECURITY;

-- Enable RLS on surgery_notes table
ALTER TABLE surgery_notes ENABLE ROW LEVEL SECURITY;

-- Enable RLS on day_notes table
ALTER TABLE day_notes ENABLE ROW LEVEL SECURITY;

-- Enable RLS on daily_assigned_doctors table
ALTER TABLE daily_assigned_doctors ENABLE ROW LEVEL SECURITY;

-- Note: activity_logs already has RLS enabled
