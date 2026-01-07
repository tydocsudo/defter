-- Tüm mevcut verileri temizleme scripti
-- DİKKAT: Bu script tüm hasta, hoca, atama ve not verilerini silecektir!

-- Önce foreign key bağımlılıkları olan tabloları temizle
DELETE FROM surgery_notes;
DELETE FROM day_notes;
DELETE FROM daily_assigned_doctors;

-- Sonra ana tabloları temizle
DELETE FROM surgeries;
DELETE FROM doctors;

-- Salonları koruyoruz, sadece içlerini boşalttık
-- Eğer salonları da silmek isterseniz aşağıdaki satırı açın:
-- DELETE FROM salons;

-- Özet bilgi
SELECT 'Tüm veriler başarıyla silindi' as message;
