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
      responsible_doctor:doctors!responsible_doctor_id(id, name),
      salon:salons!salon_id(id, name),
      creator:profiles!created_by(id, username, first_name, last_name),
      approver:profiles!approved_by(id, username, first_name, last_name)
    `)

  if (isWaitingList === "true") {
    query = query.eq("is_waiting_list", true)
  } else {
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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || [])
}
