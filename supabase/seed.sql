-- ====================================================================
-- E-VOTING SMPN 1 SUKAMULIA 2026/2027
-- Initial Seed Data
-- ====================================================================

-- 1. Insert School
INSERT INTO public.schools (
    id, name, logo_url, address, contact_phone, contact_email, principal_name, committee_chair, committee_secretary
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'SMP Negeri 1 Sukamulia',
    '/logo-smpn1sukamulia.png',
    'Jl. Pendidikan No. 1, Sukamulia, Kec. Sukamulia, Kabupaten Lombok Timur, NTB 83652',
    '(0376) 21123',
    'info@smpn1sukamulia.sch.id',
    'Drs. H. M. Zainuddin, M.Pd.',
    'Ahmad Fauzi, S.Pd.',
    'Nurul Hidayati, S.Pd.'
) ON CONFLICT (id) DO NOTHING;

-- 2. Insert Active Election
INSERT INTO public.elections (
    id, school_id, title, academic_year, start_time, end_time, timezone, status, is_published
) VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Pemilihan Ketua dan Wakil Ketua OSIS',
    '2026/2027',
    NOW() - INTERVAL '2 hours',
    NOW() + INTERVAL '7 days',
    'Asia/Makassar',
    'active',
    true
) ON CONFLICT (id) DO NOTHING;

