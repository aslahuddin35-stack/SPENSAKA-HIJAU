/**
 * E-VOTING SMPN 1 SUKAMULIA 2026/2027
 * Professional PDF Document Generator (jsPDF + autoTable)
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { School, Election, CandidateResult, Student, ElectionDocument } from '../types';

// Convert image URL to Base64 for reliable jsPDF embedding without CORS errors
async function getImageBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn('Could not load image as base64', e);
    return null;
  }
}

/**
 * 1. GENERATE OFFICIAL BERITA ACARA PDF
 */
export async function generateBeritaAcaraPDF(
  docData: ElectionDocument,
  school: School,
  election: Election,
  results: CandidateResult[],
  saveToFile: boolean = true
): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 14;

  // Try loading logo
  const logoBase64 = await getImageBase64(school.logo_url || '/logo-smpn1sukamulia.png');
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', 16, currentY, 22, 22);
    } catch (e) {
      console.warn('Failed to embed logo in PDF', e);
    }
  }

  // Official Letterhead (KOP SURAT)
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.text('PEMERINTAH KABUPATEN LOMBOK TIMUR', pageWidth / 2 + 8, currentY + 3, { align: 'center' });
  doc.text('DINAS PENDIDIKAN DAN KEBUDAYAAN', pageWidth / 2 + 8, currentY + 7.5, { align: 'center' });
  
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.text(school.name.toUpperCase(), pageWidth / 2 + 8, currentY + 13, { align: 'center' });
  
  doc.setFont('times', 'italic');
  doc.setFontSize(9);
  doc.text(school.address, pageWidth / 2 + 8, currentY + 17.5, { align: 'center' });
  doc.text(`Telp: ${school.contact_phone} | Email: ${school.contact_email}`, pageWidth / 2 + 8, currentY + 21.5, { align: 'center' });

  // Double divider lines
  currentY += 26;
  doc.setLineWidth(0.8);
  doc.line(16, currentY, pageWidth - 16, currentY);
  doc.setLineWidth(0.3);
  doc.line(16, currentY + 1.2, pageWidth - 16, currentY + 1.2);

  // Document Title
  currentY += 9;
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.text('BERITA ACARA PEMUNGUTAN DAN PENGHITUNGAN SUARA', pageWidth / 2, currentY, { align: 'center' });
  
  doc.setFontSize(11);
  doc.text(`PEMILIHAN KETUA DAN WAKIL KETUA OSIS PERIODE ${election.academic_year}`, pageWidth / 2, currentY + 5.5, { align: 'center' });
  
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text(`Nomor: ${docData.doc_number || '042/PAN-OSIS/SMPN1-SKM/2026'}`, pageWidth / 2, currentY + 10.5, { align: 'center' });

  // Preamble narrative
  currentY += 17;
  const executionDateStr = new Date(docData.execution_date).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const narrative = `Pada hari ini, ${executionDateStr}, bertempat di ${docData.execution_place}, telah dilaksanakan kegiatan Pemungutan dan Penghitungan Suara Pemilihan Ketua dan Wakil Ketua OSIS SMP Negeri 1 Sukamulia Periode ${election.academic_year} secara elektronik (E-Voting) melalui sistem digital terverifikasi.`;

  const splitNarrative = doc.splitTextToSize(narrative, pageWidth - 32);
  doc.text(splitNarrative, 16, currentY);
  currentY += splitNarrative.length * 5 + 3;

  // I. Rekapitulasi Data Pemilih
  doc.setFont('times', 'bold');
  doc.text('I. DATA PARTISIPASI DAN SUARA PEMILIHAN', 16, currentY);
  currentY += 2;

  const participationPct = docData.total_eligible > 0 
    ? ((docData.total_voted / docData.total_eligible) * 100).toFixed(1) 
    : '0';

  autoTable(doc, {
    startY: currentY,
    margin: { left: 16, right: 16 },
    head: [['No', 'Uraian Data Pemilihan', 'Jumlah / Angka', 'Keterangan']],
    body: [
      ['1', 'Jumlah Seluruh Siswa Terdaftar (Daftar Pemilih Tetap)', `${docData.total_eligible} Orang`, '100% Hak Pilih'],
      ['2', 'Jumlah Siswa yang Menggunakan Hak Suara', `${docData.total_voted} Orang`, `${participationPct}% Partisipasi`],
      ['3', 'Jumlah Siswa yang Tidak Menggunakan Hak Suara', `${docData.total_unvoted} Orang`, `${(100 - Number(participationPct)).toFixed(1)}%`],
      ['4', 'Jumlah Suara Sah Masuk ke Sistem', `${docData.total_valid_votes} Suara`, 'Tervalidasi Digital'],
      ['5', 'Jumlah Suara Tidak Sah / Batal', `${docData.total_invalid_votes} Suara`, '0 (Tolak Sistem)'],
    ],
    theme: 'grid',
    styles: { font: 'times', fontSize: 9.5, cellPadding: 2.2 },
    headStyles: { fillColor: [6, 95, 70], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 95 },
      2: { cellWidth: 38, halign: 'center' },
      3: { cellWidth: 35, halign: 'center' },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 7;

  // II. Rekapitulasi Hasil Perolehan Suara
  doc.setFont('times', 'bold');
  doc.text('II. RINCIAN PEROLEHAN SUARA PASANGAN CALON KANDIDAT', 16, currentY);
  currentY += 2;

  const candidateRows = results.map(c => [
    `No. ${c.ballot_number}`,
    `${c.leader_name} & ${c.vice_leader_name}\n"${c.slogan || '-'}"`,
    `${c.vote_count} Suara`,
    `${c.percentage}%`,
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: 16, right: 16 },
    head: [['No. Urut', 'Nama Pasangan Calon (Ketua & Wakil)', 'Jumlah Suara', 'Persentase']],
    body: candidateRows,
    theme: 'grid',
    styles: { font: 'times', fontSize: 9.5, cellPadding: 2.5 },
    headStyles: { fillColor: [6, 95, 70], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      1: { cellWidth: 95 },
      2: { cellWidth: 35, halign: 'center' },
      3: { cellWidth: 28, halign: 'center' },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // III. Penetapan Hasil
  doc.setFont('times', 'bold');
  doc.text('III. KESIMPULAN DAN PENETAPAN HASIL', 16, currentY);
  currentY += 4.5;

  doc.setFont('times', 'normal');
  let conclusionText = '';
  if (results.length > 0 && docData.total_valid_votes > 0) {
    const topVote = results[0].vote_count;
    const leaders = results.filter(c => c.vote_count === topVote);
    if (leaders.length > 1) {
      conclusionText = `Berdasarkan hasil penghitungan suara di atas, terjadi HASIL SERI (DRAW) antara pasangan calon kandidat yang memperoleh jumlah suara tertinggi sama (${topVote} suara). Tindak lanjut penentuan hasil akhir akan dilaksanakan sesuai ketentuan tata tertib pemilihan OSIS SMP Negeri 1 Sukamulia.`;
    } else {
      conclusionText = `Berdasarkan hasil penghitungan suara di atas, pasangan calon Nomor Urut ${leaders[0].ballot_number} (${leaders[0].leader_name} dan ${leaders[0].vice_leader_name}) dengan perolehan ${leaders[0].vote_count} suara (${leaders[0].percentage}%) DITETAPKAN SEBAGAI KETUA DAN WAKIL KETUA OSIS TERPILIH Periode ${election.academic_year}.`;
    }
  } else {
    conclusionText = 'Proses pemungutan suara belum memiliki data perolehan suara sah yang tercatat.';
  }

  const splitConclusion = doc.splitTextToSize(conclusionText, pageWidth - 32);
  doc.text(splitConclusion, 16, currentY);
  currentY += splitConclusion.length * 4.8 + 6;

  // Closing sentence
  const closingText = 'Demikian Berita Acara ini dibuat dengan sebenarnya dan penuh tanggung jawab berdasarkan rekapitulasi data digital yang tersimpan pada sistem E-Voting, untuk dipergunakan sebagaimana mestinya.';
  const splitClosing = doc.splitTextToSize(closingText, pageWidth - 32);
  doc.text(splitClosing, 16, currentY);
  currentY += splitClosing.length * 4.8 + 8;

  // Signatures Section (check page break)
  if (currentY > 230) {
    doc.addPage();
    currentY = 25;
  }

  const signDateStr = `Sukamulia, ${executionDateStr}`;
  doc.setFont('times', 'normal');
  doc.text(signDateStr, pageWidth - 65, currentY);
  currentY += 5;

  // Committee signers
  const col1X = 22;
  const col2X = pageWidth - 65;

  doc.text('Ketua Panitia Pemilihan,', col1X, currentY);
  doc.text('Sekretaris Panitia,', col2X, currentY);

  currentY += 20;
  doc.setFont('times', 'bold');
  doc.text(school.committee_chair || 'Ahmad Fauzi, S.Pd.', col1X, currentY);
  doc.text(school.committee_secretary || 'Nurul Hidayati, S.Pd.', col2X, currentY);

  // Acknowledged by Principal
  currentY += 12;
  doc.setFont('times', 'normal');
  doc.text('Mengetahui,', pageWidth / 2, currentY, { align: 'center' });
  doc.text('Kepala SMP Negeri 1 Sukamulia', pageWidth / 2, currentY + 4.5, { align: 'center' });

  currentY += 21;
  doc.setFont('times', 'bold');
  doc.text(school.principal_name || 'Drs. H. M. Zainuddin, M.Pd.', pageWidth / 2, currentY, { align: 'center' });
  doc.setFont('times', 'normal');
  doc.text('NIP. 19681231 199412 1 002', pageWidth / 2, currentY + 4.5, { align: 'center' });

  const fileName = `Berita_Acara_EVoting_SMPN1_Sukamulia_${election.academic_year.replace('/', '-')}.pdf`;
  if (saveToFile) {
    doc.save(fileName);
  }
  return doc;
}

/**
 * 2. GENERATE STUDENT LOGIN CARDS PDF (KARTU LOGIN SISWA)
 * Standard A4 layout with cut dashed lines, school logo, token & instructions
 */
export async function generateStudentCardsPDF(
  students: Student[],
  school: School,
  election: Election,
  customFileName?: string
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const logoBase64 = await getImageBase64(school.logo_url || '/logo-smpn1sukamulia.png');

  // A4 dimensions: 210 x 297 mm
  // We place 4 or 6 cards per page (2 columns x 3 rows)
  const cardsPerPage = 6;
  const cardWidth = 88;
  const cardHeight = 82;
  const startX = 14;
  const startY = 18;
  const gapX = 6;
  const gapY = 8;

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const pageIndex = Math.floor(i / cardsPerPage);
    const cardIndexOnPage = i % cardsPerPage;

    if (cardIndexOnPage === 0 && i > 0) {
      doc.addPage();
    }

    const col = cardIndexOnPage % 2;
    const row = Math.floor(cardIndexOnPage / 2);

    const x = startX + col * (cardWidth + gapX);
    const y = startY + row * (cardHeight + gapY);

    // Draw cut guide dashed border
    doc.setLineDashPattern([2, 1], 0);
    doc.setDrawColor(180, 180, 180);
    doc.roundedRect(x, y, cardWidth, cardHeight, 2.5, 2.5, 'S');
    doc.setLineDashPattern([], 0);

    // Card Header Background
    doc.setFillColor(6, 95, 70); // Deep Forest Green
    doc.roundedRect(x + 1, y + 1, cardWidth - 2, 17, 2, 2, 'F');

    // School Logo
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', x + 3.5, y + 2.5, 14, 14);
      } catch (e) {
        // ignore
      }
    }

    // Card Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('KARTU LOGIN E-VOTING OSIS', x + 21, y + 7);
    doc.setFontSize(7.5);
    doc.text(school.name.toUpperCase(), x + 21, y + 11);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text(`Periode Pemilihan ${election.academic_year}`, x + 21, y + 14.5);

    // Student Info Body
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(7.5);
    let infoY = y + 23;

    doc.setFont('helvetica', 'bold');
    doc.text('Nama Lengkap', x + 4, infoY);
    doc.setFont('helvetica', 'normal');
    doc.text(`: ${student.full_name}`, x + 26, infoY);

    infoY += 4.5;
    doc.setFont('helvetica', 'bold');
    doc.text('NISN', x + 4, infoY);
    doc.setFont('helvetica', 'normal');
    doc.text(`: ${student.nisn}`, x + 26, infoY);

    infoY += 4.5;
    doc.setFont('helvetica', 'bold');
    doc.text('Kelas', x + 4, infoY);
    doc.setFont('helvetica', 'normal');
    doc.text(`: ${student.class_name || 'Reguler'}`, x + 26, infoY);

    // Token Highlight Box
    infoY += 6;
    doc.setFillColor(243, 244, 246);
    doc.setDrawColor(5, 150, 105);
    doc.setLineWidth(0.6);
    doc.roundedRect(x + 4, infoY, cardWidth - 8, 17, 2, 2, 'FD');

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text('TOKEN LOGIN PEMILIH (RAHASIA)', x + cardWidth / 2, infoY + 4.5, { align: 'center' });

    doc.setTextColor(5, 150, 105);
    doc.setFont('courier', 'bold');
    doc.setFontSize(14);
    const tokenDisplay = student.token || student.token_preview || 'SKM-VOTE';
    doc.text(tokenDisplay, x + cardWidth / 2, infoY + 12.5, { align: 'center' });

    // QR Simulated Visual Box
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(255, 255, 255);
    doc.rect(x + cardWidth - 18, y + 21, 14, 14, 'FD');
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.text('QR CODE', x + cardWidth - 11, y + 27, { align: 'center' });
    doc.setFontSize(4.5);
    doc.text('TOKEN', x + cardWidth - 11, y + 31, { align: 'center' });

    // Footer Security Instruction
    doc.setTextColor(150, 50, 50);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(5.8);
    const note = 'Perhatian: Token ini bersifat RAHASIA dan hanya berlaku 1 kali untuk memberikan suara. Dilarang membagikan token kepada siapa pun.';
    const splitNote = doc.splitTextToSize(note, cardWidth - 8);
    doc.text(splitNote, x + 4, y + cardHeight - 8);
  }

  const fileName = customFileName || `Kartu_Login_Siswa_SMPN1_Sukamulia_${Date.now()}.pdf`;
  doc.save(fileName);
}
