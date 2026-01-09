"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function createSurgeryNote(surgeryId: string, note: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("surgery_notes")
    .insert({
      surgery_id: surgeryId,
      note,
      created_by: null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/")
  return { success: true, data }
}

export async function deleteSurgeryNote(noteId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const supabase = createAdminClient()

  const { error } = await supabase.from("surgery_notes").delete().eq("id", noteId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/")
  return { success: true }
}

export async function createDayNote(salonId: string, noteDate: string, note: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const supabase = createAdminClient()

  if (!salonId) {
    throw new Error("Salon ID is required")
  }

  const { data, error } = await supabase
    .from("day_notes")
    .insert({
      salon_id: salonId,
      note_date: noteDate,
      note,
      created_by: null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Database error: ${error.message} (Code: ${error.code})`)
  }

  revalidatePath("/")
  revalidatePath("/fliphtml")
  return { success: true, data }
}

export async function deleteDayNote(noteId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const supabase = createAdminClient()

  const { error } = await supabase.from("day_notes").delete().eq("id", noteId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/")
  return { success: true }
}

export async function assignDoctorToDay(salonId: string, doctorId: string, assignedDate: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const supabase = createAdminClient()

  if (!salonId || !doctorId) {
    throw new Error("Salon ID and Doctor ID are required")
  }

  // Remove existing assignment for this salon and date
  await supabase.from("daily_assigned_doctors").delete().eq("salon_id", salonId).eq("assigned_date", assignedDate)

  // Create new assignment
  const { data, error } = await supabase
    .from("daily_assigned_doctors")
    .insert({
      salon_id: salonId,
      doctor_id: doctorId,
      assigned_date: assignedDate,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/")
  return { success: true, data }
}

export async function removeAssignedDoctor(assignmentId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const supabase = createAdminClient()

  const { error } = await supabase.from("daily_assigned_doctors").delete().eq("id", assignmentId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/")
  return { success: true }
}
