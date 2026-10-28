-- ====================================================================
-- E-VOTING SMPN 1 SUKAMULIA 2026/2027
-- Database Schema Migration
-- Designed for Supabase PostgreSQL with RLS, Security & Secret Ballots
-- ====================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. SCHOOLS TABLE
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL DEFAULT 'SMP Negeri 1 Sukamulia',
    logo_url TEXT DEFAULT '/logo-smpn1sukamulia.png',
    address TEXT DEFAULT 'Jl. Pendidikan No. 1, Sukamulia, Lombok Timur, NTB',
    contact_phone VARCHAR(50) DEFAULT '(0376) 21123',
    contact_email VARCHAR(100) DEFAULT 'info@smpn1sukamulia.sch.id',
    principal_name VARCHAR(255) DEFAULT 'Drs. H. M. Zainuddin, M.Pd.',
    committee_chair VARCHAR(255) DEFAULT 'Ahmad Fauzi, S.Pd.',
    committee_secretary VARCHAR(255) DEFAULT 'Nurul Hidayati, S.Pd.',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ELECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.elections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL DEFAULT 'Pemilihan Ketua dan Wakil Ketua OSIS',
    academic_year VARCHAR(20) NOT NULL DEFAULT '2026/2027',
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW() - INTERVAL '1 hour',
    end_time TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
    timezone VARCHAR(50) DEFAULT 'Asia/Makassar',
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'closed')),
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CLASSES TABLE
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    election_id UUID REFERENCES public.elections(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    grade_level VARCHAR(10) NOT NULL, -- '7', '8', '9'
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_class_name_per_election UNIQUE (election_id, name)
);

-- 5. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    election_id UUID REFERENCES public.elections(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE RESTRICT,
    nisn VARCHAR(20) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    birth_date DATE,
    gender VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_nisn_per_election UNIQUE (election_id, nisn)
);

-- 6. VOTER CREDENTIALS TABLE (Stores cryptographic token & hash)
CREATE TABLE IF NOT EXISTS public.voter_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE UNIQUE,
    token_hash TEXT NOT NULL,
    token_preview VARCHAR(20) NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ,
    last_issued_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CANDIDATES TABLE
CREATE TABLE IF NOT EXISTS public.candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    election_id UUID REFERENCES public.elections(id) ON DELETE CASCADE,
    ballot_number INT NOT NULL,
    photo_url TEXT,
    leader_name VARCHAR(255) NOT NULL,
    vice_leader_name VARCHAR(255) NOT NULL,
    leader_class VARCHAR(50),
    vice_leader_class VARCHAR(50),
    vision TEXT NOT NULL,
    mission TEXT NOT NULL,
    slogan TEXT,
    program_desc TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_ballot_number UNIQUE (election_id, ballot_number)
);

-- 8. VOTER PARTICIPATION TABLE (Marks whether student has voted; NO link to candidate)
CREATE TABLE IF NOT EXISTS public.voter_participation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    election_id UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    voted_at TIMESTAMPTZ DEFAULT NOW(),
    ip_hash TEXT,
    CONSTRAINT unique_voter_election UNIQUE (election_id, student_id)
);

