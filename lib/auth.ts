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
    const adminClient = getAdminClient()

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("id, username, first_name, last_name, is_admin, password")
      .eq("username", username)
      .maybeSingle()

    if (profileError || !profile) {
      return null
    }

    if (profile.password !== password) {
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
    const adminClient = getAdminClient()
    const { data: profile, error } = await adminClient
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
    return null
  }
})
