-- Cloudflare D1 Database Schema for Surgery Calendar System

-- Profiles table (users)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  is_admin INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Salons (operating rooms) table
CREATE TABLE IF NOT EXISTS salons (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Surgeries table
CREATE TABLE IF NOT EXISTS surgeries (
  id TEXT PRIMARY KEY,
  patient_name TEXT NOT NULL,
  protocol_number TEXT NOT NULL,
  indication TEXT NOT NULL,
  procedure_name TEXT NOT NULL,
  responsible_doctor_id TEXT,
  senior_resident_id TEXT,
  junior_resident_id TEXT,
  phone_number_1 TEXT NOT NULL,
  phone_number_2 TEXT NOT NULL,
  salon_id TEXT,
  surgery_date TEXT NOT NULL,
  is_waiting_list INTEGER DEFAULT 0,
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  order_index INTEGER DEFAULT 0,
  FOREIGN KEY (responsible_doctor_id) REFERENCES doctors(id) ON DELETE SET NULL,
  FOREIGN KEY (senior_resident_id) REFERENCES doctors(id) ON DELETE SET NULL,
  FOREIGN KEY (junior_resident_id) REFERENCES doctors(id) ON DELETE SET NULL,
  FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
);

-- Surgery notes table (patient-specific notes)
CREATE TABLE IF NOT EXISTS surgery_notes (
  id TEXT PRIMARY KEY,
  surgery_id TEXT NOT NULL,
  note TEXT NOT NULL,
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (surgery_id) REFERENCES surgeries(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
);

-- Day notes table (salon-specific day notes)
CREATE TABLE IF NOT EXISTS day_notes (
  id TEXT PRIMARY KEY,
  salon_id TEXT NOT NULL,
  note_date TEXT NOT NULL,
  note TEXT NOT NULL,
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
);

-- Daily assigned doctors table (one doctor per salon per day)
CREATE TABLE IF NOT EXISTS daily_assigned_doctors (
  id TEXT PRIMARY KEY,
  salon_id TEXT NOT NULL,
  doctor_id TEXT NOT NULL,
  assigned_date TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  UNIQUE(salon_id, assigned_date)
);

-- Activity log table
CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  details TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_surgeries_date ON surgeries(surgery_date);
CREATE INDEX IF NOT EXISTS idx_surgeries_salon ON surgeries(salon_id);
CREATE INDEX IF NOT EXISTS idx_surgeries_waiting_list ON surgeries(is_waiting_list);
CREATE INDEX IF NOT EXISTS idx_day_notes_date ON day_notes(note_date);
CREATE INDEX IF NOT EXISTS idx_day_notes_salon ON day_notes(salon_id);
CREATE INDEX IF NOT EXISTS idx_daily_assigned_doctors_date ON daily_assigned_doctors(assigned_date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);

-- Insert default admin user (password: admin123)
-- Password hash is bcrypt hash of 'admin123'
INSERT OR IGNORE INTO profiles (id, username, password_hash, first_name, last_name, is_admin)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin',
  '$2a$10$rKZM8dBN7KxPxQxwN5QxO.xqH5vYxE5eZHK5E5qH5E5qH5E5qH5E5u',
  'Admin',
  'User',
  1
);

-- Insert default salons
INSERT OR IGNORE INTO salons (id, name, order_index) VALUES
  ('salon-1', 'Salon 1', 1),
  ('salon-2', 'Salon 2', 2);

-- Insert default doctors
INSERT OR IGNORE INTO doctors (id, name) VALUES
  ('doctor-1', 'Prof. Dr. Ahmet Yılmaz'),
  ('doctor-2', 'Doç. Dr. Mehmet Demir'),
  ('doctor-3', 'Dr. Öğr. Üyesi Ayşe Kaya');
