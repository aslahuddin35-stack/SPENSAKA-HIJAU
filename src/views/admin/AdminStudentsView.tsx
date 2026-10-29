import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  CreditCard, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound, 
  Eye, 
  X,
  FileCheck,
  Filter
} from 'lucide-react';
import { Student, ClassItem, School, Election } from '../../types';
import { db } from '../../services/db';
import { downloadStudentTemplate, parseStudentExcel, ParsedStudentRow } from '../../utils/excelHelper';
import { generateStudentCardsPDF } from '../../utils/pdfGenerator';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { PrintCardsModal } from '../../components/common/PrintCardsModal';
import { ProgressModal, ProgressStep, ProgressResultSummary } from '../../components/common/ProgressModal';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface Props {
  school: School;
  election: Election;
}

export const AdminStudentsView: React.FC<Props> = ({ school, election }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [votingStatusFilter, setVotingStatusFilter] = useState<'all' | 'voted' | 'unvoted'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Print Cards Modal State (Cetak Semua / Per Kelas)
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Add/Edit Student Modal
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Delete & Rotate Confirm Modal States
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const [studentToRotate, setStudentToRotate] = useState<Student | null>(null);
  const [isRotateModalOpen, setIsRotateModalOpen] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  // Progress Modal State for Operations (Excel, Bulk, etc.)
  const [progressModal, setProgressModal] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    icon?: 'settings' | 'excel' | 'database' | 'trash' | 'user' | 'printer';
    steps: ProgressStep[];
    progressPercent: number;
    currentDetail?: string;
    status: 'running' | 'completed' | 'error';
    errorMessage?: string;
    resultSummary?: ProgressResultSummary;
    primaryAction?: {
      label: string;
      onClick: () => void;
    };
  }>({
    isOpen: false,
    title: '',
    subtitle: '',
    icon: 'excel',
    steps: [],
    progressPercent: 0,
    currentDetail: '',
    status: 'running',
  });
  const [formData, setFormData] = useState<{
    nisn: string;
    full_name: string;
    class_id: string;
    birth_date: string;
    gender: 'L' | 'P';
    is_active: boolean;
  }>({
    nisn: '',
    full_name: '',
    class_id: '',
    birth_date: '',
    gender: 'L',
    is_active: true,
  });

  // Import Excel Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importedRows, setImportedRows] = useState<ParsedStudentRow[]>([]);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [importReport, setImportReport] = useState<{ total: number; valid: number; invalid: number } | null>(null);

  // Notification Toast
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = () => {
    setStudents(db.getStudents());
    const cl = db.getClasses();
    setClasses(cl);
    if (cl.length > 0 && !formData.class_id) {
      setFormData(prev => ({ ...prev, class_id: cl[0].id }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenAddModal = () => {
    setEditingStudent(null);
    setFormData({
      nisn: '',
      full_name: '',
      class_id: classes[0]?.id || '',
      birth_date: '',
      gender: 'L',
      is_active: true,
    });
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      nisn: student.nisn,
      full_name: student.full_name,
      class_id: student.class_id,
      birth_date: student.birth_date || '',
      gender: student.gender || 'L',
      is_active: student.is_active,
    });
    setIsAddEditModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nisn.trim() || !formData.full_name.trim()) {
      showNotification('error', 'NISN dan Nama Lengkap wajib diisi');
      return;
    }

    const isEditing = !!editingStudent;
    setIsAddEditModalOpen(false);

    setProgressModal({
      isOpen: true,
      title: isEditing ? 'Menyimpan Perubahan Data Siswa' : 'Mendaftarkan Siswa Baru',
      subtitle: `Siswa: ${formData.full_name} (NISN: ${formData.nisn})`,
      icon: 'user',
      status: 'running',
      progressPercent: 25,
      currentDetail: 'Memvalidasi data dan format NISN...',
      steps: [
        { id: '1', label: 'Validasi kelengkapan form & format NISN 10-digit', status: 'running' },
        { id: '2', label: isEditing ? 'Memperbarui data profil siswa' : 'Menerbitkan token login unik otomatis', status: 'pending' },
        { id: '3', label: 'Menyimpan ke basis data & sinkronisasi Supabase', status: 'pending' },
      ],
    });

    try {
      await sleep(250);
      setProgressModal(prev => ({
        ...prev,
        progressPercent: 60,
        currentDetail: isEditing ? 'Menyimpan data profil...' : 'Menerbitkan token login siswa...',
        steps: prev.steps.map(s => s.id === '1' ? { ...s, status: 'completed' } : s.id === '2' ? { ...s, status: 'running' } : s),
      }));

      let studentResult: any;
      if (isEditing && editingStudent) {
        const res = await db.updateStudent(editingStudent.id, formData);
        if (!res.success) {
          throw new Error(res.message || 'Gagal memperbarui data siswa');
        }
        studentResult = res.student;
      } else {
        const res = await db.addStudent(formData);
        if (!res.success) {
          throw new Error(res.message || 'Gagal menambahkan siswa baru');
        }
        studentResult = res.student;
      }

      await sleep(250);
      loadData();

      const className = classes.find(c => c.id === formData.class_id)?.name || '-';
      setProgressModal(prev => ({
        ...prev,
        progressPercent: 100,
        status: 'completed',
        currentDetail: isEditing ? 'Perubahan berhasil disimpan!' : 'Siswa baru berhasil didaftarkan!',
        steps: prev.steps.map(s => ({ ...s, status: 'completed' })),
        resultSummary: {
          title: isEditing ? 'Data Siswa Berhasil Diperbarui' : 'Siswa Baru Berhasil Didaftarkan',
          items: [
            { label: 'Nama Lengkap', value: formData.full_name },
            { label: 'NISN', value: formData.nisn },
            { label: 'Kelas', value: className },
            { label: 'Token Login', value: studentResult?.token_preview || 'Aktif', badge: 'Siap Pakai' },
          ],
          note: isEditing ? 'Pembaruan data siswa langsung tersinkron di DPT.' : 'Siswa dapat menggunakan NISN dan Token di atas untuk masuk ke bilik suara.',
        },
      }));

      showNotification('success', isEditing ? `Data siswa ${formData.full_name} berhasil diperbarui` : `Siswa ${formData.full_name} berhasil ditambahkan`);
    } catch (err: any) {
      setProgressModal(prev => ({
        ...prev,
        status: 'error',
        errorMessage: err?.message || 'Terjadi kesalahan sistem saat menyimpan siswa',
        steps: prev.steps.map(s => s.status === 'running' ? { ...s, status: 'error' } : s),
      }));
      showNotification('error', err?.message || 'Terjadi kesalahan sistem');
    }
  };

  const handleOpenDeleteConfirm = (student: Student) => {
    setStudentToDelete(student);
    setIsDeleteModalOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (!studentToDelete) return;
    setIsDeleteModalOpen(false);

    setProgressModal({
      isOpen: true,
      title: 'Menghapus Data Siswa',
      subtitle: `Siswa: ${studentToDelete.full_name} (NISN: ${studentToDelete.nisn})`,
      icon: 'trash',
      status: 'running',
      progressPercent: 30,
      currentDetail: 'Menghapus token login dan rekaman siswa...',
      steps: [
        { id: '1', label: 'Memverifikasi status hak suara siswa', status: 'running' },
        { id: '2', label: 'Menghapus kredensial token dari database', status: 'pending' },
        { id: '3', label: 'Menghapus data siswa dari Supabase & memori lokal', status: 'pending' },
      ],
    });

    try {
      await sleep(250);
      setProgressModal(prev => ({
        ...prev,
        progressPercent: 70,
        currentDetail: 'Menghapus dari cloud database Supabase...',
        steps: prev.steps.map(s => s.id === '1' ? { ...s, status: 'completed' } : s.id === '2' ? { ...s, status: 'running' } : s),
      }));

      const res = await db.deleteStudent(studentToDelete.id);
      await sleep(200);

      if (res.success) {
        loadData();
        setProgressModal(prev => ({
          ...prev,
          progressPercent: 100,
          status: 'completed',
          currentDetail: 'Data siswa berhasil dihapus!',
          steps: prev.steps.map(s => ({ ...s, status: 'completed' })),
          resultSummary: {
            title: 'Penghapusan Siswa Berhasil',
            items: [
              { label: 'Nama Siswa', value: studentToDelete.full_name },
              { label: 'NISN', value: studentToDelete.nisn },
              { label: 'Status Token', value: 'Dicabut Permanen', badge: 'Terhapus' },
            ],
            note: 'Data pemilih telah dikeluarkan dari Daftar Pemilih Tetap (DPT).',
          },
        }));
        showNotification('success', res.message);
      } else {
        setProgressModal(prev => ({
          ...prev,
          status: 'error',
          errorMessage: res.message,
          steps: prev.steps.map(s => s.status === 'running' ? { ...s, status: 'error' } : s),
        }));
        showNotification('error', res.message);
      }
    } catch (e: any) {
      setProgressModal(prev => ({
        ...prev,
        status: 'error',
        errorMessage: e?.message || 'Gagal menghapus siswa',
        steps: prev.steps.map(s => s.status === 'running' ? { ...s, status: 'error' } : s),
      }));
      showNotification('error', e?.message || 'Gagal menghapus siswa');
    }
  };

  const handleExecuteDeleteAll = async () => {
    setIsDeleteAllModalOpen(false);

    setProgressModal({
      isOpen: true,
      title: 'Mengosongkan Seluruh Data Siswa',
      subtitle: 'Menghapus seluruh siswa, token kredensial, dan rekapitulasi DPT',
      icon: 'trash',
      status: 'running',
      progressPercent: 20,
      currentDetail: 'Menghapus token login dan foreign keys...',
      steps: [
        { id: '1', label: 'Menghapus seluruh kredensial token login', status: 'running' },
        { id: '2', label: 'Menghapus riwayat partisipasi pemilih', status: 'pending' },
        { id: '3', label: 'Menghapus seluruh data siswa di Supabase', status: 'pending' },
        { id: '4', label: 'Mengosongkan cache DPT lokal', status: 'pending' },
      ],
    });

    try {
      await sleep(300);
      setProgressModal(prev => ({
        ...prev,
        progressPercent: 55,
        currentDetail: 'Menghapus data siswa dari cloud database...',
        steps: prev.steps.map(s => (s.id === '1' || s.id === '2') ? { ...s, status: 'completed' } : s.id === '3' ? { ...s, status: 'running' } : s),
      }));

      const res = await db.deleteAllStudents();
      await sleep(250);

      if (res.success) {
        setSelectedIds(new Set());
        loadData();

        setProgressModal(prev => ({
          ...prev,
          progressPercent: 100,
          status: 'completed',
          currentDetail: 'Seluruh data siswa berhasil dikosongkan!',
          steps: prev.steps.map(s => ({ ...s, status: 'completed' })),
          resultSummary: {
            title: 'Pengosongan Data Siswa Berhasil',
            items: [
              { label: 'Jumlah Siswa Dihapus', value: `${res.deletedCount} Siswa`, badge: 'Dibersihkan' },
              { label: 'Token Kredensial', value: '0 Token Aktif' },
              { label: 'Status DPT', value: 'Kosong (Siap Impor Ulang)' },
            ],
            note: 'Database siswa kini bersih. Anda dapat mengimpor berkas Excel baru sewaktu-waktu.',
          },
        }));
        showNotification('success', res.message);
      } else {
        setProgressModal(prev => ({
          ...prev,
          status: 'error',
          errorMessage: res.message,
          steps: prev.steps.map(s => s.status === 'running' ? { ...s, status: 'error' } : s),
        }));
        showNotification('error', res.message);
      }
    } catch (e: any) {
      setProgressModal(prev => ({
        ...prev,
        status: 'error',
        errorMessage: e?.message || 'Gagal menghapus seluruh data siswa',
        steps: prev.steps.map(s => s.status === 'running' ? { ...s, status: 'error' } : s),
      }));
      showNotification('error', e?.message || 'Gagal menghapus seluruh data siswa');
    }
  };

  const handleExecuteBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const countToDelete = selectedIds.size;
    setIsBulkDeleteModalOpen(false);

    setProgressModal({
      isOpen: true,
      title: 'Menghapus Siswa Terpilih',
      subtitle: `Menghapus ${countToDelete} siswa dari Daftar Pemilih Tetap`,
      icon: 'trash',
      status: 'running',
      progressPercent: 25,
      currentDetail: 'Memverifikasi status hak suara siswa...',
      steps: [
        { id: '1', label: 'Validasi hak suara siswa terpilih', status: 'running' },
        { id: '2', label: 'Menghapus token kredensial siswa terpilih', status: 'pending' },
        { id: '3', label: 'Menghapus rekaman siswa dari database', status: 'pending' },
      ],
    });

    try {
      await sleep(250);
      setProgressModal(prev => ({
        ...prev,
        progressPercent: 65,
        currentDetail: 'Menghapus rekaman dari database awan...',
        steps: prev.steps.map(s => s.id === '1' ? { ...s, status: 'completed' } : s.id === '2' ? { ...s, status: 'running' } : s),
      }));

      const res = await db.deleteMultipleStudents(Array.from(selectedIds));
      await sleep(250);

      if (res.success) {
        setSelectedIds(new Set());
        loadData();

        setProgressModal(prev => ({
          ...prev,
          progressPercent: 100,
          status: 'completed',
          currentDetail: `Berhasil menghapus ${res.deletedCount} siswa terpilih!`,
          steps: prev.steps.map(s => ({ ...s, status: 'completed' })),
          resultSummary: {
            title: 'Penghapusan Masal Berhasil',
            items: [
              { label: 'Siswa Dihapus', value: `${res.deletedCount} Siswa`, badge: 'Selesai' },
              { label: 'Sisa Pemilih Terdaftar', value: `${students.length - res.deletedCount} Siswa` },
            ],
            note: 'Daftar pemilih terpilih telah dihapus secara aman dari sistem.',
          },
        }));
        showNotification('success', res.message);
      } else {
        setProgressModal(prev => ({
          ...prev,
          status: 'error',
          errorMessage: res.message,
          steps: prev.steps.map(s => s.status === 'running' ? { ...s, status: 'error' } : s),
        }));
        showNotification('error', res.message);
      }
    } catch (e: any) {
      setProgressModal(prev => ({
        ...prev,
        status: 'error',
        errorMessage: e?.message || 'Gagal menghapus siswa terpilih',
        steps: prev.steps.map(s => s.status === 'running' ? { ...s, status: 'error' } : s),
      }));
      showNotification('error', e?.message || 'Gagal menghapus siswa terpilih');
    }
  };

  const handleOpenRotateConfirm = (student: Student) => {
    setStudentToRotate(student);
    setIsRotateModalOpen(true);
  };

  const handleExecuteRotate = async () => {
    if (!studentToRotate) return;
    setIsRotateModalOpen(false);

    setProgressModal({
      isOpen: true,
      title: 'Penerbitan Ulang Token Siswa',
      subtitle: `Siswa: ${studentToRotate.full_name} (NISN: ${studentToRotate.nisn})`,
      icon: 'user',
      status: 'running',
      progressPercent: 30,
      currentDetail: 'Mencabut token lama dan membuat token baru...',
      steps: [
        { id: '1', label: 'Verifikasi status belum memilih', status: 'running' },
        { id: '2', label: 'Menghasilkan token kriptografis 6-karakter baru', status: 'pending' },
        { id: '3', label: 'Menyimpan token baru ke Supabase', status: 'pending' },
      ],
    });

    try {
      await sleep(250);
      setProgressModal(prev => ({
        ...prev,
        progressPercent: 70,
        currentDetail: 'Menyimpan kredensial baru ke database...',
        steps: prev.steps.map(s => s.id === '1' ? { ...s, status: 'completed' } : s.id === '2' ? { ...s, status: 'running' } : s),
      }));

      const res = await db.rotateToken(studentToRotate.id);
      await sleep(200);

      if (res.success) {
        loadData();
        setProgressModal(prev => ({
          ...prev,
          progressPercent: 100,
          status: 'completed',
          currentDetail: 'Token baru berhasil diterbitkan!',
          steps: prev.steps.map(s => ({ ...s, status: 'completed' })),
          resultSummary: {
            title: 'Rotasi Token Berhasil',
            items: [
              { label: 'Siswa', value: studentToRotate.full_name },
              { label: 'Token Baru', value: res.newToken || '-', badge: 'Aktif' },
              { label: 'Token Lama', value: 'Dicabut' },
            ],
            note: 'Berikan token baru ini kepada siswa yang bersangkutan untuk login ke bilik suara.',
          },
        }));
        showNotification('success', `Token baru berhasil diterbitkan: ${res.newToken}`);
      } else {
        setProgressModal(prev => ({
          ...prev,
          status: 'error',
          errorMessage: res.message || 'Gagal menerbitkan ulang token',
          steps: prev.steps.map(s => s.status === 'running' ? { ...s, status: 'error' } : s),
        }));
        showNotification('error', res.message || 'Gagal menerbitkan ulang token');
      }
    } catch (e: any) {
      setProgressModal(prev => ({
        ...prev,
        status: 'error',
        errorMessage: e?.message || 'Gagal merotasi token',
        steps: prev.steps.map(s => s.status === 'running' ? { ...s, status: 'error' } : s),
      }));
      showNotification('error', e?.message || 'Gagal merotasi token');
    }
  };

  // Bulk selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(filteredStudents.map(s => s.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelect = (id: string) => {
    const updated = new Set(selectedIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedIds(updated);
  };

  // Download Cards PDF
  const handleDownloadCards = async (mode: 'all' | 'selected' | 'single', singleStudent?: Student) => {
    let targetStudents: Student[] = [];

    if (mode === 'single' && singleStudent) {
      targetStudents = [singleStudent];
    } else if (mode === 'selected') {
      targetStudents = students.filter(s => selectedIds.has(s.id));
      if (targetStudents.length === 0) {
        showNotification('error', 'Pilih minimal satu siswa untuk mengunduh kartu.');
        return;
      }
    } else {
      targetStudents = students.filter(s => s.is_active);
      if (targetStudents.length === 0) {
        showNotification('error', 'Tidak ada data siswa aktif.');
        return;
      }
    }

    setProgressModal({
      isOpen: true,
      title: 'Membuat Berkas PDF Kartu Login',
      subtitle: `Menyiapkan ${targetStudents.length} kartu pemilih dalam format A4 cetak`,
      icon: 'printer',
      status: 'running',
      progressPercent: 25,
      currentDetail: `Menyiapkan data ${targetStudents.length} kartu pemilih...`,
      steps: [
        { id: '1', label: 'Mengumpulkan data siswa & token unik', status: 'running' },
        { id: '2', label: 'Menyusun tata letak lembar A4 & garis gunting', status: 'pending' },
        { id: '3', label: 'Merender logo sekolah & petunjuk teknis pemilihan', status: 'pending' },
        { id: '4', label: 'Menghasilkan berkas PDF siap unduh', status: 'pending' },
      ],
    });

    try {
      await sleep(300);
      setProgressModal(prev => ({
        ...prev,
        progressPercent: 65,
        currentDetail: 'Merender elemen grafis kartu login...',
        steps: prev.steps.map(s => (s.id === '1' || s.id === '2') ? { ...s, status: 'completed' } : s.id === '3' ? { ...s, status: 'running' } : s),
      }));

      await generateStudentCardsPDF(targetStudents, school, election);
      await sleep(250);

      setProgressModal(prev => ({
        ...prev,
        progressPercent: 100,
        status: 'completed',
        currentDetail: 'File PDF berhasil diunduh ke perangkat Anda!',
        steps: prev.steps.map(s => ({ ...s, status: 'completed' })),
        resultSummary: {
          title: 'Kartu Login Siswa Siap Cetak',
          items: [
            { label: 'Jumlah Kartu', value: `${targetStudents.length} Kartu`, badge: 'Selesai' },
            { label: 'Ukuran Kertas', value: 'A4 Portrait (8 kartu / lbr)' },
            { label: 'Pengaman', value: 'Token Kriptografis Unik' },
          ],
          note: 'Gunakan gunting atau pemotong kertas mengikuti garis putus-putus pada cetakan A4.',
        },
      }));

      showNotification('success', `Berhasil membuat file PDF untuk ${targetStudents.length} kartu login!`);
    } catch (e: any) {
      setProgressModal(prev => ({
        ...prev,
        status: 'error',
        errorMessage: 'Gagal membuat file PDF kartu login.',
        steps: prev.steps.map(s => s.status === 'running' ? { ...s, status: 'error' } : s),
      }));
      showNotification('error', 'Gagal membuat file PDF kartu login');
    }
  };

  // Excel Upload Handler with Real-Time Progress Feedback
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingExcel(true);
    setProgressModal({
      isOpen: true,
      title: 'Membaca & Memvalidasi File Excel Siswa',
      subtitle: `Memproses berkas: ${file.name}`,
      icon: 'excel',
      status: 'running',
      progressPercent: 20,
      currentDetail: `Membaca berkas ${file.name}...`,
      steps: [
        { id: '1', label: 'Membaca berkas Excel (.xlsx / .csv)', status: 'running' },
        { id: '2', label: 'Mengurai baris lembar kerja & kolom', status: 'pending' },
        { id: '3', label: 'Memvalidasi format NISN 10-digit & cek duplikasi', status: 'pending' },
      ],
    });

    try {
      await sleep(250);
      setProgressModal(prev => ({
        ...prev,
        progressPercent: 50,
        currentDetail: 'Menguraikan baris lembar kerja...',
        steps: prev.steps.map(s => s.id === '1' ? { ...s, status: 'completed' } : s.id === '2' ? { ...s, status: 'running' } : s),
      }));

      const result = await parseStudentExcel(file, (percent, msg) => {
        setProgressModal(prev => ({
          ...prev,
          progressPercent: Math.max(prev.progressPercent, percent),
          currentDetail: msg,
        }));
      });

      await sleep(250);
      setImportedRows(result.rows);
      setImportReport({
        total: result.totalRows,
        valid: result.validRows.length,
        invalid: result.invalidRows.length,
      });

      setProgressModal(prev => ({
        ...prev,
        progressPercent: 100,
        status: 'completed',
        currentDetail: `Pemeriksaan selesai: ${result.validRows.length} baris valid dari total ${result.totalRows} baris.`,
        steps: prev.steps.map(s => ({ ...s, status: 'completed' })),
        resultSummary: {
          title: 'Hasil Pemeriksaan Berkas Excel',
          items: [
            { label: 'Nama Berkas', value: file.name },
            { label: 'Total Baris Terbaca', value: `${result.totalRows} Siswa` },
            { label: 'Baris Data Valid', value: `${result.validRows.length} Siswa`, badge: 'Siap Impor' },
            { label: 'Baris Bermasalah', value: `${result.invalidRows.length} Baris`, badge: result.invalidRows.length > 0 ? 'Perlu Cek' : 'Nihil' },
          ],
          note: result.validRows.length > 0
            ? 'Klik tombol "Buka Pratinjau & Konfirmasi" untuk meninjau data sebelum dimasukkan ke database.'
            : 'Seluruh baris memiliki kendala format. Periksa pesan error pada tabel pratinjau.',
        },
        primaryAction: {
          label: 'Buka Pratinjau & Konfirmasi',
          onClick: () => {
            setProgressModal(prev => ({ ...prev, isOpen: false }));
            setIsImportModalOpen(true);
          },
        },
      }));
    } catch (err: any) {
      setProgressModal(prev => ({
        ...prev,
        status: 'error',
        errorMessage: 'Gagal membaca file Excel. Pastikan format file sesuai template yang disediakan.',
        steps: prev.steps.map(s => s.status === 'running' ? { ...s, status: 'error' } : s),
      }));
      showNotification('error', 'Gagal membaca file Excel. Pastikan format file sesuai template.');
    } finally {
      setIsParsingExcel(false);
      e.target.value = '';
    }
  };

  // Confirm Import with Live Granular Progress Ticker
  const handleConfirmImport = async () => {
    const validRows = importedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      showNotification('error', 'Tidak ada baris data valid untuk diimpor.');
      return;
    }

    setIsImportModalOpen(false);

    setProgressModal({
      isOpen: true,
      title: 'Memproses Impor Data Siswa dari Excel',
      subtitle: `Menyimpan ${validRows.length} siswa dan menerbitkan token login kriptografis`,
      icon: 'excel',
      status: 'running',
      progressPercent: 10,
      currentDetail: 'Menyiapkan alokasi kelas dan struktur database...',
      steps: [
        { id: '1', label: 'Inisialisasi & pemetaan kelas siswa', status: 'running' },
        { id: '2', label: 'Membuat token login unik & enkripsi kredensial', status: 'pending' },
        { id: '3', label: 'Menyimpan data pemilih ke basis data lokal & Supabase', status: 'pending' },
        { id: '4', label: 'Rekapitulasi DPT dan finalisasi kartu login siap cetak', status: 'pending' },
      ],
    });

    try {
      await sleep(300);
      setProgressModal(prev => ({
        ...prev,
        progressPercent: 20,
        currentDetail: 'Menerbitkan token unik untuk setiap siswa...',
        steps: prev.steps.map(s => s.id === '1' ? { ...s, status: 'completed' } : s.id === '2' ? { ...s, status: 'running' } : s),
      }));

      const res = await db.importStudents(validRows, (info) => {
        // Map 20% -> 85% range for the student loop
        const scaledPercent = Math.min(85, Math.max(20, Math.round(20 + (info.percent * 0.65))));
        setProgressModal(prev => ({
          ...prev,
          progressPercent: scaledPercent,
          currentDetail: `[${info.current}/${info.total}] ${info.stage}`,
        }));
      });

      setProgressModal(prev => ({
        ...prev,
        progressPercent: 90,
        currentDetail: 'Menyelesaikan sinkronisasi Supabase dan DPT...',
        steps: prev.steps.map(s => (s.id === '1' || s.id === '2') ? { ...s, status: 'completed' } : s.id === '3' ? { ...s, status: 'running' } : s),
      }));

      await sleep(350);

      loadData();
      setImportedRows([]);
      setImportReport(null);

      setProgressModal(prev => ({
        ...prev,
        progressPercent: 100,
        status: 'completed',
        currentDetail: `Berhasil mengimpor ${res.importedCount} siswa!`,
        steps: prev.steps.map(s => ({ ...s, status: 'completed' })),
        resultSummary: {
          title: 'Hasil Impor Siswa Excel',
          items: [
            { label: 'Siswa Berhasil Diimpor', value: `${res.importedCount} Siswa`, badge: 'Sukses' },
            { label: 'Token Login Dibuat', value: `${res.importedCount} Token`, badge: 'Aktif' },
            { label: 'Baris Dilewati', value: `${res.skippedCount} Baris` },
            { label: 'Status DPT', value: 'Terdaftar & Siap Cetak' },
          ],
          note: 'Token login 6-karakter unik telah diterbitkan otomatis dan kartu login siap dicetak.',
        },
        primaryAction: {
          label: 'Cetak Kartu Login Siswa',
          onClick: () => {
            setProgressModal(prev => ({ ...prev, isOpen: false }));
            setIsPrintModalOpen(true);
          },
        },
      }));

      showNotification('success', `Berhasil mengimpor ${res.importedCount} siswa!`);
    } catch (err: any) {
      setProgressModal(prev => ({
        ...prev,
        status: 'error',
        errorMessage: err?.message || 'Terjadi kesalahan sistem saat mengimpor data siswa.',
        steps: prev.steps.map(s => s.status === 'running' ? { ...s, status: 'error' } : s),
      }));
      showNotification('error', err?.message || 'Gagal mengimpor siswa');
    }
  };

  // Filter & Search Logic
  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nisn.includes(searchTerm) ||
      (s.token_preview || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = classFilter === 'all' || s.class_id === classFilter;
    const matchesVoting = votingStatusFilter === 'all' ||
      (votingStatusFilter === 'voted' && s.has_voted) ||
      (votingStatusFilter === 'unvoted' && !s.has_voted);
    return matchesSearch && matchesClass && matchesVoting;
  });

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Header and Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Data Siswa & Kartu Login
          </h2>
          <p className="text-xs text-slate-500">
            Daftar Pemilih Tetap (DPT), penerbitan token unik, dan pencetakan kartu login siap cetak A4.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Download Template Excel */}
          <button
            onClick={downloadStudentTemplate}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2.5 rounded-xl transition border border-slate-300 shadow-xs"
            title="Download Template Format Siswa (.xlsx)"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Download Template Excel</span>
          </button>

          {/* Import Excel */}
          <button
            onClick={() => {
              setImportedRows([]);
              setImportReport(null);
              setIsImportModalOpen(true);
            }}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2.5 rounded-xl transition border border-slate-300 shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-blue-700" />
            <span>Import Excel</span>
          </button>

          {/* Download Student Cards PDF (All or Specific Class) */}
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 text-xs font-bold px-3.5 py-2.5 rounded-xl transition shadow-md shadow-amber-950/20"
            title="Download / Cetak Kartu Login Siswa (Pilihan Semua Kelas atau Per Kelas Tertentu)"
          >
            <CreditCard className="w-4 h-4" />
            <span>
              {selectedIds.size > 0
                ? `Cetak Kartu (${selectedIds.size} Dipilih / Opsi)`
                : 'Cetak Kartu Login (PDF)'}
            </span>
          </button>

          {/* Bulk Delete Selected */}
          {selectedIds.size > 0 && (
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition shadow-md shadow-rose-950/20"
              title="Hapus siswa terpilih"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus ({selectedIds.size}) Siswa</span>
            </button>
          )}

          {/* Delete All Students */}
          {students.length > 0 && (
            <button
              onClick={() => setIsDeleteAllModalOpen(true)}
              className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 text-xs font-bold px-3.5 py-2.5 rounded-xl transition border border-rose-300 shadow-xs"
              title="Kosongkan seluruh data siswa / DPT"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Kosongkan Semua Siswa</span>
            </button>
          )}

          {/* Add Student */}
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-md shadow-emerald-950/20"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Siswa</span>
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
          <button onClick={() => setNotification(null)}>
            <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari NISN, Nama, atau Token..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Class Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-slate-500">Kelas:</span>
            <select
              value={classFilter}
              onChange={(e) => { setClassFilter(e.target.value); setCurrentPage(1); }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
            >
              <option value="all">Semua Kelas</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Voting Status Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-slate-500">Hak Suara:</span>
            <select
              value={votingStatusFilter}
              onChange={(e) => { setVotingStatusFilter(e.target.value as any); setCurrentPage(1); }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
            >
              <option value="all">Semua Status</option>
              <option value="unvoted">Belum Memilih</option>
              <option value="voted">Sudah Memilih</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredStudents.length > 0 && selectedIds.size === filteredStudents.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                  />
                </th>
                <th className="py-3.5 px-4">NISN</th>
                <th className="py-3.5 px-4">Nama Lengkap</th>
                <th className="py-3.5 px-4 text-center">Kelas</th>
                <th className="py-3.5 px-4 text-center">Token Rahasia</th>
                <th className="py-3.5 px-4 text-center">Status Suara</th>
                <th className="py-3.5 px-4 text-center w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-slate-600">
                        {students.length === 0 
                          ? 'Belum ada data siswa / DPT terdaftar'
                          : 'Tidak ada data siswa yang cocok dengan pencarian atau filter'}
                      </p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        {students.length === 0
                          ? 'Seluruh data siswa telah dikosongkan. Klik "Tambah Siswa" atau "Import Excel" untuk mengunggah DPT baru.'
                          : 'Coba ubah kata kunci pencarian atau sesuaikan pilihan filter kelas / hak suara.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition ${isSelected ? 'bg-emerald-50/40' : ''}`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(item.id)}
                          className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                        />
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {item.nisn}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{item.full_name}</div>
                        <div className="text-[11px] text-slate-400">{item.gender === 'P' ? 'Perempuan' : 'Laki-laki'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {item.class_name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 tracking-wider">
                          {item.token || item.token_preview || 'SKM-VOTE'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {item.has_voted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Sudah Memilih
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                            Belum Memilih
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleDownloadCards('single', item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition"
                            title="Unduh Kartu Siswa (PDF)"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenRotateConfirm(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition"
                            title="Rotasi / Terbitkan Ulang Token"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
                            title="Edit Siswa"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteConfirm(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Hapus Siswa"
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
              Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredStudents.length)} dari {filteredStudents.length} siswa
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

      {/* Modal Add / Edit Student */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">
                {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
              </h3>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  NISN Siswa <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 0081234567"
                  value={formData.nisn}
                  onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap Siswa <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama sesuai Dapodik"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kelas <span className="text-rose-500">*</span>:
                  </label>
                  <select
                    value={formData.class_id}
                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition text-slate-800"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jenis Kelamin:
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'L' | 'P' })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition text-slate-800"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tanggal Lahir (Opsional):
                </label>
                <input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition text-slate-800"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveStudent"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="isActiveStudent" className="font-semibold text-slate-700">
                  Status Siswa Aktif (Berhak Memilih)
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
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

      {/* Modal Import Excel with Preview */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  Import Data Siswa dari Excel (.xlsx / .csv)
                </h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              {/* File input box */}
              <div className="border-2 border-dashed border-emerald-300 bg-emerald-50/50 rounded-2xl p-6 text-center hover:bg-emerald-50 transition cursor-pointer relative">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="font-bold text-slate-800">
                  {isParsingExcel ? 'Membaca file...' : 'Klik atau seret file Excel/CSV ke sini'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Mendukung file .xlsx dan .csv sesuai template resmi sekolah
                </p>
              </div>

              {/* Import summary report */}
              {importReport && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 rounded-xl bg-slate-100 border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Total Baris</span>
                    <div className="text-base font-black text-slate-800">{importReport.total}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] text-emerald-700 uppercase font-bold">Valid & Siap</span>
                    <div className="text-base font-black text-emerald-700">{importReport.valid}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                    <span className="text-[10px] text-rose-700 uppercase font-bold">Bermasalah</span>
                    <div className="text-base font-black text-rose-700">{importReport.invalid}</div>
                  </div>
                </div>
              )}

              {/* Preview Table */}
              {importedRows.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">Pratinjau Data Impor:</h4>
                  <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 sticky top-0 text-slate-600 font-bold">
                        <tr>
                          <th className="p-2">NISN</th>
                          <th className="p-2">Nama</th>
                          <th className="p-2">Kelas</th>
                          <th className="p-2">Status Baris</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importedRows.map((r, i) => (
                          <tr key={i} className={r.isValid ? 'bg-white' : 'bg-rose-50/60'}>
                            <td className="p-2 font-mono">{r.nisn || '-'}</td>
                            <td className="p-2 font-semibold text-slate-800">{r.full_name || '-'}</td>
                            <td className="p-2">{r.class_name || '-'}</td>
                            <td className="p-2">
                              {r.isValid ? (
                                <span className="text-emerald-700 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Siap Impor
                                </span>
                              ) : (
                                <span className="text-rose-600 font-medium">
                                  {r.errors.join(', ')}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!importReport || importReport.valid === 0}
                onClick={handleConfirmImport}
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs transition shadow-sm"
              >
                Konfirmasi Impor ({importReport?.valid || 0} Siswa)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Student Confirm Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Hapus Data Siswa"
        message={`Apakah Anda yakin ingin menghapus siswa "${studentToDelete?.full_name}" (NISN: ${studentToDelete?.nisn})? Data yang sudah dihapus tidak dapat dipulihkan.`}
        confirmText="Ya, Hapus Siswa"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleExecuteDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />

      {/* Delete ALL Students Confirm Modal */}
      <ConfirmModal
        isOpen={isDeleteAllModalOpen}
        title="Kosongkan Seluruh Data Siswa"
        message={`PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA data siswa (${students.length} siswa)? Seluruh akun login, token, dan data DPT akan dihapus secara permanen dari sistem dan database Supabase.`}
        confirmText="Ya, Kosongkan Semua Siswa"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeletingAll}
        onConfirm={handleExecuteDeleteAll}
        onCancel={() => setIsDeleteAllModalOpen(false)}
      />

      {/* Bulk Delete Selected Students Confirm Modal */}
      <ConfirmModal
        isOpen={isBulkDeleteModalOpen}
        title="Hapus Siswa Terpilih"
        message={`Apakah Anda yakin ingin menghapus ${selectedIds.size} siswa yang telah dipilih? Data dan token yang dihapus tidak dapat dikembalikan.`}
        confirmText={`Ya, Hapus (${selectedIds.size}) Siswa`}
        cancelText="Batal"
        variant="danger"
        isLoading={isBulkDeleting}
        onConfirm={handleExecuteBulkDelete}
        onCancel={() => setIsBulkDeleteModalOpen(false)}
      />

      {/* Rotate Token Confirm Modal */}
      <ConfirmModal
        isOpen={isRotateModalOpen}
        title="Penerbitan Ulang Token Siswa"
        message={`Terbitkan token baru untuk siswa "${studentToRotate?.full_name}"? Token lama (${studentToRotate?.token || studentToRotate?.token_preview}) akan otomatis dicabut dan tidak dapat digunakan lagi.`}
        confirmText="Ya, Terbitkan Token Baru"
        cancelText="Batal"
        variant="warning"
        isLoading={isRotating}
        onConfirm={handleExecuteRotate}
        onCancel={() => setIsRotateModalOpen(false)}
      />

      {/* Print / Download Cards Options Modal (All / Per Class) */}
      <PrintCardsModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        students={students}
        classes={classes}
        school={school}
        election={election}
        selectedStudentIds={selectedIds}
        onSuccessNotification={(msg) => showNotification('success', msg)}
      />

      {/* Progress Notification Modal for Student Operations & Excel */}
      <ProgressModal
        isOpen={progressModal.isOpen}
        title={progressModal.title}
        subtitle={progressModal.subtitle}
        icon={progressModal.icon}
        steps={progressModal.steps}
        progressPercent={progressModal.progressPercent}
        currentDetail={progressModal.currentDetail}
        status={progressModal.status}
        errorMessage={progressModal.errorMessage}
        resultSummary={progressModal.resultSummary}
        primaryAction={progressModal.primaryAction}
        onClose={() => setProgressModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
