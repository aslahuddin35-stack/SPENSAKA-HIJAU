import React, { useState, useEffect } from 'react';
import { 
  Maximize2, 
  Minimize2, 
  ArrowLeft, 
  Clock, 
  Sparkles, 
  Award, 
  Users, 
  Vote, 
  Percent, 
  RefreshCw,
  AlertTriangle,
  Volume2,
  VolumeX
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { School, Election, CandidateResult } from '../../types';
import { db } from '../../services/db';
import { CandidatePhoto } from '../../components/common/CandidatePhoto';

interface Props {
  school: School;
  election: Election;
  onExit: () => void;
}

export const LiveQuickCountView: React.FC<Props> = ({
  school,
  election,
  onExit,
}) => {
  const [results, setResults] = useState(db.getResults());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [witaTime, setWitaTime] = useState('');
  const [pulseKey, setPulseKey] = useState(0);

  // Auto-refresh live quick count every 1.5 seconds
  useEffect(() => {
    const updateStats = () => {
      setResults(db.getResults());
      setPulseKey(k => k + 1);
    };

    updateStats();
    const interval = setInterval(updateStats, 1500);
    return () => clearInterval(interval);
  }, []);

  // Live WITA Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Makassar',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(now);
      setWitaTime(formatted + ' WITA');
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Track Fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#ffffff'],
      });
    } catch (e) {
      // ignore
    }
  };

  const candidateGradients = [
    {
      border: 'border-emerald-500/80',
      badgeBg: 'bg-emerald-600',
      glow: 'shadow-emerald-500/20',
      bar: 'bg-gradient-to-r from-emerald-600 to-teal-400',
      accentText: 'text-emerald-400',
      lightBg: 'bg-emerald-950/40',
    },
    {
      border: 'border-blue-500/80',
      badgeBg: 'bg-blue-600',
      glow: 'shadow-blue-500/20',
      bar: 'bg-gradient-to-r from-blue-600 to-cyan-400',
      accentText: 'text-blue-400',
      lightBg: 'bg-blue-950/40',
    },
    {
      border: 'border-amber-500/80',
      badgeBg: 'bg-amber-600',
      glow: 'shadow-amber-500/20',
      bar: 'bg-gradient-to-r from-amber-600 to-yellow-400',
      accentText: 'text-amber-400',
      lightBg: 'bg-amber-950/40',
    },
    {
      border: 'border-purple-500/80',
      badgeBg: 'bg-purple-600',
      glow: 'shadow-purple-500/20',
      bar: 'bg-gradient-to-r from-purple-600 to-pink-400',
      accentText: 'text-purple-400',
      lightBg: 'bg-purple-950/40',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#02130d] text-white flex flex-col justify-between overflow-y-auto font-sans select-none">
      {/* Background ambient lighting */}
      <div className="fixed -top-40 left-1/4 w-[600px] h-[600px] bg-emerald-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed -bottom-40 right-1/4 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* TOP BAR / PROJECTOR HEADER */}
      <header className="relative z-10 bg-black/40 backdrop-blur-md border-b border-emerald-500/20 px-6 py-4 flex items-center justify-between gap-4">
        {/* Left: School brand & Live Quick Count Title */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-white/10 p-1.5 flex items-center justify-center border border-emerald-400/30 shadow-lg shadow-emerald-950/50">
              <img
                src={school.logo_url || '/logo-smpn1sukamulia.png'}
                alt={school.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo-smpn1sukamulia.png';
                }}
              />
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#02130d] animate-ping" />
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-extrabold text-[11px] tracking-wider uppercase animate-pulse">
                ● LIVE DARI BILIK SUARA
              </span>
              <span className="text-xs text-amber-400 font-bold uppercase tracking-widest hidden sm:inline">
                SMP NEGERI 1 SUKAMULIA
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight mt-0.5 drop-shadow-md">
              LIVE QUICK COUNT PEMILIHAN KETUA & WAKIL KETUA OSIS
            </h1>
            <p className="text-xs text-emerald-300/80 font-medium">
              Periode Akademik {election.academic_year} • Penayangan Layar Proyektor Auditorium
            </p>
          </div>
        </div>

        {/* Right: Clock & Fullscreen Controls */}
        <div className="flex items-center gap-3">
          {/* Large WITA Clock */}
          <div className="hidden md:flex flex-col items-end px-4 py-2 rounded-2xl bg-white/5 border border-emerald-500/20">
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-400" /> Waktu Resmi
            </span>
            <span className="font-mono text-lg lg:text-xl font-black text-amber-300 tracking-wider">
              {witaTime}
            </span>
          </div>

          {/* Celebration button */}
          <button
            onClick={triggerCelebration}
            className="p-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition shadow-lg"
            title="Tembakkan Konfeti Perayaan"
          >
            <Sparkles className="w-5 h-5" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition shadow-lg shadow-emerald-950/40 border border-emerald-400/30"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh (F11)'}</span>
          </button>

          {/* Exit / Return to Admin */}
          <button
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
              }
              onExit();
            }}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition border border-white/20"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Kembali</span>
          </button>
        </div>
      </header>

      {/* AGGREGATE STATS STRIP */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 pt-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/5 backdrop-blur-md p-4 rounded-3xl border border-emerald-500/20 shadow-xl">
          <div className="p-3 text-center sm:text-left">
            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">
              Total DPT (Hak Pilih)
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-0.5">
              {results.totalEligible} <span className="text-xs font-normal text-slate-400">Siswa</span>
            </div>
          </div>

          <div className="p-3 text-center sm:text-left">
            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">
              Total Suara Sah Masuk
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-0.5">
              {results.totalValidVotes} <span className="text-xs font-normal text-slate-400">Suara</span>
            </div>
          </div>

          <div className="p-3 text-center sm:text-left">
            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">
              Siswa Belum Memilih
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-300 mt-0.5">
              {results.totalUnvoted} <span className="text-xs font-normal text-slate-400">Siswa</span>
            </div>
          </div>

          <div className="p-3 text-center sm:text-left">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
              Partisipasi Pemilih
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-amber-300">
                {results.participationRate}%
              </span>
              <div className="flex-1 bg-white/10 h-3 rounded-full overflow-hidden hidden lg:block">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-amber-400 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, results.participationRate)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DRAW BANNER IF TIE */}
      {results.isTie && results.totalValidVotes > 0 && (
        <div className="max-w-7xl mx-auto w-full px-6 pt-4">
          <div className="bg-amber-500/20 border-2 border-amber-400/80 rounded-2xl p-4 flex items-center gap-4 text-amber-200">
            <AlertTriangle className="w-8 h-8 text-amber-400 shrink-0 animate-bounce" />
            <div>
              <h3 className="font-black text-base text-amber-300">STATUS HASIL SERI (DRAW) SEMENTARA</h3>
              <p className="text-xs text-amber-100/90">
                Dua pasangan calon kandidat memperoleh perolehan suara tertinggi yang sama ({results.highestVotes} suara). Hasil akhir menunggu seluruh bilik suara selesai.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CANDIDATE SCOREBOARD ARENA */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {results.candidateResults.map((c, i) => {
            const style = candidateGradients[i % candidateGradients.length];
            const isLeader = results.winner?.id === c.id && !results.isTie;

            return (
              <div
                key={c.id}
                className={`relative rounded-3xl overflow-hidden bg-white/5 backdrop-blur-xl border-2 transition-all duration-300 shadow-2xl flex flex-col justify-between group ${
                  isLeader
                    ? 'border-amber-400 ring-4 ring-amber-400/20 shadow-amber-500/20'
                    : `${style.border} ${style.glow}`
                }`}
              >
                {/* Leader Ribbon */}
                {isLeader && (
                  <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-emerald-950 font-black text-xs shadow-lg uppercase tracking-wider animate-pulse">
                    <Award className="w-4 h-4 text-emerald-950" />
                    <span>MEMIMPIN</span>
                  </div>
                )}

                {/* Candidate Photo & Number */}
                <div className="relative h-64 sm:h-72 bg-slate-900 overflow-hidden">
                  <CandidatePhoto
                    photoUrl={c.photo_url}
                    altText={`${c.leader_name} & ${c.vice_leader_name}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#02130d] via-[#02130d]/40 to-transparent" />

                  {/* Gigantic Ballot Number */}
                  <div className={`absolute top-4 left-4 w-14 h-14 rounded-2xl ${style.badgeBg} text-white font-black text-3xl flex items-center justify-center shadow-xl border-2 border-white/60`}>
                    #{c.ballot_number}
                  </div>

                  {/* Candidate Names on Photo */}
                  <div className="absolute bottom-4 left-5 right-5 text-white">
                    <span className="text-[11px] font-bold text-amber-300 uppercase tracking-widest block">
                      PASANGAN CALON NO. {c.ballot_number}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black leading-tight drop-shadow-md">
                      {c.leader_name}
                    </h3>
                    <p className="text-sm text-slate-300 font-semibold drop-shadow-xs">
                      & {c.vice_leader_name}
                    </p>
                    <div className="text-[11px] text-emerald-300 font-medium mt-0.5">
                      Kelas: {c.leader_class || '-'} & {c.vice_leader_class || '-'}
                    </div>
                  </div>
                </div>

                {/* Live Vote Display & Bar */}
                <div className="p-6 space-y-5 flex-1 flex flex-col justify-between">
                  {/* Slogan */}
                  {c.slogan && (
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-amber-200 text-xs italic font-semibold text-center">
                      "{c.slogan}"
                    </div>
                  )}

                  {/* HUGE NUMBERS COUNTER */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Perolehan Suara
                      </span>
                      <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                        {c.vote_count} <span className="text-xs font-semibold text-slate-400 uppercase">Suara</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Persentase
                      </span>
                      <div className={`text-3xl sm:text-4xl font-black ${style.accentText} tracking-tight`}>
                        {c.percentage}%
                      </div>
                    </div>
                  </div>

                  {/* Animated Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="w-full bg-white/10 h-4 rounded-full overflow-hidden p-0.5 border border-white/10">
                      <div
                        className={`${style.bar} h-full rounded-full transition-all duration-700 ease-out shadow-lg`}
                        style={{ width: `${Math.max(c.percentage > 0 ? 5 : 0, c.percentage)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* FOOTER INFO STRIP */}
      <footer className="relative z-10 bg-black/50 border-t border-emerald-500/20 px-6 py-3 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span>Sistem Penghitungan Otomatis & Terverifikasi • Panitia Pemilihan OSIS {school.name}</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>Tekan tombol <strong>F11</strong> pada keyboard untuk mode layar penuh maksimal</span>
          <button
            onClick={onExit}
            className="text-emerald-400 hover:text-white font-bold transition underline"
          >
            Tutup Tampilan Proyektor
          </button>
        </div>
      </footer>
    </div>
  );
};
