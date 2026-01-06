"use server"

import { createClient } from "@/lib/supabase/server"
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
}

export async function findAvailableDates(
  salonId: string,
  doctorId: string,
  patientId: string,
): Promise<{ success: boolean; slots?: AvailableSlot[]; error?: string }> {
  try {
    const supabase = await createClient()

    // Get salon info for capacity rules
    const { data: salon } = await supabase.from("salons").select("name").eq("id", salonId).single()

    if (!salon) {
      return { success: false, error: "Salon bulunamadı" }
    }

    const maxCapacity = salon.name === "Salon 5" ? 4 : salon.name === "Salon 6" ? 3 : 3

    // Search for available dates in next 3 months (90 days)
    const today = startOfDay(new Date())
    const endDate = addDays(today, 90)

    const { data: doctorAssignments } = await supabase
      .from("daily_assigned_doctors")
      .select("assigned_date")
      .eq("doctor_id", doctorId)
      .eq("salon_id", salonId)
      .gte("assigned_date", format(today, "yyyy-MM-dd"))
      .lte("assigned_date", format(endDate, "yyyy-MM-dd"))

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
      .gte("surgery_date", format(today, "yyyy-MM-dd"))
      .lte("surgery_date", format(endDate, "yyyy-MM-dd"))

    if (error) {
      console.error("[v0] Error fetching surgeries for auto-scheduler:", error)
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

    // Find available dates (where count <= maxCapacity)
    const availableSlots: AvailableSlot[] = []
    let currentDate = today

    while (currentDate <= endDate && availableSlots.length < 5) {
      const dateStr = format(currentDate, "yyyy-MM-dd")
      const dayOfWeek = currentDate.getDay()

      if (dayOfWeek !== 0 && dayOfWeek !== 6 && assignedDates.has(dateStr)) {
        const patientsOnDate = surgeryCountByDate[dateStr] || []
        const patientCount = patientsOnDate.length

        if (patientCount < maxCapacity) {
          availableSlots.push({
            date: dateStr,
            dayName: format(currentDate, "EEEE", { locale: tr }),
            currentPatientCount: patientCount,
            maxCapacity: maxCapacity,
            patients: patientsOnDate,
          })
        }
      }

      currentDate = addDays(currentDate, 1)
    }

    console.log(
      `[v0] Found ${availableSlots.length} available slots for salon ${salon.name} (max capacity: ${maxCapacity})`,
    )

    return {
      success: true,
      slots: availableSlots.slice(0, 5), // Return first 5
    }
  } catch (error: any) {
    console.error("[v0] Auto-scheduler error:", error)
    return { success: false, error: error.message }
  }
}
