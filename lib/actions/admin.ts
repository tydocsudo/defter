"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"

// User Management
export async function createUser(formData: {
  username: string
  password: string
  first_name: string
  last_name: string
  is_admin: boolean
}) {
  const user = await getCurrentUser()
  if (!user?.is_admin) throw new Error("Unauthorized")

  const supabase = createAdminClient()

  // Check for existing username in profiles table
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("username")
    .eq("username", formData.username)
    .maybeSingle()

  if (existingProfile) {
    throw new Error("Bu kullanıcı adı zaten kullanılıyor")
  }

  const sanitizedUsername = formData.username.toLowerCase().replace(/[^a-z0-9]/g, "")
  const email = `${sanitizedUsername}@surgery-system.local`

  // Create user in Supabase Auth first (this will trigger profile creation via trigger)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email,
    password: formData.password,
    email_confirm: true, // Auto-confirm email
    user_metadata: {
      username: formData.username,
      first_name: formData.first_name,
      last_name: formData.last_name,
      is_admin: formData.is_admin,
    },
  })

  if (authError || !authData.user) {
    console.error("[v0] Error creating auth user:", authError)
    throw new Error("Kullanıcı oluşturulurken hata oluştu: " + authError?.message)
  }

  // Update the profile with password (since trigger creates it without password)
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      password: formData.password,
    })
    .eq("id", authData.user.id)

  if (updateError) {
    console.error("[v0] Error updating profile with password:", updateError)
    // Don't throw here - user is created, just password wasn't saved to profiles
  }

  revalidatePath("/admin")
  return { success: true, data: authData.user }
}

export async function updateUserPassword(userId: string, newPassword: string) {
  const user = await getCurrentUser()

  // Allow if user is admin OR if user is changing their own password
  if (!user || (!user.is_admin && user.id !== userId)) {
    throw new Error("Unauthorized")
  }

  const supabase = createAdminClient()

  const { error } = await supabase.from("profiles").update({ password: newPassword }).eq("id", userId)

  if (error) {
    console.error("[v0] Error updating user password:", error)
    throw new Error("Şifre güncellenirken hata oluştu: " + error.message)
  }

  revalidatePath("/admin")
  revalidatePath("/")
  return { success: true }
}

export async function deleteUser(userId: string) {
  const user = await getCurrentUser()
  if (!user?.is_admin) throw new Error("Unauthorized")

  const supabase = createAdminClient()

  const { error } = await supabase.from("profiles").delete().eq("id", userId)

  if (error) {
    console.error("[v0] Error deleting user:", error)
    throw new Error(error.message)
  }

  revalidatePath("/admin")
  return { success: true }
}

