import uuid
from datetime import datetime, timedelta

# Salon and doctor IDs
salon_5_id = 'f717ec03-2bfd-43d7-b761-41f3ee320fa0'
salon_6_id = '2f3c3a71-e835-4bfe-a8c9-f7c479e8adc6'
doctor_ids = [
    '77dd8708-9bca-4f9c-a90c-331f4477a07f',  # Prof. Dr. Ayşe Yılmaz
    '6b7b9382-b04c-42e4-bc9e-a033364bac33',  # Doç. Dr. Mehmet Kaya
    'f8800316-b292-477a-8d71-11e2f38427b1'   # Op. Dr. Fatma Demir
]

# Patient names
patient_names = [
    'Zehra', 'Aylin', 'Elif', 'Selin', 'Merve', 'Fatma', 'Büşra', 'Gamze',
    'Deniz', 'Işıl', 'Cansu', 'Ebru', 'Gizem', 'Hülya', 'İpek', 'Jale',
    'Kezban', 'Leyla', 'Melis', 'Nalan', 'Oya', 'Pınar', 'Rabia', 'Sevgi',
    'Tuba', 'Ülkü', 'Vildan', 'Yelda', 'Zeynep', 'Ayşegül', 'Betül', 'Canan'
]

surnames = [
    'Kaya', 'Demir', 'Yılmaz', 'Ak', 'Kara', 'Öz', 'Aydın', 'Çelik',
    'Arslan', 'Yurt', 'Yıldız', 'Kılıç', 'Şahin', 'Güneş', 'Akar', 'Erdoğan',
    'Taş', 'Korkmaz', 'Yavuz', 'Öztürk', 'Bilgin', 'Çakır', 'Şen', 'Durmuş',
    'Ateş', 'Polat', 'Aslan', 'Kurt', 'Başar', 'Nas', 'Özkan', 'Tekin'
]

# Gynecological cases
cases = [
    ('Myoma uteri', 'Total abdominal histerektomi'),
    ('Myoma uteri', 'Laparoskopik myomektomi'),
    ('Myoma uteri', 'Abdominal myomektomi'),
    ('Endometriozis', 'Laparoskopik over kistektomi'),
    ('Endometriozis', 'Laparoskopik ablasyon'),
    ('Endometriozis', 'Laparoskopik endometriozis eksizyonu'),
    ('Over kisti', 'Laparoskopik kistektomi'),
    ('Over kisti', 'Laparoskopik over kistektomi'),
    ('Adenomyozis', 'Total histerektomi'),
    ('Adenomyozis', 'Laparoskopik histerektomi'),
    ('Endometrial polyp', 'Histeroskopik polipektomi'),
    ('Prolapsus uteri', 'Vajinal histerektomi'),
]

# Generate SQL
start_date = datetime(2025, 12, 1)
end_date = datetime(2026, 1, 31)
current_date = start_date
protocol_number = 1

sql_statements = []
sql_statements.append("-- Gynecological surgeries for December 2025 and January 2026\n")

patient_index = 0
while current_date <= end_date:
    # Skip if weekend (Saturday=5, Sunday=6)
    if current_date.weekday() < 5:
        date_str = current_date.strftime('%Y-%m-%d')
        
        # Add 2-3 surgeries per day for each salon
        for salon_id in [salon_5_id, salon_6_id]:
            num_surgeries = 2 if current_date.day % 2 == 0 else 3
            
            for i in range(num_surgeries):
                patient_name = f"{patient_names[patient_index % len(patient_names)]} {surnames[patient_index % len(surnames)]}"
                protocol = f"JIN-{current_date.year}-{protocol_number:04d}"
                indication, procedure = cases[(patient_index + i) % len(cases)]
                doctor_id = doctor_ids[protocol_number % len(doctor_ids)]
                phone1 = f"0532 {protocol_number // 1000:03d} {protocol_number % 1000:04d}"
                phone2 = f"0533 {protocol_number // 1000:03d} {protocol_number % 1000:04d}"
                
                sql = f"(gen_random_uuid(), '{patient_name}', '{protocol}', '{indication}', '{procedure}', '{date_str}', '{salon_id}', '{doctor_id}', '{phone1}', '{phone2}', false)"
                sql_statements.append(sql)
                
                protocol_number += 1
                patient_index += 1
    
    current_date += timedelta(days=1)

# Create INSERT statement
print("INSERT INTO surgeries (id, patient_name, protocol_number, indication, procedure_name, surgery_date, salon_id, responsible_doctor_id, phone_number_1, phone_number_2, is_waiting_list) VALUES")
print(",\n".join(sql_statements))
print(";")

print(f"\n-- Total surgeries generated: {protocol_number - 1}")
