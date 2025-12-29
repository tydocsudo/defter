import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const salonId = searchParams.get("salon_id")
  const date = searchParams.get("date")

  if (!salonId || !date) {
    return NextResponse.json({ error: "salon_id and date are required" }, { status: 400 })
  }

  const supabase = await createClient()

  // Fetch salon details
  const { data: salon } = await supabase.from("salons").select("*").eq("id", salonId).single()

  if (!salon) {
    return NextResponse.json({ error: "Salon not found" }, { status: 404 })
  }

  // Fetch surgeries for the date
  const { data: surgeries } = await supabase
    .from("surgeries")
    .select(
      `
      *,
      responsible_doctor:doctors!surgeries_responsible_doctor_id_fkey(name),
      salon:salons(name)
    `,
    )
    .eq("salon_id", salonId)
    .eq("surgery_date", date)
    .eq("is_waiting_list", false)
    .order("created_at")

  const csv = generateExcelCSV(salon, surgeries || [], date)
  const formattedDate = format(new Date(date + "T00:00:00"), "dd-MM-yyyy", { locale: tr })

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ameliyat-listesi-${formattedDate}.csv"`,
    },
  })
}

function generateExcelCSV(salon: any, surgeries: any[], date: string) {
  const formattedDate = format(new Date(date + "T00:00:00"), "dd/MM/yyyy", { locale: tr })

  // CSV Header matching the template
  const header = [
    "AMELİYAT SALON NO",
    "HASTA ADI",
    "ODA NO",
    "PROTOKOL NO",
    "YAŞ",
    "ASA SKORU",
    "TANI",
    "OPERASYON",
    "YOĞUN BAKIM İHTİYACI",
    "KAN HAZIRLIĞI",
    "DOKTOR ADI",
  ]

  // Title rows
  const titleRows = [["JİNEKOLOJİ KLİNİĞİ GÜNLÜK AMELİYAT LİSTESİ"], [`TARİH: ${formattedDate}`], [], header]

  // Data rows
  const dataRows = surgeries.map((surgery) => [
    salon.name.replace("Salon ", ""),
    surgery.patient_name.toUpperCase(),
    surgery.room_number || "",
    surgery.protocol_number || "",
    surgery.age || "",
    surgery.asa_score || "",
    surgery.indication?.toUpperCase() || "",
    surgery.procedure_name?.toUpperCase() || "",
    surgery.icu_need ? "EVET" : "",
    surgery.blood_preparation ? "EVET" : "",
    surgery.responsible_doctor?.name?.toUpperCase() || "",
  ])

  // Combine all rows
  const allRows = [...titleRows, ...dataRows]

  // Convert to CSV format with proper escaping
  const csvContent = allRows
    .map((row) =>
      row
        .map((cell) => {
          const cellStr = String(cell)
          // Escape quotes and wrap in quotes if contains comma or quote
          if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
            return `"${cellStr.replace(/"/g, '""')}"`
          }
          return cellStr
        })
        .join(","),
    )
    .join("\n")

  // Add BOM for proper Turkish character encoding in Excel
  return "\uFEFF" + csvContent
}
