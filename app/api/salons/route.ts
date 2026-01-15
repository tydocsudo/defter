import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase.from("salons").select("*").order("order_index", { ascending: true })

    if (error) {
      console.error("Salons fetch error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Salons fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
