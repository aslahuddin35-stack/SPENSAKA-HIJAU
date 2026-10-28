-- ====================================================================
-- SCRIPT LENGKAP: PERBAIKAN RLS & SEED DATA SUPABASE
-- E-VOTING SMPN 1 SUKAMULIA 2026/2027
-- Salin dan jalankan seluruh script ini di Supabase SQL Editor:
-- https://supabase.com/dashboard/project/phqkeaqsfmnlfpxwepfo/sql/new
-- ====================================================================

-- 1. Pastikan ekstensi aktif
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Buka izin Row Level Security (RLS) & Pasang Kebijakan Akses Penuh (Full CRUD)
ALTER TABLE IF EXISTS public.schools DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.elections DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.voter_credentials DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.candidates DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.voter_participation DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ballots DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.election_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_profiles DISABLE ROW LEVEL SECURITY;

-- Pasang Policy Permissive untuk anon dan authenticated jika RLS diaktifkan kembali
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "allow_anon_all" ON public.%I', tbl);
        EXECUTE format('CREATE POLICY "allow_anon_all" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', tbl);
    END LOOP;
END $$;

-- Berikan hak akses penuh kepada role anon dan authenticated
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, postgres, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, postgres, service_role;

-- 3. Buat RPC cast_student_vote (Atomic & Aman)
CREATE OR REPLACE FUNCTION public.cast_student_vote(
    p_election_id UUID,
    p_student_id UUID,
    p_candidate_id UUID,
    p_ip_hash TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_election_status VARCHAR(20);
    v_already_voted INT;
    v_candidate_valid INT;
BEGIN
    -- Validasi status pemilihan
    SELECT status INTO v_election_status
    FROM public.elections 
    WHERE id = p_election_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Pemilihan tidak ditemukan');
    END IF;

    -- Cek apakah sudah memilih
    SELECT COUNT(*) INTO v_already_voted
    FROM public.voter_participation
    WHERE election_id = p_election_id AND student_id = p_student_id;

    IF v_already_voted > 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Anda sudah menggunakan hak suara sebelumnya');
    END IF;

    -- Cek kandidat valid
    SELECT COUNT(*) INTO v_candidate_valid
    FROM public.candidates
    WHERE id = p_candidate_id AND election_id = p_election_id;

    IF v_candidate_valid = 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Kandidat tidak valid');
    END IF;

    -- Simpan partisipasi pemilih (tanpa menghubungkan pilihan calon)
    INSERT INTO public.voter_participation (election_id, student_id, voted_at, ip_hash)
    VALUES (p_election_id, p_student_id, NOW(), p_ip_hash);

    -- Simpan surat suara 100% rahasia (tanpa ID siswa)
    INSERT INTO public.ballots (election_id, candidate_id, created_at)
    VALUES (p_election_id, p_candidate_id, NOW());

    RETURN jsonb_build_object('success', true, 'message', 'Suara Anda berhasil dicatat, terima kasih telah berpartisipasi');
EXCEPTION
    WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'message', 'Anda sudah tercatat memilih');
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', 'Terjadi kesalahan sistem saat memproses suara');
END;
$$;

GRANT EXECUTE ON FUNCTION public.cast_student_vote TO anon, authenticated, postgres, service_role;

-- 4. INSERT DATA AWAL (SEED DATA LENGKAP)

-- A. Data Sekolah
INSERT INTO public.schools (
    id, name, logo_url, address, contact_phone, contact_email, principal_name, committee_chair, committee_secretary
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'SMP Negeri 1 Sukamulia',
    '/logo-smpn1sukamulia.png',
    'Jl. Pendidikan No. 1, Sukamulia, Kec. Sukamulia, Kab. Lombok Timur, NTB 83652',
    '(0376) 21123',
    'info@smpn1sukamulia.sch.id',
    'Drs. H. M. Zainuddin, M.Pd.',
    'Ahmad Fauzi, S.Pd.',
    'Nurul Hidayati, S.Pd.'
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    logo_url = EXCLUDED.logo_url,
    address = EXCLUDED.address;

-- B. Data Periode Pemilihan
INSERT INTO public.elections (
    id, school_id, title, academic_year, start_time, end_time, timezone, status, is_published
) VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Pemilihan Ketua dan Wakil Ketua OSIS',
    '2026/2027',
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '7 days',
    'Asia/Makassar',
    'active',
    true
) ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    title = EXCLUDED.title;

-- C. Data Kelas
INSERT INTO public.classes (id, election_id, name, grade_level, description) VALUES
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'VII-A', '7', 'Kelas 7 Reguler A'),
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'VII-B', '7', 'Kelas 7 Reguler B'),
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'VIII-A', '8', 'Kelas 8 Unggulan A'),
('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'VIII-B', '8', 'Kelas 8 Reguler B'),
('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'IX-A', '9', 'Kelas 9 Reguler A'),
('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', 'IX-B', '9', 'Kelas 9 Reguler B')
ON CONFLICT (id) DO NOTHING;

-- D. Data Calon Kandidat
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
    E'1. Menciptakan iklim sekolah yang bebas perundungan (anti-bullying) dengan duta damai di setiap kelas.\n2. Mendorong kelompok belajar intensif sains, bahasa Inggris, dan seni budaya daerah Lombok.\n3. Menghidupkan mading digital dan media informasi sekolah sebagai ruang ekspresi positif siswa.\n4. Memperkuat koordinasi antara pengurus OSIS, dewan guru, dan seluruh perwakilan kelas.',
    'Program Unggulan: Pos Sahabat Pelajar (Anti-Bullying), English Club & Sains Olympiad Camp, Festival Budaya Sasak.',
    true
)
ON CONFLICT (id) DO NOTHING;

-- E. Kosongkan Data Siswa & Token Lama (Sesuai Permintaan Pengguna)
DELETE FROM public.voter_credentials;
DELETE FROM public.voter_participation;
DELETE FROM public.students;

-- G. Profil Admin
INSERT INTO public.admin_profiles (email, full_name, role) VALUES
('admin@smpn1sukamulia.sch.id', 'Administrator Utama OSIS', 'superadmin')
ON CONFLICT (email) DO NOTHING;
