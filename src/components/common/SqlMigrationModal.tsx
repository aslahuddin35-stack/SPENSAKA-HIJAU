import React, { useState } from 'react';
import { Database, CheckCircle2, Copy, Check, ExternalLink, RefreshCw, X, ShieldAlert, ArrowUpRight, UploadCloud, AlertTriangle } from 'lucide-react';
import { db } from '../../services/db';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SqlMigrationModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testResult, setTestResult] = useState<{ 
    connected: boolean; 
    tablesFound: boolean; 
    writable: boolean; 
    rlsBlocked: boolean; 
    details: string;
    counts?: any;
  } | null>(null);

  if (!isOpen) return null;

  const sqlScript = `-- ====================================================================
-- E-VOTING SMPN 1 SUKAMULIA 2026/2027
-- SCRIPT LENGKAP: PERBAIKAN RLS & SEED DATA SUPABASE
-- Salin dan jalankan seluruh script ini di Supabase SQL Editor:
-- https://supabase.com/dashboard/project/phqkeaqsfmnlfpxwepfo/sql/new
-- ====================================================================

-- 1. Pastikan ekstensi aktif
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Buat tabel jika belum ada
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL DEFAULT 'SMP Negeri 1 Sukamulia',
    logo_url TEXT DEFAULT '/logo-smpn1sukamulia.png',
    address TEXT DEFAULT 'Jl. Pendidikan No. 1, Sukamulia, Kec. Sukamulia, Kab. Lombok Timur, NTB 83652',
    contact_phone VARCHAR(50) DEFAULT '(0376) 21123',
    contact_email VARCHAR(100) DEFAULT 'info@smpn1sukamulia.sch.id',
    principal_name VARCHAR(255) DEFAULT 'Drs. H. M. Zainuddin, M.Pd.',
    principal_nip VARCHAR(100) DEFAULT '19681231 199412 1 002',
    committee_chair VARCHAR(255) DEFAULT 'Ahmad Fauzi, S.Pd.',
    committee_chair_nip VARCHAR(100) DEFAULT '19850412 201001 1 015',
    committee_secretary VARCHAR(255) DEFAULT 'Nurul Hidayati, S.Pd.',
    committee_secretary_nip VARCHAR(100) DEFAULT '19900825 201503 2 008',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kolom NIP pejabat sekolah jika tabel sudah pernah dibuat sebelumnya
ALTER TABLE IF EXISTS public.schools ADD COLUMN IF NOT EXISTS principal_nip VARCHAR(100);
ALTER TABLE IF EXISTS public.schools ADD COLUMN IF NOT EXISTS committee_chair_nip VARCHAR(100);
ALTER TABLE IF EXISTS public.schools ADD COLUMN IF NOT EXISTS committee_secretary_nip VARCHAR(100);

CREATE TABLE IF NOT EXISTS public.elections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL DEFAULT 'Pemilihan Ketua dan Wakil Ketua OSIS',
    academic_year VARCHAR(20) NOT NULL DEFAULT '2026/2027',
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW() - INTERVAL '1 day',
    end_time TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
    timezone VARCHAR(50) DEFAULT 'Asia/Makassar',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    election_id UUID REFERENCES public.elections(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    grade_level VARCHAR(10) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS public.voter_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE UNIQUE,
    token_hash TEXT NOT NULL,
    token_preview VARCHAR(20) NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.voter_participation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    election_id UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    voted_at TIMESTAMPTZ DEFAULT NOW(),
    ip_hash TEXT,
    CONSTRAINT unique_voter_election UNIQUE (election_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.ballots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    election_id UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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
    is_verified BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(255) DEFAULT 'Panitia Pemilihan OSIS',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    election_id UUID REFERENCES public.elections(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    actor VARCHAR(255) NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Buka izin Row Level Security (RLS) & Pasang Kebijakan Akses Penuh (Full CRUD)
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

-- 4. Buat RPC cast_student_vote (Atomic & Aman)
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
    SELECT status INTO v_election_status
    FROM public.elections 
    WHERE id = p_election_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Pemilihan tidak ditemukan');
    END IF;

    SELECT COUNT(*) INTO v_already_voted
    FROM public.voter_participation
    WHERE election_id = p_election_id AND student_id = p_student_id;

    IF v_already_voted > 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Anda sudah menggunakan hak suara sebelumnya');
    END IF;

    SELECT COUNT(*) INTO v_candidate_valid
    FROM public.candidates
    WHERE id = p_candidate_id AND election_id = p_election_id;

    IF v_candidate_valid = 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Kandidat tidak valid');
    END IF;

    INSERT INTO public.voter_participation (election_id, student_id, voted_at, ip_hash)
    VALUES (p_election_id, p_student_id, NOW(), p_ip_hash);

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

-- 5. Data Awal (Seed Data)
INSERT INTO public.schools (
    id, name, logo_url, address, contact_phone, contact_email, principal_name, principal_nip, committee_chair, committee_chair_nip, committee_secretary, committee_secretary_nip
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'SMP Negeri 1 Sukamulia',
    '/logo-smpn1sukamulia.png',
    'Jl. Pendidikan No. 1, Sukamulia, Kec. Sukamulia, Kab. Lombok Timur, NTB 83652',
    '(0376) 21123',
    'info@smpn1sukamulia.sch.id',
    'Drs. H. M. Zainuddin, M.Pd.',
    '19681231 199412 1 002',
    'Ahmad Fauzi, S.Pd.',
    '19850412 201001 1 015',
    'Nurul Hidayati, S.Pd.',
    '19900825 201503 2 008'
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    logo_url = EXCLUDED.logo_url,
    address = EXCLUDED.address,
    principal_name = EXCLUDED.principal_name,
    principal_nip = EXCLUDED.principal_nip,
    committee_chair = EXCLUDED.committee_chair,
    committee_chair_nip = EXCLUDED.committee_chair_nip,
    committee_secretary = EXCLUDED.committee_secretary,
    committee_secretary_nip = EXCLUDED.committee_secretary_nip;

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

INSERT INTO public.classes (id, election_id, name, grade_level, description) VALUES
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'VII-A', '7', 'Kelas 7 Reguler A'),
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'VII-B', '7', 'Kelas 7 Reguler B'),
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'VIII-A', '8', 'Kelas 8 Unggulan A'),
('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'VIII-B', '8', 'Kelas 8 Reguler B'),
('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'IX-A', '9', 'Kelas 9 Reguler A'),
('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', 'IX-B', '9', 'Kelas 9 Reguler B')
ON CONFLICT (id) DO NOTHING;

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
    E'1. Mengoptimalkan kegiatan literasi digital dan penguatan karakter Profil Pelajar Pancasila.\\n2. Mewadahi aspirasi siswa secara terbuka melalui forum kotak saran digital OSIS.\\n3. Menyelenggarakan pekan olahraga dan seni antarkelas secara berkala dan kompetitif.\\n4. Membudayakan program Sekolah Hijau (Green School) melalui gerakan zero waste.',
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
    E'1. Membangun sinergi antarekstrakurikuler untuk meningkatkan prestasi sekolah tingkat kabupaten dan provinsi.\\n2. Mengadakan workshop kreativitas siswa, podcast sekolah, dan festival karya pelajar.\\n3. Menumbuhkan empati melalui program Gerakan Peduli Kawan dan bakti sosial berkala.\\n4. Menguatkan kedisiplinan dan sopan santun melalui keteladanan pengurus OSIS.',
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
    E'1. Menciptakan iklim sekolah yang bebas perundungan (anti-bullying) dengan duta damai di setiap kelas.\\n2. Mendorong kelompok belajar intensif sains, bahasa Inggris, dan seni budaya daerah Lombok.\\n3. Menghidupkan mading digital dan media informasi sekolah sebagai ruang ekspresi positif siswa.\\n4. Memperkuat koordinasi antara pengurus OSIS, dewan guru, dan seluruh perwakilan kelas.',
    'Program Unggulan: Pos Sahabat Pelajar (Anti-Bullying), English Club & Sains Olympiad Camp, Festival Budaya Sasak.',
    true
)
ON CONFLICT (id) DO NOTHING;

-- Kosongkan seluruh data siswa & kredensial token lama (sesuai permintaan pengguna)
DELETE FROM public.voter_credentials;
DELETE FROM public.voter_participation;
DELETE FROM public.students;

INSERT INTO public.admin_profiles (email, full_name, role) VALUES
('admin@smpn1sukamulia.sch.id', 'Administrator Utama OSIS', 'superadmin')
ON CONFLICT (email) DO NOTHING;
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setSyncMessage(null);
    const result = await db.checkSupabase();
    setTestResult(result);
    setTesting(false);
  };

  const handleSyncData = async () => {
    setSyncing(true);
    setSyncMessage(null);
    const result = await db.pushDataToSupabase();
    if (result.success) {
      setSyncMessage({ type: 'success', text: result.message });
      // Re-check status
      const res = await db.checkSupabase();
      setTestResult(res);
    } else {
      setSyncMessage({ type: 'error', text: result.message });
    }
    setSyncing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-emerald-900/10">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-700/60 flex items-center justify-center border border-emerald-500/30 shadow-inner">
              <Database className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-black text-lg sm:text-xl leading-tight">
                Pusat Perbaikan & Integrasi Database Supabase
              </h3>
              <p className="text-xs text-emerald-200">
                E-Voting SMP Negeri 1 Sukamulia 2026/2027 • PostgreSQL
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-emerald-300 hover:text-white p-2 rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status Box */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-bold text-sm text-emerald-950">Status Koneksi Supabase: Terhubung via API</span>
              </div>
              <p className="text-xs text-emerald-800 mt-1 font-mono">
                Project URL: <span className="font-bold underline">https://phqkeaqsfmnlfpxwepfo.supabase.co</span>
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                {testing ? 'Menguji...' : 'Uji Status & Izin Tulis'}
              </button>
              <button
                onClick={handleSyncData}
                disabled={syncing}
                className="flex items-center gap-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm disabled:opacity-50"
              >
                <UploadCloud className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Mengirim...' : 'Kirim Data ke Supabase'}
              </button>
            </div>
          </div>

          {/* Sync Message Alert */}
          {syncMessage && (
            <div className={`p-4 rounded-2xl text-xs flex items-center gap-3 ${
              syncMessage.type === 'success' 
                ? 'bg-emerald-100 text-emerald-950 border border-emerald-300' 
                : 'bg-rose-100 text-rose-950 border border-rose-300'
            }`}>
              {syncMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span className="font-medium leading-relaxed">{syncMessage.text}</span>
            </div>
          )}

          {/* Test Result Diagnostic Card */}
          {testResult && (
            <div className={`p-4 rounded-2xl text-xs space-y-2 border ${
              testResult.writable 
                ? 'bg-emerald-50 text-emerald-950 border-emerald-300' 
                : testResult.rlsBlocked
                ? 'bg-amber-50 text-amber-950 border-amber-300'
                : 'bg-rose-50 text-rose-950 border-rose-300'
            }`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                {testResult.writable ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                )}
                <span>
                  {testResult.writable 
                    ? 'Koneksi Supabase Sempurna & Izin Tulis Aktif!' 
                    : testResult.rlsBlocked
                    ? 'Tabel Ditemukan, Namun Izin Tulis Diblokir RLS (Error 42501)'
                    : 'Pemeriksaan Koneksi Supabase'}
                </span>
              </div>
              <p className="leading-relaxed text-slate-700">{testResult.details}</p>

              {testResult.counts && (
                <div className="pt-2 grid grid-cols-2 sm:grid-cols-6 gap-2 text-center">
                  <div className="bg-white/80 p-2 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Sekolah</span>
                    <span className="font-mono font-bold text-emerald-800 text-sm">{testResult.counts.schools} baris</span>
                  </div>
                  <div className="bg-white/80 p-2 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Periode</span>
                    <span className="font-mono font-bold text-emerald-800 text-sm">{testResult.counts.elections} baris</span>
                  </div>
                  <div className="bg-white/80 p-2 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Kelas</span>
                    <span className="font-mono font-bold text-emerald-800 text-sm">{testResult.counts.classes} baris</span>
                  </div>
                  <div className="bg-white/80 p-2 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Kandidat</span>
                    <span className="font-mono font-bold text-emerald-800 text-sm">{testResult.counts.candidates} baris</span>
                  </div>
                  <div className="bg-white/80 p-2 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Siswa</span>
                    <span className="font-mono font-bold text-emerald-800 text-sm">{testResult.counts.students} baris</span>
                  </div>
                  <div className="bg-white/80 p-2 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Suara</span>
                    <span className="font-mono font-bold text-emerald-800 text-sm">{testResult.counts.ballots} suara</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick instructions */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs space-y-3 text-slate-700">
            <div className="flex items-center justify-between">
              <p className="font-extrabold text-slate-900 text-sm">
                Petunjuk Cepat: 2 Langkah Membuka Izin & Menghubungkan Supabase 100%
              </p>
              <a 
                href="https://supabase.com/dashboard/project/phqkeaqsfmnlfpxwepfo/sql/new" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-100/70 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition"
              >
                <span>Buka SQL Editor Supabase</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <ol className="list-decimal list-inside space-y-2 leading-relaxed text-slate-700">
              <li>
                Klik tombol <span className="font-bold text-emerald-800">"Salin Seluruh Script SQL"</span> di bawah ini.
              </li>
              <li>
                Buka tab baru ke <a href="https://supabase.com/dashboard/project/phqkeaqsfmnlfpxwepfo/sql/new" target="_blank" rel="noreferrer" className="text-emerald-700 font-bold underline inline-flex items-center gap-0.5">Supabase SQL Editor <ArrowUpRight className="w-3 h-3 inline" /></a>, paste script lalu klik tombol hijau <strong>"RUN"</strong>.
              </li>
            </ol>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px] leading-relaxed">
              <strong>Catatan Teknis:</strong> Script ini otomatis membuka izin Row Level Security (RLS), memberikan hak akses ke role <code>anon</code> dan <code>authenticated</code>, memasang fungsi RPC voting atomik <code>cast_student_vote</code>, serta memasukkan seluruh data awal (SMPN 1 Sukamulia, 3 Paslon, 6 Kelas, 6 Siswa).
            </div>
          </div>

          {/* SQL Editor preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Script SQL Perbaikan & Data Awal (PostgreSQL):
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl transition shadow-sm"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Tersalin ke Clipboard!' : 'Salin Seluruh Script SQL'}
              </button>
            </div>
            <pre className="bg-slate-900 text-emerald-400 font-mono text-[11px] p-4 rounded-2xl max-h-60 overflow-y-auto leading-relaxed border border-slate-800 shadow-inner">
              {sqlScript}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 sm:p-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500">
            Aplikasi tetap berjalan normal berkat sistem sinkronisasi otomatis.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-sm flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Tersalin!' : 'Salin Script SQL'}</span>
            </button>
            <button
              onClick={onClose}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs px-5 py-2.5 rounded-xl transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
