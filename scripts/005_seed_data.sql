-- Seed script to add initial data to database
-- Run this script after creating the tables

-- Insert default salons
INSERT INTO public.salons (id, name, order_index) VALUES
  (gen_random_uuid(), 'Salon 1', 1),
  (gen_random_uuid(), 'Salon 2', 2)
ON CONFLICT DO NOTHING;

-- Insert sample doctors
INSERT INTO public.doctors (id, name) VALUES
  (gen_random_uuid(), 'Prof. Dr. Ahmet Yılmaz'),
  (gen_random_uuid(), 'Doç. Dr. Mehmet Demir'),
  (gen_random_uuid(), 'Op. Dr. Ayşe Kaya'),
  (gen_random_uuid(), 'Op. Dr. Fatma Şahin'),
  (gen_random_uuid(), 'Op. Dr. Ali Çelik')
ON CONFLICT DO NOTHING;
