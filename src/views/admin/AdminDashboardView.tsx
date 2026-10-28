import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Landmark, 
  UserCheck, 
  CheckCircle2, 
  Clock, 
  Percent, 
  Vote, 
  TrendingUp, 
  ArrowRight, 
  RefreshCw,
  AlertCircle,
  FileText,
  Calendar,
  Database
} from 'lucide-react';
import { School, Election, CandidateResult, AuditLog } from '../../types';
import { db } from '../../services/db';
import { AdminTab } from '../../components/layout/Sidebar';

interface Props {
  school: School;
  election: Election;
  onNavigateTab: (tab: AdminTab) => void;
  onOpenSqlModal: () => void;
}

export const AdminDashboardView: React.FC<Props> = ({
  school,
  election,
  onNavigateTab,
  onOpenSqlModal,
}) => {
  const [stats, setStats] = useState(db.getResults());
  const [classesCount, setClassesCount] = useState(0);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = () => {
    setIsRefreshing(true);
    setStats(db.getResults());
    setClassesCount(db.getClasses().length);
    setAuditLogs(db.getAuditLogs().slice(0, 5));
    setTimeout(() => setIsRefreshing(false), 300);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000); // 5s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const getElectionTimingStatus = () => {
    const now = Date.now();
    const start = new Date(election.start_time).getTime();
    const end = new Date(election.end_time).getTime();

    if (now < start) {
      return { label: 'Belum Dimulai', color: 'bg-amber-100 text-amber-800 border-amber-300' };
    }
    if (now > end) {
      return { label: 'Pemungutan Suara Berakhir', color: 'bg-slate-100 text-slate-800 border-slate-300' };
    }
    return { label: 'Sedang Berlangsung', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  };

  const timingStatus = getElectionTimingStatus();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-10 translate-y-10 pointer-events-none">
          <Vote className="w-80 h-80" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold mb-3 border border-white/20">
              <Calendar className="w-3.5 h-3.5" />
              <span>Periode Akademik {election.academic_year}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Dashboard E-Voting OSIS
            </h2>
            <p className="text-sm text-emerald-100/90 mt-1 max-w-xl">
              Selamat datang di pusat kendali pemilihan {school.name}. Pantau partisipasi siswa, keabsahan suara, dan hasil pemilihan secara langsung dan aman.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={refreshData}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition border border-white/20 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Segarkan Data</span>
            </button>
            <button
              onClick={() => onNavigateTab('results')}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-md shadow-amber-950/20"
            >
              <span>Lihat Perolehan Suara</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* RLS Warning Banner */}
      {db.isRlsBlocked && (
        <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5 sm:mt-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <span>Database Supabase Menolak Operasi Tulis (RLS Error 42501)</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">Perlu Aksi</span>
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Supabase menolak CRUD (tambah, edit, hapus) karena kebijakan Row-Level Security aktif tanpa aturan akses publik. Jalankan script SQL 1-klik di SQL Editor Supabase untuk membuka izin tulis secara otomatis.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenSqlModal}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2"
          >
            <Database className="w-4 h-4" />
            <span>Buka Script SQL 1-Klik</span>
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Siswa */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Siswa (DPT)
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.totalEligible}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Pemilih yang berhak memberikan suara
            </p>
          </div>
        </div>

        {/* Sudah Memilih */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Sudah Memilih
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">
              {stats.totalVoted}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {stats.totalUnvoted} siswa belum memilih
            </p>
          </div>
        </div>

        {/* Partisipasi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Partisipasi Pemilih
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.participationRate}%
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, stats.participationRate)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Suara Sah Masuk */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Suara Sah Masuk
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Vote className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.totalValidVotes}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Tercatat di tabel suara rahasia
            </p>
          </div>
        </div>
      </div>

      {/* Row 2: Live Candidate Standing & System Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidate Standing (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Perolehan Suara Sementara
              </h3>
              <p className="text-xs text-slate-500">
                Pembaruan terakhir: {stats.lastUpdated} WITA
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('results')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>Rincian Lengkap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {stats.candidateResults.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100/60 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-emerald-700 text-white font-bold text-sm flex items-center justify-center">
                      {c.ballot_number}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                        {c.leader_name} & {c.vice_leader_name}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate max-w-xs sm:max-w-md">
                        {c.slogan || 'Pasangan Calon Ketua & Wakil Ketua OSIS'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-extrabold text-sm text-slate-900">
                      {c.vote_count} <span className="text-xs font-normal text-slate-500">suara</span>
                    </div>
                    <div className="text-xs font-bold text-emerald-700">
                      {c.percentage}%
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${c.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status & Quick Navigation */}
        <div className="space-y-6">
          {/* Status Box */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">
              Status Sistem & Jadwal
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-600 font-medium">Jadwal Pemilihan:</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${timingStatus.color}`}>
                  {timingStatus.label}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-600 font-medium">Zona Waktu:</span>
                <span className="font-mono font-bold text-slate-800">
                  {election.timezone || 'Asia/Makassar'} (WITA)
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-600 font-medium">Total Kelas:</span>
                <span className="font-bold text-slate-800">{classesCount} Kelas</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-600 font-medium">Jumlah Kandidat:</span>
                <span className="font-bold text-slate-800">{stats.candidateResults.length} Pasangan</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onNavigateTab('documents')}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition"
              >
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>Buat Berita Acara PDF</span>
              </button>
            </div>
          </div>

          {/* Recent Audit Activities */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-3">
            <h3 className="font-extrabold text-slate-900 text-sm">
              Aktivitas Sistem Terakhir
            </h3>

            <div className="space-y-2 text-xs">
              {auditLogs.length === 0 ? (
                <p className="text-slate-400 text-center py-4">Belum ada aktivitas tercatat.</p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                      <span className="font-bold text-emerald-800">{log.action}</span>
                      <span>{new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-700 text-[11px] leading-snug">{log.details}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
