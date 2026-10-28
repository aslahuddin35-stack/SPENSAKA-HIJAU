import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  LogOut, 
  User, 
  Award, 
  Sparkles, 
  Vote, 
  ShieldCheck, 
  Clock, 
  ChevronRight,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Student, School, Election, Candidate } from '../../types';
import { db } from '../../services/db';
import { CandidatePhoto } from '../../components/common/CandidatePhoto';

interface Props {
  student: Student;
  school: School;
  election: Election;
  onLogout: () => void;
}

export const StudentVotingView: React.FC<Props> = ({
  student,
  school,
  election,
  onLogout,
}) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [votingSuccess, setVotingSuccess] = useState(false);
  const [countdown, setCountdown] = useState(4);
  const [activeTab, setActiveTab] = useState<'profile' | 'ballot'>('ballot');
  const [viewingDetailCandidate, setViewingDetailCandidate] = useState<Candidate | null>(null);

  useEffect(() => {
    setCandidates(db.getCandidates().filter(c => c.is_active));
  }, []);

  // Countdown timer on voting success
  useEffect(() => {
    if (!votingSuccess) return;

    // Trigger festive celebration
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#059669', '#10b981', '#f59e0b', '#3b82f6'],
      });
    } catch {
      // ignore
    }

    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [votingSuccess]);

  // Safely trigger onLogout after countdown finishes
  useEffect(() => {
    if (votingSuccess && countdown <= 0) {
      onLogout();
    }
  }, [votingSuccess, countdown, onLogout]);

  const handleSelectCandidate = (candidate: Candidate) => {
    if (student.has_voted) return;
    setSelectedCandidate(candidate);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmVote = async () => {
    if (!selectedCandidate || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await db.castVote(election.id, student.id, selectedCandidate.id);
      if (res.success) {
        setIsConfirmModalOpen(false);
        setVotingSuccess(true);
      } else {
        alert(res.message);
        setIsSubmitting(false);
      }
    } catch (err: any) {
      alert(err?.message || 'Gagal mengirimkan suara. Silakan coba kembali.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Student Header */}
      <header className="bg-gradient-to-r from-emerald-900 to-emerald-800 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={school.logo_url || '/logo-smpn1sukamulia.png'}
              alt={school.name}
              className="w-10 h-10 object-contain bg-white/10 p-1 rounded-xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo-smpn1sukamulia.png';
              }}
            />
            <div>
              <h1 className="font-extrabold text-sm sm:text-base tracking-tight leading-tight">
                {school.name}
              </h1>
              <p className="text-xs text-emerald-200">
                Bilik Suara Digital Siswa • Periode {election.academic_year}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-2 rounded-xl transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      {/* Main Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Success Screen Banner */}
        {votingSuccess ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-xl border border-emerald-100 my-8 animate-fade-in">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 mb-3">
              Suara Anda Berhasil Dicatat!
            </h2>
            <p className="text-base text-slate-600 max-w-md mx-auto mb-6 leading-relaxed">
              Terima kasih telah berpartisipasi menyukseskan Pemilihan Ketua dan Wakil Ketua OSIS {school.name}.
            </p>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 mb-6">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Pilihan Anda dijamin rahasia dan aman di sistem.</span>
            </div>

            <div className="text-xs text-slate-400 font-medium">
              Sesi Anda akan otomatis diakhiri dalam <span className="font-bold text-emerald-700 text-sm">{countdown}</span> detik...
            </div>
          </div>
        ) : (
          <>
            {/* Student Identity Card */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center font-bold text-xl border border-emerald-200">
                    <User className="w-7 h-7 text-emerald-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900">{student.full_name}</h2>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {student.gender === 'P' ? 'Perempuan' : 'Laki-laki'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                      <span>NISN: <strong className="text-slate-700">{student.nisn}</strong></span>
                      <span>Kelas: <strong className="text-slate-700">{student.class_name}</strong></span>
                      <span>Sekolah: <strong className="text-slate-700">{school.name}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Voting status indicator */}
                <div>
                  {student.has_voted ? (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>ANDA SUDAH MENGGUNAKAN HAK SUARA</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold animate-pulse">
                      <Vote className="w-4 h-4 text-emerald-600" />
                      <span>HAK SUARA TERSEDIA: SILAKAN MEMILIH</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* If Student Already Voted notice */}
            {student.has_voted && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center max-w-xl mx-auto space-y-3">
                <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-base text-amber-950">
                  Anda Sudah Memberikan Suara
                </h3>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Hak suara atas nama <strong>{student.full_name}</strong> telah berhasil dicatat pada{' '}
                  {student.voted_at ? new Date(student.voted_at).toLocaleString('id-ID') : 'sistem pemilihan'}. Demi menjaga asas kerahasiaan dan kejujuran, setiap siswa hanya berhak memilih satu kali.
                </p>
                <button
                  onClick={onLogout}
                  className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold transition shadow-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Selesai & Keluar</span>
                </button>
              </div>
            )}

            {/* Candidate Ballot Cards */}
            {!student.has_voted && (
              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    Daftar Pasangan Calon Ketua & Wakil Ketua OSIS
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pelajari visi, misi, dan slogan setiap pasangan sebelum memberikan pilihan suara Anda.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {candidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-200 border-2 border-slate-200/90 overflow-hidden flex flex-col justify-between group hover:border-emerald-600"
                    >
                      {/* Photo & Number Badge */}
                      <div className="relative h-60 bg-slate-100 overflow-hidden">
                        <CandidatePhoto
                          photoUrl={candidate.photo_url}
                          altText={`${candidate.leader_name} & ${candidate.vice_leader_name}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        {/* Ballot Number */}
                        <div className="absolute top-4 left-4 w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-2xl flex items-center justify-center shadow-lg border-2 border-white">
                          {candidate.ballot_number}
                        </div>

                        {/* Candidate Names overlay */}
                        <div className="absolute bottom-3 left-4 right-4 text-white">
                          <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                            Pasangan Calon No. {candidate.ballot_number}
                          </p>
                          <h4 className="font-extrabold text-base leading-tight">
                            {candidate.leader_name}
                          </h4>
                          <p className="text-xs text-slate-200">
                            & {candidate.vice_leader_name}
                          </p>
                        </div>
                      </div>

                      {/* Info & Slogan */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          {candidate.slogan && (
                            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-900 text-xs font-semibold italic text-center mb-3">
                              "{candidate.slogan}"
                            </div>
                          )}

                          <div className="space-y-2 text-xs">
                            <div>
                              <span className="font-bold text-slate-800">Visi Utama:</span>
                              <p className="text-slate-600 line-clamp-3 mt-0.5 leading-relaxed">
                                {candidate.vision}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setViewingDetailCandidate(candidate)}
                            className="w-full text-center text-xs font-semibold text-emerald-700 hover:text-emerald-800 py-1.5 transition flex items-center justify-center gap-1"
                          >
                            <Info className="w-3.5 h-3.5" />
                            <span>Lihat Visi & Misi Lengkap</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSelectCandidate(candidate)}
                            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-4 rounded-xl transition shadow-md shadow-emerald-900/10 flex items-center justify-center gap-2 group-hover:bg-emerald-600"
                          >
                            <Vote className="w-4 h-4" />
                            <span>Pilih Pasangan No. {candidate.ballot_number}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Confirmation Modal */}
      {isConfirmModalOpen && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <Vote className="w-8 h-8" />
            </div>

            <div>
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                Konfirmasi Pilihan Suara
              </p>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                Pasangan Nomor Urut {selectedCandidate.ballot_number}
              </h3>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">
                {selectedCandidate.leader_name} & {selectedCandidate.vice_leader_name}
              </p>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-900 text-left flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Perhatian Penting:</p>
                <p className="mt-0.5 leading-relaxed">
                  Pilihan suara Anda bersifat <strong>rahasia</strong> dan <strong>tidak dapat diubah atau dibatalkan</strong> setelah dikonfirmasi. Pastikan pilihan Anda sudah benar!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsConfirmModalOpen(false)}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmVote}
                className="py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs transition shadow-md shadow-emerald-900/20"
              >
                {isSubmitting ? 'Mencatat Suara...' : 'Ya, Kirim Suara'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Detail Modal */}
      {viewingDetailCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-6 bg-gradient-to-r from-emerald-900 to-emerald-800 text-white">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-emerald-950 text-[10px] font-bold">
                Nomor Urut {viewingDetailCandidate.ballot_number}
              </span>
              <h3 className="text-lg font-bold mt-1">
                {viewingDetailCandidate.leader_name} & {viewingDetailCandidate.vice_leader_name}
              </h3>
              {viewingDetailCandidate.slogan && (
                <p className="text-xs text-emerald-200 italic mt-0.5">
                  "{viewingDetailCandidate.slogan}"
                </p>
              )}
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-slate-700">
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1 text-emerald-900">Visi:</h4>
                <p className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {viewingDetailCandidate.vision}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1 text-emerald-900">Misi:</h4>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 whitespace-pre-line">
                  {viewingDetailCandidate.mission}
                </div>
              </div>

              {viewingDetailCandidate.program_desc && (
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1 text-emerald-900">Program Kerja Unggulan:</h4>
                  <p className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {viewingDetailCandidate.program_desc}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setViewingDetailCandidate(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
