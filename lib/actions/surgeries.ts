"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function createSurgery(formData: {
  patient_name: string
  protocol_number: string
  indication: string
  procedure_name: string
  responsible_doctor_id: string | null
  senior_resident_id: string | null
  junior_resident_id: string | null
  senior_resident_custom?: string | null
  junior_resident_custom?: string | null
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
    senior_resident_id: formData.senior_resident_id || null,
    junior_resident_id: formData.junior_resident_id || null,
    phone_number_1: formData.phone_number_1 || "",
    phone_number_2: formData.phone_number_2 || "",
    salon_id: formData.is_waiting_list ? null : formData.salon_id || null,
    surgery_date: formData.is_waiting_list ? null : formData.surgery_date || null,
    is_waiting_list: formData.is_waiting_list,
    created_by: null, // Set null since mock user doesn't exist in DB
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
      created_by: null,
    })
  }

  console.log("[v0] Surgery created successfully:", newSurgery)

  revalidatePath("/")
  revalidatePath("/waiting-list")
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
    senior_resident_id: string | null
    junior_resident_id: string | null
    senior_resident_custom: string | null
    junior_resident_custom: string | null
    phone_number_1: string
    phone_number_2: string
    salon_id: string | null
    surgery_date: string | null
    is_waiting_list: boolean
  }>,
) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const supabase = createAdminClient()

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

  revalidatePath("/")
  revalidatePath("/waiting-list")
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
  return { success: true }
}

export async function moveToWaitingList(surgeryId: string) {
  return updateSurgery(surgeryId, {
    is_waiting_list: true,
    salon_id: null,
    surgery_date: null,
  })
}

export async function assignFromWaitingList(surgeryId: string, salonId: string, surgeryDate: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const supabase = createAdminClient()

  console.log("[v0] Assigning surgery from waiting list:", { surgeryId, salonId, surgeryDate })

  const { data, error } = await supabase
    .from("surgeries")
    .update({
      is_waiting_list: false,
      salon_id: salonId,
      surgery_date: surgeryDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", surgeryId)
    .select()
    .single()

  if (error) {
    console.error("[v0] Error assigning surgery:", error)
    throw new Error(error.message)
  }

  console.log("[v0] Surgery assigned successfully:", data)

  revalidatePath("/")
  revalidatePath("/waiting-list")
  return { success: true, data }
}
