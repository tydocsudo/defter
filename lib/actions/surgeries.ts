"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"

async function logActivity(action: string, details: any) {
  const user = await getCurrentUser()
  if (!user) return

  const supabase = createAdminClient()

  await supabase.from("activity_logs").insert({
    user_id: user.id,
    action,
    details,
  })
}

export async function createSurgery(formData: {
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
  initial_note?: string
}) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const supabase = createAdminClient()

  let validSurgeryDate = null
  if (!formData.is_waiting_list && formData.surgery_date) {
    const dateStr = formData.surgery_date.trim()
    if (dateStr && dateStr !== "") {
      validSurgeryDate = dateStr
    }
  }

  if (formData.salon_id && !validSurgeryDate) {
    throw new Error("Salona atanan hastalar için ameliyat tarihi zorunludur")
  }

  const surgeryData = {
    patient_name: formData.patient_name,
    protocol_number: formData.protocol_number,
    indication: formData.indication,
    procedure_name: formData.procedure_name,
    responsible_doctor_id: formData.responsible_doctor_id || null,
    phone_number_1: formData.phone_number_1 || "",
    phone_number_2: formData.phone_number_2 || "",
    salon_id: formData.is_waiting_list ? null : formData.salon_id || null,
    surgery_date: validSurgeryDate,
    is_waiting_list: formData.is_waiting_list,
    created_by: user.id,
    is_approved: false,
  }

  const { data: newSurgery, error } = await supabase.from("surgeries").insert(surgeryData).select().single()

  if (error) {
    throw new Error(error.message)
  }

  if (formData.initial_note && newSurgery) {
    await supabase.from("surgery_notes").insert({
      surgery_id: newSurgery.id,
      note: formData.initial_note,
      created_by: user.id,
    })
  }

  await logActivity("Hasta Eklendi", {
    surgery_id: newSurgery.id,
    patient_name: newSurgery.patient_name,
    surgery_date: newSurgery.surgery_date,
  })

  revalidatePath("/")
  revalidatePath("/waiting-list")
  revalidatePath("/fliphtml")
  return { success: true, data: newSurgery }
}

export async function updateSurgery(
  surgeryId: string,
  formData: Partial<{
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
  }>,
  skipLogging = false,
) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const supabase = createAdminClient()

  const { data: oldData } = await supabase.from("surgeries").select("*").eq("id", surgeryId).single()

  const { data, error } = await supabase
    .from("surgeries")
    .update({
      ...formData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", surgeryId)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  if (!skipLogging) {
    const detailedChanges: any = {}
    if (oldData) {
      Object.keys(formData).forEach((key) => {
        const oldValue = oldData[key as keyof typeof oldData]
        const newValue = formData[key as keyof typeof formData]
        if (oldValue !== newValue) {
          detailedChanges[key] = {
            old: oldValue,
            new: newValue,
          }
        }
      })
    }

    await logActivity("Hasta Güncellendi", {
      surgery_id: surgeryId,
      patient_name: data.patient_name,
      changes: detailedChanges,
    })
  }

  revalidatePath("/")
  revalidatePath("/waiting-list")
  revalidatePath("/fliphtml")
  return { success: true, data }
}

export async function deleteSurgery(surgeryId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const supabase = createAdminClient()

  const { error } = await supabase.from("surgeries").delete().eq("id", surgeryId)

  if (error) {
    console.error("[v0] Error deleting surgery:", error)
    throw new Error(error.message)
  }

  revalidatePath("/")
  revalidatePath("/waiting-list")
  revalidatePath("/fliphtml")
  return { success: true }
}

export async function moveToWaitingList(surgeryId: string) {
  const supabase = createAdminClient()
  const { data: surgery } = await supabase
    .from("surgeries")
    .select("patient_name, salon_id, surgery_date")
    .eq("id", surgeryId)
    .single()

  await logActivity("Bekleme Listesine Alındı", {
    surgery_id: surgeryId,
    patient_name: surgery?.patient_name,
    old_salon_id: surgery?.salon_id,
    old_surgery_date: surgery?.surgery_date,
  })

  return updateSurgery(
    surgeryId,
    {
      is_waiting_list: true,
      salon_id: null,
      surgery_date: null,
    },
    true,
  )
}