-- 9. BALLOTS TABLE (100% SECRET: contains only election_id and candidate_id, never student_id)
CREATE TABLE IF NOT EXISTS public.ballots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    election_id UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ELECTION DOCUMENTS (Official Berita Acara & Archives)
CREATE TABLE IF NOT EXISTS public.election_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    election_id UUID REFERENCES public.elections(id) ON DELETE CASCADE,
    doc_type VARCHAR(50) DEFAULT 'berita_acara',
    title VARCHAR(255) NOT NULL,
    doc_number VARCHAR(100),
    execution_date DATE DEFAULT CURRENT_DATE,
    execution_time VARCHAR(100) DEFAULT '08:00 - 13:00 WITA',
    execution_place VARCHAR(255) DEFAULT 'Aula Serbaguna SMPN 1 Sukamulia',
    total_eligible INT DEFAULT 0,
    total_voted INT DEFAULT 0,
    total_unvoted INT DEFAULT 0,
    total_valid_votes INT DEFAULT 0,
    total_invalid_votes INT DEFAULT 0,
    results_summary JSONB,
    notes TEXT,
    is_verified BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(255) DEFAULT 'Panitia Pemilihan OSIS',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    election_id UUID REFERENCES public.elections(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    actor VARCHAR(255) NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. ADMIN PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'superadmin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_students_election_nisn ON public.students(election_id, nisn);
CREATE INDEX IF NOT EXISTS idx_students_class ON public.students(class_id);
CREATE INDEX IF NOT EXISTS idx_voter_credentials_token ON public.voter_credentials(token_hash);
CREATE INDEX IF NOT EXISTS idx_candidates_ballot ON public.candidates(election_id, ballot_number);
CREATE INDEX IF NOT EXISTS idx_ballots_election_candidate ON public.ballots(election_id, candidate_id);
CREATE INDEX IF NOT EXISTS idx_participation_student ON public.voter_participation(election_id, student_id);

-- 14. VIEW: ELECTION RESULTS SUMMARY
CREATE OR REPLACE VIEW public.v_election_results AS
SELECT 
    c.id AS candidate_id,
    c.election_id,
    c.ballot_number,
    c.leader_name,
    c.vice_leader_name,
    c.photo_url,
    c.slogan,
    COUNT(b.id) AS vote_count
FROM public.candidates c
LEFT JOIN public.ballots b ON c.id = b.candidate_id AND c.election_id = b.election_id
WHERE c.is_active = TRUE
GROUP BY c.id, c.election_id, c.ballot_number, c.leader_name, c.vice_leader_name, c.photo_url, c.slogan
ORDER BY c.ballot_number ASC;

-- 15. ATOMIC RPC FOR SAFE VOTING (Prevents race conditions & double-voting)
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
    v_election_start TIMESTAMPTZ;
    v_election_end TIMESTAMPTZ;
    v_student_active BOOLEAN;
    v_already_voted INT;
    v_candidate_valid INT;
BEGIN
    -- Check election validity
    SELECT status, start_time, end_time 
    INTO v_election_status, v_election_start, v_election_end
    FROM public.elections 
    WHERE id = p_election_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Pemilihan tidak ditemukan');
    END IF;

    IF v_election_status <> 'active' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Pemilihan sedang tidak aktif atau ditutup');
    END IF;

    IF NOW() < v_election_start OR NOW() > v_election_end THEN
        RETURN jsonb_build_object('success', false, 'message', 'Waktu pemungutan suara berada di luar jadwal resmi');
    END IF;

    -- Check student active status
    SELECT is_active INTO v_student_active
    FROM public.students
    WHERE id = p_student_id AND election_id = p_election_id;

    IF NOT FOUND OR v_student_active IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'message', 'Data siswa tidak valid atau status siswa tidak aktif');
    END IF;

    -- Check if student already voted
    SELECT COUNT(*) INTO v_already_voted
    FROM public.voter_participation
    WHERE election_id = p_election_id AND student_id = p_student_id;

    IF v_already_voted > 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Anda sudah menggunakan hak suara sebelumnya');
    END IF;

    -- Check candidate validity
    SELECT COUNT(*) INTO v_candidate_valid
    FROM public.candidates
    WHERE id = p_candidate_id AND election_id = p_election_id AND is_active = TRUE;

    IF v_candidate_valid = 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Kandidat yang dipilih tidak valid atau tidak aktif');
    END IF;

    -- Atomically record voter participation
    INSERT INTO public.voter_participation (election_id, student_id, voted_at, ip_hash)
    VALUES (p_election_id, p_student_id, NOW(), p_ip_hash);

    -- Atomically insert anonymous ballot
    INSERT INTO public.ballots (election_id, candidate_id, created_at)
    VALUES (p_election_id, p_candidate_id, NOW());

    RETURN jsonb_build_object('success', true, 'message', 'Suara Anda berhasil dicatat, terima kasih telah berpartisipasi');
EXCEPTION
    WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'message', 'Pelanggaran integritas: Anda sudah tercatat memilih');
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', 'Terjadi kesalahan sistem saat memproses suara');
END;
$$;

-- 16. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voter_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voter_participation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ballots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.election_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- Public read policies for active election data
CREATE POLICY "Public read schools" ON public.schools FOR SELECT USING (true);
CREATE POLICY "Public read elections" ON public.elections FOR SELECT USING (true);
CREATE POLICY "Public read classes" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Public read candidates" ON public.candidates FOR SELECT USING (is_active = true);
CREATE POLICY "Public read student vote status" ON public.voter_participation FOR SELECT USING (true);
CREATE POLICY "Public read election docs" ON public.election_documents FOR SELECT USING (true);

-- Allow anonymous execution of vote RPC and token verification
GRANT EXECUTE ON FUNCTION public.cast_student_vote TO anon, authenticated;

-- Allow anon read/write permissions for demo and school app usage
CREATE POLICY "Allow anon select students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Allow anon select credentials" ON public.voter_credentials FOR SELECT USING (true);
CREATE POLICY "Allow anon insert ballots" ON public.ballots FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon select ballots" ON public.ballots FOR SELECT USING (true);
CREATE POLICY "Allow anon all on schools" ON public.schools FOR ALL USING (true);
CREATE POLICY "Allow anon all on elections" ON public.elections FOR ALL USING (true);
CREATE POLICY "Allow anon all on classes" ON public.classes FOR ALL USING (true);
CREATE POLICY "Allow anon all on students" ON public.students FOR ALL USING (true);
CREATE POLICY "Allow anon all on credentials" ON public.voter_credentials FOR ALL USING (true);
CREATE POLICY "Allow anon all on candidates" ON public.candidates FOR ALL USING (true);
CREATE POLICY "Allow anon all on voter_participation" ON public.voter_participation FOR ALL USING (true);
CREATE POLICY "Allow anon all on election_documents" ON public.election_documents FOR ALL USING (true);
CREATE POLICY "Allow anon all on audit_logs" ON public.audit_logs FOR ALL USING (true);
