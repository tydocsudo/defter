# Excel Export Sistemi Kurulum Rehberi

## Gereksinimler

### 1. NPM Paketleri

Projeye ExcelJS paketini kurun:

```bash
npm install exceljs
```

### 2. LibreOffice (PDF Dönüşümü için)

PDF export özelliği için sunucuda LibreOffice kurulu olmalıdır.

#### Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install -y libreoffice-calc --no-install-recommends
```

#### macOS (Homebrew):
```bash
brew install --cask libreoffice
```

#### Windows:
[LibreOffice resmi sitesinden](https://www.libreoffice.org/download/download/) indirip kurun.

## Şablon Dosyası

**❌ Şablon dosyası GEREKLİ DEĞİL!** 

Bu sistem template dosyası kullanmaz. Tüm Excel tasarımı (başlık, tarih, tablo, border, kolon genişlikleri, yazdırma ayarları) ExcelJS ile programatik olarak oluşturulur.

### Oluşturulan Tasarım

Excel dosyası aşağıdaki özelliklerde otomatik oluşturulur:

- **Worksheet adı**: Sayfa1
- **Sayfa düzeni**: A4, portrait, 1 sayfa genişliğinde
- **Başlık** (Row 4): "JİNEKOLOJİ KLİNİĞİ GÜNLÜK AMELİYAT LİSTESİ" (merged A4:K4, bold, 18pt, center)
- **Tarih** (Row 6): "TARİH: dd/MM/yyyy" (merged A6:K6, bold, 12pt, left)
- **Tablo başlıkları** (Row 7): Bold, center, wrap text, light gray fill
- **Veri satırları** (Row 8-17): 10 kayıt kapasitesi, borders, wrap text

### Doldurulacak Kolonlar

Sadece şu kolonlar doldurulur:
- **A**: Salon No
- **B**: Hasta Adı  
- **D**: Protokol No
- **G**: Tanı
- **H**: Operasyon
- **K**: Doktor Adı

Diğer kolonlar (C: Oda No, E: Yaş, F: ASA Skoru, I: Yoğun Bakım İhtiyacı, J: Kan Hazırlığı) boş kalır.

## API Kullanımı

### Endpoint

```
GET /api/export/salon?salon_id={uuid}&date={YYYY-MM-DD}&format={xlsx|pdf}
```

### Parametreler

- **salon_id** (zorunlu): Salon UUID'si
- **date** (zorunlu): Ameliyat tarihi (YYYY-MM-DD formatında)
- **format** (opsiyonel): "xlsx" veya "pdf" (varsayılan: xlsx)

### Örnek İstekler

#### Excel İndirme:
```
GET /api/export/salon?salon_id=f717ec03-2bfd-43d7-b761-41f3ee320fa0&date=2025-01-15&format=xlsx
```

#### PDF İndirme:
```
GET /api/export/salon?salon_id=f717ec03-2bfd-43d7-b761-41f3ee320fa0&date=2025-01-15&format=pdf
```

### Yanıt Başlıkları

**XLSX:**
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="ameliyat-listesi-15-01-2025.xlsx"
```

**PDF:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="ameliyat-listesi-15-01-2025.pdf"
```

## Hata Kodları

- **400**: Gerekli parametreler eksik veya geçersiz format
- **404**: Salon bulunamadı
- **500**: Export veya PDF dönüşüm hatası

### Örnek Hata Yanıtı

```json
{
  "error": "PDF dönüşümü başarısız oldu. LibreOffice kurulu olmayabilir.",
  "details": "Command failed: soffice --headless...",
  "note": "LibreOffice kurmak için: apt-get install libreoffice-calc --no-install-recommends"
}
```

## Troubleshooting

### LibreOffice Bulunamıyor

Eğer PDF dönüşümü "LibreOffice kurulu olmayabilir" hatası veriyorsa:

1. LibreOffice'in kurulu olduğundan emin olun
2. Terminal'de `soffice --version` veya `libreoffice --version` komutunu çalıştırın
3. PATH değişkeninde LibreOffice'in olduğunu kontrol edin

### Vercel/Production Deployment

Vercel gibi serverless ortamlarda LibreOffice kurulamaz. Alternatifler:

1. **Sadece XLSX**: PDF özelliğini kullanmayın, sadece Excel export sunun
2. **External Service**: PDF dönüşümü için harici bir servis kullanın (örn: AWS Lambda with LibreOffice layer)
3. **Client-side**: Kullanıcının Excel'i indirip kendisi PDF'e çevirmesini sağlayın

### v0 Ortamında Kullanım

v0 preview ortamında:
- ✅ XLSX export çalışır (ExcelJS tamamen Node.js tabanlı)
- ❌ PDF export çalışmaz (LibreOffice kurulu değil)

Production'da PDF kullanmak için sunucunuzda LibreOffice kurmanız gerekir.

## Tasarım Detayları

Programatik olarak oluşturulan tasarım özellikleri:

### Kolon Genişlikleri
- A: 14 (Salon No)
- B: 28 (Hasta Adı)
- C: 12 (Oda No)
- D: 16 (Protokol No)
- E: 8 (Yaş)
- F: 10 (ASA Skoru)
- G: 22 (Tanı)
- H: 26 (Operasyon)
- I: 18 (Yoğun Bakım İhtiyacı)
- J: 14 (Kan Hazırlığı)
- K: 22 (Doktor Adı)

### Satır Yükseklikleri
- Row 4 (Başlık): 30pt
- Row 6 (Tarih): 20pt
- Row 7 (Header): 26pt
- Row 8-17 (Data): 22pt

### Biçimlendirme
- **Grid lines**: Kapalı
- **Borders**: Tüm tablo hücreleri thin border
- **Header fill**: Light gray (ARGB: FFD9D9D9)
- **Text alignment**: Vertical middle, wrap text enabled
- **Font**: Default Excel font (Calibri)