export async function assignFromWaitingList(
  surgeryId: string,
  salonId: string,
  surgeryDate: string,
  doctorId?: string,
) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const supabase = createAdminClient()

  console.log("[v0] Assigning surgery from waiting list:", { surgeryId, salonId, surgeryDate, doctorId })

  const updateData: any = {
    is_waiting_list: false,
    salon_id: salonId,
    surgery_date: surgeryDate,
    updated_at: new Date().toISOString(),
  }

  if (doctorId) {
    updateData.responsible_doctor_id = doctorId
  }

  const { data, error } = await supabase.from("surgeries").update(updateData).eq("id", surgeryId).select().single()

  if (error) {
    console.error("[v0] Error assigning surgery:", error)
    throw new Error(error.message)
  }

  console.log("[v0] Surgery assigned successfully:", data)

  await logActivity("Bekleme Listesinden Atandı", {
    surgery_id: surgeryId,
    patient_name: data.patient_name,
    salon_id: salonId,
    surgery_date: surgeryDate,
    doctor_id: doctorId,
  })

  revalidatePath("/")
  revalidatePath("/waiting-list")
  revalidatePath("/fliphtml")
  return { success: true, data }
}

export async function approveSurgery(surgeryId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("surgeries")
    .update({
      is_approved: true,
      approved_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", surgeryId)
    .select()
    .single()

  if (error) {
    console.error("[v0] Error approving surgery:", error)
    throw new Error(error.message)
  }

  await logActivity("Hasta Onaylandı", {
    surgery_id: surgeryId,
    patient_name: data.patient_name,
  })

  revalidatePath("/")
  revalidatePath("/waiting-list")
  revalidatePath("/fliphtml")
  return { success: true, data }
}

export async function unapproveSurgery(surgeryId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("surgeries")
    .update({
      is_approved: false,
      approved_by: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", surgeryId)
    .select()
    .single()

  if (error) {
    console.error("[v0] Error unapproving surgery:", error)
    throw new Error(error.message)
  }

  await logActivity("Onay Kaldırıldı", {
    surgery_id: surgeryId,
    patient_name: data.patient_name,
  })

  revalidatePath("/")
  revalidatePath("/waiting-list")
  revalidatePath("/fliphtml")
  return { success: true, data }
}

export async function createSurgeryNote(surgeryId: string, note: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("surgery_notes")
    .insert({
      surgery_id: surgeryId,
      note,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating surgery note:", error)
    throw new Error(error.message)
  }

  await logActivity("Not Eklendi", {
    surgery_id: surgeryId,
    note: note.substring(0, 100),
  })

  revalidatePath("/")
  revalidatePath("/waiting-list")
  revalidatePath("/fliphtml")
  return { success: true, data }
}

export async function deleteSurgeryNote(noteId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const supabase = createAdminClient()

  const { data: note } = await supabase.from("surgery_notes").select("surgery_id").eq("id", noteId).single()

  const { error } = await supabase.from("surgery_notes").delete().eq("id", noteId)

  if (error) {
    console.error("[v0] Error deleting surgery note:", error)
    throw new Error(error.message)
  }

  await logActivity("Not Silindi", {
    note_id: noteId,
    surgery_id: note?.surgery_id,
  })

  revalidatePath("/")
  revalidatePath("/waiting-list")
  revalidatePath("/fliphtml")
  return { success: true }
}

export async function bulkMoveToWaitingListByMonth(year: number, month: number) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const supabase = createAdminClient()

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`
  const endDate = `${year}-${String(month).padStart(2, "0")}-31`

  console.log("[v0] Bulk moving surgeries to waiting list:", { year, month, startDate, endDate })

  const { data: surgeries, error: fetchError } = await supabase
    .from("surgeries")
    .select("id, patient_name, salon_id, surgery_date")
    .gte("surgery_date", startDate)
    .lte("surgery_date", endDate)
    .eq("is_waiting_list", false)

  if (fetchError) {
    console.error("[v0] Error fetching surgeries:", fetchError)
    throw new Error(fetchError.message)
  }

  if (!surgeries || surgeries.length === 0) {
    return { success: true, count: 0, message: "No surgeries found for this month" }
  }

  console.log("[v0] Found", surgeries.length, "surgeries to move")

  const { error: updateError } = await supabase
    .from("surgeries")
    .update({
      is_waiting_list: true,
      salon_id: null,
      surgery_date: null,
      updated_at: new Date().toISOString(),
    })
    .in(
      "id",
      surgeries.map((s) => s.id),
    )

  if (updateError) {
    console.error("[v0] Error moving surgeries:", updateError)
    throw new Error(updateError.message)
  }

  await logActivity("Toplu Bekleme Listesine Alındı", {
    year,
    month,
    count: surgeries.length,
    patient_names: surgeries.map((s) => s.patient_name).join(", "),
  })

  console.log("[v0] Successfully moved", surgeries.length, "surgeries to waiting list")

  revalidatePath("/")
  revalidatePath("/waiting-list")
  revalidatePath("/fliphtml")
  revalidatePath("/admin")

  return { success: true, count: surgeries.length }
}

export async function bulkCreateSurgeriesForDate(
  salonId: string,
  surgeryDate: string,
  patients: Array<{
    patient_name: string
    protocol_number: string
    indication: string
    procedure_name: string
    responsible_doctor_id: string | null
    phone_number_1: string
    phone_number_2: string
  }>,
) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const supabase = createAdminClient()

  console.log("[v0] Bulk creating surgeries for date:", { salonId, surgeryDate, count: patients.length })

  const surgeriesData = patients.map((patient) => ({
    ...patient,
    salon_id: salonId,
    surgery_date: surgeryDate,
    is_waiting_list: false,
    created_by: user.id,
    is_approved: false,
  }))

  const { data, error } = await supabase.from("surgeries").insert(surgeriesData).select()

  if (error) {
    console.error("[v0] Error bulk creating surgeries:", error)
    throw new Error(error.message)
  }

  await logActivity("Toplu Hasta Eklendi", {
    salon_id: salonId,
    surgery_date: surgeryDate,
    count: patients.length,
    patient_names: patients.map((p) => p.patient_name).join(", "),
  })

  console.log("[v0] Successfully created", data.length, "surgeries")

  revalidatePath("/")
  revalidatePath("/waiting-list")
  revalidatePath("/fliphtml")

  return { success: true, count: data.length, data }
}

export async function restoreFromBackup(
  backupData: any,
  options: {
    skipExisting: boolean
    tables: string[]
  },
) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const supabase = createAdminClient()
  const results: Record<string, { inserted: number; skipped: number; updated: number; errors: number }> = {}

  console.log("[v0] Starting restore from backup:", { tables: options.tables, skipExisting: options.skipExisting })

  const idMapping: Record<string, Record<string, string>> = {
    salons: {},
    doctors: {},
    profiles: {},
  }

  const priorityOrder = [
    "salons",
    "doctors",
    "profiles",
    "surgeries",
    "surgery_notes",
    "day_notes",
    "daily_assigned_doctors",
  ]
  const orderedTables = priorityOrder.filter((t) => options.tables.includes(t))

  for (const table of orderedTables) {
    if (!backupData[table]) {
      continue
    }

    const records = backupData[table]
    results[table] = { inserted: 0, skipped: 0, updated: 0, errors: 0 }

    for (const record of records) {
      try {
        const oldId = record.id
        let existingRecord = null

        if (table === "salons" && record.name) {
          const { data } = await supabase.from("salons").select("id").eq("name", record.name).maybeSingle()
          existingRecord = data
        } else if (table === "doctors" && record.name) {
          const { data } = await supabase.from("doctors").select("id").eq("name", record.name).maybeSingle()
          existingRecord = data
        } else if (table === "profiles" && record.username) {
          const { data } = await supabase.from("profiles").select("id").eq("username", record.username).maybeSingle()
          existingRecord = data
        } else if (table === "surgeries" && record.protocol_number) {
          const { data } = await supabase
            .from("surgeries")
            .select("id")
            .eq("protocol_number", record.protocol_number)
            .maybeSingle()
          existingRecord = data
        } else if (table === "surgery_notes" && record.id) {
          const { data } = await supabase.from("surgery_notes").select("id").eq("id", record.id).maybeSingle()
          existingRecord = data
        } else if (table === "day_notes" && record.salon_id && record.date) {
          const mappedSalonId = idMapping.salons[record.salon_id] || record.salon_id
          const { data } = await supabase
            .from("day_notes")
            .select("id")
            .eq("salon_id", mappedSalonId)
            .eq("date", record.date)
            .maybeSingle()
          existingRecord = data
        } else if (table === "daily_assigned_doctors" && record.salon_id && record.assigned_date && record.doctor_id) {
          const mappedSalonId = idMapping.salons[record.salon_id] || record.salon_id
          const mappedDoctorId = idMapping.doctors[record.doctor_id] || record.doctor_id
          const { data } = await supabase
            .from("daily_assigned_doctors")
            .select("id")
            .eq("salon_id", mappedSalonId)
            .eq("assigned_date", record.assigned_date)
            .eq("doctor_id", mappedDoctorId)
            .maybeSingle()
          existingRecord = data
        }

        if (existingRecord && options.skipExisting) {
          if (oldId && (table === "salons" || table === "doctors" || table === "profiles")) {
            idMapping[table][oldId] = existingRecord.id
          }
          results[table].skipped++
          continue
        }

        const { id, created_at, updated_at, ...recordWithoutId } = record

        if (table === "surgeries") {
          if (recordWithoutId.salon_id && idMapping.salons[recordWithoutId.salon_id]) {
            recordWithoutId.salon_id = idMapping.salons[recordWithoutId.salon_id]
          }
          if (recordWithoutId.responsible_doctor_id && idMapping.doctors[recordWithoutId.responsible_doctor_id]) {
            recordWithoutId.responsible_doctor_id = idMapping.doctors[recordWithoutId.responsible_doctor_id]
          }
          if (recordWithoutId.created_by && idMapping.profiles[recordWithoutId.created_by]) {
            recordWithoutId.created_by = idMapping.profiles[recordWithoutId.created_by]
          } else {
            recordWithoutId.created_by = user.id
          }
          if (recordWithoutId.approved_by && idMapping.profiles[recordWithoutId.approved_by]) {
            recordWithoutId.approved_by = idMapping.profiles[recordWithoutId.approved_by]
          }
        }

        if (table === "day_notes") {
          if (recordWithoutId.salon_id && idMapping.salons[recordWithoutId.salon_id]) {
            recordWithoutId.salon_id = idMapping.salons[recordWithoutId.salon_id]
          }
        }

        if (table === "daily_assigned_doctors") {
          if (recordWithoutId.salon_id && idMapping.salons[recordWithoutId.salon_id]) {
            recordWithoutId.salon_id = idMapping.salons[recordWithoutId.salon_id]
          }
          if (recordWithoutId.doctor_id && idMapping.doctors[recordWithoutId.doctor_id]) {
            recordWithoutId.doctor_id = idMapping.doctors[recordWithoutId.doctor_id]
          }
        }

        if (existingRecord) {
          const { error } = await supabase.from(table).update(recordWithoutId).eq("id", existingRecord.id)
          if (error) {
            results[table].errors++
          } else {
            results[table].updated++
          }
        } else {
          const { data: newRecord, error } = await supabase.from(table).insert(recordWithoutId).select("id").single()
          if (error) {
            results[table].errors++
          } else {
            results[table].inserted++
            if (oldId && newRecord && (table === "salons" || table === "doctors" || table === "profiles")) {
              idMapping[table][oldId] = newRecord.id
            }
          }
        }
      } catch (err) {
        results[table].errors++
      }
    }
  }

  await logActivity("Yedekten Geri Yükleme", {
    tables: options.tables,
    results,
  })

  revalidatePath("/")
  revalidatePath("/waiting-list")
  revalidatePath("/fliphtml")
  revalidatePath("/admin")

  return { success: true, results }
}

export async function bulkReassignPatientsByDate(
  surgeryDate: string,
  currentSalonId: string,
  updates: {
    newSalonId?: string
    newDoctorId?: string
  },
) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const supabase = createAdminClient()

  console.log("[v0] Bulk reassigning patients for date:", { surgeryDate, currentSalonId, updates })

  const { data: surgeries, error: fetchError } = await supabase
    .from("surgeries")
    .select("id, patient_name, salon_id, responsible_doctor_id")
    .eq("surgery_date", surgeryDate)
    .eq("salon_id", currentSalonId)
    .eq("is_waiting_list", false)

  if (fetchError) {
    console.error("[v0] Error fetching surgeries:", fetchError)
    throw new Error(fetchError.message)
  }

  if (!surgeries || surgeries.length === 0) {
    return { success: true, count: 0, message: "Bu tarih ve salonda hasta bulunamadı" }
  }

  console.log("[v0] Found", surgeries.length, "surgeries to reassign")

  const updateData: any = {
    updated_at: new Date().toISOString(),
  }

  if (updates.newSalonId) {
    updateData.salon_id = updates.newSalonId
  }

  if (updates.newDoctorId) {
    updateData.responsible_doctor_id = updates.newDoctorId
  }

  const { error: updateError } = await supabase
    .from("surgeries")
    .update(updateData)
    .in(
      "id",
      surgeries.map((s) => s.id),
    )

  if (updateError) {
    console.error("[v0] Error reassigning surgeries:", updateError)
    throw new Error(updateError.message)
  }

  await logActivity("Toplu Hasta Yeniden Atandı", {
    surgery_date: surgeryDate,
    current_salon_id: currentSalonId,
    new_salon_id: updates.newSalonId,
    new_doctor_id: updates.newDoctorId,
    count: surgeries.length,
    patient_names: surgeries.map((s) => s.patient_name).join(", "),
  })

  console.log("[v0] Successfully reassigned", surgeries.length, "surgeries")

  revalidatePath("/")
  revalidatePath("/waiting-list")
  revalidatePath("/fliphtml")
  revalidatePath("/admin")

  return { success: true, count: surgeries.length }
}

export const moveSurgeryToWaitingList = moveToWaitingList
