-- Insert default salons (2 operating rooms)
INSERT INTO public.salons (name, order_index) VALUES
  ('Salon 1', 1),
  ('Salon 2', 2)
ON CONFLICT DO NOTHING;

-- Insert sample doctors
INSERT INTO public.doctors (name) VALUES
  ('Dr. Ahmet Yılmaz'),
  ('Dr. Mehmet Demir'),
  ('Dr. Ayşe Kaya'),
  ('Dr. Fatma Şahin'),
  ('Dr. Ali Çelik')
ON CONFLICT DO NOTHING;
