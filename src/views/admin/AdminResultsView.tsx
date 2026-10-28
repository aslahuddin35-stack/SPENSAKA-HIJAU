import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  FileSpreadsheet, 
  FileText,
  Users,
  Vote,
  Percent,
  Clock,
  Tv
} from 'lucide-react';
import { School, Election, CandidateResult } from '../../types';
import { db } from '../../services/db';
import { exportResultsExcel } from '../../utils/excelHelper';
import { AdminTab } from '../../components/layout/Sidebar';

interface Props {
  school: School;
  election: Election;
  onNavigateTab: (tab: AdminTab) => void;
  onOpenQuickCount?: () => void;
}

export const AdminResultsView: React.FC<Props> = ({
  school,
  election,
  onNavigateTab,
  onOpenQuickCount,
}) => {
  const [results, setResults] = useState(db.getResults());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = () => {
    setIsRefreshing(true);
    setResults(db.getResults());
    setTimeout(() => setIsRefreshing(false), 300);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleExportExcel = () => {
    exportResultsExcel(results.candidateResults, election, school);
  };

  // Color palette for charts & candidates
  const candidateColors = [
    { bg: 'bg-emerald-600', text: 'text-emerald-700', border: 'border-emerald-300', fill: '#059669' },
    { bg: 'bg-blue-600', text: 'text-blue-700', border: 'border-blue-300', fill: '#2563eb' },
    { bg: 'bg-amber-600', text: 'text-amber-700', border: 'border-amber-300', fill: '#d97706' },
    { bg: 'bg-purple-600', text: 'text-purple-700', border: 'border-purple-300', fill: '#9333ea' },
  ];

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Perolehan Suara Real-Time
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
              ● Live Sync
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Penghitungan suara otomatis dari database PostgreSQL, diperbarui setiap saat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenQuickCount && (
            <button
              onClick={onOpenQuickCount}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-emerald-950 text-xs font-black px-4 py-2.5 rounded-xl transition shadow-md shadow-amber-950/20"
              title="Tampilkan Live Quick Count di Layar Penuh Proyektor Aula"
            >
              <Tv className="w-4 h-4" />
              <span>Layar Proyektor Full Screen</span>
            </button>
          )}

          <button
            onClick={refreshData}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold px-3.5 py-2.5 rounded-xl transition border border-slate-200 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2.5 rounded-xl transition border border-slate-300 shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => onNavigateTab('documents')}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-md shadow-emerald-950/20"
          >
            <FileText className="w-4 h-4" />
            <span>Buat Berita Acara</span>
          </button>
        </div>
      </div>

      {/* Tie Detection or Winner Banner */}
      {results.totalValidVotes > 0 && (
        <div>
          {results.isTie ? (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 shadow-xs flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-amber-950 text-sm sm:text-base">
                    HASIL SERI TERDETEKSI (DRAW STATUS)
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                    Perolehan Suara Tertinggi Sama
                  </span>
                </div>
                <p className="text-xs text-amber-900/90 leading-relaxed">
                  Dua atau lebih pasangan calon kandidat memperoleh suara terbanyak yang identik ({results.highestVotes} suara). Sesuai dengan AD/ART OSIS dan tata tertib pemilihan, sistem tidak menetapkan pemenang sepihak. Panitia Pemilihan dan Kepala Sekolah akan melaksanakan mekanisme musyawarah mufakat atau putaran kedua.
                </p>
              </div>
            </div>
          ) : results.winner ? (
            <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-3xl p-6 shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="w-16 h-16 rounded-2xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black text-2xl shadow-lg border-2 border-white shrink-0">
                  #{results.winner.ballot_number}
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-300 text-emerald-950 uppercase tracking-wider">
                    Memimpin Perolehan Suara
                  </span>
                  <h3 className="text-lg sm:text-xl font-black mt-1">
                    {results.winner.leader_name} & {results.winner.vice_leader_name}
                  </h3>
                  <p className="text-xs text-emerald-200">
                    "{results.winner.slogan || 'Sukamulia Berprestasi'}"
                  </p>
                </div>
              </div>

              <div className="text-center sm:text-right bg-white/10 px-5 py-3 rounded-2xl border border-white/20">
                <div className="text-2xl sm:text-3xl font-black text-amber-300">
                  {results.winner.vote_count} <span className="text-sm font-normal text-white">suara</span>
                </div>
                <p className="text-xs font-bold text-emerald-200">
                  {results.winner.percentage}% dari seluruh suara sah
                </p>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Hak Pilih (DPT)</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{results.totalEligible} Siswa</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Siswa aktif terdaftar</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Suara Telah Masuk</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{results.totalVoted} Suara</div>
          <p className="text-[11px] text-slate-500 mt-0.5">{results.totalUnvoted} belum memilih</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Tingkat Partisipasi</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{results.participationRate}%</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Target &gt; 85% DPT</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Pembaruan Sistem</span>
          <div className="text-lg font-mono font-bold text-slate-800 mt-1.5">{results.lastUpdated} WITA</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Sinkronisasi otomatis</p>
        </div>
      </div>

      {/* Visual Charts: Bar Chart & Doughnut Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Horizontal Bar Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Grafik Batang Perolehan Suara
              </h3>
              <p className="text-xs text-slate-500">
                Visualisasi perolehan suara sah per pasangan calon nomor urut
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {results.candidateResults.map((c, i) => {
              const color = candidateColors[i % candidateColors.length];
              return (
                <div key={c.id} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-lg ${color.bg} text-white font-bold text-xs flex items-center justify-center`}>
                        {c.ballot_number}
                      </span>
                      <span className="font-bold text-slate-900">
                        {c.leader_name} & {c.vice_leader_name}
                      </span>
                    </div>

                    <div className="font-mono font-extrabold text-slate-900">
                      {c.vote_count} Suara ({c.percentage}%)
                    </div>
                  </div>

                  {/* Bar */}
                  <div className="w-full bg-slate-100 h-6 rounded-xl overflow-hidden p-1 border border-slate-200/80">
                    <div
                      className={`${color.bg} h-full rounded-lg transition-all duration-700 ease-out flex items-center justify-end pr-2 text-[10px] text-white font-bold`}
                      style={{ width: `${Math.max(c.percentage > 0 ? 8 : 0, c.percentage)}%` }}
                    >
                      {c.percentage > 0 && `${c.percentage}%`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Donut Distribution Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-6">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">
              Distribusi Suara Masuk
            </h3>
            <p className="text-xs text-slate-500">
              Proporsi persentase suara dari total {results.totalValidVotes} suara
            </p>
          </div>

          {/* Simulated SVG Donut Chart */}
          <div className="flex items-center justify-center py-4">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#f1f5f9"
                  strokeWidth="16"
                />
                {results.totalValidVotes === 0 ? (
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#cbd5e1"
                    strokeWidth="16"
                  />
                ) : (
                  results.candidateResults.reduce((acc, c, i) => {
                    const color = candidateColors[i % candidateColors.length];
                    const circumference = 2 * Math.PI * 38;
                    const strokeDasharray = `${(c.percentage / 100) * circumference} ${circumference}`;
                    const strokeDashoffset = -acc.offset;
                    acc.offset += (c.percentage / 100) * circumference;

                    acc.elements.push(
                      <circle
                        key={c.id}
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke={color.fill}
                        strokeWidth="16"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-700"
                      />
                    );
                    return acc;
                  }, { elements: [] as React.ReactNode[], offset: 0 }).elements
                )}
              </svg>

              <div className="absolute text-center">
                <span className="text-2xl font-black text-slate-900 leading-none">
                  {results.totalValidVotes}
                </span>
                <span className="block text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                  Suara Sah
                </span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
            {results.candidateResults.map((c, i) => {
              const color = candidateColors[i % candidateColors.length];
              return (
                <div key={c.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${color.bg}`} />
                    <span className="text-slate-700 font-semibold truncate max-w-[130px]">
                      No. {c.ballot_number} ({c.leader_name.split(' ')[0]})
                    </span>
                  </div>
                  <span className="font-bold text-slate-900">{c.percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Official Table Breakdown */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
            Tabel Rekapitulasi Resmi Perolehan Suara
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            Status: Sah dan Tervalidasi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 text-center w-16">No. Urut</th>
                <th className="py-3.5 px-4">Nama Pasangan Calon</th>
                <th className="py-3.5 px-4">Slogan</th>
                <th className="py-3.5 px-4 text-center">Perolehan Suara</th>
                <th className="py-3.5 px-4 text-center">Persentase</th>
                <th className="py-3.5 px-4 text-center">Peringkat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {results.candidateResults.map((c, index) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 text-center font-black text-slate-800 text-sm">
                    {c.ballot_number}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">
                      {c.leader_name} & {c.vice_leader_name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Kelas {c.leader_class || '-'} & {c.vice_leader_class || '-'}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 italic">
                    "{c.slogan || '-'}"
                  </td>
                  <td className="py-3.5 px-4 text-center font-black text-slate-900 text-sm">
                    {c.vote_count} Suara
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-700 text-sm">
                    {c.percentage}%
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      index === 0 && results.totalValidVotes > 0 && !results.isTie
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      Peringkat {index + 1}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
