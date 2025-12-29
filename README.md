# Ameliyat Planlama Sistemi

Hastane ameliyathaneleri için kapsamlı bir ameliyat planlama ve takip sistemi.

## Özellikler

### Kullanıcı Yönetimi
- Rol tabanlı erişim kontrolü (Admin/Kullanıcı)
- Kullanıcı oluşturma ve yönetme
- Detaylı aktivite logları

### Ameliyat Yönetimi
- Günlük ameliyat planlaması
- Hasta bilgileri (ad, protokol no, endikasyon, işlem)
- Doktor atamaları (sorumlu hoca)
- Hasta iletişim bilgileri

### Takvim Görünümleri
- Aylık takvim görünümü
- Günlük detaylı ameliyat listesi
- Salon bazlı görüntüleme
- Günlük hoca atamaları

### Bekleme Listesi
- Ameliyat bekleyen hastaların takibi
- Takvime kolay atama
- Hasta bazlı notlar

### Not Sistemi
- Gün bazlı notlar
- Hasta bazlı notlar
- Kullanıcı kimlik bilgisi ile not takibi

### PDF Export
- Günlük ameliyat listelerini PDF olarak indirme
- Türkçe karakter desteği
- Print-ready format

### Mobil Uyumlu
- Responsive tasarım
- Mobil cihazlarda optimum kullanım
- Touch-friendly interface

## Kurulum

### Gereksinimler
- Node.js 18+
- Supabase hesabı
- Modern web tarayıcı

### Adımlar

1. **Bağımlılıkları yükleyin:**
```bash
npm install
```

2. **Veritabanı tablolarını oluşturun:**
Scripts klasöründeki SQL dosyalarını sırayla çalıştırın:
- `001_create_tables.sql`
- `002_create_profile_trigger.sql`
- `003_seed_initial_data.sql`
- `004_create_admin_user.sql`

3. **Uygulamayı başlatın:**
```bash
npm run dev
```

4. **İlk giriş:**
- Kullanıcı adı: `admin`
- Şifre: `admin123`

**ÖNEMLİ:** İlk girişten sonra admin şifresini değiştirin!

## Kullanım

### Admin İşlemleri
- Kullanıcı ekleme/silme
- Salon yönetimi
- Hoca yönetimi
- İşlem geçmişini görüntüleme
- Günlük hoca atamaları

### Kullanıcı İşlemleri
- Ameliyat ekleme/düzenleme/silme
- Bekleme listesi yönetimi
- Not ekleme (gün ve hasta bazlı)
- PDF export

## Teknolojiler

- **Frontend:** Next.js 16, React 19, Tailwind CSS
- **Backend:** Next.js API Routes
- **Veritabanı:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **UI Components:** shadcn/ui

## Güvenlik

- Row Level Security (RLS) ile veri koruması
- Rol tabanlı yetkilendirme
- Secure authentication
- HTTPS zorunlu (production)

## Lisans

MIT License

## Destek

Sorun bildirmek veya özellik isteği için GitHub Issues kullanın.
