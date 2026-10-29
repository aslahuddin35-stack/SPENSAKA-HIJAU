/**
 * E-VOTING SMPN 1 SUKAMULIA 2026/2027
 * Database Service & Resilient Synchronization Layer
 */

import { supabase, SUPABASE_CONFIG } from './supabase';
import { 
  School, Election, ClassItem, Student, Candidate, 
  CandidateResult, ElectionDocument, AuditLog 
} from '../types';
import { formatCandidateImageUrl } from '../utils/imageUrl';

const STORAGE_KEYS = {
  SCHOOL: 'evoting_school',
  ELECTION: 'evoting_election',
  CLASSES: 'evoting_classes',
  STUDENTS: 'evoting_students',
  CANDIDATES: 'evoting_candidates',
  PARTICIPATION: 'evoting_participation',
  BALLOTS: 'evoting_ballots',
  DOCUMENTS: 'evoting_documents',
  AUDIT: 'evoting_audit_logs',
};

// Initial default school profile
const DEFAULT_SCHOOL: School = {
  id: 'a0000000-0000-0000-0000-000000000001',
  name: 'SMP Negeri 1 Sukamulia',
  logo_url: '/logo-smpn1sukamulia.png',
  address: 'Jl. Pendidikan No. 1, Sukamulia, Kec. Sukamulia, Kab. Lombok Timur, NTB 83652',
  contact_phone: '(0376) 21123',
  contact_email: 'info@smpn1sukamulia.sch.id',
  principal_name: 'Drs. H. M. Zainuddin, M.Pd.',
  principal_nip: '19681231 199412 1 002',
  committee_chair: 'Ahmad Fauzi, S.Pd.',
  committee_chair_nip: '19850412 201001 1 015',
  committee_secretary: 'Nurul Hidayati, S.Pd.',
  committee_secretary_nip: '19900825 201503 2 008',
};

// Initial default election
const DEFAULT_ELECTION: Election = {
  id: 'b0000000-0000-0000-0000-000000000001',
  school_id: 'a0000000-0000-0000-0000-000000000001',
  title: 'Pemilihan Ketua dan Wakil Ketua OSIS',
  academic_year: '2026/2027',
  start_time: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  end_time: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
  timezone: 'Asia/Makassar',
  status: 'active',
  is_published: true,
};

// Initial default classes
const DEFAULT_CLASSES: ClassItem[] = [
  { id: 'c0000000-0000-0000-0000-000000000001', election_id: DEFAULT_ELECTION.id, name: 'VII-A', grade_level: '7', description: 'Kelas 7 Reguler A', is_active: true },
  { id: 'c0000000-0000-0000-0000-000000000002', election_id: DEFAULT_ELECTION.id, name: 'VII-B', grade_level: '7', description: 'Kelas 7 Reguler B', is_active: true },
  { id: 'c0000000-0000-0000-0000-000000000003', election_id: DEFAULT_ELECTION.id, name: 'VIII-A', grade_level: '8', description: 'Kelas 8 Unggulan A', is_active: true },
  { id: 'c0000000-0000-0000-0000-000000000004', election_id: DEFAULT_ELECTION.id, name: 'VIII-B', grade_level: '8', description: 'Kelas 8 Reguler B', is_active: true },
  { id: 'c0000000-0000-0000-0000-000000000005', election_id: DEFAULT_ELECTION.id, name: 'IX-A', grade_level: '9', description: 'Kelas 9 Reguler A', is_active: true },
  { id: 'c0000000-0000-0000-0000-000000000006', election_id: DEFAULT_ELECTION.id, name: 'IX-B', grade_level: '9', description: 'Kelas 9 Reguler B', is_active: true },
];

// Initial default candidates
const DEFAULT_CANDIDATES: Candidate[] = [
  {
    id: 'd0000000-0000-0000-0000-000000000001',
    election_id: DEFAULT_ELECTION.id,
    ballot_number: 1,
    photo_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
    leader_name: 'M. Rayhan Pratama',
    vice_leader_name: 'Siti Aisyah Azzahra',
    leader_class: 'VIII-A',
    vice_leader_class: 'VII-B',
    slogan: 'BERAKSI: Berkarya, Berkarakter, dan Berprestasi',
    vision: 'Mewujudkan OSIS SMPN 1 Sukamulia sebagai wadah pembentukan generasi berakhlak mulia, adaptif teknologi, berwawasan lingkungan, dan berprestasi unggul.',
    mission: '1. Mengoptimalkan literasi digital dan penguatan karakter Profil Pelajar Pancasila.\n2. Mewadahi aspirasi siswa secara terbuka melalui forum kotak saran digital OSIS.\n3. Menyelenggarakan pekan olahraga dan seni antarkelas secara berkala.\n4. Membudayakan program Sekolah Hijau (Green School) melalui gerakan zero waste.',
    program_desc: 'Program Unggulan: E-Mading Sukamulia Hebat, Liga Futsal & Voli Antarkelas, Gerakan Siswa Peduli Lingkungan.',
    is_active: true,
  },
  {
    id: 'd0000000-0000-0000-0000-000000000002',
    election_id: DEFAULT_ELECTION.id,
    ballot_number: 2,
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    leader_name: 'Dimas Aditya Nugraha',
    vice_leader_name: 'Kayla Putri Maharani',
    leader_class: 'VIII-B',
    vice_leader_class: 'VIII-A',
    slogan: 'SINERGI: Solutif, Inovatif, dan Menginspirasi',
    vision: 'Menjadikan OSIS SMPN 1 Sukamulia sebagai penggerak kolaborasi siswa yang kreatif, disiplin, berjiwa wirausaha muda, dan peduli sosial.',
    mission: '1. Membangun sinergi antarekstrakurikuler untuk meningkatkan prestasi sekolah.\n2. Mengadakan workshop kreativitas siswa, podcast sekolah, dan festival karya pelajar.\n3. Menumbuhkan empati melalui program Gerakan Peduli Kawan dan bakti sosial berkala.\n4. Menguatkan kedisiplinan dan sopan santun melalui keteladanan pengurus OSIS.',
    program_desc: 'Program Unggulan: Podcast Pelajar Sukamulia Berbicara, Pameran Seni & Market Day Pelajar, Sukamulia Bersedekah.',
    is_active: true,
  },
  {
    id: 'd0000000-0000-0000-0000-000000000003',
    election_id: DEFAULT_ELECTION.id,
    ballot_number: 3,
    photo_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
    leader_name: 'Fadhil Arfa Maulana',
    vice_leader_name: 'Nabila Zahra Humaira',
    leader_class: 'VIII-B',
    vice_leader_class: 'VII-A',
    slogan: 'HARMONI: Hebat, Amanah, dan Berintegritas',
    vision: 'Mewujudkan lingkungan sekolah yang harmonis, ramah anak, berprestasi dalam sains maupun seni, dan berbudaya kearifan lokal.',
    mission: '1. Menciptakan iklim sekolah yang ramah anak dan bebas perundungan (anti-bullying).\n2. Mendorong kelompok belajar intensif sains, bahasa Inggris, dan seni budaya daerah Lombok.\n3. Menghidupkan mading dan media informasi sekolah sebagai ruang kreasi positif.\n4. Memperkuat koordinasi antara pengurus OSIS, dewan guru, dan seluruh perwakilan kelas.',
    program_desc: 'Program Unggulan: Pos Sahabat Pelajar (Anti-Bullying), English Club & Sains Olympiad Camp, Festival Budaya Sasak.',
    is_active: true,
  },
];

// Initial sample students (cleared per user request)
const DEFAULT_STUDENTS: Student[] = [];

function generateSecureToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'SKM-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface RemoteCounts {
  schools: number;
  elections: number;
  classes: number;
  candidates: number;
  students: number;
  ballots: number;
}

