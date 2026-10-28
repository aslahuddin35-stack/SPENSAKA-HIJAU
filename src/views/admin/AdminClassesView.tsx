import React, { useState, useEffect } from 'react';
import { 
  Landmark, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Users,
  Filter,
  X
} from 'lucide-react';
import { ClassItem } from '../../types';
import { db } from '../../services/db';

import { ConfirmModal } from '../../components/common/ConfirmModal';

export const AdminClassesView: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<'all' | '7' | '8' | '9'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    grade_level: '7' | '8' | '9';
    description: string;
    is_active: boolean;
  }>({
    name: '',
    grade_level: '7',
    description: '',
    is_active: true,
  });

  // Delete Confirm Modal State
  const [classToDelete, setClassToDelete] = useState<ClassItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadClasses = () => {
    setClasses(db.getClasses());
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenAddModal = () => {
    setEditingClass(null);
    setFormData({
      name: '',
      grade_level: '7',
      description: '',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: ClassItem) => {
    setEditingClass(item);
    setFormData({
      name: item.name,
      grade_level: item.grade_level,
      description: item.description || '',
      is_active: item.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showNotification('error', 'Nama kelas wajib diisi');
      return;
    }

    // Check duplicate
    const existing = classes.find(
      c => c.name.toLowerCase() === formData.name.trim().toLowerCase() && c.id !== editingClass?.id
    );
    if (existing) {
      showNotification('error', `Kelas dengan nama ${formData.name} sudah ada`);
      return;
    }

    try {
      if (editingClass) {
        const res = await db.updateClass(editingClass.id, formData);
        if (!res.success) {
          showNotification('error', res.message || 'Gagal memperbarui kelas');
          return;
        }
        showNotification('success', `Kelas ${formData.name} berhasil diperbarui`);
      } else {
        const res = await db.addClass(formData);
        if (!res.success) {
          showNotification('error', res.message || 'Gagal menambahkan kelas');
          return;
        }
        showNotification('success', `Kelas ${formData.name} berhasil ditambahkan`);
      }
      setIsModalOpen(false);
      loadClasses();
    } catch (err: any) {
      showNotification('error', err?.message || 'Gagal menyimpan data kelas');
    }
  };

  const handleOpenDeleteConfirm = (item: ClassItem) => {
    setClassToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (!classToDelete) return;
    setIsDeleting(true);

    try {
      const res = await db.deleteClass(classToDelete.id);
      if (res.success) {
        showNotification('success', res.message);
        loadClasses();
        setIsDeleteModalOpen(false);
      } else {
        showNotification('error', res.message);
      }
    } catch (e: any) {
      showNotification('error', e?.message || 'Gagal menghapus kelas');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter & Search
  const filteredClasses = classes.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = gradeFilter === 'all' || c.grade_level === gradeFilter;
    return matchesSearch && matchesGrade;
  });

  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage) || 1;
  const paginatedClasses = filteredClasses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Header title & add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Manajemen Data Kelas
          </h2>
          <p className="text-xs text-slate-500">
            Kelola daftar rombongan belajar tingkat 7, 8, dan 9 SMP Negeri 1 Sukamulia.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-md shadow-emerald-950/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kelas Baru</span>
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

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama kelas..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
          />
        </div>

        {/* Grade Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Tingkat:
          </span>
          {(['all', '7', '8', '9'] as const).map((grade) => (
            <button
              key={grade}
              onClick={() => { setGradeFilter(grade); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                gradeFilter === grade
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {grade === 'all' ? 'Semua Tingkat' : `Kelas ${grade}`}
            </button>
          ))}
        </div>
      </div>

      {/* Classes Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 text-center w-12">No</th>
                <th className="py-3.5 px-4">Nama Kelas</th>
                <th className="py-3.5 px-4 text-center">Tingkat</th>
                <th className="py-3.5 px-4">Keterangan</th>
                <th className="py-3.5 px-4 text-center">Jumlah Siswa</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedClasses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Tidak ada kelas yang ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedClasses.map((item, index) => {
                  const rowNum = (currentPage - 1) * itemsPerPage + index + 1;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 text-center text-slate-400 font-mono">
                        {rowNum}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {item.name}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Tingkat {item.grade_level}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {item.description || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {item.student_count || 0} Siswa
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          item.is_active 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {item.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
                            title="Edit Kelas"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteConfirm(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Hapus Kelas"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredClasses.length)} dari {filteredClasses.length} kelas
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition font-medium"
              >
                Sebelumnya
              </button>
              <span className="px-2 font-bold text-slate-700">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition font-medium"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Add / Edit Class */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">
                {editingClass ? 'Edit Data Kelas' : 'Tambah Kelas Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Kelas <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: VII-A atau VIII-Unggulan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tingkat Kelas <span className="text-rose-500">*</span>:
                </label>
                <select
                  value={formData.grade_level}
                  onChange={(e) => setFormData({ ...formData, grade_level: e.target.value as '7' | '8' | '9' })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition text-slate-800"
                >
                  <option value="7">Tingkat 7 (Kelas VII)</option>
                  <option value="8">Tingkat 8 (Kelas VIII)</option>
                  <option value="9">Tingkat 9 (Kelas IX)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Keterangan (Opsional):
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan rombel, wali kelas, dll..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition text-slate-800"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveClass"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="isActiveClass" className="font-semibold text-slate-700">
                  Status Kelas Aktif
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Hapus Data Kelas"
        message={`Apakah Anda yakin ingin menghapus kelas "${classToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus Kelas"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleExecuteDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
