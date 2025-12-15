import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const supabase = createAdminClient()

  const searchParams = request.nextUrl.searchParams
  const salonId = searchParams.get("salon_id")
  const startDate = searchParams.get("start_date")
  const endDate = searchParams.get("end_date")
  const isWaitingList = searchParams.get("is_waiting_list")

  let query = supabase.from("surgeries").select(`
      *,
      responsible_doctor:doctors!surgeries_responsible_doctor_id_fkey(id, name),
      senior_resident:doctors!surgeries_senior_resident_id_fkey(id, name),
      junior_resident:doctors!surgeries_junior_resident_id_fkey(id, name),
      salon:salons(id, name)
    `)

  if (isWaitingList === "true") {
    query = query.eq("is_waiting_list", true)
  } else if (isWaitingList === "false") {
    query = query.eq("is_waiting_list", false)
  }

  if (salonId) {
    query = query.eq("salon_id", salonId)
  }

  if (startDate && endDate) {
    query = query.gte("surgery_date", startDate).lte("surgery_date", endDate)
  }

  const { data, error } = await query.order("surgery_date", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching surgeries:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log("[v0] Fetched surgeries from Supabase:", data?.length || 0)
  return NextResponse.json(data || [])
}