-- 3. Insert Classes
INSERT INTO public.classes (id, election_id, name, grade_level, description) VALUES
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'VII-A', '7', 'Kelas 7 Reguler A'),
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'VII-B', '7', 'Kelas 7 Reguler B'),
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'VIII-A', '8', 'Kelas 8 Unggulan A'),
('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'VIII-B', '8', 'Kelas 8 Reguler B'),
('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'IX-A', '9', 'Kelas 9 Reguler A'),
('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', 'IX-B', '9', 'Kelas 9 Reguler B')
ON CONFLICT DO NOTHING;

-- 4. Insert Candidate Pairs
INSERT INTO public.candidates (
    id, election_id, ballot_number, photo_url, leader_name, vice_leader_name, 
    leader_class, vice_leader_class, slogan, vision, mission, program_desc, is_active
) VALUES 
(
    'd0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    1,
    'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
    'M. Rayhan Pratama',
    'Siti Aisyah Azzahra',
    'VIII-A',
    'VII-B',
    'BERAKSI: Berkarya, Berkarakter, dan Berprestasi',
    'Mewujudkan OSIS SMPN 1 Sukamulia sebagai wadah pembentukan generasi berakhlak mulia, adaptif teknologi, berwawasan lingkungan, dan berprestasi unggul.',
    E'1. Mengoptimalkan kegiatan literasi digital dan penguatan karakter Profil Pelajar Pancasila.\n2. Mewadahi aspirasi siswa secara terbuka melalui forum kotak saran digital OSIS.\n3. Menyelenggarakan pekan olahraga dan seni antarkelas secara berkala dan kompetitif.\n4. Membudayakan program Sekolah Hijau (Green School) melalui gerakan zero waste.',
    'Program Unggulan: E-Mading Sukamulia Hebat, Liga Futsal & Voli Antarkelas, Gerakan Siswa Peduli Lingkungan.',
    true
),
(
    'd0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000001',
    2,
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    'Dimas Aditya Nugraha',
    'Kayla Putri Maharani',
    'VIII-B',
    'VIII-A',
    'SINERGI: Solutif, Inovatif, dan Menginspirasi',
    'Menjadikan OSIS SMPN 1 Sukamulia sebagai penggerak kolaborasi siswa yang kreatif, disiplin, berjiwa wirausaha muda, dan peduli sosial.',
    E'1. Membangun sinergi antarekstrakurikuler untuk meningkatkan prestasi sekolah tingkat kabupaten dan provinsi.\n2. Mengadakan workshop kreativitas siswa, podcast sekolah, dan festival karya pelajar.\n3. Menumbuhkan empati melalui program Gerakan Peduli Kawan dan bakti sosial berkala.\n4. Menguatkan kedisiplinan dan sopan santun melalui keteladanan pengurus OSIS.',
    'Program Unggulan: Podcast Pelajar Sukamulia Berbicara, Pameran Seni & Market Day Pelajar, Sukamulia Bersedekah.',
    true
),
(
    'd0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000001',
    3,
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
    'Fadhil Arfa Maulana',
    'Nabila Zahra Humaira',
    'VIII-B',
    'VII-A',
    'HARMONI: Hebat, Amanah, dan Berintegritas',
    'Mewujudkan lingkungan sekolah yang harmonis, ramah anak, berprestasi dalam sains maupun seni, dan berbudaya kearifan lokal.',
    E'1. Menciptakan iklim sekolah yang bebas perundungan (anti-bullying) dengan duta damai di setiap kelas.\n2. Mendorong kelompok belajar intensif sains, bahasa Inggris, dan seni budaya daerah Lombok.\n3. Menghidupkan media informasi sekolah sebagai ruang ekspresi positif siswa.\n4. Memperkuat koordinasi antara pengurus OSIS, dewan guru, dan seluruh perwakilan kelas.',
    'Program Unggulan: Pos Sahabat Pelajar (Anti-Bullying), English Club & Sains Olympiad Camp, Festival Budaya Sasak.',
    true
)
ON CONFLICT DO NOTHING;

-- 5. Insert Sample Students with Tokens
INSERT INTO public.students (id, election_id, class_id, nisn, full_name, birth_date, gender, is_active) VALUES
('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '0081234567', 'Budi Santoso', '2012-05-14', 'L', true),
('e0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '0081234568', 'Annisa Nurul Fadhila', '2012-08-21', 'P', true),
('e0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', '0081234569', 'Muhammad Rizky', '2011-03-11', 'L', true),
('e0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', '0081234570', 'Tiara Maharani', '2011-11-05', 'P', true),
('e0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', '0081234571', 'Gilang Ramadhan', '2010-09-19', 'L', true),
('e0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000006', '0081234572', 'Zahra Amalia Putri', '2010-01-30', 'P', true)
ON CONFLICT DO NOTHING;

-- 6. Insert Credentials
INSERT INTO public.voter_credentials (student_id, token_hash, token_preview, is_revoked) VALUES
('e0000000-0000-0000-0000-000000000001', crypt('VOTE-8821', gen_salt('bf')), 'VOTE-8821', false),
('e0000000-0000-0000-0000-000000000002', crypt('VOTE-3490', gen_salt('bf')), 'VOTE-3490', false),
('e0000000-0000-0000-0000-000000000003', crypt('VOTE-7124', gen_salt('bf')), 'VOTE-7124', false),
('e0000000-0000-0000-0000-000000000004', crypt('VOTE-5539', gen_salt('bf')), 'VOTE-5539', false),
('e0000000-0000-0000-0000-000000000005', crypt('VOTE-9012', gen_salt('bf')), 'VOTE-9012', false),
('e0000000-0000-0000-0000-000000000006', crypt('VOTE-1248', gen_salt('bf')), 'VOTE-1248', false)
ON CONFLICT DO NOTHING;

-- 7. Insert Initial Admin Profile
INSERT INTO public.admin_profiles (email, full_name, role) VALUES
('admin@smpn1sukamulia.sch.id', 'Administrator Utama OSIS', 'superadmin')
ON CONFLICT DO NOTHING;

-- 8. Insert Audit Log
INSERT INTO public.audit_logs (election_id, action, actor, details) VALUES
('b0000000-0000-0000-0000-000000000001', 'INISIALISASI_SISTEM', 'Sistem', 'Inisialisasi sistem pemilihan OSIS SMPN 1 Sukamulia periode 2026/2027 berhasil.')
ON CONFLICT DO NOTHING;
