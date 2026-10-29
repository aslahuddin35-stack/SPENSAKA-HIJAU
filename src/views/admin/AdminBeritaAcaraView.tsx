import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Eye, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  MapPin, 
  Save, 
  History,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { School, Election, ElectionDocument, CandidateResult } from '../../types';
import { db } from '../../services/db';
import { generateBeritaAcaraPDF } from '../../utils/pdfGenerator';

interface Props {
  school: School;
  election: Election;
}

export const AdminBeritaAcaraView: React.FC<Props> = ({ school, election }) => {
  const [results, setResults] = useState(db.getResults());
  const [documents, setDocuments] = useState<ElectionDocument[]>([]);

  // Form State for creating Berita Acara
  const [formData, setFormData] = useState({
    title: 'BERITA ACARA PEMUNGUTAN DAN PENGHITUNGAN SUARA',
    doc_number: '042/PAN-OSIS/SMPN1-SKM/X/2026',
    execution_date: new Date().toISOString().split('T')[0],
    execution_time: '08:00 - 13:00 WITA',
    execution_place: 'Aula Serbaguna SMP Negeri 1 Sukamulia',
    notes: 'Pemungutan suara berlangsung secara tertib, lancar, jujur, dan adil menggunakan sistem E-Voting.',
  });

  const [activeTab, setActiveTab] = useState<'create' | 'preview' | 'history'>('create');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadDocuments = () => {
    setDocuments(db.getDocuments());
    setResults(db.getResults());
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const constructDocObject = (): ElectionDocument => {
    return {
      id: 'doc-preview',
      election_id: election.id,
      doc_type: 'berita_acara',
      title: formData.title,
      doc_number: formData.doc_number,
      execution_date: formData.execution_date,
      execution_time: formData.execution_time,
      execution_place: formData.execution_place,
      total_eligible: results.totalEligible,
      total_voted: results.totalVoted,
      total_unvoted: results.totalUnvoted,
      total_valid_votes: results.totalValidVotes,
      total_invalid_votes: 0,
      results_summary: results.candidateResults.map(c => ({
        ballot_number: c.ballot_number,
        leader_name: c.leader_name,
        vice_leader_name: c.vice_leader_name,
        vote_count: c.vote_count,
        percentage: c.percentage,
      })),
      notes: formData.notes,
      is_verified: true,
      created_by: 'Panitia Pemilihan OSIS',
      created_at: new Date().toISOString(),
    };
  };

  const handleSaveAndDownload = async () => {
    setIsGeneratingPdf(true);
    const docData = constructDocObject();

    try {
      // 1. Save document to database
      await db.saveDocument(docData);
      loadDocuments();

      // 2. Generate and download PDF
      await generateBeritaAcaraPDF(docData, school, election, results.candidateResults, true);
      showNotification('success', 'Berita Acara resmi berhasil disimpan ke arsip dan diunduh dalam format PDF!');
    } catch (e: any) {
      showNotification('error', 'Gagal menghasilkan PDF Berita Acara');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadSavedDoc = async (docItem: ElectionDocument) => {
    try {
      showNotification('success', `Mengunduh dokumen: ${docItem.doc_number}...`);
      await generateBeritaAcaraPDF(docItem, school, election, results.candidateResults, true);
    } catch (e) {
      showNotification('error', 'Gagal mengunduh dokumen');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Berita Acara Pemilihan (Dokumen Resmi)
          </h2>
          <p className="text-xs text-slate-500">
            Penyusunan, pengesahan, dan pengunduhan Berita Acara Resmi berformat A4 dengan kop resmi sekolah.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'create'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Formulir Berita Acara
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'preview'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pratinjau Dokumen
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Arsip Dokumen ({documents.length})</span>
          </button>
        </div>
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

      {/* TAB 1: FORMULIR BERITA ACARA */}
      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-700" />
              <span>Detail Pelaksanaan Pemungutan Suara</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nomor Surat / Dokumen:
                </label>
                <input
                  type="text"
                  value={formData.doc_number}
                  onChange={(e) => setFormData({ ...formData, doc_number: e.target.value })}
                  placeholder="042/PAN-OSIS/SMPN1-SKM/X/2026"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Hari & Tanggal Pelaksanaan:
                </label>
                <input
                  type="date"
                  value={formData.execution_date}
                  onChange={(e) => setFormData({ ...formData, execution_date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Waktu Pelaksanaan:
                </label>
                <input
                  type="text"
                  value={formData.execution_time}
                  onChange={(e) => setFormData({ ...formData, execution_time: e.target.value })}
                  placeholder="08:00 - 13:00 WITA"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tempat Pelaksanaan:
                </label>
                <input
                  type="text"
                  value={formData.execution_place}
                  onChange={(e) => setFormData({ ...formData, execution_place: e.target.value })}
                  placeholder="Aula Serbaguna SMPN 1 Sukamulia"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 text-xs mb-1">
                Catatan Penyelenggaraan / Saksi Panitia:
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition text-slate-800 text-xs"
              />
            </div>

            {/* Signers Info */}
            <div className="pt-3 border-t border-slate-100">
              <h4 className="font-bold text-slate-800 text-xs mb-2">Penandatangan Resmi:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-slate-600">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-800 block">Ketua Panitia:</span>
                  <span>{school.committee_chair || 'Ahmad Fauzi, S.Pd.'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-800 block">Sekretaris:</span>
                  <span>{school.committee_secretary || 'Nurul Hidayati, S.Pd.'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-800 block">Kepala Sekolah:</span>
                  <span>{school.principal_name || 'Drs. H. M. Zainuddin, M.Pd.'}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-2.5 rounded-xl transition border border-slate-200"
              >
                <Eye className="w-4 h-4" />
                <span>Lihat Pratinjau Dokumen</span>
              </button>

              <button
                type="button"
                disabled={isGeneratingPdf}
                onClick={handleSaveAndDownload}
                className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-md shadow-emerald-950/20 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isGeneratingPdf ? 'Memproses PDF...' : 'Simpan & Download PDF Resmi'}</span>
              </button>
            </div>
          </div>

          {/* Quick stats snapshot */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm">
                Data Hasil Terverifikasi Sistem
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-600">DPT (Total Pemilih):</span>
                  <span className="font-bold text-slate-900">{results.totalEligible} Orang</span>
                </div>
                <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-600">Menggunakan Hak Suara:</span>
                  <span className="font-bold text-emerald-700">{results.totalVoted} Orang</span>
                </div>
                <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-600">Tidak Memilih (Golput):</span>
                  <span className="font-bold text-slate-700">{results.totalUnvoted} Orang</span>
                </div>
                <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-600">Persentase Partisipasi:</span>
                  <span className="font-bold text-slate-900">{results.participationRate}%</span>
                </div>
                <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-600">Total Suara Sah:</span>
                  <span className="font-bold text-emerald-700">{results.totalValidVotes} Suara</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 leading-relaxed">
                <FileCheck className="w-4 h-4 text-emerald-600 mb-1 inline mr-1" />
                Data di atas diambil langsung dari rekaman transaksi PostgreSQL dan dijamin sesuai hasil pemungutan suara digital.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRATINJAU DOKUMEN BERITA ACARA */}
      {activeTab === 'preview' && (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl max-w-4xl mx-auto space-y-6 font-serif">
          {/* Action floating bar */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 font-sans">
            <span className="text-xs font-bold text-slate-500 uppercase">
              Pratinjau Tata Letak Format A4
            </span>
            <button
              onClick={handleSaveAndDownload}
              className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download File PDF</span>
            </button>
          </div>

          {/* Document Header (Kop Surat) */}
          <div className="flex items-center gap-5 pb-4 border-b-4 border-double border-slate-800 text-center">
            <img
              src={school.logo_url || '/logo-smpn1sukamulia.png'}
              alt="Logo"
              className="w-20 h-20 object-contain shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo-smpn1sukamulia.png';
              }}
            />
            <div className="flex-1">
              <h4 className="text-xs uppercase tracking-widest text-slate-800">
                Pemerintah Kabupaten Lombok Timur
              </h4>
              <h4 className="text-xs uppercase tracking-widest text-slate-800">
                Dinas Pendidikan dan Kebudayaan
              </h4>
              <h2 className="text-xl font-black text-slate-900 tracking-wider mt-0.5">
                {school.name.toUpperCase()}
              </h2>
              <p className="text-[11px] italic text-slate-600 mt-1">
                {school.address}
              </p>
              <p className="text-[11px] italic text-slate-600">
                Telp: {school.contact_phone} | Email: {school.contact_email}
              </p>
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-1">
            <h3 className="text-base font-bold text-slate-900 underline uppercase tracking-wide">
              {formData.title}
            </h3>
            <p className="text-xs font-bold text-slate-800 uppercase">
              Pemilihan Ketua dan Wakil Ketua OSIS Periode {election.academic_year}
            </p>
            <p className="text-xs text-slate-600 font-sans">
              Nomor: {formData.doc_number}
            </p>
          </div>

          {/* Narrative preamble */}
          <p className="text-xs text-slate-800 leading-relaxed text-justify">
            Pada hari ini, <strong>{new Date(formData.execution_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>, bertempat di {formData.execution_place}, telah diselenggarakan kegiatan Pemungutan dan Penghitungan Suara Pemilihan Ketua dan Wakil Ketua OSIS SMP Negeri 1 Sukamulia Periode {election.academic_year} secara elektronik (E-Voting) yang berlangsung tertib, jujur, dan adil.
          </p>

          {/* Section 1: Data Pemilih */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase text-slate-900">
              I. Data Pemilih dan Penggunaan Hak Suara
            </h4>
            <table className="w-full text-xs border border-slate-800 font-sans">
              <tbody className="divide-y divide-slate-800">
                <tr>
                  <td className="p-2 border-r border-slate-800 w-10 text-center">1</td>
                  <td className="p-2 border-r border-slate-800">Jumlah Siswa Terdaftar Dalam DPT</td>
                  <td className="p-2 border-r border-slate-800 text-center font-bold">{results.totalEligible} Orang</td>
                  <td className="p-2 text-center">100% Hak Pilih</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-800 text-center">2</td>
                  <td className="p-2 border-r border-slate-800">Jumlah Siswa yang Menggunakan Hak Suara</td>
                  <td className="p-2 border-r border-slate-800 text-center font-bold">{results.totalVoted} Orang</td>
                  <td className="p-2 text-center">{results.participationRate}% Partisipasi</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-800 text-center">3</td>
                  <td className="p-2 border-r border-slate-800">Jumlah Siswa yang Tidak Menggunakan Hak Suara (Golput)</td>
                  <td className="p-2 border-r border-slate-800 text-center font-bold">{results.totalUnvoted} Orang</td>
                  <td className="p-2 text-center">{(100 - results.participationRate).toFixed(1)}%</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-800 text-center">4</td>
                  <td className="p-2 border-r border-slate-800">Jumlah Suara Sah Masuk</td>
                  <td className="p-2 border-r border-slate-800 text-center font-bold text-emerald-800">{results.totalValidVotes} Suara</td>
                  <td className="p-2 text-center">Tervalidasi Digital</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 2: Hasil Perolehan Suara */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase text-slate-900">
              II. Rincian Perolehan Suara Pasangan Calon
            </h4>
            <table className="w-full text-xs border border-slate-800 font-sans">
              <thead className="bg-slate-100 border-b border-slate-800">
                <tr>
                  <th className="p-2 border-r border-slate-800 text-center w-16">No. Urut</th>
                  <th className="p-2 border-r border-slate-800">Pasangan Calon (Ketua & Wakil)</th>
                  <th className="p-2 border-r border-slate-800 text-center">Perolehan Suara</th>
                  <th className="p-2 text-center">Persentase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {results.candidateResults.map(c => (
                  <tr key={c.id}>
                    <td className="p-2 border-r border-slate-800 text-center font-bold">{c.ballot_number}</td>
                    <td className="p-2 border-r border-slate-800">
                      <strong>{c.leader_name}</strong> & <strong>{c.vice_leader_name}</strong>
                    </td>
                    <td className="p-2 border-r border-slate-800 text-center font-bold">{c.vote_count} Suara</td>
                    <td className="p-2 text-center font-bold">{c.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 3: Penetapan */}
          <div className="space-y-1 text-xs text-slate-800 leading-relaxed">
            <h4 className="font-bold uppercase text-slate-900">
              III. Penetapan Hasil
            </h4>
            <p>
              {results.isTie ? (
                <span>Terjadi hasil seri (draw) pada perolehan suara tertinggi. Penentuan keputusan akhir dilimpahkan kepada musyawarah panitia dan pihak sekolah.</span>
              ) : results.winner ? (
                <span>Berdasarkan hasil penghitungan suara di atas, pasangan calon Nomor Urut <strong>{results.winner.ballot_number}</strong> atas nama <strong>{results.winner.leader_name}</strong> dan <strong>{results.winner.vice_leader_name}</strong> dinyatakan sebagai <strong>Ketua dan Wakil Ketua OSIS Terpilih</strong> Periode {election.academic_year}.</span>
              ) : (
                <span>Belum ada data suara sah yang masuk.</span>
              )}
            </p>
          </div>

          {/* Signatures */}
          <div className="pt-8 text-xs font-sans">
            <div className="text-right mb-4">
              Sukamulia, {new Date(formData.execution_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <div className="grid grid-cols-2 gap-8 text-center">
              <div>
                <p>Ketua Panitia Pemilihan,</p>
                <div className="h-16" />
                <p className="font-bold underline">{school.committee_chair}</p>
                {school.committee_chair_nip && (
                  <p className="text-[11px] text-slate-600">NIP. {school.committee_chair_nip}</p>
                )}
              </div>
              <div>
                <p>Sekretaris Panitia,</p>
                <div className="h-16" />
                <p className="font-bold underline">{school.committee_secretary}</p>
                {school.committee_secretary_nip && (
                  <p className="text-[11px] text-slate-600">NIP. {school.committee_secretary_nip}</p>
                )}
              </div>
            </div>

            <div className="text-center mt-6">
              <p>Mengetahui,</p>
              <p>Kepala {school.name || 'SMP Negeri 1 Sukamulia'}</p>
              <div className="h-16" />
              <p className="font-bold underline">{school.principal_name}</p>
              <p className="text-[11px] text-slate-600">
                NIP. {school.principal_nip || '19681231 199412 1 002'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RIWAYAT / ARSIP BERITA ACARA */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
              Daftar Arsip Berita Acara Tersimpan
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Total {documents.length} Dokumen
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 text-center w-12">No</th>
                  <th className="py-3.5 px-4">Nomor Dokumen</th>
                  <th className="py-3.5 px-4">Tanggal Pelaksanaan</th>
                  <th className="py-3.5 px-4 text-center">Suara Sah</th>
                  <th className="py-3.5 px-4">Dibuat Oleh</th>
                  <th className="py-3.5 px-4 text-center">Aksi Unduh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {documents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400">
                      Belum ada berita acara yang disimpan. Silakan buat pada formulir.
                    </td>
                  </tr>
                ) : (
                  documents.map((doc, idx) => (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 text-center text-slate-400 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                        {doc.doc_number || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {new Date(doc.execution_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-800">
                        {doc.total_valid_votes} Suara
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {doc.created_by}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDownloadSavedDoc(doc)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold transition border border-emerald-200"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh PDF</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
