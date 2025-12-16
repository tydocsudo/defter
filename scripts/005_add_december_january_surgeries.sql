-- Add gynecological surgeries for December 2025 and January 2026
-- 2+ surgeries per day for Salon 5 and Salon 6

-- December 2025 - Salon 5
INSERT INTO surgeries (id, patient_name, protocol_number, indication, procedure_name, surgery_date, salon_id, responsible_doctor_id, phone_number_1, phone_number_2, is_waiting_list) VALUES
(gen_random_uuid(), 'Zehra Kaya', 'JIN-2025-001', 'Myoma uteri', 'Total abdominal histerektomi', '2025-12-01', 'f717ec03-2bfd-43d7-b761-41f3ee320fa0', '77dd8708-9bca-4f9c-a90c-331f4477a07f', '0532 111 2001', '0532 111 2002', false),
(gen_random_uuid(), 'Aylin Demir', 'JIN-2025-002', 'Endometriozis', 'Laparoskopik over kistektomi', '2025-12-01', 'f717ec03-2bfd-43d7-b761-41f3ee320fa0', '77dd8708-9bca-4f9c-a90c-331f4477a07f', '0532 111 2003', '0532 111 2004', false),
(gen_random_uuid(), 'Elif Yılmaz', 'JIN-2025-003', 'Prolapsus uteri', 'Vajinal histerektomi', '2025-12-02', 'f717ec03-2bfd-43d7-b761-41f3ee320fa0', '6b7b9382-b04c-42e4-bc9e-a033364bac33', '0532 111 2005', '0532 111 2006', false),
(gen_random_uuid(), 'Selin Ak', 'JIN-2025-004', 'Over kisti', 'Laparoskopik kistektomi', '2025-12-02', 'f717ec03-2bfd-43d7-b761-41f3ee320fa0', '6b7b9382-b04c-42e4-bc9e-a033364bac33', '0532 111 2007', '0532 111 2008', false),
(gen_random_uuid(), 'Merve Kara', 'JIN-2025-005', 'Myoma uteri', 'Laparoskopik myomektomi', '2025-12-03', 'f717ec03-2bfd-43d7-b761-41f3ee320fa0', 'f8800316-b292-477a-8d71-11e2f38427b1', '0532 111 2009', '0532 111 2010', false),
(gen_random_uuid(), 'Fatma Öz', 'JIN-2025-006', 'Adenomyozis', 'Total histerektomi', '2025-12-03', 'f717ec03-2bfd-43d7-b761-41f3ee320fa0', 'f8800316-b292-477a-8d71-11e2f38427b1', '0532 111 2011', '0532 111 2012', false),
(gen_random_uuid(), 'Büşra Aydın', 'JIN-2025-007', 'Endometrial polyp', 'Histeroskopik polipektomi', '2025-12-04', 'f717ec03-2bfd-43d7-b761-41f3ee320fa0', '77dd8708-9bca-4f9c-a90c-331f4477a07f', '0532 111 2013', '0532 111 2014', false),
(gen_random_uuid(), 'Gamze Çelik', 'JIN-2025-008', 'Over kisti', 'Laparoskopik over kistektomi', '2025-12-04', 'f717ec03-2bfd-43d7-b761-41f3ee320fa0', '77dd8708-9bca-4f9c-a90c-331f4477a07f', '0532 111 2015', '0532 111 2016', false),
(gen_random_uuid(), 'Deniz Arslan', 'JIN-2025-009', 'Myoma uteri', 'Abdominal myomektomi', '2025-12-05', 'f717ec03-2bfd-43d7-b761-41f3ee320fa0', '6b7b9382-b04c-42e4-bc9e-a033364bac33', '0532 111 2017', '0532 111 2018', false),
(gen_random_uuid(), 'Işıl Yurt', 'JIN-2025-010', 'Endometriozis', 'Laparoskopik endometriozis eksizyonu', '2025-12-05', 'f717ec03-2bfd-43d7-b761-41f3ee320fa0', '6b7b9382-b04c-42e4-bc9e-a033364bac33', '0532 111 2019', '0532 111 2020', false),
(gen_random_uuid(), 'Cansu Yıldız', 'JIN-2025-011', 'Myoma uteri', 'Laparoskopik myomektomi', '2025-12-06', 'f717ec03-2bfd-43d7-b761-41f3ee320fa0', 'f8800316-b292-477a-8d71-11e2f38427b1', '0532 111 2021', '0532 111 2022', false),
(gen_random_uuid(), 'Ebru Kılıç', 'JIN-2025-012', 'Endometriozis', 'Laparoskopik ablasyon', '2025-12-06', 'f717ec03-2bfd-43d7-b761-41f3ee320fa0', 'f8800316-b292-477a-8d71-11e2f38427b1', '0532 111 2023', '0532 111 2024', false),
(gen_random_uuid(), 'Gizem Şahin', 'JIN-2025-013', 'Over kisti', 'Laparoskopik kistektomi', '2025-12-07', 'f717ec03-2bfd-43d7-b761-41f3ee320fa0', '77dd8708-9bca-4f9c-a90c-331f4477a07f', '0532 111 2025', '0532 111 2026', false),
(gen_random_uuid(), 'Hülya Güneş', 'JIN-2025-014', 'Myoma uteri', 'Total histerektomi', '2025-12-07', 'f717ec03-2bfd-43d7-b761-41f3ee320fa0', '77dd8708-9bca-4f9c-a90c-331f4477a07f', '0532 111 2027', '0532 111 2028', false),
(gen_random_uuid(), 'İpek Akar', 'JIN-2025-015', 'Endometrial polyp', 'Histeroskopik polipektomi', '2025-12-08', 'f717ec03-2bfd-43d7-b761-41f3ee320fa0', '6b7b9382-b04c-42e4-bc9e-a033364bac33', '0532 111 2029', '0532 111 2030', false),
(gen_random_uuid(), 'Jale Erdoğan', 'JIN-2025-016', 'Adenomyozis', 'Laparoskopik histerektomi', '2025-12-08', 'f717ec03-2bfd-43d7-b761-41f3ee320fa0', '6b7b9382-b04c-42e4-bc9e-a033364bac33', '0532 111 2031', '0532 111 2032', false);

