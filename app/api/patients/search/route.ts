import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q")

    if (!query || query.length < 2) {
      return NextResponse.json([])
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("surgeries")
      .select(`
        id,
        patient_name,
        protocol_number,
        indication,
        surgery_date,
        salon_id,
        salon:salons(id, name)
      `)
      .eq("is_waiting_list", false)
      .not("surgery_date", "is", null)
      .or(`patient_name.ilike.%${query}%,protocol_number.ilike.%${query}%,indication.ilike.%${query}%`)
      .order("surgery_date", { ascending: false })
      .limit(10)

    if (error) {
      console.error("[v0] Patient search error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("[v0] Patient search error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
