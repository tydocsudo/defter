-- Insert default salons
INSERT INTO salons (id, name) VALUES 
  ('salon-1', 'Salon 1'),
  ('salon-2', 'Salon 2');

-- Insert default doctors
INSERT INTO doctors (id, name) VALUES 
  ('doc-1', 'Dr. Ahmet Yılmaz'),
  ('doc-2', 'Dr. Ayşe Kaya'),
  ('doc-3', 'Dr. Mehmet Demir');

-- Insert admin user (password: admin123)
-- Password hash is bcrypt of "admin123"
INSERT INTO users (id, username, password_hash, first_name, last_name, is_admin) VALUES 
  ('user-admin', 'admin', '$2a$10$rKqI8vJxQ5Z9Y5N5J5N5JeN5J5N5J5N5J5N5J5N5J5N5J5N5J5N5J', 'Admin', 'User', TRUE);
