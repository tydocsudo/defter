-- Create profiles table with admin and user roles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles (all authenticated users can read, only admins can modify)
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "profiles_insert_admin" ON public.profiles FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
CREATE POLICY "profiles_delete_admin" ON public.profiles FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Create salons (operating rooms) table
CREATE TABLE IF NOT EXISTS public.salons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "salons_select_all" ON public.salons FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "salons_insert_admin" ON public.salons FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
CREATE POLICY "salons_update_admin" ON public.salons FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
CREATE POLICY "salons_delete_admin" ON public.salons FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Create doctors table
CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "doctors_select_all" ON public.doctors FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "doctors_insert_admin" ON public.doctors FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
CREATE POLICY "doctors_update_admin" ON public.doctors FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
CREATE POLICY "doctors_delete_admin" ON public.doctors FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Create surgeries table
CREATE TABLE IF NOT EXISTS public.surgeries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name TEXT NOT NULL,
  protocol_number TEXT NOT NULL,
  indication TEXT NOT NULL,
  procedure_name TEXT NOT NULL,
  responsible_doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  senior_resident_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  junior_resident_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  phone_number_1 TEXT NOT NULL,
  phone_number_2 TEXT NOT NULL,
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  surgery_date DATE NOT NULL,
  is_waiting_list BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  order_index INTEGER DEFAULT 0
);

ALTER TABLE public.surgeries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "surgeries_select_all" ON public.surgeries FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "surgeries_insert_all" ON public.surgeries FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "surgeries_update_all" ON public.surgeries FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "surgeries_delete_all" ON public.surgeries FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create surgery notes table (patient-specific notes)
CREATE TABLE IF NOT EXISTS public.surgery_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surgery_id UUID REFERENCES public.surgeries(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.surgery_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "surgery_notes_select_all" ON public.surgery_notes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "surgery_notes_insert_all" ON public.surgery_notes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "surgery_notes_delete_all" ON public.surgery_notes FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create day notes table (salon-specific day notes)
CREATE TABLE IF NOT EXISTS public.day_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  note_date DATE NOT NULL,
  note TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(salon_id, note_date, created_by, note)
);

ALTER TABLE public.day_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "day_notes_select_all" ON public.day_notes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "day_notes_insert_all" ON public.day_notes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "day_notes_delete_all" ON public.day_notes FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create daily assigned doctors table (one doctor per salon per day)
CREATE TABLE IF NOT EXISTS public.daily_assigned_doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
  assigned_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(salon_id, assigned_date)
);

ALTER TABLE public.daily_assigned_doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_assigned_doctors_select_all" ON public.daily_assigned_doctors FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "daily_assigned_doctors_insert_admin" ON public.daily_assigned_doctors FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
CREATE POLICY "daily_assigned_doctors_update_admin" ON public.daily_assigned_doctors FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
CREATE POLICY "daily_assigned_doctors_delete_admin" ON public.daily_assigned_doctors FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Create activity log table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_logs_select_admin" ON public.activity_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
CREATE POLICY "activity_logs_insert_all" ON public.activity_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_surgeries_date ON public.surgeries(surgery_date);
CREATE INDEX IF NOT EXISTS idx_surgeries_salon ON public.surgeries(salon_id);
CREATE INDEX IF NOT EXISTS idx_surgeries_waiting_list ON public.surgeries(is_waiting_list);
CREATE INDEX IF NOT EXISTS idx_day_notes_date ON public.day_notes(note_date);
CREATE INDEX IF NOT EXISTS idx_day_notes_salon ON public.day_notes(salon_id);
CREATE INDEX IF NOT EXISTS idx_daily_assigned_doctors_date ON public.daily_assigned_doctors(assigned_date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at);
