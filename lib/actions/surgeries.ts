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
  surgery_date: string
  is_waiting_list: boolean
  initial_note?: string
}) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const supabase = createAdminClient()

  const surgeryData = {
    patient_name: formData.patient_name,
    protocol_number: formData.protocol_number,
    indication: formData.indication,
    procedure_name: formData.procedure_name,
    responsible_doctor_id: formData.responsible_doctor_id || null,
    phone_number_1: formData.phone_number_1 || "",
    phone_number_2: formData.phone_number_2 || "",
    salon_id: formData.is_waiting_list ? null : formData.salon_id || null,
    surgery_date: formData.is_waiting_list ? null : formData.surgery_date || null,
    is_waiting_list: formData.is_waiting_list,
    created_by: user.id,
    is_approved: false,
  }

  console.log("[v0] Creating surgery in Supabase:", surgeryData)

  const { data: newSurgery, error } = await supabase.from("surgeries").insert(surgeryData).select().single()

  if (error) {
    console.error("[v0] Error creating surgery:", error)
    throw new Error(error.message)
  }

  // Add initial note if provided
  if (formData.initial_note && newSurgery) {
    await supabase.from("surgery_notes").insert({
      surgery_id: newSurgery.id,
      note: formData.initial_note,
      created_by: user.id,
    })
  }

  console.log("[v0] Surgery created successfully:", newSurgery)

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

  console.log("[v0] Updating surgery in Supabase:", { surgeryId, formData })

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
    console.error("[v0] Error updating surgery:", error)
    throw new Error(error.message)
  }

  console.log("[v0] Surgery updated successfully:", data)

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

  // Get all surgeries in the specified month
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

  // Move all surgeries to waiting list
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

  // Log activity for bulk operation
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

  for (const table of options.tables) {
    if (!backupData[table]) {
      console.log(`[v0] No data found for table: ${table}`)
      continue
    }

    const records = backupData[table]
    results[table] = { inserted: 0, skipped: 0, updated: 0, errors: 0 }

    console.log(`[v0] Processing ${records.length} records for table: ${table}`)

    for (const record of records) {
      try {
        // Check if record exists based on unique fields
        let existingRecord = null

        if (table === "salons" && record.name) {
          const { data } = await supabase.from("salons").select("id").eq("name", record.name).single()
          existingRecord = data
        } else if (table === "doctors" && record.name) {
          const { data } = await supabase.from("doctors").select("id").eq("name", record.name).single()
          existingRecord = data
        } else if (table === "surgeries" && record.protocol_number) {
          const { data } = await supabase
            .from("surgeries")
            .select("id")
            .eq("protocol_number", record.protocol_number)
            .single()
          existingRecord = data
        } else if (table === "profiles" && record.username) {
          const { data } = await supabase.from("profiles").select("id").eq("username", record.username).single()
          existingRecord = data
        }

        if (existingRecord && options.skipExisting) {
          results[table].skipped++
          continue
        }

        // Create a copy without id for insertion
        const { id, created_at, updated_at, ...recordWithoutId } = record

        if (existingRecord) {
          // Update existing record
          const { error } = await supabase.from(table).update(recordWithoutId).eq("id", existingRecord.id)
          if (error) {
            console.error(`[v0] Error updating ${table} record:`, error)
            results[table].errors++
          } else {
            results[table].updated++
          }
        } else {
          // Insert new record without the original id - let database generate new id
          const { error } = await supabase.from(table).insert(recordWithoutId)
          if (error) {
            console.error(`[v0] Error inserting ${table} record:`, error)
            results[table].errors++
          } else {
            results[table].inserted++
          }
        }
      } catch (err) {
        console.error(`[v0] Error processing ${table} record:`, err)
        results[table].errors++
      }
    }
  }

  await logActivity("Yedekten Geri Yükleme", {
    tables: options.tables,
    results,
  })

  console.log("[v0] Restore complete:", results)

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

  // Get all surgeries for the specified date and salon
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

  // Prepare update data
  const updateData: any = {
    updated_at: new Date().toISOString(),
  }

  if (updates.newSalonId) {
    updateData.salon_id = updates.newSalonId
  }

  if (updates.newDoctorId) {
    updateData.responsible_doctor_id = updates.newDoctorId
  }

  // Update all surgeries
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

  // Log activity
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
