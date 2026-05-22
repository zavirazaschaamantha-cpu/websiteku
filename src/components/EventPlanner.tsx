import React, { useState } from 'react';
import { 
  Sparkles, Calendar, Users, Clock, ClipboardList, CheckSquare, 
  Plus, Trash2, Download, Printer, Save, ArrowRight, UserCheck, 
  Layers, Smile, Edit3, HelpCircle, CheckCircle, RefreshCw, XCircle
} from 'lucide-react';
import { Event } from '../types';

// Structured interface for dynamic planner output
interface RundownItem {
  id: string;
  time: string;
  activity: string;
  pic: string;
  notes: string;
}

interface CommitteeDivision {
  name: string;
  coordinator: string;
  staff: string;
  tasks: { id: string; text: string; completed: boolean }[];
}

interface TimelineGroup {
  period: string;
  description: string;
  items: { id: string; title: string; desc: string; completed: boolean }[];
}

export default function EventPlanner() {
  // Input settings
  const [eventTitle, setEventTitle] = useState('Seminar Nasional Kepemimpinan Muda');
  const [organizerName, setOrganizerName] = useState('BEM Universitas');
  const [eventType, setEventType] = useState<'Seminar' | 'Workshop' | 'Lomba' | 'Rapat' | 'Makrab' | 'Pelatihan' | 'Komunitas' | 'Sosialisasi'>('Seminar');
  const [themeTone, setThemeTone] = useState<string>('Profesional & Formal');
  const [estimatedAudience, setEstimatedAudience] = useState<string>('200 Mahasiswa');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [eventDuration, setEventDuration] = useState<number>(4); // in hours
  
  // Generated State
  const [isGenerated, setIsGenerated] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'rundown' | 'committee' | 'checklist' | 'export'>('rundown');
  
  // Custom Editable Rundown
  const [rundownList, setRundownList] = useState<RundownItem[]>([]);
  const [editingRundownId, setEditingRundownId] = useState<string | null>(null);
  
  // New Item Temporary State
  const [tempTime, setTempTime] = useState('');
  const [tempAct, setTempAct] = useState('');
  const [tempPic, setTempPic] = useState('');
  const [tempNotes, setTempNotes] = useState('');

  // Committee details state
  const [committeeDivisions, setCommitteeDivisions] = useState<CommitteeDivision[]>([]);
  const [editingDivisionIndex, setEditingDivisionIndex] = useState<number | null>(null);
  const [editingCoordinator, setEditingCoordinator] = useState('');
  const [editingStaff, setEditingStaff] = useState('');

  // Daily work timeline
  const [workTimeline, setWorkTimeline] = useState<TimelineGroup[]>([]);

  // Generation Logic
  const handleGeneratePlan = () => {
    // 1. DYNAMIC RUNDOWN SCHEDULING (Relative offset calculator)
    const baseRundown = getRundownTemplate(eventType, startTime, eventDuration);
    setRundownList(baseRundown);

    // 2. DYNAMIC COMMITTEE & JOBS
    const baseCommittee = getCommitteeTemplate(eventType);
    setCommitteeDivisions(baseCommittee);

    // 3. TARGET TIMELINE ROADMAP (H-30 -> H+7)
    const baseTimeline = getTimelineTemplate(eventType);
    setWorkTimeline(baseTimeline);

    setIsGenerated(true);
    setActiveSubTab('rundown');
  };

  // Preset generator for Itinerary
  const getRundownTemplate = (type: string, start: string, durationHr: number): RundownItem[] => {
    const parseTime = (tStr: string) => {
      const [h, m] = tStr.split(':').map(Number);
      return h * 60 + m;
    };

    const formatTime = (minutes: number) => {
      const h = Math.floor(minutes / 60) % 24;
      const m = minutes % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    let startMin = parseTime(start);
    const totalMinutes = durationHr * 60;
    const list: { relDuration: number; activity: string; pic: string; notes: string }[] = [];

    if (type === 'Seminar' || type === 'Sosialisasi') {
      list.push(
        { relDuration: 30, activity: 'Registrasi Peserta & Pengkondisian Ruangan (Scan E-Tiket)', pic: 'Div. Presensi & Keamanan', notes: 'Stand presensi depan pintu aula' },
        { relDuration: 15, activity: 'Pembukaan oleh MC, Menyanyikan Indonesia Raya, & Doa', pic: 'MC & Dirigen', notes: 'Sound-system dicek' },
        { relDuration: 10, activity: 'Sambutan Ketua Pelaksana & Ketua Himpunan/BEM', pic: 'Ketua Panitia', notes: 'Waktu maksimal maksimal 5 menit/orang' },
        { relDuration: 5, activity: 'Sesi Foto Bersama & Pembacaan Profil Moderator/Pemateri', pic: 'DOKUM & MC', notes: 'Pengkondisian panggung' }
      );

      const mainBlockVal = Math.floor((totalMinutes - 90) / 2);
      list.push(
        { relDuration: mainBlockVal > 0 ? mainBlockVal : 45, activity: 'Pemaparan Materi Utama Bagian 1 & Studi Kasus Kampus', pic: 'Pemateri Utama', notes: 'Fokus pada tantangan era industri' },
        { relDuration: 10, activity: 'Sesi Ice Breaking / Kuis Berhadiah Tiket Pro/Merchandise', pic: 'Divisi Acara', notes: 'Menggunakan games seru' },
        { relDuration: mainBlockVal > 0 ? mainBlockVal : 45, activity: 'Lanjutan Pemaparan Materi Bagian 2 & Sesi Interaktif', pic: 'Pemateri Utama / Pembicara', notes: 'Pembagian tips & strategi jitu' },
        { relDuration: 20, activity: 'Sesi Tanya Jawab (Q&A) / Diskusi Panel Bersama Peserta', pic: 'Moderator & MC', notes: 'Siapkan mic wireless portable' },
        { relDuration: 10, activity: 'Penyerahan Plakat Penghargaan, Sertifikat, & Souvenir', pic: 'Ketua Pelaksana & BPH', notes: 'Dokumentasi formal di aula' },
        { relDuration: 10, activity: 'Pengisian Kuesioner Evaluasi & Penutup Acara', pic: 'MC & Panitia', notes: 'Link feedback dibagikan via QR Code screen' }
      );
    } else if (type === 'Workshop' || type === 'Pelatihan') {
      list.push(
        { relDuration: 25, activity: 'Registrasi Ulang Peserta, Screening Seat, & Pembagian Starter Kit', pic: 'Div. Registrasi & Konsumsi', notes: 'Bagikan Snack box di pintu' },
        { relDuration: 10, activity: 'Pembukaan Acara, Pengenal Mentor, & Pengenalan Tools Praktik', pic: 'MC & Mentor', notes: 'Pastikan koneksi internet lab stabil' },
        { relDuration: 10, activity: 'Penyerahan Sambutan Simbolis & Aturan Praktik', pic: 'Ketua Himpunan', notes: 'Penyampaian peraturan workshop' }
      );

      const prepBlock = Math.floor((totalMinutes - 85) * 0.4);
      const practiceBlock = Math.floor((totalMinutes - 85) * 0.5);
      
      list.push(
        { relDuration: prepBlock > 0 ? prepBlock : 60, activity: 'Sesi 1: Penjelasan Teoretis & Live Demo Step-by-Step oleh Mentor', pic: 'Mentor / Narasumber', notes: 'Peserta membuka laptop masing-masing' },
        { relDuration: 10, activity: 'Re-nergizer / Peregangan Cepat (Ice Breaking)', pic: 'Divisi Acara', notes: 'Mencegah ketegangan otot' },
        { relDuration: practiceBlock > 0 ? practiceBlock : 80, activity: 'Sesi 2: Sesi Hands-On Praktik Mandiri + Mentoring Kelompok', pic: 'Mentor & Co-Facilitator', notes: 'Fasilitator berkeliling membantu kendala teknis' },
        { relDuration: 20, activity: 'Presentasi Hasil Studi Kasus Kelompok / Review Pekerjaan Terbaik', pic: 'Moderator & Mentor', notes: 'Berikan feedback langsung dari layar projector' },
        { relDuration: 10, activity: 'Sesi Apresiasi Karya Terbaik & Penyerahan Cendera Mata Mentor', pic: 'Ketua Panitia & BPH', notes: 'Pemberian hadiah kecil bagi peserta teraktif' },
        { relDuration: 10, activity: 'Evaluasi Pembelajaran & Foto Bersama Akhir Workshop', pic: 'Seluruh Panitia & Peserta', notes: 'LPJ & tanda kehadiran sertifikat' }
      );
    } else if (type === 'Lomba') {
      list.push(
        { relDuration: 30, activity: 'Registrasi Tim Kompetisi, Verifikasi Identitas Kartu Mahasiswa', pic: 'Div. Ticketing & Registrasi', notes: 'Bagi ID Card peserta' },
        { relDuration: 15, activity: 'Opening Ceremony, Pengenalan Dewan Juri, & Pembacaan Regulasi Lomba', pic: 'MC & Ketua Juri', notes: 'Gunakan PPT Aturan Penilaian' },
        { relDuration: 100, activity: 'Sesi Kompetisi Babak Penyisihan (Sesi 1)', pic: 'Juri & Pengawas Lomba', notes: 'Fokus ketepatan waktu submission' },
        { relDuration: 45, activity: 'Istirahat, Sholat, Makan Bersama (Ishoma)', pic: 'Divisi Konsumsi', notes: 'Konsumsi didistribusikan' },
        { relDuration: 80, activity: 'Sesi Kompetisi Final / Babak Presentasi 5 Besar Terbaik', pic: 'Peserta Final & Juri', notes: 'Batas presentasi 10 menit per tim' },
        { relDuration: 30, activity: 'Sesi Rapat Tertutup Dewan Juri untuk Penentuan Juara', pic: 'Dewan Juri', notes: 'Panitia menyiapkan sertifikat pemenang' },
        { relDuration: 20, activity: 'Pengumuman Pemenang, Pembagian Piala Bergilir, & Uang Pembinaan', pic: 'MC & Rektorat / BEM', notes: 'Suasana dibikin dramatis memakai music background' },
        { relDuration: 10, activity: 'Penutupan Acara & Sesi Foto Antar Komunitas Mahasiswa', pic: 'DOKUM', notes: 'Foto seluruh kontestan & panitia' }
      );
    } else if (type === 'Makrab' || type === 'Komunitas') {
      list.push(
        { relDuration: 30, activity: 'Kumpul di Titik Temu Kampus, Presensi Keberangkatan, & Briefing', pic: 'Div. Registrasi & Koordinator Lapangan', notes: 'Keberangkatan bersama' },
        { relDuration: 90, activity: 'Perjalanan Menuju Lokasi Acara & Pembagian Kamar / Tenda', pic: 'Div. Perlengkapan', notes: 'Koordinasi kendaraan' },
        { relDuration: 40, activity: 'Tiba di Lokasi, Isoman, & Penataan Barang Bawaan Pribadi', pic: 'Seluruh Peserta', notes: 'Pengkondisian penginapan' },
        { relDuration: 60, activity: 'Games Outbound / Sesi Fun-Rally Keakraban Kelompok', pic: 'Divisi Acara', notes: 'Games pemecah kekakuan' },
        { relDuration: 50, activity: 'Makan Malam Bersama & Sesi Sharing Santai/Pemberian Apresiasi', pic: 'Divisi Konsumsi', notes: 'Suasana santai lesehan' },
        { relDuration: 60, activity: 'Acara Puncak: Api Unggun, Pentas Seni Angkatan, & Refleksi Organisasi', pic: 'BPH & Divisi Acara', notes: 'Membangun kebersamaan dan evaluasi hangat' },
        { relDuration: 30, activity: 'Penyerahan Atribut Anggota Baru / Anggota Komunitas Berprestasi', pic: 'Ketua Himpunan', notes: 'Sesi emosional/khidmat' },
        { relDuration: 20, activity: 'Refleksi Akhir, Doa Bersama, Bersih-Bersih Area & Persiapan Pulang', pic: 'Seluruh Panitia', notes: 'Pastikan tidak ada sampah tersisa' }
      );
    } else {
      // Default generic rundown
      list.push(
        { relDuration: 20, activity: 'Pengondisian Ruang & Kehadiran Panitia', pic: 'Seluruh Panitia', notes: 'Briefing internal singkat' },
        { relDuration: 15, activity: 'Pembukaan oleh MC & Doa Bersama', pic: 'MC', notes: 'Tertib & formal' },
        { relDuration: Math.floor(totalMinutes - 55), activity: 'Agenda Inti Rapat Koalisi / Silaturahmi Komunitas', pic: 'Ketua Acara / BPH', notes: 'Fokus pada notulen dan musyawarah' },
        { relDuration: 10, activity: 'Pengambilan Keputusan/Dokumentasi Akhir & Doa Penutup', pic: 'Sekretaris & MC', notes: 'Notulensi disimpan' }
      );
    }

    let accumMin = startMin;
    return list.map((item, idx) => {
      const startStr = formatTime(accumMin);
      accumMin += item.relDuration;
      const endStr = formatTime(accumMin);
      return {
        id: `rundown_${Date.now()}_${idx}`,
        time: `${startStr} - ${endStr}`,
        activity: item.activity,
        pic: item.pic,
        notes: item.notes
      };
    });
  };

  // Preset generator for Committee divisions & Standard Campus JobDesk
  const getCommitteeTemplate = (type: string): CommitteeDivision[] => {
    return [
      {
        name: 'Ketua Pelaksana & BPH (Ketua, Sekretaris, Bendahara)',
        coordinator: 'Belum Ditentukan',
        staff: '2 Pengurus Harian',
        tasks: [
          { id: 'bph_1', text: 'Menyusun Surat Keputusan (SK) Kepanitiaan bersama BEM/Himpunan', completed: false },
          { id: 'bph_2', text: 'Melakukan audiensi dengan birokrat kampus / dosen kemahasiswaan', completed: false },
          { id: 'bph_3', text: 'Menandatangani proposal kerja & pengajuan anggaran resmi', completed: false },
          { id: 'bph_4', text: 'Mengontrol alokasi kas uang masuk & pengeluaran uang muka divisi', completed: false },
          { id: 'bph_5', text: 'Memimpin rapat pemantauan progres berkala (Rapat Pleno)', completed: false }
        ]
      },
      {
        name: 'Divisi Acara (Rundown, MC & Pemateri)',
        coordinator: 'Belum Ditentukan',
        staff: '3 Orang Staf',
        tasks: [
          { id: 'aca_1', text: 'Menyusun finalisasi skenario rundown menit ke menit (cue sheet)', completed: false },
          { id: 'aca_2', text: 'Menghubungi pemateri, pembicara, moderator, atau dewan juri tamu', completed: false },
          { id: 'aca_3', text: 'Melakukan coaching MC formal, dirigen lagu, & pembaca doa', completed: false },
          { id: 'aca_4', text: 'Melakukan Gladi Resik (GR) internal H-1 di lokasi/aula kegiatan', completed: false },
          { id: 'aca_5', text: 'Mengatur alur kuis interaktif / ice breaking pencair suasana', completed: false }
        ]
      },
      {
        name: 'Divisi Humas, Sponsorship & Publikasi',
        coordinator: 'Belum Ditentukan',
        staff: '2 Orang Staf',
        tasks: [
          { id: 'hum_1', text: 'Menyebarkan poster publikasi digital ke minimal 20 grup angkatan/WhatsApp kampus', completed: false },
          { id: 'hum_2', text: 'Menghubungi media partner eksternal / pers mahasiswa untuk publikasi', completed: false },
          { id: 'hum_3', text: 'Membuat list undangan tamu VIP (Dekanat, Ormawa, Delegasi luar)', completed: false },
          { id: 'hum_4', text: 'Mendistribusikan proposal sponsorship ke perusahaan atau alumni', completed: false }
        ]
      },
      {
        name: 'Divisi Logistik, Perlengkapan & Sound-System',
        coordinator: 'Belum Ditentukan',
        staff: '3 Orang Staf',
        tasks: [
          { id: 'log_1', text: 'Mengajukan izin peminjaman gedung, aula, kelistrikan & AC kampus', completed: false },
          { id: 'log_2', text: 'Menyiapkan minimal 2 mic wireless aktif, colokan roll, & laptop presentasi', completed: false },
          { id: 'log_3', text: 'Menyewa banner backdrop panggung & stand banner fisik jika diperlukan', completed: false },
          { id: 'log_4', text: 'Menyiapkan plakat penghargaan fisik untuk pembicara atau pemenang', completed: false },
          { id: 'log_5', text: 'Menata posisi meja pembicara, kursi VIP, & tata cahaya panggung', completed: false }
        ]
      },
      {
        name: 'Divisi Konsumsi & Catering',
        coordinator: 'Belum Ditentukan',
        staff: '2 Orang Staf',
        tasks: [
          { id: 'kon_1', text: 'Mendata jumlah konsumsi (snack pembicara, makan siang panitia & peserta)', completed: false },
          { id: 'kon_2', text: 'Mencari vendor katering murah berkualitias ramah kantong mahasiswa', completed: false },
          { id: 'kon_3', text: 'Menyiapkan air mineral botol di podium pembicara & meja dewan juri', completed: false },
          { id: 'kon_4', text: 'Mendistribusikan makan siang secara rapi & tepat waktu ketika ISHOMA', completed: false }
        ]
      },
      {
        name: 'Divisi Multimedia, IT, Desain & Dokumentasi',
        coordinator: 'Belum Ditentukan',
        staff: '2 Orang Staf',
        tasks: [
          { id: 'dok_1', text: 'Mendesain poster utama, feeds IG, ID card rilis panitia, & template sertifikat', completed: false },
          { id: 'dok_2', text: 'Mengatur background musik pembukaan & slide PowerPoint proyektor', completed: false },
          { id: 'dok_3', text: 'Mengambil dokumentasi foto estetis & video sinematik selama kegiatan', completed: false },
          { id: 'dok_4', text: 'Membuat google form kuesioner evaluasi umpan balik peserta', completed: false }
        ]
      },
      {
        name: 'Divisi Keamanan & Registrasi / Ticketing',
        coordinator: 'Belum Ditentukan',
        staff: '2 Orang Staf',
        tasks: [
          { id: 'reg_1', text: 'Mengkondisikan antrean peserta di lobby pintu masuk aula', completed: false },
          { id: 'reg_2', text: 'Mengoperasikan scanner presensi QR Code e-tiket peserta', completed: false },
          { id: 'reg_3', text: 'Menjaga keamanan tas/barang bawaan pembicara & kelancaran lajur jalan', completed: false }
        ]
      }
    ];
  };

  // Preset generator for timeline tasks
  const getTimelineTemplate = (type: string): TimelineGroup[] => {
    return [
      {
        period: 'Fase 1: Persiapan Awal (H-30 s/d H-21)',
        description: 'Pembentukan kerangka dasar acara & legalisasis hukum birokrasi kampus',
        items: [
          { id: 't1_1', title: 'Pembentukan Struktur Panitia', desc: 'Rapat perdana BEM/Himpunan menentukan Ketua Pelaksana & BPH inti.', completed: false },
          { id: 't1_2', title: 'Pembuatan Proposal Kegiatan', desc: 'Menyusun proposal lengkap rancangan anggaran biaya (RAB) & konsep acara.', completed: false },
          { id: 't1_3', title: 'Izin Birokrasi & Rekomendasi Dosen', desc: 'Pengajuan surat permohonan ke Dekanat/Rektorat Kemahasiswaan.', completed: false }
        ]
      },
      {
        period: 'Fase 2: Publikasi & Hubungan Eksternal (H-20 s/d H-11)',
        description: 'Penyebaran info registrasi & koordinasi pengisi materi',
        items: [
          { id: 't2_1', title: 'Pembuatan Link Registrasi', desc: 'Mengaktifkan form pendaftaran mahasiswa di dashboard sistem.', completed: false },
          { id: 't2_2', title: 'Pengiriman Informasi / Undangan Pemateri', desc: 'Mengirimkan surat undangan pembicara & Co-Agreement.', completed: false },
          { id: 't2_3', title: 'Publikasi Poster Massal', desc: 'Publikasi digital masif di media sosial & grup angkatan kampus.', completed: false }
        ]
      },
      {
        period: 'Fase 3: Pengadaan & Logistik (H-10 s/d H-4)',
        description: 'Pembelian barang, pemesanan katering, & layouting',
        items: [
          { id: 't3_1', title: 'Pemesanan Konsumsi', desc: 'DP katering makan siang panitia & snack VIP pembicara.', completed: false },
          { id: 't3_2', title: 'Pencetakan Backdrop fisik', desc: 'Pencetakan banner panggung, photobooth, & plakat ukiran kayu.', completed: false },
          { id: 't3_3', title: 'Verifikasi Calon Peserta', desc: 'Memantau database pendaftar e-tiket di EventPlannerKu.', completed: false }
        ]
      },
      {
        period: 'Fase 4: Pematangan Teknis (H-3 s/d H-1)',
        description: 'Simulasi rundown panggung & kelayakan listrik/AC',
        items: [
          { id: 't4_1', title: 'Gladi Resik (GR) Panitia', desc: 'Latihan panggung MC, alur pemicu laptop operator, & kelayakan mic.', completed: false },
          { id: 't4_2', title: 'Peminjaman Inventaris', desc: 'Pengambilan kabel roll, proyektor tambahan, & pointer di ruang BEM.', completed: false },
          { id: 't4_3', title: 'Konfirmasi Akhir Pemateri', desc: 'Menghubungi pemateri terkait penjemputan atau lajur parkir mobil lokasi.', completed: false }
        ]
      },
      {
        period: 'Fase 5: Hari-H Pelaksanaan (Eksekusi Real-time)',
        description: 'Pelayanan prima penonton & ketertiban agenda',
        items: [
          { id: 't5_1', title: 'Briefing internal Panitia 2 Jam sebelum mulai', desc: 'Pengecekan akhir kesiapan seluruh seksi divisi.', completed: false },
          { id: 't5_2', title: 'Pembukaan Jalur Scanner Ticket', desc: 'Petugas registrasi menyalakan scanner QR Code pendaftaran peserta.', completed: false },
          { id: 't5_3', title: 'Pengisian Evaluasi & feedback dari layar', desc: 'Menayangkan QR code kuesioner sebelum penutupan MC.', completed: false }
        ]
      },
      {
        period: 'Fase 6: Pasca Acara (H+1 s/d H+7)',
        description: 'Pelunasan laporan keuangan & apresiasi',
        items: [
          { id: 't6_1', title: 'Penyusunan Laporan Pertanggungjawaban (LPJ)', desc: 'Pengarsipan nota fisik pengeluaran keuangan panitia.', completed: false },
          { id: 't6_2', title: 'Pengiriman Esertifikat', desc: 'Pelepasan e-sertifikat PDF melalui platform bagi peserta yang hadir scan.', completed: false },
          { id: 't6_3', title: 'Rapat Pembubaran & Evaluasi internal panitia', desc: 'Sesi makan-makan santai atas apresiasi keberhasilan acara.', completed: false }
        ]
      }
    ];
  };

  // Checklist toggles
  const handleToggleTask = (divIndex: number, taskId: string) => {
    const updated = [...committeeDivisions];
    const taskIdx = updated[divIndex].tasks.findIndex(t => t.id === taskId);
    if (taskIdx !== -1) {
      updated[divIndex].tasks[taskIdx].completed = !updated[divIndex].tasks[taskIdx].completed;
      setCommitteeDivisions(updated);
    }
  };

  const handleToggleTimelineTask = (groupIndex: number, taskId: string) => {
    const updated = [...workTimeline];
    const taskIdx = updated[groupIndex].items.findIndex(t => t.id === taskId);
    if (taskIdx !== -1) {
      updated[groupIndex].items[taskIdx].completed = !updated[groupIndex].items[taskIdx].completed;
      setWorkTimeline(updated);
    }
  };

  // Editable rundown functions
  const handleEditRundown = (id: string) => {
    setEditingRundownId(id);
    const item = rundownList.find(r => r.id === id);
    if (item) {
      setTempTime(item.time);
      setTempAct(item.activity);
      setTempPic(item.pic);
      setTempNotes(item.notes);
    }
  };

  const handleSaveRundown = (id: string) => {
    const updated = rundownList.map(item => {
      if (item.id === id) {
        return {
          ...item,
          time: tempTime,
          activity: tempAct,
          pic: tempPic,
          notes: tempNotes
        };
      }
      return item;
    });
    setRundownList(updated);
    setEditingRundownId(null);
  };

  const handleDeleteRundownRow = (id: string) => {
    setRundownList(rundownList.filter(r => r.id !== id));
  };

  const handleAddRundownRow = () => {
    const newRow: RundownItem = {
      id: `rundown_${Date.now()}`,
      time: '12:00 - 12:30',
      activity: 'Sesi Tambahan Baru',
      pic: 'Divisi Acara',
      notes: 'Keterangan agenda'
    };
    setRundownList([...rundownList, newRow]);
  };

  // Division coordinate saving
  const handleEditStaffCoord = (idx: number) => {
    setEditingDivisionIndex(idx);
    setEditingCoordinator(committeeDivisions[idx].coordinator);
    setEditingStaff(committeeDivisions[idx].staff);
  };

  const handleSaveStaffCoord = (idx: number) => {
    const updated = [...committeeDivisions];
    updated[idx].coordinator = editingCoordinator || 'Belum Ditentukan';
    updated[idx].staff = editingStaff || '-';
    setCommitteeDivisions(updated);
    setEditingDivisionIndex(null);
  };

  // Compute Overall readiness index
  const getOverallReadiness = () => {
    let totalTasks = 0;
    let completedTasks = 0;

    committeeDivisions.forEach(div => {
      div.tasks.forEach(t => {
        totalTasks++;
        if (t.completed) completedTasks++;
      });
    });

    workTimeline.forEach(gp => {
      gp.items.forEach(t => {
        totalTasks++;
        if (t.completed) completedTasks++;
      });
    });

    if (totalTasks === 0) return 0;
    return Math.round((completedTasks / totalTasks) * 100);
  };

  // Expor CSV function for rundown
  const exportRundownCVS = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Waktu,Nama Agenda Kegiatan,Penanggung Jawab (PIC),Keterangan/Notes\n';
    
    rundownList.forEach(item => {
      const row = `"${item.time}","${item.activity.replace(/"/g, '""')}","${item.pic.replace(/"/g, '""')}","${item.notes.replace(/"/g, '""')}"`;
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rundown_${eventTitle.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printDocument = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="planner-main-applet">
      {/* HEADER SECTION */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 relative overflow-hidden shadow">
        <div className="absolute right-0 top-0 w-80 h-80 bg-gradient-to-br from-purple-500/20 to-pink-500/10 blur-3xl rounded-full"></div>
        <div className="relative space-y-4 max-w-4xl">
          <div className="inline-flex items-center space-x-1 px-3 py-1 bg-gradient-to-tr from-purple-600/30 to-pink-500/30 border border-purple-500/30 text-purple-300 font-sans text-[10px] font-bold rounded-full uppercase tracking-wider">
            <Sparkles className="h-3 w-3 animate-pulse text-pink-400" />
            <span>AI & System Automated Assistant For Campus Event</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black font-sans leading-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Automated Event Planner & Assistant Panitia
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            Sistem cerdas rancangan asisten AI untuk mempermudah perumusan struktur panitia, pembagian tugas kerja (Job-Description), linimasa mingguan, serta susunan rundown secara instan.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* EVENT FORM PREFERENCE - LEFT */}
        <div className="xl:col-span-4 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-5 h-fit">
          <div className="space-y-1 pb-1 border-b border-slate-100">
            <h3 className="font-sans font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ClipboardList className="h-4.5 w-4.5 text-purple-600" />
              <span>Konfigurasi Acara Anda</span>
            </h3>
            <p className="text-[11px] text-slate-400">Isi preferensi di bawah untuk menghitung bagan kelancaran kerja.</p>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-1">
              <label htmlFor="planner-event-title" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Nama Agenda / Acara</label>
              <input
                id="planner-event-title"
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Contoh: Seminar Beasiswa Global"
                className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              />
            </div>

            {/* Organizator */}
            <div className="space-y-1">
              <label htmlFor="planner-org-name" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Nama Himpunan / Penyelenggara</label>
              <input
                id="planner-org-name"
                type="text"
                value={organizerName}
                onChange={(e) => setOrganizerName(e.target.value)}
                placeholder="Contoh: Himpunan Mahasiswa Biologi"
                className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Type dropdown */}
              <div className="space-y-1">
                <label htmlFor="planner-type" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Tipe/Format</label>
                <select
                  id="planner-type"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as any)}
                  className="w-full px-2.5 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  <option value="Seminar">Seminar</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Lomba">Lomba / Kompetisi</option>
                  <option value="Pelatihan">Pelatihan</option>
                  <option value="Makrab">Makrab / Gathering</option>
                  <option value="Rapat">Rapat / Sidang</option>
                  <option value="Sosialisasi">Sosialisasi</option>
                  <option value="Komunitas">Pertemuan Anggota</option>
                </select>
              </div>

              {/* Theme Dropdown */}
              <div className="space-y-1">
                <label htmlFor="planner-tone" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Nuansa Acara</label>
                <select
                  id="planner-tone"
                  value={themeTone}
                  onChange={(e) => setThemeTone(e.target.value)}
                  className="w-full px-2.5 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  <option value="Profesional & Formal">Profesional & Formal</option>
                  <option value="Santai & Edukatif">Santai & Edukatif</option>
                  <option value="Kompetitif & Seru">Kompetitif & Seru</option>
                  <option value="Akrab & Kekeluargaan">Akrab & Kekeluargaan</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Start Hours */}
              <div className="space-y-1">
                <label htmlFor="planner-start-time" className="block text-[10px] font-bold text-slate-500 uppercase">Jam Mulai</label>
                <input
                  id="planner-start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-2 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>

              {/* Duration (Hours) */}
              <div className="space-y-1 col-span-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="planner-duration" className="block text-[10px] font-bold text-slate-500 uppercase">
                    Durasi Acara
                  </label>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full transition-all duration-300 ${
                    eventDuration <= 3 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/50' 
                      : eventDuration <= 6 
                      ? 'bg-purple-50 text-purple-600 border border-purple-200/50' 
                      : 'bg-rose-50 text-rose-600 border border-rose-200/50'
                  }`}>
                    {eventDuration} Jam {eventDuration <= 3 ? '(Singkat)' : eventDuration <= 6 ? '(Sedang)' : '(Panjang)'}
                  </span>
                </div>
                <div className="relative pt-1">
                  <input
                    id="planner-duration"
                    type="range"
                    min="1"
                    max="12"
                    value={eventDuration}
                    onChange={(e) => setEventDuration(Number(e.target.value))}
                    className="w-full accent-purple-600 cursor-pointer h-2 rounded-lg appearance-none transition-all duration-300"
                    style={{
                      background: `linear-gradient(to right, #8b5cf6 0%, #ec4899 ${
                        ((eventDuration - 1) / 11) * 100
                      }%, #e2e8f0 ${
                        ((eventDuration - 1) / 11) * 100
                      }%, #e2e8f0 100%)`
                    }}
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-bold px-0.5 mt-1 font-mono">
                    <span>1 Jam</span>
                    <span>4 Jam</span>
                    <span>8 Jam</span>
                    <span>12 Jam</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Target Audience */}
            <div className="space-y-1">
              <label htmlFor="planner-audience" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Target Jangkauan Peserta</label>
              <input
                id="planner-audience"
                type="text"
                value={estimatedAudience}
                onChange={(e) => setEstimatedAudience(e.target.value)}
                placeholder="Contoh: 150 Mahasiswa Jurusan"
                className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              />
            </div>

            {/* Submit Action */}
            <button
              id="btn-produce-blueprint"
              type="button"
              onClick={handleGeneratePlan}
              className="w-full py-3 bg-gradient-to-tr from-purple-600 to-pink-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-purple-150 hover:opacity-95 transform transition duration-200 active:scale-98 flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Sparkles className="h-4.5 w-4.5 animate-spin duration-1000" />
              <span>Grupkan & Buat Blueprint Acara</span>
            </button>
          </div>
        </div>

        {/* BLUEPRINT OUTPUT RESULTS - RIGHT */}
        <div className="xl:col-span-8 space-y-6">
          {!isGenerated ? (
            <div className="bg-slate-50 border border-slate-200/60 p-12 rounded-3xl text-center space-y-4 max-w-2xl mx-auto py-16">
              <div className="w-16 h-16 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-sm mx-auto">
                <Calendar className="h-8 w-8 text-slate-400" />
              </div>
              <div className="space-y-1">
                <h4 className="font-sans font-extrabold text-sm text-slate-800 uppercase tracking-widest">Blueprint Belum Dibuat</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Masukkan variabel dan kriteria utama agenda ormawa Anda, lalu tekan tombol warna ungu <strong className="text-purple-600">Buat Blueprint Acara</strong> di sebelah kiri untuk merapikan pembagian kerja panitia Anda.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-6 space-y-6" id="blueprint-result-sheet">
              {/* TOP SUMMARY BAR */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="space-y-1">
                  <span className="text-purple-600 text-xs font-black uppercase tracking-wider font-mono">{eventType} PLANNER BLUEPRINT</span>
                  <h3 className="font-sans font-black text-lg text-slate-950 leading-tight">{eventTitle}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <span>Oleh: <strong>{organizerName}</strong></span>
                    <span>&bull;</span>
                    <span>Nuansa: <strong>{themeTone}</strong></span>
                    <span>&bull;</span>
                    <span>Estimasi: <strong>{estimatedAudience}</strong></span>
                  </p>
                </div>

                {/* Readiness Circular/Gauge Bar */}
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-bold leading-none uppercase">Kesiapan Kerja</span>
                    <strong className="text-sm font-black text-slate-900 font-mono mt-0.5 inline-block">{getOverallReadiness()}%</strong>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center border border-purple-100">
                    <CheckSquare className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </div>

              {/* SHEET TABS FOR OUTPUT NAVIGATION */}
              <div className="border-b border-slate-100 flex flex-wrap gap-1 bg-slate-50 p-1 rounded-2xl max-w-lg">
                <button
                  id="sub-tab-rundown"
                  onClick={() => setActiveSubTab('rundown')}
                  className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    activeSubTab === 'rundown'
                      ? 'bg-gradient-to-tr from-purple-600 to-pink-500 text-white shadow font-black'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>Susunan Rundown</span>
                </button>

                <button
                  id="sub-tab-committee"
                  onClick={() => setActiveSubTab('committee')}
                  className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    activeSubTab === 'committee'
                      ? 'bg-gradient-to-tr from-purple-600 to-pink-500 text-white shadow font-black'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Struktur Panitia & Jobdesk</span>
                </button>

                <button
                  id="sub-tab-checklist"
                  onClick={() => setActiveSubTab('checklist')}
                  className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    activeSubTab === 'checklist'
                      ? 'bg-gradient-to-tr from-purple-600 to-pink-500 text-white shadow font-black'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Fase & Linimasa Kerja</span>
                </button>

                <button
                  id="sub-tab-export"
                  onClick={() => setActiveSubTab('export')}
                  className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    activeSubTab === 'export'
                      ? 'bg-gradient-to-tr from-purple-600 to-pink-500 text-white shadow font-black'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Ekspor Rencana</span>
                </button>
              </div>

              {/* RUNDOWN TAB SHEET */}
              {activeSubTab === 'rundown' && (
                <div className="space-y-4 animate-fade-in" id="panel-planner-rundown">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest">Detail Rundown Kegiatan</h4>
                      <p className="text-[10px] text-slate-400">Anda dapat mengubah waktu, nama agenda, PIC, catatan, atau menambahkan baris baru secara langsung.</p>
                    </div>
                    <button
                      id="btn-add-rundown-row"
                      type="button"
                      onClick={handleAddRundownRow}
                      className="py-1 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Tambah Sesi</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-sm">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[9px] tracking-widest border-b border-slate-100">
                          <th className="p-3 w-32 border-r border-slate-100">Waktu / Time</th>
                          <th className="p-3">Rangkaian Aktivitas / Agenda</th>
                          <th className="p-3 w-40 border-l border-slate-100">Penanggung Jawab (PIC)</th>
                          <th className="p-3 border-l border-slate-100">Catatan Teknis</th>
                          <th className="p-3 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rundownList.map((item) => (
                          <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                            {editingRundownId === item.id ? (
                              <>
                                <td className="p-2 border-r border-slate-100">
                                  <input
                                    type="text"
                                    value={tempTime}
                                    onChange={(e) => setTempTime(e.target.value)}
                                    className="w-full px-1.5 py-1 border border-slate-300 rounded font-semibold text-[11px]"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={tempAct}
                                    onChange={(e) => setTempAct(e.target.value)}
                                    className="w-full px-1.5 py-1 border border-slate-300 rounded font-semibold text-[11px]"
                                  />
                                </td>
                                <td className="p-2 border-l border-slate-100">
                                  <input
                                    type="text"
                                    value={tempPic}
                                    onChange={(e) => setTempPic(e.target.value)}
                                    className="w-full px-1.5 py-1 border border-slate-300 rounded font-semibold text-[11px]"
                                  />
                                </td>
                                <td className="p-2 border-l border-slate-100">
                                  <input
                                    type="text"
                                    value={tempNotes}
                                    onChange={(e) => setTempNotes(e.target.value)}
                                    className="w-full px-1.5 py-1 border border-slate-300 rounded text-[11px]"
                                  />
                                </td>
                                <td className="p-2 text-center flex items-center justify-center space-x-1 h-[53px]">
                                  <button
                                    onClick={() => handleSaveRundown(item.id)}
                                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                    title="Simpan"
                                  >
                                    <Save className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingRundownId(null)}
                                    className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                                    title="Batal"
                                  >
                                    <XCircle className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="p-3 w-32 border-r border-slate-100 font-mono font-bold text-purple-700">{item.time}</td>
                                <td className="p-3 font-semibold text-slate-800">{item.activity}</td>
                                <td className="p-3 w-40 border-l border-slate-100 text-slate-600 font-semibold">{item.pic}</td>
                                <td className="p-3 border-l border-slate-100 text-slate-500 italic max-w-xs truncate">{item.notes}</td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center space-x-1">
                                    <button
                                      onClick={() => handleEditRundown(item.id)}
                                      className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                                      title="Edit"
                                    >
                                      <Edit3 className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteRundownRow(item.id)}
                                      className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                                      title="Hapus"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      id="btn-export-rundown-csv"
                      type="button"
                      onClick={exportRundownCVS}
                      className="py-1.5 px-3 bg-slate-900 text-white font-sans text-xs font-bold rounded-xl transition flex items-center space-x-1 hover:bg-slate-800 cursor-pointer shadow"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download File CSV (.csv)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* COMMITTEE STRUCTURE TAB SHEET */}
              {activeSubTab === 'committee' && (
                <div className="space-y-4 animate-fade-in" id="panel-planner-committee">
                  <div className="space-y-1">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest">Pembagian Divisi & Jobdesk Panitia</h4>
                    <p className="text-[10px] text-slate-400">Berikut adalah susunan panitia standard beserta checklist tugas pre-event dan hari-H. Silakan tandai tugas atau ketik penanggung jawab resmi.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {committeeDivisions.map((div, divIdx) => (
                      <div key={divIdx} className="border border-slate-100 bg-slate-50/50 p-4 rounded-2xl flex flex-col justify-between space-y-3">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="text-purple-700 bg-purple-50 border border-purple-100 py-0.5 px-2.5 rounded-full font-sans text-[9px] font-bold uppercase tracking-wider block w-fit">
                              DIVISI PENYELENGGARA
                            </span>
                          </div>

                          <div className="space-y-0.5">
                            <h5 className="font-sans font-extrabold text-slate-900 text-xs leading-snug">{div.name}</h5>
                            <div className="flex gap-2 text-[10px] text-slate-500 font-medium">
                              <span>Koordinator: <strong className="text-slate-700">{div.coordinator}</strong></span>
                              <span>&bull;</span>
                              <span>Anggota: <span className="text-slate-600">{div.staff}</span></span>
                            </div>
                          </div>

                          {/* TASK LIST OF DIVISION */}
                          <div className="space-y-2 pt-2 border-t border-slate-100">
                            {div.tasks.map(task => (
                              <button
                                key={task.id}
                                type="button"
                                onClick={() => handleToggleTask(divIdx, task.id)}
                                className="w-full text-left flex items-start gap-2 p-1.5 bg-white hover:bg-slate-50 border border-slate-100 rounded-xl text-[11px] text-slate-600 transition cursor-pointer"
                              >
                                <div className="mt-0.5 shrink-0">
                                  {task.completed ? (
                                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 stroke-[2.5]" />
                                  ) : (
                                    <div className="w-3.5 h-3.5 rounded border border-slate-300"></div>
                                  )}
                                </div>
                                <span className={task.completed ? 'line-through text-slate-400 font-normal' : 'font-semibold text-slate-700'}>
                                  {task.text}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* EDIT PERSONNEL */}
                        <div className="pt-2 border-t border-slate-100 flex justify-end">
                          {editingDivisionIndex === divIdx ? (
                            <div className="bg-white p-3 border border-slate-200 rounded-xl space-y-2 w-full">
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 block uppercase">Nama Koordinator</label>
                                <input
                                  type="text"
                                  value={editingCoordinator}
                                  onChange={(e) => setEditingCoordinator(e.target.value)}
                                  className="w-full p-1 border rounded text-[11px]"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 block uppercase">Anggota Staf / Jumlah</label>
                                <input
                                  type="text"
                                  value={editingStaff}
                                  onChange={(e) => setEditingStaff(e.target.value)}
                                  className="w-full p-1 border rounded text-[11px]"
                                />
                              </div>
                              <div className="flex justify-end gap-1.5 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleSaveStaffCoord(divIdx)}
                                  className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded"
                                >
                                  Simpan
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingDivisionIndex(null)}
                                  className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded"
                                >
                                  Batal
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleEditStaffCoord(divIdx)}
                              className="py-1 px-2.5 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-lg text-[9px] text-slate-500 font-bold transition flex items-center space-x-1 cursor-pointer"
                            >
                              <Edit3 className="h-2.5 w-2.5" />
                              <span>Atur Nama Personel</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TIMELINE PHASE TAB SHEET */}
              {activeSubTab === 'checklist' && (
                <div className="space-y-4 animate-fade-in" id="panel-planner-checklist">
                  <div className="space-y-1">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest">Rencana Alur & Linimasa Kerja Panitia</h4>
                    <p className="text-[10px] text-slate-400">Roadmap kerja yang diorganisasikan dari H-30 pembentukan panitia hingga H+7 pengunggahan laporan pertanggungjawaban (LPJ).</p>
                  </div>

                  <div className="relative border-l border-purple-200 ml-4 pl-6 space-y-6">
                    {workTimeline.map((group, groupIdx) => (
                      <div key={groupIdx} className="relative space-y-3">
                        {/* Timeline node dot design */}
                        <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-purple-600 ring-4 ring-purple-100"></div>

                        <div className="space-y-0.5">
                          <h5 className="font-sans font-extrabold text-purple-900 text-xs uppercase leading-none">{group.period}</h5>
                          <p className="text-[10px] text-slate-400 font-medium italic">{group.description}</p>
                        </div>

                        {/* List items for this timeline range */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {group.items.map(item => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleToggleTimelineTask(groupIdx, item.id)}
                              className="text-left p-3 border border-slate-100 bg-slate-50 hover:bg-slate-100 rounded-xl space-y-1.5 transition cursor-pointer flex flex-col justify-between"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[9px] text-slate-400 font-bold">TASK ITEM</span>
                                  {item.completed ? (
                                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                                  ) : (
                                    <div className="w-2.5 h-2.5 rounded-sm border border-slate-300"></div>
                                  )}
                                </div>
                                <h6 className={`font-sans font-bold text-[11px] leading-tight text-slate-800 ${item.completed ? 'line-through text-slate-400 font-normal' : ''}`}>
                                  {item.title}
                                </h6>
                              </div>
                              <p className="text-[9px] text-slate-500 leading-normal font-medium">{item.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* EXPORT DRAFT ROADMAP TAP */}
              {activeSubTab === 'export' && (
                <div className="space-y-4 animate-fade-in" id="panel-planner-export">
                  <div className="space-y-1">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest">Panduan Ekspor & Cetak LPJ/Proposal</h4>
                    <p className="text-[10px] text-slate-400">Bagikan cetak biru susunan rencana panitia Anda secara formal.</p>
                  </div>

                  <div className="border border-slate-100 rounded-2xl p-6 bg-slate-50/70 space-y-4">
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-slate-900 uppercase tracking-wide">Panduan Print Out LPJ Resmi</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Anda dapat menekan tombol cetak dokumen di bawah. Format cetak telah dimodifikasi (print-style CSS friendly) agar hanya mencetak struktur susunan rundown, personel divisi, dan timeline roadmap kerja secara vertikal tanpa sidebar UI.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        id="btn-print-itinerary"
                        type="button"
                        onClick={printDocument}
                        className="py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-sans text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow shadow-purple-100"
                      >
                        <Printer className="h-4 w-4" />
                        <span>Cetak Rencana (Hubungkan Printer / Cetak PDF)</span>
                      </button>

                      <button
                        id="btn-download-backup-planner"
                        type="button"
                        onClick={exportRundownCVS}
                        className="py-2.5 px-4 bg-slate-950 text-white font-sans text-xs font-bold rounded-xl transition flex items-center space-x-1.5 hover:bg-slate-850 cursor-pointer shadow"
                      >
                        <Download className="h-4 w-4" />
                        <span>Ekspor File CSV (.csv)</span>
                      </button>
                    </div>
                  </div>

                  <div className="border border-slate-100 p-6 rounded-2xl bg-white space-y-3">
                    <span className="text-[10px] text-purple-600 font-bold uppercase tracking-wider block">Integrasi Dashboard Panitia:</span>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Lanjutkan kelola event dan presensi di tab <strong className="text-slate-800">Kelola Event</strong>. Anda dapat mendaftarkan mahasiswa, mengirimkan e-tiket, serta mengandalkan scanner QR Code kamera di tab <strong className="text-slate-800">E-Tiket & Scanner</strong> untuk asisten panitia langsung yang akurat.
                    </p>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
