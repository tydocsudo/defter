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
      created_by: null, // null since mock user doesn't exist in DB
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating surgery note:", error)
    throw new Error(error.message)
  }

  console.log("[v0] Created surgery note:", data)

  revalidatePath("/")
  return { success: true, data }
}

export async function deleteSurgeryNote(noteId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const supabase = createAdminClient()

  const { error } = await supabase.from("surgery_notes").delete().eq("id", noteId)

  if (error) {
    console.error("[v0] Error deleting surgery note:", error)
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

  console.log("[v0] Creating day note with data:", { salonId, noteDate, note })

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
    console.error("[v0] Error creating day note - Full error:", JSON.stringify(error, null, 2))
    throw new Error(`Database error: ${error.message} (Code: ${error.code})`)
  }

  console.log("[v0] Created day note successfully:", data)

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
    console.error("[v0] Error deleting day note:", error)
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
    console.error("[v0] Error assigning doctor:", error)
    throw new Error(error.message)
  }

  console.log("[v0] Assigned doctor to day:", data)

  revalidatePath("/")
  return { success: true, data }
}

export async function removeAssignedDoctor(assignmentId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const supabase = createAdminClient()

  const { error } = await supabase.from("daily_assigned_doctors").delete().eq("id", assignmentId)

  if (error) {
    console.error("[v0] Error removing doctor assignment:", error)
    throw new Error(error.message)
  }

  revalidatePath("/")
  return { success: true }
}
