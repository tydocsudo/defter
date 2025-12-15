import type { Surgery, Salon, Doctor, Profile, ActivityLog, DayNote, SurgeryNote, DailyAssignedDoctor } from "./types"

// Mock Users
export const mockUsers: Profile[] = [
  {
    id: "admin-001",
    username: "admin",
    first_name: "Admin",
    last_name: "User",
    is_admin: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "user-001",
    username: "user1",
    first_name: "Doktor",
    last_name: "Kullanıcı",
    is_admin: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

// Mock Salons
export const mockSalons: Salon[] = [
  {
    id: "salon-001",
    name: "Salon 1",
    order_index: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "salon-002",
    name: "Salon 2",
    order_index: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

// Mock Doctors
export const mockDoctors: Doctor[] = [
  {
    id: "doctor-001",
    name: "Prof. Dr. Ahmet Yılmaz",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "doctor-002",
    name: "Doç. Dr. Mehmet Demir",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "doctor-003",
    name: "Dr. Ayşe Kaya",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "doctor-004",
    name: "Dr. Fatma Şahin",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const isBrowser = typeof window !== "undefined"
const STORAGE_KEY = "surgery_calendar_data"

function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (!isBrowser) return defaultValue
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}_${key}`)
    return stored ? JSON.parse(stored) : defaultValue
  } catch {
    return defaultValue
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (!isBrowser) return
  try {
    localStorage.setItem(`${STORAGE_KEY}_${key}`, JSON.stringify(value))
  } catch (error) {
    console.error("[v0] Failed to save to localStorage:", error)
  }
}

// Mock Surgeries - load from storage in browser
export const mockSurgeries: Surgery[] = loadFromStorage("surgeries", [
  {
    id: "surgery-001",
    patient_name: "Ahmet Yılmaz",
    protocol_number: "2025-1201",
    indication: "Akut Apandisit",
    procedure_name: "Laparoskopik Apendektomi",
    responsible_doctor_id: "doctor-001",
    senior_resident_id: "doctor-003",
    junior_resident_id: null,
    senior_resident_custom: null,
    junior_resident_custom: "Dr. Can Demir",
    phone_number_1: "0532 111 2233",
    phone_number_2: "0533 444 5566",
    salon_id: "salon-001",
    surgery_date: "2025-12-03",
    is_waiting_list: false,
    created_by: "admin-001",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    order_index: 1,
  },
  {
    id: "surgery-002",
    patient_name: "Ayşe Kaya",
    protocol_number: "2025-1202",
    indication: "Kolelithiazis",
    procedure_name: "Laparoskopik Kolesistektomi",
    responsible_doctor_id: "doctor-002",
    senior_resident_id: "doctor-004",
    junior_resident_id: null,
    senior_resident_custom: null,
    junior_resident_custom: "Dr. Elif Yılmaz",
    phone_number_1: "0532 222 3344",
    phone_number_2: "0533 555 6677",
    salon_id: "salon-002",
    surgery_date: "2025-12-05",
    is_waiting_list: false,
    created_by: "user-001",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    order_index: 1,
  },
  {
    id: "surgery-003",
    patient_name: "Mehmet Demir",
    protocol_number: "2025-1203",
    indication: "İnguinal Herni",
    procedure_name: "Herni Onarımı (Mesh)",
    responsible_doctor_id: "doctor-001",
    senior_resident_id: "doctor-003",
    junior_resident_id: null,
    senior_resident_custom: null,
    junior_resident_custom: "Dr. Zeynep Aydın",
    phone_number_1: "0532 333 4455",
    phone_number_2: "0533 666 7788",
    salon_id: "salon-001",
    surgery_date: "2025-12-07",
    is_waiting_list: false,
    created_by: "admin-001",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    order_index: 1,
  },
  {
    id: "surgery-004",
    patient_name: "Fatma Şahin",
    protocol_number: "2025-1204",
    indication: "Umbilikal Herni",
    procedure_name: "Umbilikal Herni Onarımı",
    responsible_doctor_id: "doctor-002",
    senior_resident_id: "doctor-004",
    junior_resident_id: null,
    senior_resident_custom: null,
    junior_resident_custom: "Dr. Ahmet Özkan",
    phone_number_1: "0532 444 5566",
    phone_number_2: "0533 777 8899",
    salon_id: "salon-002",
    surgery_date: "2025-12-10",
    is_waiting_list: false,
    created_by: "user-001",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    order_index: 1,
  },
  {
    id: "surgery-005",
    patient_name: "Ali Çelik",
    protocol_number: "2025-1205",
    indication: "Pilonidal Sinus",
    procedure_name: "Pilonidal Sinüs Eksizyonu",
    responsible_doctor_id: "doctor-001",
    senior_resident_id: "doctor-003",
    junior_resident_id: null,
    senior_resident_custom: null,
    junior_resident_custom: "Dr. Murat Yıldız",
    phone_number_1: "0532 555 6677",
    phone_number_2: "0533 888 9900",
    salon_id: "salon-001",
    surgery_date: "2025-12-12",
    is_waiting_list: false,
    created_by: "admin-001",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    order_index: 1,
  },
  {
    id: "surgery-006",
    patient_name: "Zeynep Aydın",
    protocol_number: "2025-1206",
    indication: "Hemoroid",
    procedure_name: "Hemoroidektomi",
    responsible_doctor_id: "doctor-002",
    senior_resident_id: "doctor-004",
    junior_resident_id: null,
    senior_resident_custom: null,
    junior_resident_custom: "Dr. Selin Kaya",
    phone_number_1: "0532 666 7788",
    phone_number_2: "0533 999 0011",
    salon_id: "salon-002",
    surgery_date: "2025-12-15",
    is_waiting_list: false,
    created_by: "user-001",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    order_index: 1,
  },
  {
    id: "surgery-007",
    patient_name: "Hasan Öztürk",
    protocol_number: "2025-1207",
    indication: "Anal Fissür",
    procedure_name: "Lateral İnternal Sfinkterotomi",
    responsible_doctor_id: "doctor-001",
    senior_resident_id: "doctor-003",
    junior_resident_id: null,
    senior_resident_custom: null,
    junior_resident_custom: "Dr. Burak Aksoy",
    phone_number_1: "0532 777 8899",
    phone_number_2: "0533 000 1122",
    salon_id: "salon-001",
    surgery_date: "2025-12-18",
    is_waiting_list: false,
    created_by: "admin-001",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    order_index: 1,
  },
  {
    id: "surgery-008",
    patient_name: "Emine Kara",
    protocol_number: "2025-1208",
    indication: "Lipom",
    procedure_name: "Lipom Eksizyonu",
    responsible_doctor_id: "doctor-002",
    senior_resident_id: "doctor-004",
    junior_resident_id: null,
    senior_resident_custom: null,
    junior_resident_custom: "Dr. Cem Yılmaz",
    phone_number_1: "0532 888 9900",
    phone_number_2: "0533 111 2233",
    salon_id: "salon-002",
    surgery_date: "2025-12-20",
    is_waiting_list: false,
    created_by: "user-001",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    order_index: 1,
  },
  {
    id: "surgery-009",
    patient_name: "Mustafa Yıldırım",
    protocol_number: "2025-1209",
    indication: "Varikosel",
    procedure_name: "Varikoselektomi",
    responsible_doctor_id: "doctor-001",
    senior_resident_id: "doctor-003",
    junior_resident_id: null,
    senior_resident_custom: null,
    junior_resident_custom: "Dr. Deniz Çelik",
    phone_number_1: "0532 999 0011",
    phone_number_2: "0533 222 3344",
    salon_id: "salon-001",
    surgery_date: "2025-12-23",
    is_waiting_list: false,
    created_by: "admin-001",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    order_index: 1,
  },
  {
    id: "surgery-010",
    patient_name: "Selin Akar",
    protocol_number: "2025-1210",
    indication: "Tiroid Nodülü",
    procedure_name: "Hemitroidektomi",
    responsible_doctor_id: "doctor-002",
    senior_resident_id: null,
    junior_resident_id: null,
    senior_resident_custom: "Dr. Ayşe Demir",
    junior_resident_custom: "Dr. Mehmet Kaya",
    phone_number_1: "0532 000 1122",
    phone_number_2: "0533 333 4455",
    salon_id: null,
    surgery_date: null,
    is_waiting_list: true,
    created_by: "admin-001",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    order_index: 1,
  },
  {
    id: "surgery-011",
    patient_name: "Can Yılmaz",
    protocol_number: "2025-1211",
    indication: "Safra Kesesi Taşı",
    procedure_name: "Laparoskopik Kolesistektomi",
    responsible_doctor_id: "doctor-001",
    senior_resident_id: null,
    junior_resident_id: null,
    senior_resident_custom: "Dr. Ayşe Demir",
    junior_resident_custom: "Dr. Mehmet Kaya",
    phone_number_1: "0532 111 2233",
    phone_number_2: "0533 444 5566",
    salon_id: null,
    surgery_date: null,
    is_waiting_list: true,
    created_by: "admin-001",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    order_index: 2,
  },
  {
    id: "surgery-012",
    patient_name: "Elif Öz",
    protocol_number: "2025-1212",
    indication: "Fıtık",
    procedure_name: "İnguinal Herni Onarımı",
    responsible_doctor_id: "doctor-002",
    senior_resident_id: null,
    junior_resident_id: null,
    senior_resident_custom: "Dr. Ali Çelik",
    junior_resident_custom: "Dr. Fatma Yıldız",
    phone_number_1: "0532 222 3344",
    phone_number_2: "0533 555 6677",
    salon_id: null,
    surgery_date: null,
    is_waiting_list: true,
    created_by: "user-001",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    order_index: 3,
  },
])

// Mock Activity Logs
export const mockActivityLogs: ActivityLog[] = loadFromStorage("activity_logs", [])

// Mock Day Notes
export const mockDayNotes: DayNote[] = loadFromStorage("day_notes", [
  {
    id: "note-001",
    note_date: "2025-12-03",
    salon_id: "salon-001",
    note: "Ameliyathane temizliği yapıldı",
    created_by: "admin-001",
    created_at: new Date().toISOString(),
  },
  {
    id: "note-002",
    note_date: "2025-12-05",
    salon_id: "salon-002",
    note: "Yeni ekipman test edilecek",
    created_by: "user-001",
    created_at: new Date().toISOString(),
  },
])

// Mock Surgery Notes
export const mockSurgeryNotes: SurgeryNote[] = loadFromStorage("surgery_notes", [])

// Mock Daily Assigned Doctors
const defaultAssignedDoctors = Array.from({ length: 31 }, (_, i) => {
  const day = i + 1
  const dateStr = `2025-12-${String(day).padStart(2, "0")}`
  return [
    {
      id: `assign-${day}-1`,
      salon_id: "salon-001",
      doctor_id: "doctor-001",
      assigned_date: dateStr,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: `assign-${day}-2`,
      salon_id: "salon-002",
      doctor_id: "doctor-002",
      assigned_date: dateStr,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]
}).flat()

export const mockDailyAssignedDoctors: DailyAssignedDoctor[] = loadFromStorage(
  "assigned_doctors",
  defaultAssignedDoctors,
)

// Exported mockAssignedDoctors for use in actions
export const mockAssignedDoctors = mockDailyAssignedDoctors

// Helper functions for mock data
export function getMockSurgeriesByDate(date: string, salonId?: string) {
  return mockSurgeries.filter(
    (s) => s.surgery_date === date && !s.is_waiting_list && (salonId ? s.salon_id === salonId : true),
  )
}

export function getMockWaitingListSurgeries() {
  return mockSurgeries.filter((s) => s.is_waiting_list)
}

export function getMockDayNotes(date: string, salonId: string) {
  return mockDayNotes.filter((n) => n.note_date === date && n.salon_id === salonId)
}

export function getMockAssignedDoctor(date: string, salonId: string) {
  return mockDailyAssignedDoctors.find((a) => a.assigned_date === date && a.salon_id === salonId)
}

export function addMockDayNote(note: Omit<DayNote, "id" | "created_at">) {
  const newNote: DayNote = {
    ...note,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  }
  mockDayNotes.push(newNote)
  saveMockData()
  return newNote
}

export function addMockAssignedDoctor(assignment: Omit<DailyAssignedDoctor, "id" | "created_at" | "updated_at">) {
  const existing = mockDailyAssignedDoctors.findIndex(
    (a) => a.assigned_date === assignment.assigned_date && a.salon_id === assignment.salon_id,
  )

  if (existing !== -1) {
    mockDailyAssignedDoctors[existing] = {
      ...mockDailyAssignedDoctors[existing],
      doctor_id: assignment.doctor_id,
      updated_at: new Date().toISOString(),
    }
    saveMockData()
    return mockDailyAssignedDoctors[existing]
  } else {
    const newAssignment: DailyAssignedDoctor = {
      ...assignment,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mockDailyAssignedDoctors.push(newAssignment)
    saveMockData()
    return newAssignment
  }
}

export function removeAssignedDoctor(date: string, salonId: string) {
  const index = mockDailyAssignedDoctors.findIndex((a) => a.assigned_date === date && a.salon_id === salonId)

  if (index !== -1) {
    mockDailyAssignedDoctors.splice(index, 1)
    saveMockData()
    return true
  }
  return false
}

export function getAssignedDoctors(salonId?: string) {
  if (salonId) {
    return mockDailyAssignedDoctors.filter((a) => a.salon_id === salonId)
  }
  return mockDailyAssignedDoctors
}

export const addAssignedDoctor = addMockAssignedDoctor

export function saveMockData() {
  saveToStorage("surgeries", mockSurgeries)
  saveToStorage("activity_logs", mockActivityLogs)
  saveToStorage("day_notes", mockDayNotes)
  saveToStorage("surgery_notes", mockSurgeryNotes)
  saveToStorage("assigned_doctors", mockDailyAssignedDoctors)
}
