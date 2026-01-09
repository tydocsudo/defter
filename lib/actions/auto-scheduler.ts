"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { addDays, format, startOfDay } from "date-fns"
import { tr } from "date-fns/locale"

interface AvailableSlot {
  date: string
  dayName: string
  currentPatientCount: number
  maxCapacity: number
  patients: Array<{
    id: string
    patient_name: string
    protocol_number: string
    procedure_name: string
    indication: string
    responsible_doctor: { name: string } | null
  }>
  doctorAssigned: boolean
}

export async function findAvailableDates(
  salonId: string,
  doctorId: string,
  patientId: string | null,
): Promise<{ success: boolean; slots?: AvailableSlot[]; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Get salon info for capacity rules
    const { data: salon } = await supabase.from("salons").select("name").eq("id", salonId).single()

    if (!salon) {
      return { success: false, error: "Salon bulunamadı" }
    }

    const maxCapacity = salon.name === "Salon 5" ? 4 : salon.name === "Salon 6" ? 3 : 3

    // Search for available dates in next 3 months (90 days)
    const today = startOfDay(new Date())
    const endDate = addDays(today, 90)

    const { data: doctorAssignments, error: assignmentError } = await supabase
      .from("daily_assigned_doctors")
      .select("assigned_date")
      .eq("doctor_id", doctorId)
      .eq("salon_id", salonId)
      .gte("assigned_date", format(today, "yyyy-MM-dd"))
      .lte("assigned_date", format(endDate, "yyyy-MM-dd"))

    if (assignmentError) {
      console.error("Error fetching doctor assignments:", assignmentError)
      return { success: false, error: "Hoca atamaları alınırken hata oluştu" }
    }

    const assignedDates = new Set(doctorAssignments?.map((a) => a.assigned_date) || [])

    // Get all surgeries for this salon in the date range
    const { data: allSurgeries, error } = await supabase
      .from("surgeries")
      .select(
        `
        id,
        patient_name,
        protocol_number,
        surgery_date,
        procedure_name,
        indication,
        responsible_doctor:doctors!surgeries_responsible_doctor_id_fkey(name)
      `,
      )
      .eq("salon_id", salonId)
      .eq("is_waiting_list", false)
      .not("surgery_date", "is", null)
      .gte("surgery_date", format(today, "yyyy-MM-dd"))
      .lte("surgery_date", format(endDate, "yyyy-MM-dd"))

    if (error) {
      console.error("Error fetching surgeries for auto-scheduler:", error)
      return { success: false, error: "Ameliyatlar alınırken hata oluştu" }
    }

    // Group surgeries by date
    const surgeryCountByDate: Record<string, any[]> = {}
    allSurgeries?.forEach((surgery) => {
      if (!surgeryCountByDate[surgery.surgery_date]) {
        surgeryCountByDate[surgery.surgery_date] = []
      }
      surgeryCountByDate[surgery.surgery_date].push(surgery)
    })

    const availableSlots: AvailableSlot[] = []
    let currentDate = today

    while (currentDate <= endDate && availableSlots.length < 5) {
      const dateStr = format(currentDate, "yyyy-MM-dd")
      const dayOfWeek = currentDate.getDay()

      // Skip weekends
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const patientsOnDate = surgeryCountByDate[dateStr] || []
        const patientCount = patientsOnDate.length
        const isDoctorAssigned = assignedDates.has(dateStr)

        if (isDoctorAssigned && patientCount < maxCapacity) {
          availableSlots.push({
            date: dateStr,
            dayName: format(currentDate, "EEEE", { locale: tr }),
            currentPatientCount: patientCount,
            maxCapacity: maxCapacity,
            patients: patientsOnDate,
            doctorAssigned: true,
          })
        }
      }

      currentDate = addDays(currentDate, 1)
    }

    return {
      success: true,
      slots: availableSlots.slice(0, 5), // Return first 5
    }
  } catch (error: any) {
    console.error("Auto-scheduler error:", error)
    return { success: false, error: error.message }
  }
}
