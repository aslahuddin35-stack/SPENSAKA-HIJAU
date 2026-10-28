import React, { useState } from 'react';
import { 
  CreditCard, 
  X, 
  Check, 
  Layers, 
  Users, 
  FileText, 
  Printer, 
  AlertCircle,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { Student, ClassItem, School, Election } from '../../types';
import { generateStudentCardsPDF } from '../../utils/pdfGenerator';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  classes: ClassItem[];
  school: School;
  election: Election;
  selectedStudentIds?: Set<string>;
  onSuccessNotification: (message: string) => void;
}

export type PrintMode = 'all' | 'class' | 'selected';

export const PrintCardsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  students,
  classes,
  school,
  election,
  selectedStudentIds = new Set(),
  onSuccessNotification,
}) => {
  const [printMode, setPrintMode] = useState<PrintMode>('all');
  const [selectedClassId, setSelectedClassId] = useState<string>(() => classes[0]?.id || '');
  const [onlyUnvoted, setOnlyUnvoted] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  if (!isOpen) return null;

  // Active students only
  const activeStudents = students.filter(s => s.is_active);

  // Calculate student targets based on selected mode & filters
  let targetStudents: Student[] = [];
  let scopeLabel = '';
  let fileName = '';

  if (printMode === 'selected') {
    targetStudents = activeStudents.filter(s => selectedStudentIds.has(s.id));
    scopeLabel = `${targetStudents.length} Siswa Terpilih`;
    fileName = `Kartu_Login_Siswa_Terpilih_${Date.now()}.pdf`;
  } else if (printMode === 'class') {
    const selectedClass = classes.find(c => c.id === selectedClassId);
    targetStudents = activeStudents.filter(s => s.class_id === selectedClassId);
    scopeLabel = `Kelas ${selectedClass?.name || 'Tertentu'}`;
    fileName = `Kartu_Login_Siswa_Kelas_${(selectedClass?.name || 'Kelas').replace(/\s+/g, '_')}.pdf`;
  } else {
    targetStudents = activeStudents;
    scopeLabel = 'Seluruh Kelas (Semua Siswa)';
    fileName = `Kartu_Login_Siswa_Semua_Kelas_${election.academic_year.replace(/\//g, '-')}.pdf`;
  }

  // Apply "only unvoted" filter if checked
  if (onlyUnvoted) {
    targetStudents = targetStudents.filter(s => !s.has_voted);
  }

  const sheetCount = Math.ceil(targetStudents.length / 6);

  const handleDownload = async () => {
    if (targetStudents.length === 0) return;

    setIsGenerating(true);
    try {
      await generateStudentCardsPDF(targetStudents, school, election, fileName);
      onSuccessNotification(
        `Berhasil mengunduh PDF kartu login untuk ${targetStudents.length} siswa (${scopeLabel})!`
      );
      onClose();
    } catch (e) {
      console.error('Error generating PDF:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-emerald-950 flex items-center justify-center font-bold shadow-md">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">
                Cetak & Unduh Kartu Login Siswa (PDF)
              </h3>
              <p className="text-xs text-emerald-200 font-medium">
                Pilih cakupan cetak: Semua kelas, per kelas tertentu, atau siswa terpilih
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Pilihan Cakupan Cetak */}
          <div>
            <label className="block font-bold text-slate-800 mb-2">
              Pilih Opsi Cetak:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Opsi 1: Semua Siswa */}
              <button
                type="button"
                onClick={() => setPrintMode('all')}
                className={`p-4 rounded-2xl border text-left transition relative flex flex-col justify-between ${
                  printMode === 'all'
                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <Users className="w-4 h-4" />
                  </span>
                  {printMode === 'all' && (
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Semua Siswa (Seluruh Kelas)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Cetak serentak kartu seluruh pemilih ({activeStudents.length} siswa aktif).
                  </p>
                </div>
              </button>

              {/* Opsi 2: Per Kelas Tertentu */}
              <button
                type="button"
                onClick={() => setPrintMode('class')}
                className={`p-4 rounded-2xl border text-left transition relative flex flex-col justify-between ${
                  printMode === 'class'
                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="w-7 h-7 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                    <Layers className="w-4 h-4" />
                  </span>
                  {printMode === 'class' && (
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Pilih Per Kelas Tertentu
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Cetak khusus untuk satu kelas (misal: VII-A, VIII-B).
                  </p>
                </div>
              </button>
            </div>

            {/* Opsi 3: Siswa Terpilih (Jika ada checkbox yang dicentang) */}
            {selectedStudentIds.size > 0 && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setPrintMode('selected')}
                  className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between ${
                    printMode === 'selected'
                      ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900">
                        Cetak Hanya Siswa yang Dipilih ({selectedStudentIds.size} siswa)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Berdasarkan siswa yang sedang Anda centang pada tabel.
                      </p>
                    </div>
                  </div>
                  {printMode === 'selected' && (
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Selector Dropdown Kelas (Muncul jika Mode Per Kelas Dipilih) */}
          {printMode === 'class' && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 animate-fade-in">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800">
                  Pilih Kelas yang Ingin Dicetak:
                </label>
                <span className="text-[11px] text-emerald-800 font-semibold">
                  Tersedia {classes.length} Kelas
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {classes.map((cls) => {
                  const classStudentCount = activeStudents.filter(s => s.class_id === cls.id).length;
                  const isSelected = selectedClassId === cls.id;

                  return (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => setSelectedClassId(cls.id)}
                      className={`p-3 rounded-xl border text-left transition ${
                        isSelected
                          ? 'border-emerald-600 bg-white shadow-xs ring-2 ring-emerald-600/20'
                          : 'border-slate-200 bg-white/70 hover:bg-white text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-slate-900">{cls.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {classStudentCount} siswa
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filter Tambahan: Hanya Belum Memilih */}
          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="onlyUnvotedFilter"
                checked={onlyUnvoted}
                onChange={(e) => setOnlyUnvoted(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <label htmlFor="onlyUnvotedFilter" className="text-xs text-amber-950 cursor-pointer">
                <span className="font-bold">Cetak hanya siswa yang BELUM memilih</span>
                <span className="block text-[11px] text-amber-800 font-normal">
                  Sangat berguna untuk mencetak kartu susulan saat pemungutan suara berlangsung.
                </span>
              </label>
            </div>
          </div>

          {/* Ringkasan Cetak Kertas */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Ringkasan Cetak:</span>
              <span className="text-emerald-700 font-extrabold">{scopeLabel}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                <span className="text-[10px] text-slate-500 block">Jumlah Siswa</span>
                <strong className="text-sm font-extrabold text-slate-900">{targetStudents.length}</strong>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                <span className="text-[10px] text-slate-500 block">Kartu Per Halaman</span>
                <strong className="text-sm font-extrabold text-slate-900">6 Kartu / A4</strong>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                <span className="text-[10px] text-slate-500 block">Estimasi Kertas</span>
                <strong className="text-sm font-extrabold text-emerald-700">{sheetCount} Lembar</strong>
              </div>
            </div>

            {targetStudents.length === 0 && (
              <div className="flex items-center gap-2 text-rose-600 bg-rose-50 p-2 rounded-xl text-[11px] font-semibold mt-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Tidak ada siswa yang sesuai dengan kriteria cetak saat ini.</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            disabled={isGenerating}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={targetStudents.length === 0 || isGenerating}
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs transition shadow-md shadow-emerald-950/20"
          >
            <Printer className="w-4 h-4" />
            <span>
              {isGenerating 
                ? 'Menghasilkan File PDF...' 
                : `Download PDF (${targetStudents.length} Kartu)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