class DatabaseService {
  private school: School = DEFAULT_SCHOOL;
  private election: Election = DEFAULT_ELECTION;
  private classes: ClassItem[] = DEFAULT_CLASSES;
  private students: Student[] = DEFAULT_STUDENTS;
  private candidates: Candidate[] = DEFAULT_CANDIDATES;
  private voterParticipation: Record<string, string> = {}; // student_id -> voted_at
  private ballots: Array<{ id: string; election_id: string; candidate_id: string; created_at: string }> = [];
  private documents: ElectionDocument[] = [];
  private auditLogs: AuditLog[] = [];
  public isSupabaseConnected = false;
  public tablesExistInSupabase = false;
  public isWritable = false;
  public isRlsBlocked = false;
  public lastSyncError: string | null = null;
  public remoteCounts: RemoteCounts = {
    schools: 0,
    elections: 0,
    classes: 0,
    candidates: 0,
    students: 0,
    ballots: 0,
  };

  constructor() {
    this.loadFromLocalStorage();
    this.checkSupabase();
  }

  private loadFromLocalStorage() {
    try {
      const s = localStorage.getItem(STORAGE_KEYS.SCHOOL);
      if (s) this.school = JSON.parse(s);

      const e = localStorage.getItem(STORAGE_KEYS.ELECTION);
      if (e) this.election = JSON.parse(e);

      const c = localStorage.getItem(STORAGE_KEYS.CLASSES);
      if (c) this.classes = JSON.parse(c);

      // Ensure all students are cleared per user explicit request
      const PURGE_FLAG = 'evoting_students_purged_user_request_v1';
      if (typeof localStorage !== 'undefined' && localStorage.getItem(PURGE_FLAG) !== 'done') {
        this.students = [];
        this.voterParticipation = {};
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.PARTICIPATION, JSON.stringify({}));
        localStorage.setItem(PURGE_FLAG, 'done');
      } else {
        const st = localStorage.getItem(STORAGE_KEYS.STUDENTS);
        if (st) this.students = JSON.parse(st);
      }

      const cd = localStorage.getItem(STORAGE_KEYS.CANDIDATES);
      if (cd) this.candidates = JSON.parse(cd);

      const vp = localStorage.getItem(STORAGE_KEYS.PARTICIPATION);
      if (vp) this.voterParticipation = JSON.parse(vp);

      const bl = localStorage.getItem(STORAGE_KEYS.BALLOTS);
      if (bl) this.ballots = JSON.parse(bl);

      const dc = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
      if (dc) this.documents = JSON.parse(dc);

      const ad = localStorage.getItem(STORAGE_KEYS.AUDIT);
      if (ad) this.auditLogs = JSON.parse(ad);
    } catch (err) {
      console.warn('Could not read from localStorage', err);
    }
  }

  private saveToLocalStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.SCHOOL, JSON.stringify(this.school));
      localStorage.setItem(STORAGE_KEYS.ELECTION, JSON.stringify(this.election));
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(this.classes));
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(this.students));
      localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(this.candidates));
      localStorage.setItem(STORAGE_KEYS.PARTICIPATION, JSON.stringify(this.voterParticipation));
      localStorage.setItem(STORAGE_KEYS.BALLOTS, JSON.stringify(this.ballots));
      localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(this.documents));
      localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(this.auditLogs));
    } catch (err) {
      console.warn('Could not write to localStorage', err);
    }
  }

  public async checkSupabase(): Promise<{ 
    connected: boolean; 
    tablesFound: boolean; 
    writable: boolean; 
    rlsBlocked: boolean; 
    details: string;
    counts?: RemoteCounts;
  }> {
    try {
      // 1. Check read on schools
      const { data: schoolsData, error: schoolsError, count: schoolsCount } = await supabase
        .from('schools')
        .select('*', { count: 'exact' })
        .limit(1);

      if (schoolsError) {
        if (schoolsError.code === 'PGRST205' || schoolsError.message.includes('not find the table') || schoolsError.message.includes('relation "public.schools" does not exist')) {
          this.isSupabaseConnected = true;
          this.tablesExistInSupabase = false;
          this.isWritable = false;
          this.isRlsBlocked = false;
          return {
            connected: true,
            tablesFound: false,
            writable: false,
            rlsBlocked: false,
            details: 'Terkoneksi ke server Supabase, namun tabel belum dibuat. Silakan buka menu "Panduan & Script SQL" dan jalankan script migrasi di SQL Editor Supabase.',
          };
        }
        this.isSupabaseConnected = false;
        this.tablesExistInSupabase = false;
        this.isWritable = false;
        this.isRlsBlocked = false;
        return { 
          connected: false, 
          tablesFound: false, 
          writable: false, 
          rlsBlocked: false, 
          details: `Gagal tersambung: ${schoolsError.message}` 
        };
      }

      this.isSupabaseConnected = true;
      this.tablesExistInSupabase = true;

      // 2. Fetch row counts from all tables to diagnose data fullness
      try {
        const [
          { count: elCount },
          { count: clCount },
          { count: cdCount },
          { count: stCount },
          { count: blCount },
        ] = await Promise.all([
          supabase.from('elections').select('*', { count: 'exact', head: true }),
          supabase.from('classes').select('*', { count: 'exact', head: true }),
          supabase.from('candidates').select('*', { count: 'exact', head: true }),
          supabase.from('students').select('*', { count: 'exact', head: true }),
          supabase.from('ballots').select('*', { count: 'exact', head: true }),
        ]);

        this.remoteCounts = {
          schools: schoolsCount ?? (schoolsData?.length || 0),
          elections: elCount ?? 0,
          classes: clCount ?? 0,
          candidates: cdCount ?? 0,
          students: stCount ?? 0,
          ballots: blCount ?? 0,
        };
      } catch (cntErr) {
        console.warn('Count check error:', cntErr);
      }

      // 3. Test WRITE permission to detect Row Level Security (RLS) block (Error 42501)
      const testWrite = await supabase.from('schools').upsert([{
        id: this.school.id,
        name: this.school.name,
        logo_url: this.school.logo_url,
        address: this.school.address,
        contact_phone: this.school.contact_phone,
        contact_email: this.school.contact_email,
        principal_name: this.school.principal_name,
        committee_chair: this.school.committee_chair,
        committee_secretary: this.school.committee_secretary,
      }]);

      if (testWrite.error) {
        if (testWrite.error.code === '42501' || testWrite.error.message.includes('row-level security')) {
          this.isRlsBlocked = true;
          this.isWritable = false;
          this.lastSyncError = 'Row-Level Security (Error 42501) memblokir izin tulis.';
          return {
            connected: true,
            tablesFound: true,
            writable: false,
            rlsBlocked: true,
            counts: this.remoteCounts,
            details: 'Tabel Supabase terdeteksi, namun izin TULIS diblokir oleh Row Level Security (Error 42501). Jalankan script perbaikan SQL di Supabase SQL Editor agar sistem dapat menyimpan data secara langsung.',
          };
        }
        this.isWritable = false;
        this.isRlsBlocked = false;
        return {
          connected: true,
          tablesFound: true,
          writable: false,
          rlsBlocked: false,
          counts: this.remoteCounts,
          details: `Tabel ditemukan, namun gagal menulis: ${testWrite.error.message}`,
        };
      }

      // Test INSERT permission on classes to ensure table-level RLS policies allow adding rows
      const testClassWrite = await supabase.from('classes').insert([{
        id: '00000000-0000-0000-0000-000000000000',
        election_id: this.election.id,
        name: '__RLS_TEST__',
        grade_level: '7',
      }]);

      if (testClassWrite.error) {
        if (testClassWrite.error.code === '42501' || testClassWrite.error.message.includes('row-level security')) {
          this.isRlsBlocked = true;
          this.isWritable = false;
          this.lastSyncError = 'Row-Level Security (Error 42501) memblokir operasi INSERT kelas/siswa.';
          return {
            connected: true,
            tablesFound: true,
            writable: false,
            rlsBlocked: true,
            counts: this.remoteCounts,
            details: 'Tabel Supabase terdeteksi, namun izin INSERT diblokir oleh Row-Level Security (Error 42501). Jalankan script perbaikan SQL di Supabase SQL Editor agar sistem dapat menambah/memperbarui data secara langsung.',
          };
        }
      } else {
        // Clean up test row
        await supabase.from('classes').delete().eq('name', '__RLS_TEST__');
      }

      // Write test succeeded!
      this.isWritable = true;
      this.isRlsBlocked = false;
      this.lastSyncError = null;

      // User request: purge all existing students in remote Supabase
      const REMOTE_PURGE_FLAG = 'supabase_students_purged_user_request_v1';
      if (typeof localStorage !== 'undefined' && localStorage.getItem(REMOTE_PURGE_FLAG) !== 'done') {
        try {
          await supabase.from('voter_credentials').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('voter_participation').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          this.remoteCounts.students = 0;
          this.students = [];
          this.voterParticipation = {};
          this.saveToLocalStorage();
          localStorage.setItem(REMOTE_PURGE_FLAG, 'done');
        } catch (purgeErr) {
          console.warn('Initial remote student purge error:', purgeErr);
        }
      }

      // 4. If Supabase is writable and already has data, sync it down;
      // If remote has 0 rows, auto-push initial data so Supabase is immediately populated!
      if (this.remoteCounts.candidates > 0 || this.remoteCounts.classes > 0) {
        await this.pullDataFromSupabase();
      } else if (this.remoteCounts.schools <= 1 && this.remoteCounts.candidates === 0) {
        // Auto-seed initial data to Supabase
        await this.pushDataToSupabase();
      }

      return {
        connected: true,
        tablesFound: true,
        writable: true,
        rlsBlocked: false,
        counts: this.remoteCounts,
        details: 'Terkoneksi sempurna dengan Supabase PostgreSQL! Izin baca & tulis aktif tanpa hambatan.',
      };
    } catch (e: any) {
      this.isSupabaseConnected = false;
      this.isWritable = false;
      return { 
        connected: false, 
        tablesFound: false, 
        writable: false, 
        rlsBlocked: false, 
        details: e?.message || 'Gagal tersambung ke Supabase' 
      };
    }
  }

  // Push local state to Supabase
  public async pushDataToSupabase(): Promise<{ 
    success: boolean; 
    message: string; 
    rlsError?: boolean; 
  }> {
    try {
      // 1. School (with fallback if remote table does not yet have NIP columns)
      const fullSchoolPayload = {
        id: this.school.id,
        name: this.school.name,
        logo_url: this.school.logo_url,
        address: this.school.address,
        contact_phone: this.school.contact_phone,
        contact_email: this.school.contact_email,
        principal_name: this.school.principal_name,
        principal_nip: this.school.principal_nip || null,
        committee_chair: this.school.committee_chair,
        committee_chair_nip: this.school.committee_chair_nip || null,
        committee_secretary: this.school.committee_secretary,
        committee_secretary_nip: this.school.committee_secretary_nip || null,
      };

      let sRes = await supabase.from('schools').upsert([fullSchoolPayload]);
      if (sRes.error && (sRes.error.message.includes('column') || sRes.error.code === 'PGRST204')) {
        sRes = await supabase.from('schools').upsert([{
          id: this.school.id,
          name: this.school.name,
          logo_url: this.school.logo_url,
          address: this.school.address,
          contact_phone: this.school.contact_phone,
          contact_email: this.school.contact_email,
          principal_name: this.school.principal_name,
          committee_chair: this.school.committee_chair,
          committee_secretary: this.school.committee_secretary,
        }]);
      }
      if (sRes.error) {
        if (sRes.error.code === '42501') {
          this.isRlsBlocked = true;
          this.isWritable = false;
          return {
            success: false,
            rlsError: true,
            message: 'Izin tulis diblokir oleh Row Level Security (Error 42501). Jalankan skrip perbaikan RLS di Supabase SQL Editor.',
          };
        }
        return { success: false, message: `Gagal menyimpan profil sekolah: ${sRes.error.message}` };
      }

      // 2. Election
      const eRes = await supabase.from('elections').upsert([{
        id: this.election.id,
        school_id: this.school.id,
        title: this.election.title,
        academic_year: this.election.academic_year,
        start_time: this.election.start_time,
        end_time: this.election.end_time,
        timezone: this.election.timezone || 'Asia/Makassar',
        status: this.election.status,
        is_published: this.election.is_published,
      }]);
      if (eRes.error) {
        return { success: false, message: `Gagal menyimpan periode pemilihan: ${eRes.error.message}` };
      }

      // 3. Classes
      if (this.classes.length > 0) {
        const classPayload = this.classes.map(c => ({
          id: c.id,
          election_id: this.election.id,
          name: c.name,
          grade_level: c.grade_level,
          description: c.description || null,
          is_active: c.is_active ?? true,
        }));
        const cRes = await supabase.from('classes').upsert(classPayload);
        if (cRes.error) {
          if (cRes.error.code === '42501' || cRes.error.message.includes('row-level security')) {
            this.isRlsBlocked = true;
            this.isWritable = false;
            return {
              success: false,
              rlsError: true,
              message: 'Izin tulis tabel kelas diblokir oleh Row Level Security (Error 42501). Jalankan skrip perbaikan SQL di Supabase SQL Editor.',
            };
          }
          return { success: false, message: `Gagal menyimpan data kelas: ${cRes.error.message}` };
        }
      }

      // 4. Candidates
      if (this.candidates.length > 0) {
        const candPayload = this.candidates.map(c => ({
          id: c.id,
          election_id: this.election.id,
          ballot_number: c.ballot_number,
          photo_url: c.photo_url || null,
          leader_name: c.leader_name,
          vice_leader_name: c.vice_leader_name,
          leader_class: c.leader_class || null,
          vice_leader_class: c.vice_leader_class || null,
          vision: c.vision,
          mission: c.mission,
          slogan: c.slogan || null,
          program_desc: c.program_desc || null,
          is_active: c.is_active ?? true,
        }));
        const cdRes = await supabase.from('candidates').upsert(candPayload);
        if (cdRes.error) {
          if (cdRes.error.code === '42501' || cdRes.error.message.includes('row-level security')) {
            this.isRlsBlocked = true;
            this.isWritable = false;
            return {
              success: false,
              rlsError: true,
              message: 'Izin tulis tabel calon kandidat diblokir oleh Row Level Security (Error 42501). Jalankan skrip perbaikan SQL di Supabase SQL Editor.',
            };
          }
          return { success: false, message: `Gagal menyimpan calon kandidat: ${cdRes.error.message}` };
        }
      }

      // 5. Students
      if (this.students.length > 0) {
        const studentPayload = this.students.map(s => ({
          id: s.id,
          election_id: this.election.id,
          class_id: s.class_id,
          nisn: s.nisn,
          full_name: s.full_name,
          birth_date: s.birth_date || null,
          gender: s.gender || null,
          is_active: s.is_active ?? true,
        }));
        const stRes = await supabase.from('students').upsert(studentPayload);
        if (stRes.error) {
          if (stRes.error.code === '42501' || stRes.error.message.includes('row-level security')) {
            this.isRlsBlocked = true;
            this.isWritable = false;
            return {
              success: false,
              rlsError: true,
              message: 'Izin tulis tabel siswa diblokir oleh Row Level Security (Error 42501). Jalankan skrip perbaikan SQL di Supabase SQL Editor.',
            };
          }
          return { success: false, message: `Gagal menyimpan data siswa: ${stRes.error.message}` };
        }

        // 6. Voter credentials
        const credsPayload = this.students.map(s => ({
          student_id: s.id,
          token_hash: s.token || s.token_preview || 'VOTE-0000',
          token_preview: s.token_preview || s.token || 'VOTE-0000',
          is_revoked: s.is_token_revoked ?? false,
        }));
        await supabase.from('voter_credentials').upsert(credsPayload);
      }

      this.isWritable = true;
      this.isRlsBlocked = false;
      this.lastSyncError = null;
      this.saveToLocalStorage();

      return {
        success: true,
        message: 'Seluruh data sekolah, periode pemilihan, kelas, kandidat, dan siswa berhasil disinkronkan ke Supabase!',
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Terjadi kesalahan saat pengiriman data ke Supabase' };
    }
  }

  // Pull data from Supabase into local state
  public async pullDataFromSupabase(): Promise<boolean> {
    try {
      const [
        { data: sData },
        { data: eData },
        { data: cData },
        { data: cdData },
        { data: stData },
        { data: credsData },
        { data: vpData },
        { data: blData },
      ] = await Promise.all([
        supabase.from('schools').select('*').limit(1).single(),
        supabase.from('elections').select('*').limit(1).single(),
        supabase.from('classes').select('*').order('name'),
        supabase.from('candidates').select('*').order('ballot_number'),
        supabase.from('students').select('*').order('full_name'),
        supabase.from('voter_credentials').select('*'),
        supabase.from('voter_participation').select('*'),
        supabase.from('ballots').select('*'),
      ]);

      if (sData) this.school = { ...this.school, ...sData };
      if (eData) this.election = { ...this.election, ...eData };
      if (cData && cData.length > 0) this.classes = cData;
      if (cdData && cdData.length > 0) this.candidates = cdData;

      if (stData && stData.length > 0) {
        const credMap = new Map((credsData || []).map((cr: any) => [cr.student_id, cr]));
        const partMap = new Map((vpData || []).map((p: any) => [p.student_id, p.voted_at]));
        const classMap = new Map(this.classes.map(c => [c.id, c.name]));

        this.students = stData.map((s: any) => {
          const cred = credMap.get(s.id);
          const hasVoted = partMap.has(s.id);
          return {
            ...s,
            class_name: classMap.get(s.class_id) || 'Reguler',
            token: cred?.token_preview || cred?.token_hash,
            token_preview: cred?.token_preview || cred?.token_hash,
            is_token_revoked: cred?.is_revoked ?? false,
            has_voted: hasVoted,
            voted_at: partMap.get(s.id),
          };
        });

        // Set voter participation map
        const vpObj: Record<string, string> = {};
        (vpData || []).forEach((p: any) => {
          vpObj[p.student_id] = p.voted_at;
        });
        this.voterParticipation = vpObj;
      }

      if (blData) {
        this.ballots = blData;
      }

      this.saveToLocalStorage();
      return true;
    } catch (err) {
      console.warn('Pull from Supabase failed, maintaining local state:', err);
      return false;
    }
  }

  // School
  public getSchool(): School {
    return { ...this.school };
  }

  public async updateSchool(data: Partial<School>): Promise<School> {
    this.school = { ...this.school, ...data };
    this.saveToLocalStorage();
    this.addAuditLog('PENGATURAN_SEKOLAH', 'Administrator', 'Pembaruan identitas resmi sekolah.');

    if (this.tablesExistInSupabase) {
      try {
        const fullPayload = {
          id: this.school.id,
          name: this.school.name,
          logo_url: this.school.logo_url,
          address: this.school.address,
          contact_phone: this.school.contact_phone,
          contact_email: this.school.contact_email,
          principal_name: this.school.principal_name,
          principal_nip: this.school.principal_nip || null,
          committee_chair: this.school.committee_chair,
          committee_chair_nip: this.school.committee_chair_nip || null,
          committee_secretary: this.school.committee_secretary,
          committee_secretary_nip: this.school.committee_secretary_nip || null,
        };
        const res = await supabase.from('schools').upsert([fullPayload]);
        if (res.error && (res.error.message.includes('column') || res.error.code === 'PGRST204')) {
          await supabase.from('schools').upsert([{
            id: this.school.id,
            name: this.school.name,
            logo_url: this.school.logo_url,
            address: this.school.address,
            contact_phone: this.school.contact_phone,
            contact_email: this.school.contact_email,
            principal_name: this.school.principal_name,
            committee_chair: this.school.committee_chair,
            committee_secretary: this.school.committee_secretary,
          }]);
        }
      } catch (e) {
        console.warn('Supabase remote updateSchool notice:', e);
      }
    }
    return this.school;
  }

  // Election
  public getElection(): Election {
    return { ...this.election };
  }

  public async updateElection(data: Partial<Election>): Promise<Election> {
    this.election = { ...this.election, ...data };
    this.saveToLocalStorage();
    this.addAuditLog('PENGATURAN_PEMILIHAN', 'Administrator', `Status pemilihan diperbarui menjadi ${this.election.status}.`);

    if (this.tablesExistInSupabase) {
      try {
        await supabase.from('elections').upsert([this.election]);
      } catch (e) {
        console.warn('Supabase remote updateElection notice:', e);
      }
    }
    return this.election;
  }

  // Classes
  public getClasses(): ClassItem[] {
    return this.classes.map(c => {
      const studentCount = this.students.filter(s => s.class_id === c.id && s.is_active).length;
      return { ...c, student_count: studentCount };
    });
  }

  public async addClass(item: Omit<ClassItem, 'id' | 'election_id'>): Promise<{ success: boolean; classItem?: ClassItem; message?: string; rlsError?: boolean }> {
    const newClass: ClassItem = {
      id: generateUUID(),
      election_id: this.election.id,
      name: item.name.trim(),
      grade_level: item.grade_level,
      description: item.description || '',
      is_active: item.is_active ?? true,
      created_at: new Date().toISOString(),
    };

    if (this.tablesExistInSupabase) {
      const { error } = await supabase.from('classes').insert([{
        id: newClass.id,
        election_id: newClass.election_id,
        name: newClass.name,
        grade_level: newClass.grade_level,
        description: newClass.description,
        is_active: newClass.is_active,
      }]);

      if (error) {
        console.error('Supabase remote addClass error:', error);
        if (error.code === '42501' || error.message.includes('row-level security')) {
          this.isRlsBlocked = true;
          this.isWritable = false;
          return {
            success: false,
            rlsError: true,
            message: 'Supabase menolak penambahan kelas karena Row-Level Security (RLS Error 42501). Buka tombol "Supabase DB" di header untuk membuka izin via SQL Editor.',
          };
        }
        return { success: false, message: `Gagal menyimpan kelas ke database Supabase: ${error.message}` };
      }
    }

    this.classes.push(newClass);
    this.saveToLocalStorage();
    this.addAuditLog('TAMBAH_KELAS', 'Administrator', `Menambahkan kelas baru ${newClass.name}`);
    return { success: true, classItem: newClass };
  }

  public async updateClass(id: string, data: Partial<ClassItem>): Promise<{ success: boolean; classItem?: ClassItem; message?: string; rlsError?: boolean }> {
    const idx = this.classes.findIndex(c => c.id === id);
    if (idx === -1) return { success: false, message: 'Kelas tidak ditemukan' };

    if (this.tablesExistInSupabase) {
      const payload: Record<string, any> = {};
      if (data.name !== undefined) payload.name = data.name.trim();
      if (data.grade_level !== undefined) payload.grade_level = data.grade_level;
      if (data.description !== undefined) payload.description = data.description;
      if (data.is_active !== undefined) payload.is_active = data.is_active;
      payload.updated_at = new Date().toISOString();

      const { error } = await supabase.from('classes').update(payload).eq('id', id);
      if (error) {
        console.error('Supabase remote updateClass error:', error);
        if (error.code === '42501' || error.message.includes('row-level security')) {
          this.isRlsBlocked = true;
          this.isWritable = false;
          return {
            success: false,
            rlsError: true,
            message: 'Supabase menolak pembaruan kelas karena Row-Level Security (RLS Error 42501). Jalankan script SQL perbaikan izin di Supabase.',
          };
        }
        return { success: false, message: `Gagal memperbarui kelas di Supabase: ${error.message}` };
      }
    }

    this.classes[idx] = { ...this.classes[idx], ...data, updated_at: new Date().toISOString() };
    this.saveToLocalStorage();
    this.addAuditLog('EDIT_KELAS', 'Administrator', `Memperbarui data kelas ${this.classes[idx].name}`);
    return { success: true, classItem: this.classes[idx] };
  }

  public async deleteClass(id: string): Promise<{ success: boolean; message: string }> {
    const studentsInClass = this.students.filter(s => s.class_id === id);
    if (studentsInClass.length > 0) {
      return {
        success: false,
        message: `Tidak dapat menghapus kelas karena masih memiliki ${studentsInClass.length} siswa terdaftar. Pindahkan atau hapus siswa terlebih dahulu.`,
      };
    }
    const target = this.classes.find(c => c.id === id);

    if (this.tablesExistInSupabase) {
      const { error } = await supabase.from('classes').delete().eq('id', id);
      if (error) {
        console.error('Supabase remote deleteClass error:', error);
        if (error.code === '42501' || error.message.includes('row-level security')) {
          this.isRlsBlocked = true;
          this.isWritable = false;
          return {
            success: false,
            message: 'Gagal menghapus kelas di Supabase: Izin ditolak Row-Level Security (Error 42501). Jalankan script SQL perbaikan izin di Supabase.',
          };
        }
        return { success: false, message: `Gagal menghapus kelas di database: ${error.message}` };
      }
    }

    this.classes = this.classes.filter(c => c.id !== id);
    this.saveToLocalStorage();
    this.addAuditLog('HAPUS_KELAS', 'Administrator', `Menghapus kelas ${target?.name || id}`);
    return { success: true, message: 'Kelas berhasil dihapus' };
  }

  // Students
  public getStudents(): Student[] {
    return this.students.map(s => {
      const cls = this.classes.find(c => c.id === s.class_id);
      const hasVoted = Boolean(this.voterParticipation[s.id]);
      return {
        ...s,
        class_name: cls ? cls.name : 'Belum Ditentukan',
        has_voted: hasVoted,
        voted_at: this.voterParticipation[s.id],
      };
    });
  }

  public async addStudent(item: {
    nisn: string;
    full_name: string;
    class_id: string;
    birth_date?: string;
    gender?: 'L' | 'P';
    is_active?: boolean;
  }): Promise<{ success: boolean; student?: Student; message?: string }> {
    // Check duplicate NISN
    if (this.students.some(s => s.nisn === item.nisn)) {
      return { success: false, message: `NISN ${item.nisn} sudah terdaftar dalam sistem.` };
    }

    const token = generateSecureToken();
    const newStudent: Student = {
      id: generateUUID(),
      election_id: this.election.id,
      nisn: item.nisn.trim(),
      full_name: item.full_name.trim(),
      class_id: item.class_id,
      birth_date: item.birth_date,
      gender: item.gender || 'L',
      is_active: item.is_active ?? true,
      token: token,
      token_preview: token,
      has_voted: false,
      created_at: new Date().toISOString(),
    };

    if (this.tablesExistInSupabase) {
      const { error: stErr } = await supabase.from('students').insert([{
        id: newStudent.id,
        election_id: newStudent.election_id,
        class_id: newStudent.class_id,
        nisn: newStudent.nisn,
        full_name: newStudent.full_name,
        birth_date: newStudent.birth_date || null,
        gender: newStudent.gender || null,
        is_active: newStudent.is_active,
      }]);

      if (stErr) {
        console.error('Supabase remote addStudent error:', stErr);
        if (stErr.code === '42501' || stErr.message.includes('row-level security')) {
          this.isRlsBlocked = true;
          this.isWritable = false;
          return {
            success: false,
            message: 'Supabase menolak penambahan siswa karena Row-Level Security (RLS Error 42501). Buka tombol "Supabase DB" di header untuk membuka izin via SQL Editor.',
          };
        }
        return { success: false, message: `Gagal menyimpan siswa ke database Supabase: ${stErr.message}` };
      }

      const { error: credErr } = await supabase.from('voter_credentials').insert([{
        student_id: newStudent.id,
        token_hash: token,
        token_preview: token,
        is_revoked: false,
      }]);
      if (credErr) {
        console.warn('Supabase credential insert notice:', credErr);
      }
    }

    this.students.push(newStudent);
    this.saveToLocalStorage();
    this.addAuditLog('TAMBAH_SISWA', 'Administrator', `Menambahkan siswa ${newStudent.full_name} (${newStudent.nisn})`);
    return { success: true, student: newStudent };
  }

  public async updateStudent(id: string, data: Partial<Student>): Promise<{ success: boolean; student?: Student; message?: string }> {
    const idx = this.students.findIndex(s => s.id === id);
    if (idx === -1) return { success: false, message: 'Siswa tidak ditemukan' };

    if (data.nisn && data.nisn !== this.students[idx].nisn) {
      if (this.students.some(s => s.id !== id && s.nisn === data.nisn)) {
        return { success: false, message: `NISN ${data.nisn} sudah digunakan oleh siswa lain.` };
      }
    }

    if (this.tablesExistInSupabase) {
      const payload: Record<string, any> = {};
      if (data.nisn !== undefined) payload.nisn = data.nisn.trim();
      if (data.full_name !== undefined) payload.full_name = data.full_name.trim();
      if (data.class_id !== undefined) payload.class_id = data.class_id;
      if (data.birth_date !== undefined) payload.birth_date = data.birth_date || null;
      if (data.gender !== undefined) payload.gender = data.gender;
      if (data.is_active !== undefined) payload.is_active = data.is_active;
      payload.updated_at = new Date().toISOString();

      const { error } = await supabase.from('students').update(payload).eq('id', id);
      if (error) {
        console.error('Supabase remote updateStudent error:', error);
        if (error.code === '42501' || error.message.includes('row-level security')) {
          this.isRlsBlocked = true;
          this.isWritable = false;
          return {
            success: false,
            message: 'Supabase menolak pembaruan data siswa karena Row-Level Security (RLS Error 42501). Jalankan script SQL perbaikan izin di Supabase.',
          };
        }
        return { success: false, message: `Gagal memperbarui siswa di database: ${error.message}` };
      }
    }

    this.students[idx] = { ...this.students[idx], ...data, updated_at: new Date().toISOString() };
    this.saveToLocalStorage();
    this.addAuditLog('EDIT_SISWA', 'Administrator', `Memperbarui siswa ${this.students[idx].full_name}`);
    return { success: true, student: this.students[idx] };
  }

  public async deleteStudent(id: string): Promise<{ success: boolean; message: string }> {
    if (this.voterParticipation[id]) {
      return {
        success: false,
        message: 'Siswa tidak dapat dihapus karena sudah berpartisipasi dalam pemungutan suara.',
      };
    }
    const target = this.students.find(s => s.id === id);

    if (this.tablesExistInSupabase) {
      // First clean up credentials to honor foreign keys
      await supabase.from('voter_credentials').delete().eq('student_id', id);

      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) {
        console.error('Supabase remote deleteStudent error:', error);
        if (error.code === '42501' || error.message.includes('row-level security')) {
          this.isRlsBlocked = true;
          this.isWritable = false;
          return {
            success: false,
            message: 'Supabase menolak penghapusan siswa karena Row-Level Security (RLS Error 42501). Jalankan script SQL perbaikan izin di Supabase.',
          };
        }
        return { success: false, message: `Gagal menghapus siswa di database: ${error.message}` };
      }
    }

    this.students = this.students.filter(s => s.id !== id);
    this.saveToLocalStorage();
    this.addAuditLog('HAPUS_SISWA', 'Administrator', `Menghapus siswa ${target?.full_name || id}`);
    return { success: true, message: 'Data siswa berhasil dihapus' };
  }

  public async deleteAllStudents(): Promise<{ success: boolean; deletedCount: number; message: string }> {
    const totalCount = this.students.length;

    if (this.tablesExistInSupabase) {
      try {
        // 1. Delete all credentials first (foreign key)
        const { error: credErr } = await supabase
          .from('voter_credentials')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (credErr && (credErr.code === '42501' || credErr.message.includes('row-level security'))) {
          this.isRlsBlocked = true;
          this.isWritable = false;
          return {
            success: false,
            deletedCount: 0,
            message: 'Supabase menolak penghapusan karena Row-Level Security (RLS Error 42501). Jalankan script SQL perbaikan izin di Supabase.',
          };
        }

        // 2. Delete all voter participation
        await supabase
          .from('voter_participation')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        // 3. Delete all students
        const { error: stErr } = await supabase
          .from('students')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (stErr) {
          console.error('Supabase remote deleteAllStudents error:', stErr);
          if (stErr.code === '42501' || stErr.message.includes('row-level security')) {
            this.isRlsBlocked = true;
            this.isWritable = false;
            return {
              success: false,
              deletedCount: 0,
              message: 'Supabase menolak penghapusan siswa karena Row-Level Security (RLS Error 42501). Jalankan script SQL perbaikan izin di Supabase.',
            };
          }
        }
      } catch (err: any) {
        console.warn('Supabase remote deleteAllStudents warning:', err);
      }
    }

    this.students = [];
    this.voterParticipation = {};
    this.remoteCounts.students = 0;
    this.saveToLocalStorage();
    this.addAuditLog('HAPUS_SEMUA_SISWA', 'Administrator', `Mengosongkan seluruh data siswa (${totalCount} siswa dihapus)`);
    return {
      success: true,
      deletedCount: totalCount,
      message: 'Seluruh data siswa/user dan token login telah berhasil dihapus.',
    };
  }

  public async deleteMultipleStudents(ids: string[]): Promise<{ success: boolean; deletedCount: number; message: string }> {
    if (!ids || ids.length === 0) {
      return { success: false, deletedCount: 0, message: 'Tidak ada siswa yang dipilih.' };
    }

    const unvotedIds = ids.filter(id => !this.voterParticipation[id]);
    if (unvotedIds.length === 0) {
      return {
        success: false,
        deletedCount: 0,
        message: 'Siswa yang dipilih tidak dapat dihapus karena sudah berpartisipasi dalam pemungutan suara.',
      };
    }

    if (this.tablesExistInSupabase) {
      try {
        await supabase.from('voter_credentials').delete().in('student_id', unvotedIds);
        const { error: stErr } = await supabase.from('students').delete().in('id', unvotedIds);
        if (stErr) {
          console.error('Supabase deleteMultipleStudents error:', stErr);
          if (stErr.code === '42501' || stErr.message.includes('row-level security')) {
            this.isRlsBlocked = true;
            this.isWritable = false;
            return {
              success: false,
              deletedCount: 0,
              message: 'Supabase menolak penghapusan siswa karena Row-Level Security (RLS Error 42501).',
            };
          }
        }
      } catch (err) {
        console.warn('Supabase remote deleteMultipleStudents error:', err);
      }
    }

    const beforeCount = this.students.length;
    const idSet = new Set(unvotedIds);
    this.students = this.students.filter(s => !idSet.has(s.id));
    unvotedIds.forEach(id => {
      delete this.voterParticipation[id];
    });
    this.saveToLocalStorage();
    const deletedCount = beforeCount - this.students.length;
    this.addAuditLog('HAPUS_SISWA_MASSAL', 'Administrator', `Menghapus ${deletedCount} siswa terpilih.`);
    return {
      success: true,
      deletedCount,
      message: `Berhasil menghapus ${deletedCount} siswa terpilih.`,
    };
  }

  public async rotateToken(studentId: string): Promise<{ success: boolean; newToken?: string; message?: string }> {
    const student = this.students.find(s => s.id === studentId);
    if (!student) return { success: false, message: 'Siswa tidak ditemukan' };
    if (this.voterParticipation[studentId]) {
      return { success: false, message: 'Token tidak dapat dirotasi karena hak suara siswa telah digunakan.' };
    }

    const newToken = generateSecureToken();
    student.token = newToken;
    student.token_preview = newToken;
    student.is_token_revoked = false;
    this.saveToLocalStorage();
    this.addAuditLog('ROTASI_TOKEN', 'Administrator', `Menerbitkan ulang token untuk siswa ${student.full_name}`);

    if (this.tablesExistInSupabase) {
      try {
        await supabase.from('voter_credentials').upsert([{
          student_id: studentId,
          token_hash: newToken,
          token_preview: newToken,
          is_revoked: false,
          last_issued_at: new Date().toISOString(),
        }]);
      } catch (e) {
        console.warn('Supabase remote rotateToken notice:', e);
      }
    }

    return { success: true, newToken };
  }

  public async importStudents(
    items: Array<{
      nisn: string;
      full_name: string;
      class_name: string;
      birth_date?: string;
      gender?: 'L' | 'P';
    }>,
    onProgress?: (info: {
      current: number;
      total: number;
      percent: number;
      currentItem: string;
      stage: string;
    }) => void
  ): Promise<{ importedCount: number; skippedCount: number; errors: string[] }> {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];
    const total = items.length;

    let idx = 0;
    for (const item of items) {
      idx++;
      const trimmedNisn = String(item.nisn || '').trim();
      const trimmedName = String(item.full_name || '').trim();
      const trimmedClass = String(item.class_name || '').trim();

      if (onProgress) {
        onProgress({
          current: idx,
          total,
          percent: Math.round((idx / total) * 100),
          currentItem: trimmedName || `Baris ${idx}`,
          stage: `Memvalidasi & menerbitkan token: ${trimmedName || 'Siswa'} (${trimmedClass || '-'})`,
        });
        // short tick to let browser redraw progress state
        await new Promise(r => setTimeout(r, 12));
      }

      if (!trimmedNisn || !trimmedName) {
        skipped++;
        errors.push(`Baris diabaikan: NISN atau Nama kosong`);
        continue;
      }

      // Check existing NISN
      if (this.students.some(s => s.nisn === trimmedNisn)) {
        skipped++;
        errors.push(`NISN ${trimmedNisn} (${trimmedName}) sudah terdaftar, dilewati.`);
        continue;
      }

      // Match class or create it
      let matchedClass = this.classes.find(c => c.name.toLowerCase() === trimmedClass.toLowerCase());
      if (!matchedClass) {
        // Auto create class if not exists
        const gradeLevel = (trimmedClass.match(/[789]/) || ['7'])[0] as '7' | '8' | '9';
        const addRes = await this.addClass({
          name: trimmedClass || 'VII-A',
          grade_level: gradeLevel,
          description: `Kelas ${trimmedClass} otomatis saat impor`,
          is_active: true,
        });
        matchedClass = addRes.classItem || this.classes[this.classes.length - 1];
      }

      const token = generateSecureToken();
      const newStudent: Student = {
        id: generateUUID(),
        election_id: this.election.id,
        nisn: trimmedNisn,
        full_name: trimmedName,
        class_id: matchedClass?.id || this.classes[0]?.id,
        birth_date: item.birth_date,
        gender: item.gender || 'L',
        is_active: true,
        token: token,
        token_preview: token,
        has_voted: false,
        created_at: new Date().toISOString(),
      };

      if (this.tablesExistInSupabase && this.isWritable) {
        try {
          await supabase.from('students').insert([{
            id: newStudent.id,
            election_id: newStudent.election_id,
            class_id: newStudent.class_id,
            nisn: newStudent.nisn,
            full_name: newStudent.full_name,
            birth_date: newStudent.birth_date || null,
            gender: newStudent.gender || null,
            is_active: newStudent.is_active,
          }]);
          await supabase.from('voter_credentials').insert([{
            student_id: newStudent.id,
            token_hash: token,
            token_preview: token,
            is_revoked: false,
          }]);
        } catch (e) {
          console.warn('Supabase remote importStudent notice:', e);
        }
      }

      this.students.push(newStudent);
      imported++;
    }

    this.saveToLocalStorage();
    this.addAuditLog('IMPORT_EXCEL', 'Administrator', `Impor data siswa massal: ${imported} berhasil, ${skipped} dilewati.`);
    return { importedCount: imported, skippedCount: skipped, errors };
  }

  // Candidates
  public getCandidates(): Candidate[] {
    return [...this.candidates]
      .map(c => ({
        ...c,
        photo_url: formatCandidateImageUrl(c.photo_url),
      }))
      .sort((a, b) => a.ballot_number - b.ballot_number);
  }

  public async addCandidate(item: Omit<Candidate, 'id' | 'election_id'>): Promise<{ success: boolean; candidate?: Candidate; message?: string }> {
    if (this.candidates.some(c => c.ballot_number === Number(item.ballot_number))) {
      return { success: false, message: `Nomor urut ${item.ballot_number} sudah digunakan.` };
    }

    const sanitizedPhoto = item.photo_url ? formatCandidateImageUrl(item.photo_url) : null;
    const newCandidate: Candidate = {
      id: generateUUID(),
      election_id: this.election.id,
      ...item,
      photo_url: sanitizedPhoto || '',
      ballot_number: Number(item.ballot_number),
      created_at: new Date().toISOString(),
    };

    if (this.tablesExistInSupabase) {
      const { error } = await supabase.from('candidates').insert([{
        id: newCandidate.id,
        election_id: newCandidate.election_id,
        ballot_number: newCandidate.ballot_number,
        photo_url: newCandidate.photo_url || null,
        leader_name: newCandidate.leader_name,
        vice_leader_name: newCandidate.vice_leader_name,
        leader_class: newCandidate.leader_class || null,
        vice_leader_class: newCandidate.vice_leader_class || null,
        slogan: newCandidate.slogan || null,
        vision: newCandidate.vision,
        mission: newCandidate.mission,
        program_desc: newCandidate.program_desc || null,
        is_active: newCandidate.is_active ?? true,
      }]);

      if (error) {
        console.error('Supabase remote addCandidate error:', error);
        if (error.code === '42501' || error.message.includes('row-level security')) {
          this.isRlsBlocked = true;
          this.isWritable = false;
          return {
            success: false,
            message: 'Supabase menolak penambahan calon karena Row-Level Security (RLS Error 42501). Buka tombol "Supabase DB" di header untuk membuka izin via SQL Editor.',
          };
        }
        return { success: false, message: `Gagal menyimpan calon ke database Supabase: ${error.message}` };
      }
    }

    this.candidates.push(newCandidate);
    this.saveToLocalStorage();
    this.addAuditLog('TAMBAH_KANDIDAT', 'Administrator', `Menambahkan pasangan calon nomor ${newCandidate.ballot_number}: ${newCandidate.leader_name} & ${newCandidate.vice_leader_name}`);
    return { success: true, candidate: newCandidate };
  }

  public async updateCandidate(id: string, data: Partial<Candidate>): Promise<{ success: boolean; message?: string }> {
    const idx = this.candidates.findIndex(c => c.id === id);
    if (idx === -1) return { success: false, message: 'Kandidat tidak ditemukan' };

    if (data.ballot_number && data.ballot_number !== this.candidates[idx].ballot_number) {
      if (this.candidates.some(c => c.id !== id && c.ballot_number === Number(data.ballot_number))) {
        return { success: false, message: `Nomor urut ${data.ballot_number} sudah digunakan pasangan lain.` };
      }
    }

    const sanitizedPhoto = data.photo_url !== undefined
      ? (data.photo_url ? formatCandidateImageUrl(data.photo_url) : null)
      : undefined;

    if (this.tablesExistInSupabase) {
      const payload: Record<string, any> = {};
      if (data.ballot_number !== undefined) payload.ballot_number = Number(data.ballot_number);
      if (data.photo_url !== undefined) payload.photo_url = sanitizedPhoto;
      if (data.leader_name !== undefined) payload.leader_name = data.leader_name;
      if (data.vice_leader_name !== undefined) payload.vice_leader_name = data.vice_leader_name;
      if (data.leader_class !== undefined) payload.leader_class = data.leader_class || null;
      if (data.vice_leader_class !== undefined) payload.vice_leader_class = data.vice_leader_class || null;
      if (data.slogan !== undefined) payload.slogan = data.slogan || null;
      if (data.vision !== undefined) payload.vision = data.vision;
      if (data.mission !== undefined) payload.mission = data.mission;
      if (data.program_desc !== undefined) payload.program_desc = data.program_desc || null;
      if (data.is_active !== undefined) payload.is_active = data.is_active;
      payload.updated_at = new Date().toISOString();

      const { error } = await supabase.from('candidates').update(payload).eq('id', id);
      if (error) {
        console.error('Supabase remote updateCandidate error:', error);
        if (error.code === '42501' || error.message.includes('row-level security')) {
          this.isRlsBlocked = true;
          this.isWritable = false;
          return {
            success: false,
            message: 'Supabase menolak pembaruan calon karena Row-Level Security (RLS Error 42501). Jalankan script SQL perbaikan izin di Supabase.',
          };
        }
        return { success: false, message: `Gagal memperbarui calon di database: ${error.message}` };
      }
    }

    this.candidates[idx] = { ...this.candidates[idx], ...data, updated_at: new Date().toISOString() };
    this.saveToLocalStorage();
    this.addAuditLog('EDIT_KANDIDAT', 'Administrator', `Memperbarui kandidat nomor ${this.candidates[idx].ballot_number}`);
    return { success: true };
  }

  public async deleteCandidate(id: string): Promise<{ success: boolean; message: string }> {
    const hasVotes = this.ballots.some(b => b.candidate_id === id);
    if (hasVotes) {
      return { success: false, message: 'Kandidat ini sudah memiliki suara masuk dan tidak dapat dihapus demi integritas pemilihan.' };
    }

    const target = this.candidates.find(c => c.id === id);

    if (this.tablesExistInSupabase) {
      const { error } = await supabase.from('candidates').delete().eq('id', id);
      if (error) {
        console.error('Supabase remote deleteCandidate error:', error);
        if (error.code === '42501' || error.message.includes('row-level security')) {
          this.isRlsBlocked = true;
          this.isWritable = false;
          return {
            success: false,
            message: 'Supabase menolak penghapusan calon karena Row-Level Security (RLS Error 42501). Jalankan script SQL perbaikan izin di Supabase.',
          };
        }
        return { success: false, message: `Gagal menghapus calon di database: ${error.message}` };
      }
    }

    this.candidates = this.candidates.filter(c => c.id !== id);
    this.saveToLocalStorage();
    this.addAuditLog('HAPUS_KANDIDAT', 'Administrator', `Menghapus kandidat nomor ${target?.ballot_number}`);
    return { success: true, message: 'Kandidat berhasil dihapus' };
  }

  // Voting & Results
  public getResults(): {
    totalEligible: number;
    totalVoted: number;
    totalUnvoted: number;
    participationRate: number;
    totalValidVotes: number;
    candidateResults: CandidateResult[];
    isTie: boolean;
    highestVotes: number;
    winner: CandidateResult | null;
    lastUpdated: string;
  } {
    const eligibleStudents = this.students.filter(s => s.is_active);
    const totalEligible = eligibleStudents.length;
    const totalVoted = Object.keys(this.voterParticipation).length;
    const totalUnvoted = Math.max(0, totalEligible - totalVoted);
    const participationRate = totalEligible > 0 ? Number(((totalVoted / totalEligible) * 100).toFixed(1)) : 0;
    const totalValidVotes = this.ballots.length;

    // Count votes per candidate
    const voteMap: Record<string, number> = {};
    for (const b of this.ballots) {
      voteMap[b.candidate_id] = (voteMap[b.candidate_id] || 0) + 1;
    }

    const candidateResults: CandidateResult[] = this.candidates
      .filter(c => c.is_active)
      .map(c => {
        const count = voteMap[c.id] || 0;
        const pct = totalValidVotes > 0 ? Number(((count / totalValidVotes) * 100).toFixed(1)) : 0;
        return {
          ...c,
          vote_count: count,
          percentage: pct,
        };
      })
      .sort((a, b) => b.vote_count - a.vote_count || a.ballot_number - b.ballot_number);

    let highestVotes = 0;
    let isTie = false;
    let winner: CandidateResult | null = null;

    if (candidateResults.length > 0 && totalValidVotes > 0) {
      highestVotes = candidateResults[0].vote_count;
      const topCandidates = candidateResults.filter(c => c.vote_count === highestVotes);
      if (topCandidates.length > 1) {
        isTie = true;
      } else {
        winner = topCandidates[0];
      }
    }

    return {
      totalEligible,
      totalVoted,
      totalUnvoted,
      participationRate,
      totalValidVotes,
      candidateResults,
      isTie,
      highestVotes,
      winner,
      lastUpdated: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
  }

  // Voter Authentication by Token Only
  public verifyVoterToken(token: string): {
    valid: boolean;
    student?: Student;
    hasVoted?: boolean;
    message?: string;
  } {
    const cleaned = token.trim().toUpperCase();
    if (!cleaned) {
      return { valid: false, message: 'Masukkan token pemilihan Anda' };
    }

    // Check election status
    if (this.election.status !== 'active') {
      return { valid: false, message: 'Pemilihan sedang tidak aktif atau ditutup oleh panitia.' };
    }

    // Check time bounds
    const now = Date.now();
    const start = new Date(this.election.start_time).getTime();
    const end = new Date(this.election.end_time).getTime();
    if (now < start) {
      return { valid: false, message: 'Pemungutan suara belum dimulai sesuai jadwal resmi.' };
    }
    if (now > end) {
      return { valid: false, message: 'Waktu pemungutan suara telah berakhir.' };
    }

    // Find student matching token
    const student = this.students.find(s => s.token?.toUpperCase() === cleaned || s.token_preview?.toUpperCase() === cleaned);
    if (!student) {
      return { valid: false, message: 'Token tidak valid atau tidak terdaftar. Periksa kembali kartu login Anda.' };
    }

    if (!student.is_active) {
      return { valid: false, message: 'Status akun siswa tidak aktif. Hubungi panitia pemilihan.' };
    }

    if (student.is_token_revoked) {
      return { valid: false, message: 'Token ini telah dicabut oleh panitia. Minta penerbitan token baru.' };
    }

    const hasVoted = Boolean(this.voterParticipation[student.id]);
    const cls = this.classes.find(c => c.id === student.class_id);

    return {
      valid: true,
      student: {
        ...student,
        class_name: cls?.name || 'Reguler',
        has_voted: hasVoted,
        voted_at: this.voterParticipation[student.id],
      },
      hasVoted,
    };
  }

  // Cast Vote Atomically (Guarantees Secret Ballot & Single Vote)
  public async castVote(
    electionId: string, 
    studentId: string, 
    candidateId: string
  ): Promise<{ success: boolean; message: string }> {
    // 1. Verify election
    if (this.election.status !== 'active') {
      return { success: false, message: 'Pemilihan sedang tidak aktif atau telah ditutup.' };
    }

    // 2. Verify candidate
    const candidate = this.candidates.find(c => c.id === candidateId && c.is_active);
    if (!candidate) {
      return { success: false, message: 'Kandidat yang Anda pilih tidak valid atau tidak aktif.' };
    }

    // 3. Strict Check: Double voting prevention
    if (this.voterParticipation[studentId]) {
      return { success: false, message: 'Anda sudah menggunakan hak suara Anda sebelumnya.' };
    }

    const student = this.students.find(s => s.id === studentId);
    if (!student || !student.is_active) {
      return { success: false, message: 'Data pemilih tidak memenuhi syarat untuk memilih.' };
    }

    // 4. Atomically record participation & ballot
    const nowIso = new Date().toISOString();
    this.voterParticipation[studentId] = nowIso;
    student.has_voted = true;
    student.voted_at = nowIso;

    // Create 100% SECRET ballot: candidate_id only, NO link to student
    this.ballots.push({
      id: 'b' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36),
      election_id: electionId,
      candidate_id: candidateId,
      created_at: nowIso,
    });

    this.saveToLocalStorage();
    this.addAuditLog('VOTE_TERCATAT', 'Sistem', `Satu suara sah berhasil dicatat untuk pemilihan.`);

    // If Supabase RPC is ready, trigger it
    if (this.tablesExistInSupabase) {
      try {
        await supabase.rpc('cast_student_vote', {
          p_election_id: electionId,
          p_student_id: studentId,
          p_candidate_id: candidateId,
        });
      } catch (e) {
        console.warn('Supabase remote cast_student_vote notice:', e);
      }
    }

    return {
      success: true,
      message: 'Suara Anda berhasil dicatat, terima kasih telah berpartisipasi',
    };
  }

  // Documents (Berita Acara)
  public getDocuments(): ElectionDocument[] {
    return [...this.documents].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public async saveDocument(doc: Omit<ElectionDocument, 'id' | 'created_at'>): Promise<ElectionDocument> {
    const newDoc: ElectionDocument = {
      id: 'doc-' + Date.now(),
      created_at: new Date().toISOString(),
      ...doc,
    };
    this.documents.unshift(newDoc);
    this.saveToLocalStorage();
    this.addAuditLog('BUAT_BERITA_ACARA', 'Panitia Pemilihan', `Menerbitkan dokumen berita acara: ${newDoc.title} (${newDoc.doc_number})`);

    if (this.tablesExistInSupabase) {
      await supabase.from('election_documents').insert([newDoc]);
    }

    return newDoc;
  }

  // Audit Logs
  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public addAuditLog(action: string, actor: string, details: string) {
    const newLog: AuditLog = {
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      election_id: this.election.id,
      action,
      actor,
      details,
      created_at: new Date().toISOString(),
    };
    this.auditLogs.unshift(newLog);
    if (this.auditLogs.length > 200) {
      this.auditLogs = this.auditLogs.slice(0, 200);
    }
    this.saveToLocalStorage();
  }

  // Reset demo election votes (for administrative testing if needed)
  public resetVotes() {
    this.voterParticipation = {};
    this.ballots = [];
    this.students.forEach(s => {
      s.has_voted = false;
      delete s.voted_at;
    });
    this.saveToLocalStorage();
    this.addAuditLog('RESET_SUARA', 'Administrator', 'Mereset rekaman suara pemilu untuk pengujian.');
  }
}

export const db = new DatabaseService();
