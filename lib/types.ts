export interface Profile {
  id: string
  username: string
  first_name: string
  last_name: string
  is_admin: boolean
  password?: string // Added password field
  created_at: string
  updated_at: string
}

export interface Salon {
  id: string
  name: string
  order_index: number
  created_at: string
  updated_at: string
}

export interface Doctor {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export interface Surgery {
  id: string
  patient_name: string
  protocol_number: string
  indication: string
  procedure_name: string
  responsible_doctor_id: string | null
  senior_resident_id: string | null
  junior_resident_id: string | null
  senior_resident_custom: string | null
  junior_resident_custom: string | null
  phone_number_1: string
  phone_number_2: string
  salon_id: string | null
  surgery_date: string | null
  is_waiting_list: boolean
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  order_index: number
}

export interface SurgeryWithDetails extends Surgery {
  responsible_doctor?: Doctor
  senior_resident?: Doctor
  junior_resident?: Doctor
  salon?: Salon
  creator?: Profile
}

export interface SurgeryNote {
  id: string
  surgery_id: string
  note: string
  created_by: string | null
  created_at: string
  creator?: Profile
}

export interface DayNote {
  id: string
  salon_id: string
  note_date: string
  note: string
  created_by: string | null
  created_at: string
  creator?: Profile
}

export interface DailyAssignedDoctor {
  id: string
  salon_id: string
  doctor_id: string
  assigned_date: string
  created_at: string
  updated_at: string
  doctor?: Doctor
}

export interface ActivityLog {
  id: string
  user_id: string | null
  action: string
  details: any
  created_at: string
  user?: Profile
}
