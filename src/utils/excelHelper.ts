/**
 * E-VOTING SMPN 1 SUKAMULIA 2026/2027
 * SheetJS Excel Helper: Template Download, Parsing & Validation
 */

import * as XLSX from 'xlsx';
import { CandidateResult, Election, School } from '../types';

export interface ParsedStudentRow {
  nisn: string;
  full_name: string;
  class_name: string;
  birth_date?: string;
  gender?: 'L' | 'P';
  isValid: boolean;
  errors: string[];
}

/**
 * 1. DOWNLOAD OFFICIAL STUDENT IMPORT TEMPLATE (.XLSX)
 */
export function downloadStudentTemplate() {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Data Template with header and sample rows
  const templateData = [
    {
      'NISN': '0081234599',
      'Nama Lengkap': 'Faris Ramadhan Al-Farizi (Contoh)',
      'Nama Kelas': 'VII-A',
      'Tanggal Lahir': '2012-04-18',
      'Jenis Kelamin': 'L',
    },
    {
      'NISN': '0081234600',
      'Nama Lengkap': 'Nabila Salma Az-Zahra (Contoh)',
      'Nama Kelas': 'VIII-B',
      'Tanggal Lahir': '2011-09-25',
      'Jenis Kelamin': 'P',
    },
  ];

  const wsTemplate = XLSX.utils.json_to_sheet(templateData);

  // Set column widths
  wsTemplate['!cols'] = [
    { wch: 18 }, // NISN
    { wch: 35 }, // Nama Lengkap
    { wch: 15 }, // Nama Kelas
    { wch: 18 }, // Tanggal Lahir
    { wch: 15 }, // Jenis Kelamin
  ];

  XLSX.utils.book_append_sheet(wb, wsTemplate, 'Template Siswa');

  // Sheet 2: Petunjuk Pengisian
  const instructions = [
    ['PETUNJUK PENGISIAN TEMPLATE IMPOR SISWA E-VOTING'],
    ['SMP NEGERI 1 SUKAMULIA 2026/2027'],
    [''],
    ['1. Kolom NISN (Wajib)', 'Harus berupa angka 10 digit unik dan belum pernah terdaftar sebelumnya.'],
    ['2. Kolom Nama Lengkap (Wajib)', 'Isi dengan nama lengkap siswa sesuai data Dapodik sekolah.'],
    ['3. Kolom Nama Kelas (Wajib)', 'Contoh: VII-A, VII-B, VIII-A, VIII-B, IX-A, IX-B. Jika kelas belum ada, sistem akan otomatis membuatnya.'],
    ['4. Kolom Tanggal Lahir (Opsional)', 'Gunakan format YYYY-MM-DD (Contoh: 2012-05-14).'],
    ['5. Kolom Jenis Kelamin (Opsional)', 'Isi dengan L (Laki-laki) atau P (Perempuan).'],
    ['6. Catatan Token Pemilih', 'Token pemilihan TIDAK perlu diisi pada file Excel ini. Sistem akan menerbitkan token kriptografis otomatis saat impor berhasil!'],
    ['7. Baris Contoh', 'Hapus atau timpa 2 baris contoh di lembar Template Siswa sebelum mengunggah file.'],
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
  wsInstructions['!cols'] = [{ wch: 35 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Petunjuk Pengisian');

  // Trigger download
  XLSX.writeFile(wb, 'Template_Import_Siswa_SMPN1_Sukamulia.xlsx');
}

/**
 * 2. PARSE AND VALIDATE UPLOADED EXCEL/CSV FILE
 */
export async function parseStudentExcel(file: File): Promise<{
  rows: ParsedStudentRow[];
  totalRows: number;
  validRows: ParsedStudentRow[];
  invalidRows: ParsedStudentRow[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const parsedRows: ParsedStudentRow[] = [];
        const seenNisns = new Set<string>();

        rawJson.forEach((row, index) => {
          const rowNum = index + 2; // considering 1-based and header
          const errors: string[] = [];

          // Normalize keys (support various headers like "nisn", "NISN", "nama", "Nama Lengkap")
          const nisn = String(row['NISN'] || row['nisn'] || row['No NISN'] || '').trim();
          const fullName = String(row['Nama Lengkap'] || row['Nama'] || row['nama_lengkap'] || row['NAMA'] || '').trim();
          const className = String(row['Nama Kelas'] || row['Kelas'] || row['kelas'] || row['KELAS'] || '').trim();
          let birthDate = String(row['Tanggal Lahir'] || row['Tgl Lahir'] || row['birth_date'] || '').trim();
          let gender = String(row['Jenis Kelamin'] || row['JK'] || row['gender'] || '').trim().toUpperCase();

          // Validation
          if (!nisn) {
            errors.push('NISN wajib diisi');
          } else if (seenNisns.has(nisn)) {
            errors.push(`NISN ${nisn} duplikat di dalam file ini`);
          } else {
            seenNisns.add(nisn);
          }

          if (!fullName) {
            errors.push('Nama lengkap wajib diisi');
          }

          if (!className) {
            errors.push('Nama kelas wajib diisi');
          }

          if (gender && gender !== 'L' && gender !== 'P') {
            gender = 'L'; // default fallback
          }

          parsedRows.push({
            nisn,
            full_name: fullName,
            class_name: className,
            birth_date: birthDate || undefined,
            gender: (gender as 'L' | 'P') || 'L',
            isValid: errors.length === 0,
            errors,
          });
        });

        const validRows = parsedRows.filter(r => r.isValid);
        const invalidRows = parsedRows.filter(r => !r.isValid);

        resolve({
          rows: parsedRows,
          totalRows: parsedRows.length,
          validRows,
          invalidRows,
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * 3. EXPORT ELECTION RESULTS TO EXCEL
 */
export function exportResultsExcel(results: CandidateResult[], election: Election, school: School) {
  const wb = XLSX.utils.book_new();

  const data = results.map(r => ({
    'Nomor Urut': r.ballot_number,
    'Calon Ketua': r.leader_name,
    'Kelas Ketua': r.leader_class || '-',
    'Calon Wakil Ketua': r.vice_leader_name,
    'Kelas Wakil': r.vice_leader_class || '-',
    'Slogan': r.slogan,
    'Perolehan Suara': r.vote_count,
    'Persentase (%)': `${r.percentage}%`,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 12 },
    { wch: 25 },
    { wch: 14 },
    { wch: 25 },
    { wch: 14 },
    { wch: 35 },
    { wch: 18 },
    { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Hasil Perolehan Suara');
  XLSX.writeFile(wb, `Hasil_Pemilihan_OSIS_SMPN1_Sukamulia_${election.academic_year.replace('/', '-')}.xlsx`);
}
