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
    changes: formData,
    detailed_changes: detailedChanges,
  })

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
  await logActivity("Bekleme Listesine Alındı", {
    surgery_id: surgeryId,
  })

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

  await logActivity("Bekleme Listesinden Atandı", {
    surgery_id: surgeryId,
    salon_id: salonId,
    surgery_date: surgeryDate,
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
  })

  revalidatePath("/")
  revalidatePath("/waiting-list")
  revalidatePath("/fliphtml")
  return { success: true, data }
}
