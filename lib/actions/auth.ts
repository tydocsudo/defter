"use server"

import { createSession, deleteSession, getCurrentUser as getUser, verifyCredentials } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function login(username: string, password: string) {
  const user = await verifyCredentials(username, password)

  if (!user) {
    return { success: false, error: "Kullanıcı adı veya şifre hatalı" }
  }

  await createSession(user.id)

  return { success: true }
}

export async function logout() {
  await deleteSession()
  revalidatePath("/", "layout")
  redirect("/login")
}

export async function getCurrentUser() {
  return await getUser()
}
