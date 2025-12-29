import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import ExcelJS from "exceljs"

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

  const excelBuffer = await generateExcelXLSX(salon, surgeries || [], date)
  const formattedDate = format(new Date(date + "T00:00:00"), "dd-MM-yyyy", { locale: tr })

  return new NextResponse(excelBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="ameliyat-listesi-${formattedDate}.xlsx"`,
    },
  })
}

async function generateExcelXLSX(salon: any, surgeries: any[], date: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet("Ameliyat Listesi")

  const formattedDate = format(new Date(date + "T00:00:00"), "dd/MM/yyyy", { locale: tr })

  // Title
  worksheet.mergeCells("A1:K1")
  const titleCell = worksheet.getCell("A1")
  titleCell.value = "JİNEKOLOJİ KLİNİĞİ GÜNLÜK AMELİYAT LİSTESİ"
  titleCell.font = { bold: true, size: 14 }
  titleCell.alignment = { horizontal: "center", vertical: "middle" }

  // Date
  worksheet.mergeCells("A2:K2")
  const dateCell = worksheet.getCell("A2")
  dateCell.value = `TARİH: ${formattedDate}`
  dateCell.font = { bold: true, size: 12 }
  dateCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFF00" },
  }
  dateCell.alignment = { horizontal: "left", vertical: "middle" }

  // Headers
  const headers = [
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

  const headerRow = worksheet.getRow(4)
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1)
    cell.value = header
    cell.font = { bold: true }
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "D3D3D3" },
    }
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    }
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
  })

  // Data rows
  surgeries.forEach((surgery, index) => {
    const row = worksheet.getRow(5 + index)
    const rowData = [
      salon.name.replace("Salon ", ""),
      surgery.patient_name?.toUpperCase() || "",
      surgery.room_number || "",
      surgery.protocol_number || "",
      surgery.age || "",
      surgery.asa_score || "",
      surgery.indication?.toUpperCase() || "",
      surgery.procedure_name?.toUpperCase() || "",
      surgery.icu_need ? "EVET" : "",
      surgery.blood_preparation ? "EVET" : "",
      surgery.responsible_doctor?.name?.toUpperCase() || "",
    ]

    rowData.forEach((data, colIndex) => {
      const cell = row.getCell(colIndex + 1)
      cell.value = data
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      }
      cell.alignment = { vertical: "middle", wrapText: true }
    })
  })

  // Set column widths
  worksheet.columns = [
    { width: 15 }, // Ameliyat Salon No
    { width: 25 }, // Hasta Adı
    { width: 10 }, // Oda No
    { width: 15 }, // Protokol No
    { width: 8 }, // Yaş
    { width: 12 }, // ASA Skoru
    { width: 30 }, // Tanı
    { width: 40 }, // Operasyon
    { width: 15 }, // Yoğun Bakım
    { width: 15 }, // Kan Hazırlığı
    { width: 25 }, // Doktor Adı
  ]

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
