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

  const html = generatePDFHTML(salon, surgeries || [], date)

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  })
}

function generatePDFHTML(salon: any, surgeries: any[], date: string) {
  const formattedDate = format(new Date(date + "T00:00:00"), "dd/MM/yyyy", { locale: tr })

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Günlük Ameliyat Listesi - ${formattedDate}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 15mm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      font-size: 9pt;
      line-height: 1.3;
      color: #000;
    }
    .header-section {
      display: flex;
      border: 2px solid #000;
      margin-bottom: 5px;
    }
    .logo-section {
      width: 200px;
      border-right: 2px solid #000;
      padding: 10px;
      text-align: center;
    }
    .logo-section img {
      width: 80px;
      height: auto;
      margin-bottom: 5px;
    }
    .logo-text {
      font-size: 7pt;
      font-weight: bold;
      line-height: 1.2;
    }
    .title-section {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14pt;
      font-weight: bold;
      text-align: center;
    }
    .info-section {
      width: 200px;
      border-left: 2px solid #000;
      padding: 5px;
      font-size: 8pt;
    }
    .info-row {
      border: 1px solid #000;
      padding: 3px 5px;
      margin-bottom: 2px;
    }
    .date-row {
      background-color: #FFFF00;
      font-weight: bold;
      padding: 5px;
      border: 2px solid #000;
      margin-bottom: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      border: 1px solid #000;
      padding: 4px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background-color: #f0f0f0;
      font-weight: bold;
      font-size: 8pt;
      text-align: center;
    }
    td {
      font-size: 9pt;
    }
    .col-salon { width: 8%; text-align: center; }
    .col-name { width: 12%; }
    .col-room { width: 6%; text-align: center; }
    .col-protocol { width: 10%; text-align: center; }
    .col-age { width: 5%; text-align: center; }
    .col-asa { width: 5%; text-align: center; }
    .col-diagnosis { width: 18%; }
    .col-operation { width: 20%; }
    .col-icu { width: 8%; text-align: center; }
    .col-blood { width: 8%; text-align: center; }
    .col-doctor { width: 12%; }
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="header-section">
    <div class="logo-section">
      <img src="/logo.png" alt="Logo" />
      <div class="logo-text">
        T.C. SAĞLIK BAKANLIĞI<br/>
        ANKARA BİLKENT ŞEHİR HASTANESİ<br/>
        KADIN HASTALIKLARI VE DOĞUM
      </div>
    </div>
    <div class="title-section">
      JİNEKOLOJİ KLİNİĞİ GÜNLÜK AMELİYAT LİSTESİ
    </div>
    <div class="info-section">
      <div class="info-row">Kodu:</div>
      <div class="info-row">Yayın Tarihi:</div>
      <div class="info-row">Revizyon Tarihi:</div>
      <div class="info-row">Revizyon No: 1</div>
      <div class="info-row">Sayfa No/ Sayısı:1/1</div>
    </div>
  </div>
  
  <div class="date-row">
    TARİH: ${formattedDate}
  </div>

  <table>
    <thead>
      <tr>
        <th class="col-salon">AMELİYAT<br/>SALON NO</th>
        <th class="col-name">HASTA ADI</th>
        <th class="col-room">ODA<br/>NO</th>
        <th class="col-protocol">PROTOKOL NO</th>
        <th class="col-age">YAŞ</th>
        <th class="col-asa">ASA<br/>SKORU</th>
        <th class="col-diagnosis">TANI</th>
        <th class="col-operation">OPERASYON</th>
        <th class="col-icu">YOĞUN<br/>BAKIM<br/>İHTİYACI</th>
        <th class="col-blood">KAN<br/>HAZIRLIĞI</th>
        <th class="col-doctor">DOKTOR ADI</th>
      </tr>
    </thead>
    <tbody>
      ${
        surgeries.length === 0
          ? '<tr><td colspan="11" style="text-align: center; padding: 30px; color: #666;">Bu gün için ameliyat planlanmamış</td></tr>'
          : surgeries
              .map(
                (surgery) => `
        <tr>
          <td class="col-salon">${salon.name.replace("Salon ", "")}</td>
          <td class="col-name"><strong>${surgery.patient_name.toUpperCase()}</strong></td>
          <td class="col-room">${surgery.room_number || ""}</td>
          <td class="col-protocol">${surgery.protocol_number || ""}</td>
          <td class="col-age">${surgery.age || ""}</td>
          <td class="col-asa">${surgery.asa_score || ""}</td>
          <td class="col-diagnosis">${surgery.indication?.toUpperCase() || ""}</td>
          <td class="col-operation">${surgery.procedure_name?.toUpperCase() || ""}</td>
          <td class="col-icu">${surgery.icu_need ? "EVET" : ""}</td>
          <td class="col-blood">${surgery.blood_preparation ? "EVET" : ""}</td>
          <td class="col-doctor">${surgery.responsible_doctor?.name?.toUpperCase() || ""}</td>
        </tr>
      `,
              )
              .join("")
      }
    </tbody>
  </table>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
  `
}
