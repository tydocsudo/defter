import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const doctorId = searchParams.get("doctorId")
    const salonId = searchParams.get("salonId")
    const checkDate = searchParams.get("checkDate")

    if (!doctorId || !salonId) {
      return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 })
    }

    const supabase = createAdminClient()

    if (checkDate) {
      const { data: assignedDoctor, error: checkError } = await supabase
        .from("daily_assigned_doctors")
        .select("doctor_id, doctors!inner(id, name)")
        .eq("salon_id", salonId)
        .eq("assigned_date", checkDate)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        console.error("Error checking assigned doctor:", checkError)
        return NextResponse.json({ success: false, error: checkError.message }, { status: 500 })
      }

      if (assignedDoctor) {
        return NextResponse.json({
          success: true,
          assignedDoctor: {
            id: assignedDoctor.doctor_id,
            name: (assignedDoctor.doctors as any).name,
          },
        })
      }

      return NextResponse.json({ success: true, assignedDoctor: null })
    }

    const { data, error } = await supabase
      .from("daily_assigned_doctors")
      .select("assigned_date")
      .eq("doctor_id", doctorId)
      .eq("salon_id", salonId)
      .order("assigned_date", { ascending: true })

    if (error) {
      console.error("Error fetching assigned dates:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const dates = data.map((item) => item.assigned_date)

    return NextResponse.json({ success: true, dates })
  } catch (error: any) {
    console.error("Error in doctor-assigned-dates API:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
