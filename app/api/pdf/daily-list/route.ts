import { mockSalons, mockSurgeries, mockDoctors } from "@/lib/mock-data"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const salonId = searchParams.get("salon_id")
  const date = searchParams.get("date")

  if (!salonId || !date) {
    return NextResponse.json({ error: "salon_id and date are required" }, { status: 400 })
  }

  const salon = mockSalons.find((s) => s.id === salonId)
  if (!salon) {
    return NextResponse.json({ error: "Salon not found" }, { status: 404 })
  }

  const surgeries = mockSurgeries
    .filter((s) => s.salon_id === salonId && s.surgery_date === date && !s.is_waiting_list)
    .map((surgery) => ({
      ...surgery,
      responsible_doctor: mockDoctors.find((d) => d.id === surgery.responsible_doctor_id) || null,
    }))

  // Generate HTML for PDF
  const html = generatePDFHTML(salon, surgeries, date)

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  })
}

function generatePDFHTML(salon: any, surgeries: any[], date: string) {
  const formattedDate = new Date(date + "T00:00:00").toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  })

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ameliyat Listesi - ${salon.name} - ${formattedDate}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #000;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #000;
    }
    .header h1 {
      font-size: 18pt;
      margin-bottom: 5px;
    }
    .header h2 {
      font-size: 14pt;
      color: #333;
    }
    .header p {
      font-size: 12pt;
      margin-top: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      border: 1px solid #000;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f0f0f0;
      font-weight: bold;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .no-surgeries {
      text-align: center;
      padding: 40px;
      color: #666;
      font-style: italic;
    }
    .footer {
      margin-top: 30px;
      padding-top: 10px;
      border-top: 1px solid #ccc;
      font-size: 9pt;
      color: #666;
      text-align: center;
    }
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Ameliyat Planlama Sistemi</h1>
    <h2>${salon.name}</h2>
    <p>${formattedDate}</p>
  </div>

  ${
    surgeries.length === 0
      ? '<div class="no-surgeries">Bu gün için ameliyat planlanmamış</div>'
      : `
  <table>
    <thead>
      <tr>
        <th style="width: 8%;">Sıra</th>
        <th style="width: 20%;">Hasta Adı</th>
        <th style="width: 12%;">Protokol No</th>
        <th style="width: 15%;">Endikasyon</th>
        <th style="width: 25%;">Yapılacak İşlem</th>
        <th style="width: 15%;">Sorumlu Hoca</th>
        <th style="width: 10%;">Telefon</th>
      </tr>
    </thead>
    <tbody>
      ${surgeries
        .map(
          (surgery, index) => `
        <tr>
          <td style="text-align: center;">${index + 1}</td>
          <td><strong>${surgery.patient_name}</strong></td>
          <td>${surgery.protocol_number}</td>
          <td>${surgery.indication}</td>
          <td>${surgery.procedure_name}</td>
          <td>${surgery.responsible_doctor?.name || "-"}</td>
          <td style="font-size: 9pt;">
            ${surgery.phone_number_1}<br/>
            ${surgery.phone_number_2}
          </td>
        </tr>
      `,
        )
        .join("")}
    </tbody>
  </table>
  `
  }

  <div class="footer">
    <p>Toplam ${surgeries.length} ameliyat planlanmıştır.</p>
    <p>Yazdırma Tarihi: ${new Date().toLocaleString("tr-TR")}</p>
  </div>

  <script>
    // Auto-print when page loads
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
  `
}
