-- Demo seed data for Legal Workflow Agent
-- Run AFTER migrate.sql, in Supabase SQL Editor.
-- Date math is relative to current_date so the demo always has 1 "critical" item.

-- 1 lawyer (single-user MVP — no auth)
insert into users (id, email, full_name, bar_council_no, phone)
values (
  '11111111-1111-1111-1111-111111111111',
  'priya.mehta@advocate.in',
  'Priya Mehta, Advocate',
  'MAH/12345/2018',
  '+91-98765-43210'
);

-- 2 clients
insert into clients (id, lawyer_id, full_name, email, phone, address, aadhar_no) values
  ('22222222-2222-2222-2222-222222222222',
   '11111111-1111-1111-1111-111111111111',
   'Rahul Sharma',
   'rahul.sharma.demo@example.in',
   '+91-99887-76543',
   '14, Senapati Bapat Road, Pune – 411016',
   'XXXX-XXXX-1234'),
  ('33333333-3333-3333-3333-333333333333',
   '11111111-1111-1111-1111-111111111111',
   'Sunita Patel',
   'sunita.patel.demo@example.in',
   '+91-91234-56789',
   'B-302, Lake View Apts, Aundh, Pune – 411007',
   'XXXX-XXXX-5678');

-- 3 cases spanning case types and phases
-- Case A: POCSO criminal — pretrial — CHARGESHEET DUE IN 2 DAYS (the demo headline)
insert into cases (
  id, lawyer_id, client_id, case_number, title, case_type, phase, status,
  court_name, court_type, fir_date, fir_number, police_station, sections,
  offence_max_years, arrest_date, opposing_party, notes
) values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'CC/734/2026',
  'State of Maharashtra vs. Rahul Sharma',
  'criminal',
  'pretrial',
  'active',
  'Sessions Court, Pune',
  'sessions',
  current_date - interval '88 days',
  'FIR 0289/2026',
  'Chaturshringi P.S., Pune',
  's.6 POCSO Act, 2012; s.376AB IPC',
  20,
  current_date - interval '85 days',
  'State of Maharashtra',
  'Accused alleges false implication arising from a property dispute. Investigation is complete; chargesheet still not filed despite 88 days elapsed.'
);

-- Case B: Civil recovery — pleadings stage — limitation comfortable
insert into cases (
  id, lawyer_id, client_id, case_number, title, case_type, phase, status,
  court_name, court_type, opposing_party, notes
) values (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333333',
  'CS/421/2026',
  'Sunita Patel vs. Anant Joshi & Ors.',
  'civil',
  'pleadings',
  'active',
  'Civil Judge Sr. Div., Pune',
  'district',
  'Anant Joshi',
  'Suit for recovery of INR 18,50,000 advanced under unregistered loan agreement dated 14.02.2024. Defendant served; written statement awaited.'
);

-- Case C: Criminal cheating (IPC 420) — evidence stage — next hearing 14 days out
insert into cases (
  id, lawyer_id, client_id, case_number, title, case_type, phase, status,
  court_name, court_type, fir_date, fir_number, police_station, sections,
  offence_max_years, opposing_party
) values (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'CC/118/2025',
  'State of Maharashtra vs. Rahul Sharma',
  'criminal',
  'evidence',
  'active',
  'JMFC Court No. 4, Pune',
  'magistrate',
  current_date - interval '420 days',
  'FIR 0142/2025',
  'Deccan P.S., Pune',
  's.420 IPC; s.318 BNS',
  7,
  'State of Maharashtra'
);

-- Auto-computed deadlines for Case A (the headline demo item)
insert into deadlines (case_id, title, deadline_type, due_date, urgency, is_auto_generated, notes) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Chargesheet deadline (90-day rule)',
   'statutory',
   current_date + interval '2 days',
   'critical',
   true,
   'BNSS s.187(3) — offence carries ≥10 yrs. On Day 91, accused becomes entitled to default bail.'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Bail application — listed for hearing',
   'hearing',
   current_date + interval '5 days',
   'high',
   false,
   'Regular bail application u/s 483 BNSS to be argued.');

-- Hearing & limitation deadlines for the other two
insert into deadlines (case_id, title, deadline_type, due_date, urgency, is_auto_generated, notes) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'Written statement due (defendant)',
   'filing',
   current_date + interval '21 days',
   'medium',
   false,
   'Order VIII Rule 1 CPC, 30-day window from service.'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc',
   'Next hearing — examination of PW-3',
   'hearing',
   current_date + interval '14 days',
   'medium',
   false,
   'Cross-examination of complainant scheduled.');

-- One past hearing on Case A so the AI summary has substance
insert into hearing_logs (case_id, hearing_date, what_happened, judge_order, next_date, next_action) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   current_date - interval '7 days',
   'Application for bail moved orally; opposing party sought time to file reply. Court directed prosecution to file reply within 7 days.',
   'Reply by prosecution within 7 days. List for arguments thereafter.',
   current_date + interval '5 days',
   'File rejoinder if reply received; prepare arguments citing Satender Kumar Antil triple test.'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc',
   current_date - interval '21 days',
   'PW-2 examined-in-chief and cross-examined. Defence counsel reserved further cross till next hearing.',
   'PW-3 to be examined on next date. List on 02.05.2026.',
   current_date + interval '14 days',
   'Prepare cross-examination questions for PW-3 (complainant).');

-- One AI-drafted document already on Case A (so document panel isn't empty in the demo)
insert into documents (case_id, name, doc_type, phase, source, content) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Bail Application — Draft v1',
   'bail_app',
   'pretrial',
   'ai_drafted',
   '# IN THE COURT OF SESSIONS JUDGE, PUNE

**Bail Application No. _____ of 2026**

(Placeholder — click "Re-draft" to regenerate with the latest AI prompt.)');
