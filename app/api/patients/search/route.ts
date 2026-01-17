import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q")
    const doctorId = searchParams.get("doctorId")
    const waitingListOnly = searchParams.get("waitingListOnly") === "true"

    if (!query || query.length < 2) {
      return NextResponse.json([])
    }

    const supabase = createAdminClient()

    let dbQuery = supabase
      .from("surgeries")
      .select(`
        id,
        patient_name,
        protocol_number,
        indication,
        procedure_name,
        surgery_date,
        salon_id,
        salon:salons(id, name),
        responsible_doctor:doctors!responsible_doctor_id(id, name)
      `)
      .eq("is_waiting_list", waitingListOnly)

    if (!waitingListOnly) {
      dbQuery = dbQuery.not("surgery_date", "is", null)
    }

    dbQuery = dbQuery.or(
      `patient_name.ilike.%${query}%,protocol_number.ilike.%${query}%,indication.ilike.%${query}%,procedure_name.ilike.%${query}%`,
    )

    if (doctorId) {
      dbQuery = dbQuery.eq("responsible_doctor_id", doctorId)
    }

    const { data, error } = await dbQuery.order("created_at", { ascending: false }).limit(10)

    if (error) {
      console.error("Patient search error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Patient search error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
