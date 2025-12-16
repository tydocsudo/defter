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

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("username")
    .eq("username", formData.username)
    .maybeSingle()

  if (existingProfile) {
    throw new Error("Bu kullanıcı adı zaten kullanılıyor")
  }

  // Create profile directly with password
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: crypto.randomUUID(),
      username: formData.username,
      password: formData.password,
      first_name: formData.first_name,
      last_name: formData.last_name,
      is_admin: formData.is_admin,
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error("[v0] Error creating user:", error)
    throw new Error("Kullanıcı oluşturulurken hata oluştu: " + error.message)
  }

  revalidatePath("/admin")
  return { success: true, data }
}

export async function updateUserPassword(userId: string, newPassword: string) {
  const user = await getCurrentUser()
  if (!user?.is_admin) throw new Error("Unauthorized")

  const supabase = createAdminClient()

  const { error } = await supabase.from("profiles").update({ password: newPassword }).eq("id", userId)

  if (error) {
    console.error("[v0] Error updating user password:", error)
    throw new Error("Şifre güncellenirken hata oluştu: " + error.message)
  }

  revalidatePath("/admin")
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

  const supabase = createAdminClient()

  const { data, error } = await supabase.from("doctors").insert({ name }).select().maybeSingle()

  if (error) {
    console.error("[v0] Error creating doctor:", error)
    throw new Error(error.message)
  }

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
export async function getActivityLogs(limit = 50) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("[v0] Error fetching activity logs:", error)
    return []
  }

  return data || []
}