-- December 2025 - Salon 6
INSERT INTO surgeries (id, patient_name, protocol_number, indication, procedure_name, surgery_date, salon_id, responsible_doctor_id, phone_number_1, phone_number_2, is_waiting_list) VALUES
(gen_random_uuid(), 'Kezban Taş', 'JIN-2025-051', 'Myoma uteri', 'Abdominal myomektomi', '2025-12-01', '2f3c3a71-e835-4bfe-a8c9-f7c479e8adc6', '77dd8708-9bca-4f9c-a90c-331f4477a07f', '0533 111 2001', '0533 111 2002', false),
(gen_random_uuid(), 'Leyla Korkmaz', 'JIN-2025-052', 'Over kisti', 'Laparoskopik over kistektomi', '2025-12-01', '2f3c3a71-e835-4bfe-a8c9-f7c479e8adc6', '6b7b9382-b04c-42e4-bc9e-a033364bac33', '0533 111 2003', '0533 111 2004', false),
(gen_random_uuid(), 'Melis Yavuz', 'JIN-2025-053', 'Endometriozis', 'Laparoskopik ablasyon', '2025-12-02', '2f3c3a71-e835-4bfe-a8c9-f7c479e8adc6', 'f8800316-b292-477a-8d71-11e2f38427b1', '0533 111 2005', '0533 111 2006', false),
(gen_random_uuid(), 'Nalan Öztürk', 'JIN-2025-054', 'Myoma uteri', 'Total histerektomi', '2025-12-02', '2f3c3a71-e835-4bfe-a8c9-f7c479e8adc6', '77dd8708-9bca-4f9c-a90c-331f4477a07f', '0533 111 2007', '0533 111 2008', false),
(gen_random_uuid(), 'Oya Bilgin', 'JIN-2025-055', 'Endometrial polyp', 'Histeroskopik polipektomi', '2025-12-03', '2f3c3a71-e835-4bfe-a8c9-f7c479e8adc6', '6b7b9382-b04c-42e4-bc9e-a033364bac33', '0533 111 2009', '0533 111 2010', false),
(gen_random_uuid(), 'Pınar Çakır', 'JIN-2025-056', 'Over kisti', 'Laparoskopik kistektomi', '2025-12-03', '2f3c3a71-e835-4bfe-a8c9-f7c479e8adc6', 'f8800316-b292-477a-8d71-11e2f38427b1', '0533 111 2011', '0533 111 2012', false),
(gen_random_uuid(), 'Rabia Şen', 'JIN-2025-057', 'Myoma uteri', 'Laparoskopik myomektomi', '2025-12-04', '2f3c3a71-e835-4bfe-a8c9-f7c479e8adc6', '77dd8708-9bca-4f9c-a90c-331f4477a07f', '0533 111 2013', '0533 111 2014', false),
(gen_random_uuid(), 'Sevgi Durmuş', 'JIN-2025-058', 'Adenomyozis', 'Total histerektomi', '2025-12-04', '2f3c3a71-e835-4bfe-a8c9-f7c479e8adc6', '6b7b9382-b04c-42e4-bc9e-a033364bac33', '0533 111 2015', '0533 111 2016', false),
(gen_random_uuid(), 'Tuba Ateş', 'JIN-2025-059', 'Endometriozis', 'Laparoskopik ablasyon', '2025-12-05', '2f3c3a71-e835-4bfe-a8c9-f7c479e8adc6', 'f8800316-b292-477a-8d71-11e2f38427b1', '0533 111 2017', '0533 111 2018', false),
(gen_random_uuid(), 'Ülkü Polat', 'JIN-2025-060', 'Over kisti', 'Laparoskopik over kistektomi', '2025-12-05', '2f3c3a71-e835-4bfe-a8c9-f7c479e8adc6', '77dd8708-9bca-4f9c-a90c-331f4477a07f', '0533 111 2019', '0533 111 2020', false),
(gen_random_uuid(), 'Vildan Aslan', 'JIN-2025-061', 'Myoma uteri', 'Abdominal myomektomi', '2025-12-06', '2f3c3a71-e835-4bfe-a8c9-f7c479e8adc6', '6b7b9382-b04c-42e4-bc9e-a033364bac33', '0533 111 2021', '0533 111 2022', false),
(gen_random_uuid(), 'Yelda Kurt', 'JIN-2025-062', 'Endometrial polyp', 'Histeroskopik polipektomi', '2025-12-06', '2f3c3a71-e835-4bfe-a8c9-f7c479e8adc6', 'f8800316-b292-477a-8d71-11e2f38427b1', '0533 111 2023', '0533 111 2024', false),
(gen_random_uuid(), 'Zeynep Başar', 'JIN-2025-063', 'Adenomyozis', 'Laparoskopik histerektomi', '2025-12-07', '2f3c3a71-e835-4bfe-a8c9-f7c479e8adc6', '77dd8708-9bca-4f9c-a90c-331f4477a07f', '0533 111 2025', '0533 111 2026', false),
(gen_random_uuid(), 'Ayşegül Yurt', 'JIN-2025-064', 'Over kisti', 'Laparoskopik kistektomi', '2025-12-07', '2f3c3a71-e835-4bfe-a8c9-f7c479e8adc6', '6b7b9382-b04c-42e4-bc9e-a033364bac33', '0533 111 2027', '0533 111 2028', false),
(gen_random_uuid(), 'Betül Nas', 'JIN-2025-065', 'Myoma uteri', 'Total histerektomi', '2025-12-08', '2f3c3a71-e835-4bfe-a8c9-f7c479e8adc6', 'f8800316-b292-477a-8d71-11e2f38427b1', '0533 111 2029', '0533 111 2030', false),
(gen_random_uuid(), 'Canan Özkan', 'JIN-2025-066', 'Endometriozis', 'Laparoskopik ablasyon', '2025-12-08', '2f3c3a71-e835-4bfe-a8c9-f7c479e8adc6', '77dd8708-9bca-4f9c-a90c-331f4477a07f', '0533 111 2031', '0533 111 2032', false);

-- Continue with more days for December and January...
-- Note: This script needs to be run in the v0 SQL executor

SELECT 'Sample surgeries added for first week of December 2025' as result;
