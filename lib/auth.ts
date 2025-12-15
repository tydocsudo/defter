import { cookies } from "next/headers"
import { cache } from "react"
import { getAdminClient } from "@/lib/supabase/admin"

export interface User {
  id: string
  username: string
  first_name: string
  last_name: string
  is_admin: boolean
}

export async function verifyCredentials(username: string, password: string): Promise<User | null> {
  try {
    const supabase = getAdminClient()

    // First, get the user's email from profiles table using username
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, first_name, last_name, is_admin")
      .eq("username", username)
      .maybeSingle()

    if (profileError || !profile) {
      console.log("[v0] Profile not found for username:", username)
      return null
    }

    // Get the email from auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.id)

    if (authError || !authUser.user) {
      console.log("[v0] Auth user not found:", authError)
      return null
    }

    // Verify password using Supabase auth
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: authUser.user.email!,
      password: password,
    })

    if (signInError || !signInData.user) {
      console.log("[v0] Sign in failed:", signInError?.message)
      return null
    }

    return {
      id: profile.id,
      username: profile.username,
      first_name: profile.first_name,
      last_name: profile.last_name,
      is_admin: profile.is_admin,
    }
  } catch (error) {
    console.error("[v0] Error verifying credentials:", error)
    return null
  }
}

export function generateSessionId(): string {
  return crypto.randomUUID()
}

export async function createSession(userId: string): Promise<void> {
  const sessionId = generateSessionId()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const cookieStore = await cookies()
  cookieStore.set("session_id", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  })

  cookieStore.set("user_id", userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  })
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete("session_id")
  cookieStore.delete("user_id")
}

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const cookieStore = await cookies()
  const userId = cookieStore.get("user_id")?.value

  if (!userId) {
    return null
  }

  try {
    const supabase = getAdminClient()
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, username, first_name, last_name, is_admin")
      .eq("id", userId)
      .maybeSingle()

    if (error || !profile) {
      return null
    }

    return {
      id: profile.id,
      username: profile.username,
      first_name: profile.first_name,
      last_name: profile.last_name,
      is_admin: profile.is_admin,
    }
  } catch (error) {
    console.error("[v0] Error getting current user:", error)
    return null
  }
})
