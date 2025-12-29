import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const supabase = createAdminClient()

  const searchParams = request.nextUrl.searchParams
  const salonId = searchParams.get("salon_id")
  const startDate = searchParams.get("start_date")
  const endDate = searchParams.get("end_date")
  const isWaitingList = searchParams.get("is_waiting_list")

  console.log("[v0] Surgery API called with params:", {
    salonId,
    startDate,
    endDate,
    isWaitingList,
  })

  let query = supabase.from("surgeries").select(`
      *,
      responsible_doctor:doctors!surgeries_responsible_doctor_id_fkey(id, name),
      salon:salons(id, name),
      creator:profiles!surgeries_created_by_fkey(id, username, first_name, last_name),
      approver:profiles!surgeries_approved_by_fkey(id, username, first_name, last_name)
    `)

  if (isWaitingList === "true") {
    query = query.eq("is_waiting_list", true)
  } else {
    // Default to false to show only scheduled surgeries
    query = query.eq("is_waiting_list", false)
  }

  if (salonId) {
    query = query.eq("salon_id", salonId)
  }

  if (startDate && endDate) {
    query = query.not("surgery_date", "is", null).gte("surgery_date", startDate).lte("surgery_date", endDate)
  }

  const { data, error } = await query.order("surgery_date", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching surgeries:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log("[v0] Fetched surgeries from Supabase:", data?.length || 0)
  if (data && data.length > 0) {
    console.log("[v0] Sample surgery data:", {
      count: data.length,
      dates: data.slice(0, 3).map((s) => s.surgery_date),
      salons: data.slice(0, 3).map((s) => s.salon?.name),
    })
  }

  return NextResponse.json(data || [])
}
