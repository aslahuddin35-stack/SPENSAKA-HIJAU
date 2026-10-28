import React, { useState, useEffect } from 'react';
import { Clock, Shield, Database, Menu, LogOut, CheckCircle2, UserCheck, Tv } from 'lucide-react';
import { School, Election, AuthSession } from '../../types';

interface Props {
  school: School;
  election: Election;
  session: AuthSession | null;
  onLogout: () => void;
  onOpenSqlModal: () => void;
  onOpenQuickCount?: () => void;
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<Props> = ({
  school,
  election,
  session,
  onLogout,
  onOpenSqlModal,
  onOpenQuickCount,
  onToggleMobileMenu,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format time in WITA (UTC+8)
      const formatted = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Makassar',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(now);
      setCurrentTime(formatted + ' WITA');
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = () => {
    switch (election.status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            Voting Aktif
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 border border-amber-500/30">
            Voting Ditunda
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-700 border border-rose-500/30">
            Voting Ditutup
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-700 border border-slate-500/30">
            Draft
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-emerald-950/10 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand Left */}
          <div className="flex items-center gap-3.5">
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-emerald-900 hover:bg-emerald-50 transition"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <img
              src={school.logo_url || '/logo-smpn1sukamulia.png'}
              alt={school.name}
              className="w-11 h-11 object-contain drop-shadow-xs"
              onError={(e) => {
                // Fallback to local logo path
                (e.target as HTMLImageElement).src = '/logo-smpn1sukamulia.png';
              }}
            />

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-emerald-950">
                  {school.name}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  OSIS 2026/2027
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Sistem Pemilihan Ketua & Wakil Ketua OSIS
              </p>
            </div>
          </div>

          {/* Right Action Widgets */}
          <div className="flex items-center gap-3">
            {/* Live Clock */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200 text-slate-700 text-xs font-mono font-medium">
              <Clock className="w-3.5 h-3.5 text-emerald-700" />
              <span>{currentTime}</span>
            </div>

            {/* Election Status Badge */}
            <div className="hidden sm:block">
              {getStatusBadge()}
            </div>

            {/* Live Quick Count Proyektor Button */}
            {session?.role === 'admin' && onOpenQuickCount && (
              <button
                onClick={onOpenQuickCount}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-emerald-950 transition shadow-xs"
                title="Buka Tampilan Quick Count Layar Proyektor"
              >
                <Tv className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Live Proyektor</span>
              </button>
            )}

            {/* Supabase Integration Button */}
            {session?.role === 'admin' && (
              <button
                onClick={onOpenSqlModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition shadow-xs"
                title="Buka Status Database & SQL Migration"
              >
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Supabase DB</span>
              </button>
            )}

            {/* User Session Info & Logout */}
            {session && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="hidden lg:block text-right">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
                    {session.role === 'admin' ? 'Administrator' : session.student?.full_name}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {session.role === 'admin' ? session.adminEmail || 'Panitia Pemilihan' : `Kelas ${session.student?.class_name}`}
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition"
                  title="Keluar / Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
