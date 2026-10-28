import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Plus, 
  Edit3, 
  Trash2, 
  Image as ImageIcon, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  X,
  Upload,
  Info,
  ExternalLink,
  FileImage,
  Check
} from 'lucide-react';
import { Candidate, Election } from '../../types';
import { db } from '../../services/db';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { CandidatePhoto } from '../../components/common/CandidatePhoto';
import { 
  formatCandidateImageUrl, 
  isGoogleDriveUrl, 
  extractGoogleDriveFileId, 
  DEFAULT_CANDIDATE_PHOTO 
} from '../../utils/imageUrl';

interface Props {
  election: Election;
}

export const AdminCandidatesView: React.FC<Props> = ({ election }) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [previewDetail, setPreviewDetail] = useState<Candidate | null>(null);

  // Delete Confirm Modal State
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState<{
    ballot_number: number;
    leader_name: string;
    vice_leader_name: string;
    leader_class: string;
    vice_leader_class: string;
    photo_url: string;
    slogan: string;
    vision: string;
    mission: string;
    program_desc: string;
    is_active: boolean;
  }>({
    ballot_number: 1,
    leader_name: '',
    vice_leader_name: '',
    leader_class: '',
    vice_leader_class: '',
    photo_url: '',
    slogan: '',
    vision: '',
    mission: '',
    program_desc: '',
    is_active: true,
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadCandidates = () => {
    setCandidates(db.getCandidates());
  };

  useEffect(() => {
    loadCandidates();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenAddModal = () => {
    setEditingCandidate(null);
    const nextNumber = candidates.length > 0 ? Math.max(...candidates.map(c => c.ballot_number)) + 1 : 1;
    setFormData({
      ballot_number: nextNumber,
      leader_name: '',
      vice_leader_name: '',
      leader_class: 'VIII-A',
      vice_leader_class: 'VII-B',
      photo_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
      slogan: '',
      vision: '',
      mission: '',
      program_desc: '',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c: Candidate) => {
    setEditingCandidate(c);
    setFormData({
      ballot_number: c.ballot_number,
      leader_name: c.leader_name,
      vice_leader_name: c.vice_leader_name,
      leader_class: c.leader_class || '',
      vice_leader_class: c.vice_leader_class || '',
      photo_url: c.photo_url || '',
      slogan: c.slogan || '',
      vision: c.vision || '',
      mission: c.mission || '',
      program_desc: c.program_desc || '',
      is_active: c.is_active,
    });
    setIsModalOpen(true);
  };

  const handlePhotoUrlChange = (val: string) => {
    const trimmed = val.trim();
    if (isGoogleDriveUrl(trimmed)) {
      const converted = formatCandidateImageUrl(trimmed);
      setFormData(prev => ({ ...prev, photo_url: converted }));
    } else {
      setFormData(prev => ({ ...prev, photo_url: val }));
    }
  };

  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('error', 'File yang dipilih harus berupa gambar (JPG, PNG, atau WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1000;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedUrl = canvas.toDataURL('image/jpeg', 0.85);
            setFormData(prev => ({ ...prev, photo_url: compressedUrl }));
            showNotification('success', 'Foto berhasil diunggah langsung dari perangkat!');
          }
        };
        img.src = dataUrl;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.leader_name.trim() || !formData.vice_leader_name.trim()) {
      showNotification('error', 'Nama Ketua dan Wakil Ketua wajib diisi');
      return;
    }

    const payload = {
      ...formData,
      photo_url: formData.photo_url ? formatCandidateImageUrl(formData.photo_url) : formData.photo_url,
    };

    try {
      if (editingCandidate) {
        const res = await db.updateCandidate(editingCandidate.id, payload);
        if (!res.success) {
          showNotification('error', res.message || 'Gagal memperbarui kandidat');
          return;
        }
        showNotification('success', `Data pasangan calon nomor ${formData.ballot_number} berhasil diperbarui`);
      } else {
        const res = await db.addCandidate(payload);
        if (!res.success) {
          showNotification('error', res.message || 'Gagal menambahkan kandidat');
          return;
        }
        showNotification('success', `Pasangan calon nomor ${formData.ballot_number} berhasil didaftarkan`);
      }
      setIsModalOpen(false);
      loadCandidates();
    } catch (err: any) {
      showNotification('error', err?.message || 'Terjadi kesalahan sistem');
    }
  };

  const handleOpenDeleteConfirm = (c: Candidate) => {
    setCandidateToDelete(c);
    setIsDeleteModalOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (!candidateToDelete) return;
    setIsDeleting(true);

    try {
      const res = await db.deleteCandidate(candidateToDelete.id);
      if (res.success) {
        showNotification('success', res.message);
        loadCandidates();
        setIsDeleteModalOpen(false);
      } else {
        showNotification('error', res.message);
      }
    } catch (e: any) {
      showNotification('error', e?.message || 'Gagal menghapus kandidat');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Data Calon Ketua & Wakil Ketua OSIS
          </h2>
          <p className="text-xs text-slate-500">
            Kelola nomor urut, foto resmi, visi, misi, dan profil pasangan calon peserta pemilihan.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-md shadow-emerald-950/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pasangan Calon</span>
        </button>
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
          <button onClick={() => setNotification(null)}>
            <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
          </button>
        </div>
      )}

      {/* Candidates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {candidates.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col justify-between"
          >
            {/* Header Photo */}
            <div className="relative h-52 bg-slate-100 overflow-hidden">
              <CandidatePhoto
                photoUrl={c.photo_url}
                altText={`${c.leader_name} & ${c.vice_leader_name}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Number Badge */}
              <div className="absolute top-4 left-4 w-11 h-11 rounded-2xl bg-emerald-600 text-white font-black text-xl flex items-center justify-center shadow-lg border-2 border-white">
                {c.ballot_number}
              </div>

              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  c.is_active ? 'bg-emerald-500/90 text-white' : 'bg-slate-500/90 text-white'
                }`}>
                  {c.is_active ? 'Aktif di Surat Suara' : 'Nonaktif'}
                </span>
              </div>

              {/* Names overlay */}
              <div className="absolute bottom-3 left-4 right-4 text-white">
                <h4 className="font-extrabold text-base leading-tight">
                  {c.leader_name}
                </h4>
                <p className="text-xs text-slate-200">
                  & {c.vice_leader_name}
                </p>
                <div className="text-[10px] text-amber-300 font-semibold mt-0.5">
                  Kelas: {c.leader_class || '-'} & {c.vice_leader_class || '-'}
                </div>
              </div>
            </div>

            {/* Slogan and Vision */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-3 text-xs">
              <div>
                {c.slogan && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-900 font-semibold italic text-center mb-2">
                    "{c.slogan}"
                  </div>
                )}
                <div>
                  <span className="font-bold text-slate-800">Visi:</span>
                  <p className="text-slate-600 line-clamp-3 mt-0.5 leading-relaxed">
                    {c.vision}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setPreviewDetail(c)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Detail Visi/Misi</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEditModal(c)}
                    className="p-2 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
                    title="Edit Pasangan Calon"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenDeleteConfirm(c)}
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Hapus Pasangan Calon"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add / Edit Candidate */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">
                {editingCandidate ? 'Edit Data Pasangan Calon' : 'Tambah Pasangan Calon Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-1 overflow-y-auto space-y-4 pt-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nomor Urut <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={formData.ballot_number}
                    onChange={(e) => setFormData({ ...formData, ballot_number: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition text-slate-800 font-bold"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Slogan Pasangan:
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: BERAKSI, SINERGI..."
                    value={formData.slogan}
                    onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition text-slate-800"
                  />
                </div>
              </div>

              {/* Ketua & Wakil */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Calon Ketua <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama calon ketua"
                    value={formData.leader_name}
                    onChange={(e) => setFormData({ ...formData, leader_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kelas Calon Ketua:
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: VIII-A"
                    value={formData.leader_class}
                    onChange={(e) => setFormData({ ...formData, leader_class: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Calon Wakil Ketua <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama calon wakil"
                    value={formData.vice_leader_name}
                    onChange={(e) => setFormData({ ...formData, vice_leader_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kelas Calon Wakil:
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: VII-B"
                    value={formData.vice_leader_class}
                    onChange={(e) => setFormData({ ...formData, vice_leader_class: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition text-slate-800"
                  />
                </div>
              </div>

              {/* Photo Configuration Area */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800 text-xs">
                    Foto Pasangan Calon (Google Drive / URL / Upload File)
                  </label>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100/70 font-semibold px-2 py-0.5 rounded-full">
                    Mendukung Link Google Drive
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-start">
                  {/* Live Photo Preview */}
                  <div className="relative w-28 h-32 rounded-2xl overflow-hidden bg-slate-200 border-2 border-emerald-600/30 shrink-0 shadow-xs flex items-center justify-center group">
                    <CandidatePhoto
                      photoUrl={formData.photo_url}
                      altText="Preview Foto"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] text-center py-0.5 font-bold">
                      Preview Foto
                    </div>
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <div>
                      <input
                        type="text"
                        placeholder="Tempel link Google Drive atau URL foto di sini..."
                        value={formData.photo_url}
                        onChange={(e) => handlePhotoUrlChange(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 transition text-slate-800 text-xs font-mono"
                      />
                    </div>

                    {/* Google Drive Detection Banner */}
                    {isGoogleDriveUrl(formData.photo_url) && (
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200 font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Link Google Drive berhasil dikenali dan dikonversi otomatis ke format gambar langsung.</span>
                      </div>
                    )}

                    {/* Buttons: Direct File Upload & Default Image */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-[11px] cursor-pointer transition shadow-xs">
                        <Upload className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Pilih Foto dari Perangkat</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLocalImageUpload}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, photo_url: DEFAULT_CANDIDATE_PHOTO })}
                        className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-medium text-[11px] transition"
                      >
                        Gunakan Foto Standar
                      </button>
                    </div>

                    {/* Google Drive Instruction Guide */}
                    <div className="text-[11px] text-slate-500 bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 flex items-start gap-2">
                      <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <strong className="text-amber-900 font-semibold">Petunjuk Link Google Drive:</strong>
                        <p className="mt-0.5">
                          1. Di Google Drive, klik kanan foto &rarr; pilih <strong>Bagikan (Share)</strong>.
                          <br />
                          2. Pada Akses Umum, ubah dari <em>Dibatasi</em> menjadi <strong className="text-amber-950 font-bold">"Siapa saja yang memiliki link" (Anyone with the link)</strong>.
                          <br />
                          3. Salin link dan tempelkan di kotak di atas. Foto akan langsung tampil otomatis.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visi */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Visi Pasangan Calon <span className="text-rose-500">*</span>:
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Rumusan visi pasangan calon..."
                  value={formData.vision}
                  onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition text-slate-800"
                />
              </div>

              {/* Misi */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Misi Pasangan Calon (Gunakan penomoran 1, 2, 3...) <span className="text-rose-500">*</span>:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="1. Misi pertama&#10;2. Misi kedua&#10;3. Misi ketiga..."
                  value={formData.mission}
                  onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition text-slate-800"
                />
              </div>

              {/* Program description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Program Kerja Unggulan:
                </label>
                <textarea
                  rows={2}
                  placeholder="Deskripsi program kerja unggulan..."
                  value={formData.program_desc}
                  onChange={(e) => setFormData({ ...formData, program_desc: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition text-slate-800"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveCandidate"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="isActiveCandidate" className="font-semibold text-slate-700">
                  Kandidat Aktif (Muncul di Bilik Suara Siswa)
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition shadow-sm"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Detail Modal */}
      {previewDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-6 bg-gradient-to-r from-emerald-900 to-emerald-800 text-white">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-emerald-950 text-[10px] font-bold">
                Nomor Urut {previewDetail.ballot_number}
              </span>
              <h3 className="text-lg font-bold mt-1">
                {previewDetail.leader_name} & {previewDetail.vice_leader_name}
              </h3>
              {previewDetail.slogan && (
                <p className="text-xs text-emerald-200 italic mt-0.5">
                  "{previewDetail.slogan}"
                </p>
              )}
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-slate-700">
              <div>
                <h4 className="font-bold text-emerald-900 text-sm mb-1">Visi:</h4>
                <p className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {previewDetail.vision}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-emerald-900 text-sm mb-1">Misi:</h4>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 whitespace-pre-line">
                  {previewDetail.mission}
                </div>
              </div>

              {previewDetail.program_desc && (
                <div>
                  <h4 className="font-bold text-emerald-900 text-sm mb-1">Program Kerja Unggulan:</h4>
                  <p className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {previewDetail.program_desc}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setPreviewDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Candidate Confirm Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Hapus Data Pasangan Calon"
        message={`Apakah Anda yakin ingin menghapus pasangan calon nomor urut ${candidateToDelete?.ballot_number}: "${candidateToDelete?.leader_name} & ${candidateToDelete?.vice_leader_name}"?`}
        confirmText="Ya, Hapus Kandidat"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleExecuteDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
