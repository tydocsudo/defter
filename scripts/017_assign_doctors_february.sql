-- Assign doctors randomly to Salon 5 and Salon 6 for all weekdays in February 2026
-- This script assigns doctors to all weekdays (Monday-Friday) in February 2026
-- for Salon 5 and Salon 6

-- First, delete any existing assignments for February 2026 for these salons
DELETE FROM daily_assigned_doctors
WHERE assigned_date >= '2026-02-01' AND assigned_date < '2026-03-01'
  AND salon_id IN (
    SELECT id FROM salons WHERE name IN ('Salon 5', 'Salon 6')
  );

-- Insert random doctor assignments for Salon 5 and Salon 6
-- February 2026: 1st is Sunday, so weekdays are 2-6, 9-13, 16-20, 23-27
-- Excluding weekends (Saturdays and Sundays)

WITH 
  salon_5 AS (SELECT id FROM salons WHERE name = 'Salon 5' LIMIT 1),
  salon_6 AS (SELECT id FROM salons WHERE name = 'Salon 6' LIMIT 1),
  doctors_list AS (SELECT id, ROW_NUMBER() OVER (ORDER BY RANDOM()) as rn FROM doctors),
  -- Generate all weekdays in February 2026 (excluding weekends)
  february_weekdays AS (
    SELECT date::date as assigned_date
    FROM generate_series('2026-02-02'::date, '2026-02-27'::date, '1 day'::interval) date
    WHERE EXTRACT(DOW FROM date) BETWEEN 1 AND 5  -- Monday=1 to Friday=5
  ),
  -- Create assignments for Salon 5
  salon_5_assignments AS (
    SELECT 
      (SELECT id FROM salon_5) as salon_id,
      assigned_date,
      (SELECT id FROM doctors_list WHERE rn = (1 + (EXTRACT(DAY FROM assigned_date)::integer % (SELECT COUNT(*)::integer FROM doctors_list)))) as doctor_id
    FROM february_weekdays
  ),
  -- Create assignments for Salon 6
  salon_6_assignments AS (
    SELECT 
      (SELECT id FROM salon_6) as salon_id,
      assigned_date,
      (SELECT id FROM doctors_list WHERE rn = (1 + ((EXTRACT(DAY FROM assigned_date)::integer + 10) % (SELECT COUNT(*)::integer FROM doctors_list)))) as doctor_id
    FROM february_weekdays
  )
-- Insert all assignments
INSERT INTO daily_assigned_doctors (salon_id, doctor_id, assigned_date)
SELECT salon_id, doctor_id, assigned_date FROM salon_5_assignments
WHERE doctor_id IS NOT NULL
UNION ALL
SELECT salon_id, doctor_id, assigned_date FROM salon_6_assignments
WHERE doctor_id IS NOT NULL;

-- Show summary of assignments
SELECT 
  s.name as salon_name,
  COUNT(*) as days_assigned,
  COUNT(DISTINCT d.id) as unique_doctors
FROM daily_assigned_doctors dad
JOIN salons s ON dad.salon_id = s.id
JOIN doctors d ON dad.doctor_id = d.id
WHERE dad.assigned_date >= '2026-02-01' AND dad.assigned_date < '2026-03-01'
GROUP BY s.name
ORDER BY s.name;
