import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("doctors")
      .select("id, name, first_name, last_name, title, specialization, email, phone")
      .order("name", { ascending: true })

    if (error) {
      console.error("Doctors fetch error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Doctors fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
