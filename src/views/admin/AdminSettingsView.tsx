import React, { useState } from 'react';
import { 
  Settings, 
  School as SchoolIcon, 
  Calendar, 
  Lock, 
  Database, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  ShieldAlert,
  RotateCcw,
  Sparkles,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  AlertTriangle
} from 'lucide-react';
import { School, Election, ElectionStatus } from '../../types';
import { db } from '../../services/db';
import { ConfirmModal } from '../../components/common/ConfirmModal';

interface Props {
  school: School;
  election: Election;
  onUpdateSchool: (s: School) => void;
  onUpdateElection: (e: Election) => void;
  onOpenSqlModal: () => void;
}

export const AdminSettingsView: React.FC<Props> = ({
  school,
  election,
  onUpdateSchool,
  onUpdateElection,
  onOpenSqlModal,
}) => {
  // Section A: School identity
  const [schoolForm, setSchoolForm] = useState<School>({ ...school });

  // Section B: Election period & schedule
  const [electionForm, setElectionForm] = useState<Election>({ ...election });

  // Reset votes confirm modal state
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Section D: Admin Credentials
  const [adminEmail, setAdminEmail] = useState('admin@smpn1sukamulia.sch.id');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Supabase Diagnostics & Synchronization State
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    tablesFound: boolean;
    writable: boolean;
    rlsBlocked: boolean;
    details: string;
    counts?: any;
  } | null>(null);
  const [isCheckingDb, setIsCheckingDb] = useState(false);
  const [isSyncingDb, setIsSyncingDb] = useState(false);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  React.useEffect(() => {
    handleCheckDb();
  }, []);

  const handleCheckDb = async () => {
    setIsCheckingDb(true);
    try {
      const res = await db.checkSupabase();
      setDbStatus(res);
    } catch (err: any) {
      console.warn('DB check error', err);
    } finally {
      setIsCheckingDb(false);
    }
  };

  const handlePushToSupabase = async () => {
    setIsSyncingDb(true);
    try {
      const res = await db.pushDataToSupabase();
      if (res.success) {
        showNotification('success', res.message);
        await handleCheckDb();
      } else {
        showNotification('error', res.message);
      }
    } catch (err: any) {
      showNotification('error', err?.message || 'Gagal sinkronisasi data');
    } finally {
      setIsSyncingDb(false);
    }
  };

  const handlePullFromSupabase = async () => {
    setIsSyncingDb(true);
    try {
      const ok = await db.pullDataFromSupabase();
      if (ok) {
        onUpdateSchool(db.getSchool());
        onUpdateElection(db.getElection());
        showNotification('success', 'Data terbaru dari Supabase berhasil ditarik ke aplikasi!');
        await handleCheckDb();
      } else {
        showNotification('error', 'Gagal menarik data dari Supabase.');
      }
    } catch (err: any) {
      showNotification('error', err?.message || 'Gagal menarik data');
    } finally {
      setIsSyncingDb(false);
    }
  };

  const handleSaveSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await db.updateSchool(schoolForm);
      onUpdateSchool(updated);
      showNotification('success', 'Identitas resmi sekolah berhasil diperbarui!');
    } catch (err: any) {
      showNotification('error', 'Gagal memperbarui identitas sekolah');
    }
  };

  const handleSaveElection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await db.updateElection(electionForm);
      onUpdateElection(updated);
      showNotification('success', 'Konfigurasi periode dan jadwal pemilihan berhasil disimpan!');
    } catch (err: any) {
      showNotification('error', 'Gagal menyimpan konfigurasi pemilihan');
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showNotification('error', 'Konfirmasi kata sandi baru tidak cocok!');
      return;
    }
    if (newPassword.length < 6) {
      showNotification('error', 'Kata sandi minimal 6 karakter.');
      return;
    }

    db.addAuditLog('GANTI_PASSWORD_ADMIN', 'Administrator', 'Pembaruan kata sandi akun administrator.');
    showNotification('success', 'Kata sandi akun administrator berhasil diperbarui!');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleOpenResetConfirm = () => {
    setIsResetConfirmOpen(true);
  };

  const handleExecuteResetVotes = () => {
    db.resetVotes();
    showNotification('success', 'Seluruh rekaman suara uji coba berhasil direset.');
    setIsResetConfirmOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Pengaturan Sistem & Konfigurasi
        </h2>
        <p className="text-xs text-slate-500">
          Kelola profil sekolah, jadwal pemilihan, akun admin, serta status database Supabase.
        </p>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center justify-between gap-3 shadow-xs animate-fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Grid Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* BAGIAN A: IDENTITAS SEKOLAH */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <SchoolIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                Identitas Resmi Sekolah
              </h3>
              <p className="text-[11px] text-slate-500">
                Data resmi yang ditampilkan di header, kartu login, dan berita acara PDF
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveSchool} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Sekolah:</label>
              <input
                type="text"
                required
                value={schoolForm.name}
                onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Logo Sekolah (Path/URL):</label>
              <div className="flex items-center gap-3">
                <img
                  src={schoolForm.logo_url || '/logo-smpn1sukamulia.png'}
                  alt="Logo"
                  className="w-12 h-12 object-contain rounded-xl bg-slate-100 p-1 border border-slate-200 shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo-smpn1sukamulia.png';
                  }}
                />
                <input
                  type="text"
                  value={schoolForm.logo_url}
                  onChange={(e) => setSchoolForm({ ...schoolForm, logo_url: e.target.value })}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition text-slate-800 font-mono text-[11px]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap:</label>
              <textarea
                rows={2}
                value={schoolForm.address}
                onChange={(e) => setSchoolForm({ ...schoolForm, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition text-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Telepon / Kontak:</label>
                <input
                  type="text"
                  value={schoolForm.contact_phone}
                  onChange={(e) => setSchoolForm({ ...schoolForm, contact_phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition text-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Resmi:</label>
                <input
                  type="email"
                  value={schoolForm.contact_email}
                  onChange={(e) => setSchoolForm({ ...schoolForm, contact_email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Kepala Sekolah:</label>
              <input
                type="text"
                value={schoolForm.principal_name}
                onChange={(e) => setSchoolForm({ ...schoolForm, principal_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition text-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ketua Panitia:</label>
                <input
                  type="text"
                  value={schoolForm.committee_chair}
                  onChange={(e) => setSchoolForm({ ...schoolForm, committee_chair: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition text-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Sekretaris Panitia:</label>
                <input
                  type="text"
                  value={schoolForm.committee_secretary}
                  onChange={(e) => setSchoolForm({ ...schoolForm, committee_secretary: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition text-slate-800"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl transition shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Identitas Sekolah</span>
              </button>
            </div>
          </form>
        </div>

        {/* BAGIAN B: PERIODE & JADWAL PEMILIHAN */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                Periode & Jadwal Pemilihan
              </h3>
              <p className="text-[11px] text-slate-500">
                Pengaturan tanggal, waktu, zona waktu WITA, dan status voting
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveElection} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Pemilihan:</label>
              <input
                type="text"
                required
                value={electionForm.title}
                onChange={(e) => setElectionForm({ ...electionForm, title: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition text-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tahun Ajaran:</label>
                <input
                  type="text"
                  required
                  value={electionForm.academic_year}
                  onChange={(e) => setElectionForm({ ...electionForm, academic_year: e.target.value })}
                  placeholder="2026/2027"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Zona Waktu:</label>
                <input
                  type="text"
                  disabled
                  value={`${electionForm.timezone || 'Asia/Makassar'} (WITA)`}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Status Pemilihan:</label>
              <select
                value={electionForm.status}
                onChange={(e) => setElectionForm({ ...electionForm, status: e.target.value as ElectionStatus })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-emerald-600"
              >
                <option value="active">Aktif (Siswa Dapat Memberikan Suara)</option>
                <option value="paused">Ditunda / Terkunci Sementara</option>
                <option value="closed">Ditutup Resmi</option>
                <option value="draft">Draft (Persiapan)</option>
              </select>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 block">Jadwal Mulai & Berakhir:</span>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div>
                  <span className="block text-slate-400">Waktu Mulai:</span>
                  <span className="font-semibold text-slate-800">{new Date(electionForm.start_time).toLocaleString('id-ID')}</span>
                </div>
                <div>
                  <span className="block text-slate-400">Waktu Selesai:</span>
                  <span className="font-semibold text-slate-800">{new Date(electionForm.end_time).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl transition shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Jadwal Pemilihan</span>
              </button>
            </div>
          </form>

          {/* Danger Zone: Reset Votes */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="font-bold text-rose-700 text-xs mb-1 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Zona Pengujian Administratif</span>
            </h4>
            <p className="text-[11px] text-slate-500 mb-2">
              Reset rekaman suara pemilu jika Anda sedang dalam tahap simulasi / gladi bersih pemilihan.
            </p>
            <button
              onClick={handleOpenResetConfirm}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs border border-rose-200 transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span>Reset Seluruh Suara Uji Coba</span>
            </button>
          </div>
        </div>

        {/* BAGIAN D: KREDENSIAL ADMINISTRATOR */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                Kredensial Akun Administrator
              </h3>
              <p className="text-[11px] text-slate-500">
                Pembaruan email dan kata sandi login panitia pemilihan
              </p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Login Admin:</label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Kata Sandi Lama:</label>
              <input
                type="password"
                required
                placeholder="Kata sandi saat ini"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition text-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kata Sandi Baru:</label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Konfirmasi Kata Sandi:</label>
                <input
                  type="password"
                  required
                  placeholder="Ulangi kata sandi baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition text-slate-800"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 bg-purple-700 hover:bg-purple-800 text-white font-bold px-4 py-2 rounded-xl transition shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Perubahan Kata Sandi</span>
              </button>
            </div>
          </form>
        </div>

        {/* BAGIAN E: SUPABASE DATABASE STATUS & DIAGNOSTICS */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  Pusat Integrasi Database Supabase
                </h3>
                <p className="text-[11px] text-slate-500">
                  PostgreSQL, Row Level Security, RPC & Sinkronisasi
                </p>
              </div>
            </div>

            <button
              onClick={handleCheckDb}
              disabled={isCheckingDb}
              title="Periksa Ulang Status Koneksi & Izin Tulis"
              className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isCheckingDb ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Project URL */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Project Endpoint:</span>
                <span className="font-mono text-[11px] text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded font-bold">
                  phqkeaqsfmnlfpxwepfo
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono truncate">
                https://phqkeaqsfmnlfpxwepfo.supabase.co
              </p>
            </div>

            {/* Diagnostic Badges */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Connection Status */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-bold text-slate-900 text-xs">Koneksi API:</span>
                </div>
                <p className="text-emerald-900 font-semibold text-[11px]">Terhubung (Online)</p>
              </div>

              {/* RLS / Write Status */}
              <div className={`p-3 rounded-xl border ${
                dbStatus?.writable
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : dbStatus?.rlsBlocked
                  ? 'bg-amber-50 border-amber-300'
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    dbStatus?.writable 
                      ? 'bg-emerald-500' 
                      : dbStatus?.rlsBlocked
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-slate-400'
                  }`}></span>
                  <span className="font-bold text-slate-900 text-xs">Izin Tulis (RLS):</span>
                </div>
                <p className={`font-semibold text-[11px] ${
                  dbStatus?.writable 
                    ? 'text-emerald-900' 
                    : dbStatus?.rlsBlocked
                    ? 'text-amber-900'
                    : 'text-slate-600'
                }`}>
                  {dbStatus?.writable 
                    ? 'Aktif (Dapat Menulis)' 
                    : dbStatus?.rlsBlocked
                    ? 'Diblokir RLS (Error 42501)'
                    : 'Memeriksa...'}
                </p>
              </div>
            </div>

            {/* Diagnostic Alert if RLS Blocked */}
            {dbStatus?.rlsBlocked && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl text-amber-950 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[11px]">Tabel Supabase Kosong / Terkunci RLS</p>
                    <p className="text-[11px] text-amber-900 leading-relaxed mt-0.5">
                      Supabase menolak izin tulis karena kebijakan Row-Level Security (Error 42501). Jalankan script SQL 1-klik untuk membuka izin dan menginput data awal secara otomatis.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Table Row Counters */}
            {dbStatus?.counts && (
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-600 font-bold mb-1">
                  <span>Data Tersimpan di Supabase:</span>
                  <span className="text-[10px] text-slate-400">PostgreSQL</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 block">Kelas</span>
                    <span className="font-mono font-bold text-slate-800">{dbStatus.counts.classes} baris</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 block">Kandidat</span>
                    <span className="font-mono font-bold text-slate-800">{dbStatus.counts.candidates} baris</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 block">Siswa</span>
                    <span className="font-mono font-bold text-slate-800">{dbStatus.counts.students} baris</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                onClick={onOpenSqlModal}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition shadow-sm"
              >
                <Database className="w-3.5 h-3.5 text-emerald-300" />
                <span>Buka Script SQL & Panduan</span>
              </button>

              <button
                onClick={handlePushToSupabase}
                disabled={isSyncingDb}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs transition shadow-sm disabled:opacity-50"
              >
                <UploadCloud className={`w-3.5 h-3.5 ${isSyncingDb ? 'animate-spin' : ''}`} />
                <span>{isSyncingDb ? 'Mengirim...' : 'Kirim Data ke Supabase'}</span>
              </button>
            </div>

            <button
              onClick={handlePullFromSupabase}
              disabled={isSyncingDb}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition disabled:opacity-50"
            >
              <DownloadCloud className="w-3.5 h-3.5 text-slate-500" />
              <span>Tarik Data Terbaru dari Supabase</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reset Votes Confirm Modal */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        title="Reset Seluruh Suara Uji Coba"
        message="PERINGATAN: Apakah Anda yakin ingin mereset seluruh data suara pemilih dan surat suara? Pilihan ini hanya diperuntukkan untuk simulasi / gladi bersih sebelum hari pemilihan resmi."
        confirmText="Ya, Reset Seluruh Suara"
        cancelText="Batal"
        variant="danger"
        onConfirm={handleExecuteResetVotes}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
};
