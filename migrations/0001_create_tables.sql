-- Users table (replaces auth.users and profiles)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Salons table
CREATE TABLE IF NOT EXISTS salons (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Surgeries table
CREATE TABLE IF NOT EXISTS surgeries (
  id TEXT PRIMARY KEY,
  patient_name TEXT NOT NULL,
  protocol_number TEXT NOT NULL,
  indication TEXT NOT NULL,
  procedure TEXT NOT NULL,
  responsible_doctor_id TEXT,
  senior_resident_id TEXT,
  junior_resident_id TEXT,
  phone_1 TEXT NOT NULL,
  phone_2 TEXT NOT NULL,
  salon_id TEXT,
  surgery_date DATE NOT NULL,
  status TEXT DEFAULT 'planned',
  created_by TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (responsible_doctor_id) REFERENCES doctors(id),
  FOREIGN KEY (senior_resident_id) REFERENCES doctors(id),
  FOREIGN KEY (junior_resident_id) REFERENCES doctors(id),
  FOREIGN KEY (salon_id) REFERENCES salons(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Day notes table
CREATE TABLE IF NOT EXISTS day_notes (
  id TEXT PRIMARY KEY,
  salon_id TEXT NOT NULL,
  note_date DATE NOT NULL,
  note TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (salon_id) REFERENCES salons(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Surgery notes table
CREATE TABLE IF NOT EXISTS surgery_notes (
  id TEXT PRIMARY KEY,
  surgery_id TEXT NOT NULL,
  note TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (surgery_id) REFERENCES surgeries(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Assigned doctors table (daily doctor assignments)
CREATE TABLE IF NOT EXISTS assigned_doctors (
  id TEXT PRIMARY KEY,
  salon_id TEXT NOT NULL,
  assignment_date DATE NOT NULL,
  doctor_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(salon_id, assignment_date),
  FOREIGN KEY (salon_id) REFERENCES salons(id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

-- Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Sessions table for authentication
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_surgeries_date ON surgeries(surgery_date);
CREATE INDEX IF NOT EXISTS idx_surgeries_salon ON surgeries(salon_id);
CREATE INDEX IF NOT EXISTS idx_day_notes_date ON day_notes(note_date);
CREATE INDEX IF NOT EXISTS idx_assigned_doctors_date ON assigned_doctors(assignment_date);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
