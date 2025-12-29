import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import ExcelJS from "exceljs"
import { exec } from "child_process"
import { promisify } from "util"
import { writeFile, unlink, readFile } from "fs/promises"
import { tmpdir } from "os"
import { join } from "path"

const execAsync = promisify(exec)

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const salonId = searchParams.get("salon_id")
  const date = searchParams.get("date")
  const format = searchParams.get("format") || "xlsx"

  if (!salonId || !date) {
    return NextResponse.json({ error: "salon_id ve date parametreleri zorunludur" }, { status: 400 })
  }

  if (format !== "xlsx" && format !== "pdf") {
    return NextResponse.json({ error: "format parametresi 'xlsx' veya 'pdf' olmalıdır" }, { status: 400 })
  }

  try {
    const supabase = await createClient()

    const { data: salon, error: salonError } = await supabase.from("salons").select("*").eq("id", salonId).single()

    if (salonError || !salon) {
      return NextResponse.json({ error: "Salon bulunamadı" }, { status: 404 })
    }

    const { data: surgeries, error: surgeriesError } = await supabase
      .from("surgeries")
      .select(`
        *,
        responsible_doctor:doctors!surgeries_responsible_doctor_id_fkey(name)
      `)
      .eq("salon_id", salonId)
      .eq("surgery_date", date)
      .eq("is_waiting_list", false)
      .order("order_index")

    if (surgeriesError) {
      return NextResponse.json(
        { error: "Ameliyatlar yüklenirken hata oluştu: " + surgeriesError.message },
        { status: 500 },
      )
    }

    const workbookBuffer = await createExcelFromScratch(salon, surgeries || [], date)

    if (format === "xlsx") {
      const formattedDate = date.split("-").reverse().join("-")
      return new NextResponse(workbookBuffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="ameliyat-listesi-${formattedDate}.xlsx"`,
        },
      })
    } else {
      try {
        const pdfBuffer = await convertToPDF(workbookBuffer, date)
        const formattedDate = date.split("-").reverse().join("-")
        return new NextResponse(pdfBuffer, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="ameliyat-listesi-${formattedDate}.pdf"`,
          },
        })
      } catch (pdfError) {
        return NextResponse.json(
          {
            error: "PDF dönüşümü başarısız oldu. LibreOffice kurulu olmayabilir.",
            details: pdfError instanceof Error ? pdfError.message : String(pdfError),
            note: "LibreOffice kurmak için: apt-get install libreoffice-calc --no-install-recommends",
          },
          { status: 500 },
        )
      }
    }
  } catch (error) {
    console.error("[v0] Excel export error:", error)
    return NextResponse.json(
      {
        error: "Export sırasında hata oluştu",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

async function createExcelFromScratch(salon: any, surgeries: any[], date: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet("Sayfa1")

  worksheet.pageSetup = {
    paperSize: 9, // A4
    orientation: "portrait",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0, // auto
    margins: {
      left: 0.7,
      right: 0.7,
      top: 0.75,
      bottom: 0.75,
      header: 0.3,
      footer: 0.3,
    },
  }

  worksheet.getColumn(1).width = 14 // A: Ameliyat Salon No
  worksheet.getColumn(2).width = 28 // B: Hasta Adı
  worksheet.getColumn(3).width = 12 // C: Oda No
  worksheet.getColumn(4).width = 16 // D: Protokol No
  worksheet.getColumn(5).width = 8 // E: Yaş
  worksheet.getColumn(6).width = 10 // F: ASA Skoru
  worksheet.getColumn(7).width = 22 // G: Tanı
  worksheet.getColumn(8).width = 26 // H: Operasyon
  worksheet.getColumn(9).width = 18 // I: Yoğun Bakım İhtiyacı
  worksheet.getColumn(10).width = 14 // J: Kan Hazırlığı
  worksheet.getColumn(11).width = 22 // K: Doktor Adı

  worksheet.mergeCells("A4:K4")
  const titleCell = worksheet.getCell("A4")
  titleCell.value = "JİNEKOLOJİ KLİNİĞİ GÜNLÜK AMELİYAT LİSTESİ"
  titleCell.font = { size: 18, bold: true }
  titleCell.alignment = { horizontal: "center", vertical: "middle" }
  worksheet.getRow(4).height = 30

  worksheet.mergeCells("A6:K6")
  const dateCell = worksheet.getCell("A6")
  const formattedDate = date.split("-").reverse().join("/")
  dateCell.value = `TARİH: ${formattedDate}`
  dateCell.font = { size: 12, bold: true }
  dateCell.alignment = { horizontal: "left", vertical: "middle" }
  worksheet.getRow(6).height = 20

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

  headers.forEach((header, idx) => {
    const cell = worksheet.getCell(7, idx + 1)
    cell.value = header
    cell.font = { bold: true }
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9D9D9" }, // light gray
    }
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    }
  })
  worksheet.getRow(7).height = 26

  const salonNumber = salon.name.match(/\d+/)?.[0] || salon.name

  const maxRows = 10
  const startRow = 8

  for (let i = 0; i < maxRows; i++) {
    const row = startRow + i
    const surgery = surgeries[i]

    if (surgery) {
      // Column A: Salon No
      worksheet.getCell(`A${row}`).value = salonNumber
      // Column B: Hasta Adı
      worksheet.getCell(`B${row}`).value = surgery.patient_name?.toUpperCase() || ""
      // Column D: Protokol No
      worksheet.getCell(`D${row}`).value = surgery.protocol_number || ""
      // Column G: Tanı
      worksheet.getCell(`G${row}`).value = surgery.indication?.toUpperCase() || ""
      // Column H: Operasyon
      worksheet.getCell(`H${row}`).value = surgery.procedure_name?.toUpperCase() || ""
      // Column K: Doktor Adı
      worksheet.getCell(`K${row}`).value = surgery.responsible_doctor?.name?.toUpperCase() || ""
    }

    for (let col = 1; col <= 11; col++) {
      const cell = worksheet.getCell(row, col)
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      }
      cell.alignment = { vertical: "middle", wrapText: true }
    }

    worksheet.getRow(row).height = 22
  }

  worksheet.views = [{ showGridLines: false }]

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

async function convertToPDF(xlsxBuffer: Buffer, date: string): Promise<Buffer> {
  const tmpDir = tmpdir()
  const timestamp = Date.now()
  const xlsxPath = join(tmpDir, `surgery-list-${timestamp}.xlsx`)
  const pdfPath = join(tmpDir, `surgery-list-${timestamp}.pdf`)

  try {
    // Write XLSX to temp file
    await writeFile(xlsxPath, xlsxBuffer)

    // Try soffice first, then libreoffice as fallback
    let convertCommand = `soffice --headless --nologo --nofirststartwizard --convert-to pdf --outdir "${tmpDir}" "${xlsxPath}"`

    try {
      await execAsync(convertCommand)
    } catch {
      // Fallback to libreoffice command
      convertCommand = `libreoffice --headless --nologo --nofirststartwizard --convert-to pdf --outdir "${tmpDir}" "${xlsxPath}"`
      await execAsync(convertCommand)
    }

    // Read the generated PDF
    const pdfBuffer = await readFile(pdfPath)

    // Cleanup temp files
    await unlink(xlsxPath).catch(() => {})
    await unlink(pdfPath).catch(() => {})

    return pdfBuffer
  } catch (error) {
    // Cleanup on error
    await unlink(xlsxPath).catch(() => {})
    await unlink(pdfPath).catch(() => {})
    throw error
  }
}