// Salon Management
export async function createSalon(name: string) {
  const user = await getCurrentUser()
  if (!user?.is_admin) throw new Error("Unauthorized")

  console.log("[v0] Creating salon with name:", name) // Added debug logging

  const supabase = createAdminClient()

  // Get max order_index
  const { data: salons } = await supabase
    .from("salons")
    .select("order_index")
    .order("order_index", { ascending: false })
    .limit(1)

  const maxOrder = salons && salons.length > 0 ? salons[0].order_index : 0

  const { data, error } = await supabase
    .from("salons")
    .insert({
      name,
      order_index: maxOrder + 1,
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error("[v0] Error creating salon:", error)
    throw new Error(error.message)
  }

  console.log("[v0] Salon created successfully:", data) // Added debug logging

  revalidatePath("/admin")
  revalidatePath("/")
  return { success: true, data }
}

export async function deleteSalon(salonId: string) {
  const user = await getCurrentUser()
  if (!user?.is_admin) throw new Error("Unauthorized")

  const supabase = createAdminClient()

  const { error } = await supabase.from("salons").delete().eq("id", salonId)

  if (error) {
    console.error("[v0] Error deleting salon:", error)
    throw new Error(error.message)
  }

  revalidatePath("/admin")
  revalidatePath("/")
  return { success: true }
}

// Doctor Management
export async function createDoctor(name: string) {
  const user = await getCurrentUser()
  if (!user?.is_admin) throw new Error("Unauthorized")

  console.log("[v0] Creating doctor with name:", name)

  const supabase = createAdminClient()

  const { data, error } = await supabase.from("doctors").insert({ name }).select().maybeSingle()

  if (error) {
    console.error("[v0] Error creating doctor:", error)
    throw new Error(error.message)
  }

  console.log("[v0] Doctor created successfully:", data)

  revalidatePath("/admin")
  revalidatePath("/")
  return { success: true, data }
}

export async function deleteDoctor(doctorId: string) {
  const user = await getCurrentUser()
  if (!user?.is_admin) throw new Error("Unauthorized")

  const supabase = createAdminClient()

  const { error } = await supabase.from("doctors").delete().eq("id", doctorId)

  if (error) {
    console.error("[v0] Error deleting doctor:", error)
    throw new Error(error.message)
  }

  revalidatePath("/admin")
  revalidatePath("/")
  return { success: true }
}

// Activity Logs
export async function getActivityLogs(limit = 50, offset = 0) {
  try {
    const supabase = createAdminClient()

    console.log("[v0] Fetching activity logs with limit:", limit, "offset:", offset)

    const { data, error } = await supabase
      .from("activity_logs")
      .select(`
        *,
        user:profiles!activity_logs_user_id_fkey(id, username, first_name, last_name)
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("[v0] Error fetching activity logs:", error)
      return []
    }

    console.log("[v0] Fetched", data?.length || 0, "activity logs")

    // Extract all unique surgery IDs and salon IDs from logs
    const surgeryIds = new Set<string>()
    const salonIds = new Set<string>()
    ;(data || []).forEach((log) => {
      const details = log.details as any
      if (details?.surgery_id) surgeryIds.add(details.surgery_id)
      if (details?.salon_id) salonIds.add(details.salon_id)
      if (details?.old_salon_id) salonIds.add(details.old_salon_id)
    })

    // Batch fetch all surgeries
    const surgeriesMap = new Map()
    if (surgeryIds.size > 0) {
      const { data: surgeriesData } = await supabase
        .from("surgeries")
        .select("id, patient_name, surgery_date, is_waiting_list, salon_id")
        .in("id", Array.from(surgeryIds))

      surgeriesData?.forEach((s: any) => {
        surgeriesMap.set(s.id, s)
        if (s.salon_id) salonIds.add(s.salon_id)
      })
    }

    // Batch fetch all salons
    const salonsMap = new Map()
    if (salonIds.size > 0) {
      const { data: salonsData } = await supabase.from("salons").select("id, name").in("id", Array.from(salonIds))

      salonsData?.forEach((s: any) => {
        salonsMap.set(s.id, s.name)
      })
    }

    // Map data with pre-fetched information
    const logsWithDetails = (data || []).map((log) => {
      const details = log.details as any
      const surgery = details?.surgery_id ? surgeriesMap.get(details.surgery_id) || null : null
      const salonName = details?.salon_id ? salonsMap.get(details.salon_id) || null : null
      const oldSalonName = details?.old_salon_id ? salonsMap.get(details.old_salon_id) || null : null

      return {
        ...log,
        surgery,
        salonName,
        oldSalonName,
      }
    })

    console.log("[v0] Successfully processed activity logs")
    return logsWithDetails
  } catch (error) {
    console.error("[v0] Error in getActivityLogs:", error)
    return []
  }
}

export async function getActivityLogsCount() {
  const supabase = createAdminClient()

  const { count, error } = await supabase.from("activity_logs").select("*", { count: "exact", head: true })

  if (error) {
    console.error("[v0] Error fetching activity logs count:", error)
    return 0
  }

  return count || 0
}

// Surgery Management
export async function getSurgeryHistory(surgeryId: string) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("activity_logs")
    .select(`
      *,
      user:profiles!activity_logs_user_id_fkey(id, username, first_name, last_name)
    `)
    .eq("details->>surgery_id", surgeryId)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    console.error("[v0] Error fetching surgery history:", error)
    throw new Error("Geçmiş yüklenirken hata oluştu")
  }

  return data || []
}
