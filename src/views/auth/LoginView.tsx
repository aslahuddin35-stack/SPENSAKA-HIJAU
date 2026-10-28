import React, { useState } from 'react';
import { KeyRound, Shield, Vote, Lock, Mail, ArrowRight, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { School, Election, AuthSession } from '../../types';
import { db } from '../../services/db';

interface Props {
  school: School;
  election: Election;
  onLoginSuccess: (session: AuthSession) => void;
  onOpenSqlModal: () => void;
}

export const LoginView: React.FC<Props> = ({
  school,
  election,
  onLoginSuccess,
  onOpenSqlModal,
}) => {
  const [activeTab, setActiveTab] = useState<'student' | 'admin'>('student');
  const [tokenInput, setTokenInput] = useState('');
  const [adminEmail, setAdminEmail] = useState('admin@smpn1sukamulia.sch.id');
  const [adminPassword, setAdminPassword] = useState('AdminSukamulia2026!');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sample quick test tokens
  const sampleTokens = [
    { label: 'Budi (VII-A)', token: 'VOTE-8821' },
    { label: 'Annisa (VII-A)', token: 'VOTE-3490' },
    { label: 'Rizky (VIII-A)', token: 'VOTE-7124' },
    { label: 'Tiara (VIII-B)', token: 'VOTE-5539' },
  ];

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const verify = db.verifyVoterToken(tokenInput);
      if (!verify.valid || !verify.student) {
        setErrorMsg(verify.message || 'Token tidak valid. Silakan periksa kembali.');
        setLoading(false);
        return;
      }

      onLoginSuccess({
        role: 'student',
        student: verify.student,
        token: tokenInput.trim().toUpperCase(),
        expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour session
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan sistem saat memproses login.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    // Validate admin credentials
    if (adminEmail && adminPassword) {
      setTimeout(() => {
        onLoginSuccess({
          role: 'admin',
          adminEmail: adminEmail,
          expiresAt: Date.now() + 8 * 60 * 60 * 1000, // 8 hours session
        });
        setLoading(false);
      }, 400);
    } else {
      setErrorMsg('Harap lengkapi email dan kata sandi administrator.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header info */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between text-white/80 py-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">
            Portal Pemilihan Resmi
          </span>
        </div>
        <button
          onClick={onOpenSqlModal}
          className="text-xs bg-white/10 hover:bg-white/20 text-emerald-100 px-3 py-1.5 rounded-lg border border-white/20 transition flex items-center gap-1.5"
        >
          <span>Supabase DB Config</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="max-w-md w-full mx-auto my-auto z-10">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden">
          {/* Card Top Banner */}
          <div className="p-7 text-center bg-gradient-to-b from-emerald-50 to-white border-b border-emerald-100">
            <div className="w-20 h-20 mx-auto mb-3.5 p-2 bg-white rounded-2xl shadow-md border border-emerald-100 flex items-center justify-center">
              <img
                src={school.logo_url || '/logo-smpn1sukamulia.png'}
                alt={school.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo-smpn1sukamulia.png';
                }}
              />
            </div>

            <h2 className="text-xl font-black text-emerald-950 tracking-tight">
              E-VOTING OSIS
            </h2>
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
              {school.name}
            </p>
            <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-semibold">
              <Sparkles className="w-3 h-3 text-amber-600" /> Periode {election.academic_year}
            </div>
          </div>

          {/* Role Tabs */}
          <div className="grid grid-cols-2 p-1.5 m-4 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => { setActiveTab('student'); setErrorMsg(null); }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'student'
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Vote className="w-3.5 h-3.5" />
              <span>Login Siswa</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('admin'); setErrorMsg(null); }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'admin'
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Administrator</span>
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 pt-2">
            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {activeTab === 'student' ? (
              <form onSubmit={handleStudentLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Masukkan Token Pemilih:
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4 text-emerald-600" />
                    </div>
                    <input
                      type="text"
                      required
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                      placeholder="Contoh: VOTE-8821"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-center font-mono font-bold tracking-widest text-lg text-emerald-950 focus:outline-none transition uppercase shadow-inner"
                      autoFocus
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-500 text-center">
                    Gunakan token rahasia yang tercetak pada Kartu Login Anda.
                  </p>
                </div>

                {/* Quick token tester pills */}
                <div className="pt-2">
                  <div className="text-[10px] uppercase font-bold text-slate-400 text-center mb-1.5">
                    Pilih Cepat Token Uji Coba:
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {sampleTokens.map((item) => (
                      <button
                        type="button"
                        key={item.token}
                        onClick={() => setTokenInput(item.token)}
                        className="text-left px-2.5 py-1.5 rounded-lg bg-emerald-50/80 hover:bg-emerald-100/90 text-emerald-900 border border-emerald-200/60 text-[11px] transition"
                      >
                        <div className="font-bold font-mono">{item.token}</div>
                        <div className="text-[10px] text-emerald-700 truncate">{item.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !tokenInput.trim()}
                  className="w-full mt-4 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl transition shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 group"
                >
                  <span>{loading ? 'Memverifikasi...' : 'Masuk & Berikan Suara'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Administrator:
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4 text-emerald-600" />
                    </div>
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@smpn1sukamulia.sch.id"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl text-xs text-slate-900 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kata Sandi:
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4 text-emerald-600" />
                    </div>
                    <input
                      type="password"
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl text-xs text-slate-900 focus:outline-none transition"
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Default: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">AdminSukamulia2026!</code></span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3 px-4 rounded-xl transition shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>{loading ? 'Mengautentikasi...' : 'Masuk Dashboard Admin'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto w-full text-center text-xs text-emerald-200/60 py-2">
        <p>© 2026 Panitia Pemilihan OSIS {school.name}. Seluruh Hak Cipta Dilindungi.</p>
      </div>
    </div>
  );
};
