import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const supabase = createAdminClient()

  const searchParams = request.nextUrl.searchParams
  const salonId = searchParams.get("salon_id")
  const startDate = searchParams.get("start_date")
  const endDate = searchParams.get("end_date")

  let query = supabase.from("daily_assigned_doctors").select(`
      *,
      doctor:doctors(id, name)
    `)

  if (salonId) {
    query = query.eq("salon_id", salonId)
  }

  if (startDate && endDate) {
    query = query.gte("assigned_date", startDate).lte("assigned_date", endDate)
  }

  const { data, error } = await query

  if (error) {
    console.error("[v0] Error fetching assigned doctors:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || [])
}
