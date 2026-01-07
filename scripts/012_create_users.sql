-- Temporarily drop foreign key constraint since we're using custom auth with password column
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Create all user accounts
-- Username: firstname (combined if two names), Password: 1

INSERT INTO profiles (id, username, password, first_name, last_name, is_admin) VALUES
(gen_random_uuid(), 'odul', '1', 'ÖDÜL', 'ÖZKAN', false),
(gen_random_uuid(), 'mehmetserhat', '1', 'MEHMET SERHAT', 'ÇİÇEK', false),
(gen_random_uuid(), 'muhammedselim', '1', 'MUHAMMED SELİM', 'DEMİR', false),
(gen_random_uuid(), 'alperaykut', '1', 'ALPER AYKUT', 'YETKİN', false),
(gen_random_uuid(), 'gulserenipek', '1', 'GÜLSEREN İPEK', 'KARADAĞ', false),
(gen_random_uuid(), 'haticekolcu', '1', 'HATİCE KOLCU', 'EVRAN', false),
(gen_random_uuid(), 'ezgi', '1', 'EZGİ', 'İL', false),
(gen_random_uuid(), 'feraygulec', '1', 'FERAY GÜLEÇ', 'ÇİÇEK', false),
(gen_random_uuid(), 'nehir', '1', 'NEHİR', 'SEZER', false),
(gen_random_uuid(), 'beyzanur', '1', 'BEYZANUR', 'BEKDEMİR', false),
(gen_random_uuid(), 'furkanutku', '1', 'FURKAN UTKU', 'ÖZKURT', false),
(gen_random_uuid(), 'bilgesu', '1', 'BİLGESU', 'ADIGÜZEL', false),
(gen_random_uuid(), 'enverege', '1', 'ENVER EGE', 'SARAY', false),
(gen_random_uuid(), 'nurseda', '1', 'NURSEDA', 'KOÇAR', false),
(gen_random_uuid(), 'hande', '1', 'HANDE', 'TÜRKİŞ', false),
(gen_random_uuid(), 'zekiye', '1', 'ZEKİYE', 'SİVRİ', false),
(gen_random_uuid(), 'sevim', '1', 'SEVİM', 'UĞURLU', false),
(gen_random_uuid(), 'gizem', '1', 'GİZEM', 'VERGİLİ', false),
(gen_random_uuid(), 'ertugrul', '1', 'ERTUĞRUL', 'KARTOP', false),
(gen_random_uuid(), 'merve', '1', 'MERVE', 'KARADUMAN', false),
(gen_random_uuid(), 'ebru', '1', 'EBRU', 'KAŞ', false),
(gen_random_uuid(), 'sultankevser', '1', 'SULTAN KEVSER', 'HATALMIŞ', false),
(gen_random_uuid(), 'batuhan', '1', 'BATUHAN', 'COŞAR', false),
(gen_random_uuid(), 'gulin', '1', 'GÜLİN', 'GÖKBAŞ', false),
(gen_random_uuid(), 'erdem', '1', 'ERDEM', 'ERÇELİK', false),
(gen_random_uuid(), 'fatmairem', '1', 'FATMA İREM', 'YARICI', false),
(gen_random_uuid(), 'eren', '1', 'EREN', 'ERDEM', false),
(gen_random_uuid(), 'nigar', '1', 'NİGAR', 'NABİYEVA', false),
(gen_random_uuid(), 'ahmethaluk', '1', 'AHMET HALUK', 'ÇAYLI', false),
(gen_random_uuid(), 'yaseminelif', '1', 'YASEMİN ELİF', 'GÜRCAN', false),
(gen_random_uuid(), 'muserref', '1', 'MÜŞERREF', 'GÜREL', false),
(gen_random_uuid(), 'samet', '1', 'SAMET', 'AKAR', false),
(gen_random_uuid(), 'elifasude', '1', 'ELİF ASUDE', 'ŞAVLI', false),
(gen_random_uuid(), 'derya', '1', 'DERYA', 'KORKMAZ', false),
(gen_random_uuid(), 'fadimebusra', '1', 'FADİME BÜŞRA', 'İNCE', false),
(gen_random_uuid(), 'beynun', '1', 'BEYNUN', 'KIRAY', false),
(gen_random_uuid(), 'ozgesokeoglu', '1', 'ÖZGE SÖKEOĞLU', 'MERT', false),
(gen_random_uuid(), 'selin', '1', 'SELİN', 'ÖZKAYA', false),
(gen_random_uuid(), 'nur', '1', 'NUR', 'ALPASLAN', false),
(gen_random_uuid(), 'nazlinur', '1', 'NAZLI NUR', 'GÜL', false),
(gen_random_uuid(), 'elnurabaiyshbek', '1', 'ELNURA BAIYSHBEK', 'KYZY', false)
ON CONFLICT (username) DO UPDATE SET
  password = EXCLUDED.password,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name;
