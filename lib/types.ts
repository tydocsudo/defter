export interface Profile {
  id: string
  username: string
  first_name: string
  last_name: string
  is_admin: boolean
  password?: string
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
  phone_number_1: string
  phone_number_2: string
  salon_id: string | null
  surgery_date: string | null
  is_waiting_list: boolean
  is_approved: boolean
  approved_by: string | null // Added approved_by field
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  order_index: number
}

export interface SurgeryWithDetails extends Surgery {
  responsible_doctor?: Doctor
  salon?: Salon
  creator?: Profile
  approver?: Profile // Added approver field
  surgery_notes?: SurgeryNote[]
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
