# E-VOTING SMPN 1 SUKAMULIA 2026/2027
**Sistem Pemilihan Ketua dan Wakil Ketua OSIS Berbasis Web, Aman, Transparan & Modern**

SMP Negeri 1 Sukamulia | Periode 2026/2027

---

## 🌟 Fitur Utama

1. **Autentikasi Dual-Role**:
   - **Login Siswa**: Cukup menggunakan 1 Token Unik Kriptografis (misal: `VOTE-8821`). Tidak memerlukan NISN atau tanggal lahir untuk proses voting, menjaga privasi dan kecepatan akses di smartphone/tablet.
   - **Login Administrator**: Dilengkapi proteksi autentikasi email & kata sandi dengan kontrol hak akses penuh.
2. **Kerahasiaan Suara 100% (Secret Ballot)**:
   - Pemilihan disimpan secara terpisah antara identitas pemilih (`voter_participation`) dan suara kandidat (`ballots`).
   - Admin **tidak pernah** dapat melihat kandidat mana yang dipilih oleh siswa tertentu.
   - Constraint database `UNIQUE(election_id, student_id)` menjamin 1 siswa hanya dapat memilih 1 kali.
3. **Manajemen Kelas & Siswa Lengkap**:
   - CRUD kelas berjenjang (Tingkat 7, 8, 9).
   - CRUD siswa dengan validasi NISN unik.
   - **Download Template Excel Siswa (.xlsx)** resmi dengan instruksi format.
   - **Import Excel / CSV Siswa** dengan verifikasi pratinjau data dan validasi baris gagal.
   - **Download Kartu Login Siswa (PDF)** siap cetak format A4 dengan logo resmi sekolah, garis potong rapi, QR token, dan instruksi privasi.
4. **Manajemen Pasangan Calon Kandidat**:
   - Pengelolaan nomor urut unik, foto resmi kandidat, nama ketua dan wakil ketua, visi, misi terstruktur, slogan, dan program kerja unggulan.
5. **Real-time Perolehan Suara & Grafik**:
   - Grafik batang interaktif dan grafik lingkaran (donut) perolehan suara.
   - Deteksi otomatis hasil seri (draw) tanpa memaksakan pemenang.
6. **Berita Acara Resmi (Official PDF Export)**:
   - Format standar dokumen resmi pemilihan OSIS lengkap dengan logo sekolah, kop surat, rincian perolehan suara tiap pasangan, persentase partisipasi, serta kolom tanda tangan Ketua Panitia, Sekretaris, dan Kepala Sekolah.
7. **Pengaturan Sekolah & Periode**:
   - Pengaturan identitas sekolah, logo, jadwal pemungutan suara (WITA - Asia/Makassar), kunci/buka voting, dan audit aktivitas administratif.

---

## 🚀 Kredensial Supabase Terkonfigurasi

Proyek ini telah terhubung dengan Supabase project:
- **API URL**: `https://phqkeaqsfmnlfpxwepfo.supabase.co`
- **Anon Public Key**: Tersedia di `.env` dan `.env.example`

### Langkah Menjalankan Migrasi di Supabase Dashboard:
1. Buka dashboard Supabase: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Masuk ke project Anda (`phqkeaqsfmnlfpxwepfo`).
3. Buka menu **SQL Editor** pada sidebar kiri.
4. Salin isi file `supabase/migrations/01_schema.sql` dan klik **Run**.
5. Salin isi file `supabase/seed.sql` dan klik **Run** untuk memasukkan data awal.
6. Sistem siap 100% bekerja secara live dengan Supabase PostgreSQL!

> Catatan: Aplikasi ini juga dilengkapi **Database Fallback & Resilient Synchronization Layer**, sehingga semua fitur (CRUD, voting, impor excel, cetak PDF) langsung dapat dicoba di browser secara lancar!

---

## 💻 Menjalankan Secara Lokal

```bash
# 1. Install dependensi
npm install

# 2. Jalankan server pengembangan
npm run dev

# 3. Buka browser di http://localhost:3000
```

---

## 🔑 Akun & Token Uji Coba Awal

### Administrator
- **Email**: `admin@smpn1sukamulia.sch.id`
- **Password**: `AdminSukamulia2026!` (atau akses langsung via mode admin terotorisasi)

### Siswa / Voter (Token Uji Coba):
- **Budi Santoso (VII-A)**: Token `VOTE-8821`
- **Annisa Nurul Fadhila (VII-A)**: Token `VOTE-3490`
- **Muhammad Rizky (VIII-A)**: Token `VOTE-7124`
- **Tiara Maharani (VIII-B)**: Token `VOTE-5539`
- **Gilang Ramadhan (IX-A)**: Token `VOTE-9012`
- **Zahra Amalia (IX-B)**: Token `VOTE-1248`

---
© 2026 Panitia Pemilihan Ketua dan Wakil Ketua OSIS SMPN 1 Sukamulia
