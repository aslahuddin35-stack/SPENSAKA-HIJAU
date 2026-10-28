import React from 'react';
import { 
  LayoutDashboard, 
  Landmark, 
  Users, 
  UserCheck, 
  BarChart3, 
  FileText, 
  Settings, 
  LogOut,
  ChevronRight,
  Database,
  Vote,
  ExternalLink,
  Tv
} from 'lucide-react';
import { School, Election } from '../../types';

export type AdminTab = 
  | 'dashboard' 
  | 'classes' 
  | 'students' 
  | 'candidates' 
  | 'results' 
  | 'documents' 
  | 'settings';

interface Props {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onLogout: () => void;
  onOpenQuickCount: () => void;
  school: School;
  election: Election;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenSqlModal: () => void;
}

export const Sidebar: React.FC<Props> = ({
  currentTab,
  onSelectTab,
  onLogout,
  onOpenQuickCount,
  school,
  election,
  isMobileOpen,
  onCloseMobile,
  onOpenSqlModal,
}) => {
  const menuItems: Array<{ id: AdminTab; label: string; icon: React.ReactNode; badge?: string }> = [
    { id: 'dashboard', label: 'Beranda', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'classes', label: 'Kelas', icon: <Landmark className="w-4 h-4" /> },
    { id: 'students', label: 'Siswa / User', icon: <Users className="w-4 h-4" /> },
    { id: 'candidates', label: 'Calon Kandidat', icon: <UserCheck className="w-4 h-4" /> },
    { id: 'results', label: 'Perolehan Suara', icon: <BarChart3 className="w-4 h-4" />, badge: 'Live' },
    { id: 'documents', label: 'Berita Acara', icon: <FileText className="w-4 h-4" /> },
    { id: 'settings', label: 'Pengaturan', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-68 bg-gradient-to-b from-[#064e3b] via-[#043d2e] to-[#022c22] text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-full shadow-xl border-r border-emerald-800/40 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Area */}
        <div className="p-5 border-b border-emerald-800/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 p-1 flex items-center justify-center border border-white/20 shadow-xs">
            <img
              src={school.logo_url || '/logo-smpn1sukamulia.png'}
              alt="Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo-smpn1sukamulia.png';
              }}
            />
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-wide text-white leading-tight">
              E-VOTING OSIS
            </h1>
            <p className="text-[11px] text-emerald-300/90 font-medium">
              SMPN 1 Sukamulia
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-emerald-300/60">
            Menu Utama
          </div>

          {menuItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/30'
                    : 'text-emerald-100/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-amber-300' : 'text-emerald-300'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-400 text-emerald-950">
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-200" />}
                </div>
              </button>
            );
          })}

          {/* Quick Count Proyektor Highlight Button */}
          <div className="pt-3">
            <button
              onClick={() => {
                onOpenQuickCount();
                onCloseMobile();
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-emerald-600/30 to-teal-600/20 hover:from-amber-500/30 hover:to-teal-600/30 text-white font-bold text-xs border border-amber-400/40 transition shadow-lg group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-400 text-emerald-950 flex items-center justify-center font-black shadow-xs">
                  <Tv className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="leading-tight text-amber-300 group-hover:text-amber-200">
                    Live Quick Count
                  </div>
                  <div className="text-[10px] text-emerald-200/80 font-normal">
                    Layar Proyektor Aula
                  </div>
                </div>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-400 text-emerald-950">
                PROYEKTOR
              </span>
            </button>
          </div>
        </div>

        {/* Database Status Card & Logout */}
        <div className="p-3 border-t border-emerald-800/50 space-y-2">
          <button
            onClick={onOpenSqlModal}
            className="w-full bg-emerald-950/60 hover:bg-emerald-900/80 text-left p-3 rounded-xl border border-emerald-700/40 transition group"
          >
            <div className="flex items-center justify-between text-xs text-emerald-200 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-400" /> Supabase Status
              </span>
              <span className="text-[10px] text-emerald-400 group-hover:underline">Buka</span>
            </div>
            <p className="text-[11px] text-emerald-300/80 line-clamp-1 font-mono">
              phqkeaqsfmnlfpxwepfo
            </p>
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-200 hover:bg-rose-500/20 hover:text-rose-100 transition"
          >
            <LogOut className="w-4 h-4 text-rose-300" />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>
    </>
  );
};
