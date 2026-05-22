import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Search, Calendar as CalendarIcon, MapPin, 
  Clock, Users, Ticket, CheckCircle2, ChevronRight, 
  Sparkles, Filter, Info, Download, Copy, Share2, Award, 
  BookOpen, Compass, GraduationCap, Home, QrCode
} from 'lucide-react';
import { Event, Participant, User } from '../types';

interface EventShowcaseProps {
  currentUser: User | null;
  onNavigateBack: () => void;
  onGoToDashboard: () => void;
}

export default function EventShowcase({ currentUser, onNavigateBack, onGoToDashboard }: EventShowcaseProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  
  // Showcase States
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  
  // RSVP Form States
  const [rsvpName, setRsvpName] = useState('');
  const [rsvpEmail, setRsvpEmail] = useState('');
  const [rsvpPhone, setRsvpPhone] = useState('');
  const [rsvpMajor, setRsvpMajor] = useState('');
  const [rsvpFaculty, setRsvpFaculty] = useState('Fakultas Ilmu Komputer');
  const [rsvpError, setRsvpError] = useState('');
  
  // Successful Registration State
  const [registeredParticipant, setRegisteredParticipant] = useState<Participant | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Load latest events & participants from localStorage on mount
  const refreshData = () => {
    try {
      const savedEvents = localStorage.getItem('ep_events');
      const savedParts = localStorage.getItem('ep_participants');
      if (savedEvents) {
        setEvents(JSON.parse(savedEvents));
      }
      if (savedParts) {
        setParticipants(JSON.parse(savedParts));
      }
    } catch (e) {
      console.error("Gagal membaca database di showcase publik", e);
    }
  };

  useEffect(() => {
    refreshData();
    // Auto fill form if user is logged in
    if (currentUser) {
      setRsvpName(currentUser.name);
      setRsvpEmail(currentUser.email);
    }
  }, [currentUser]);

  // Handle direct RSVP
  const handleRsvpSubmit = (e: React.FormEvent, eventItem: Event) => {
    e.preventDefault();
    setRsvpError('');

    if (!rsvpName || !rsvpEmail || !rsvpPhone || !rsvpMajor) {
      setRsvpError('Silakan isi seluruh kolom formulir di bawah untuk mendaftar.');
      return;
    }

    // Capacity checking
    const eventParts = participants.filter(p => p.eventId === eventItem.id);
    if (eventParts.length >= eventItem.capacity) {
      setRsvpError('Maaf, kapasitas pendaftar untuk event ini sudah penuh.');
      return;
    }

    // Email double registration checking
    const isDouble = eventParts.some(p => p.email.toLowerCase() === rsvpEmail.toLowerCase());
    if (isDouble) {
      setRsvpError('Email ini sudah terdaftar untuk mengikuti event ini.');
      return;
    }

    // Create unique ticket code: EV<event_num>-<NamePrefix><random>
    const namePrefix = rsvpName.substring(0, 3).toUpperCase().replace(/\s/g, 'X');
    const randNum = Math.floor(100 + Math.random() * 900);
    const eventIndex = events.findIndex(ev => ev.id === eventItem.id) + 1;
    const ticketCode = `EV${eventIndex > 0 ? eventIndex : 'M'}-${namePrefix}${randNum}`;

    const newParticipant: Participant = {
      id: `part_${Date.now()}`,
      eventId: eventItem.id,
      name: rsvpName,
      email: rsvpEmail,
      phone: rsvpPhone,
      ticketCode,
      status: 'Registered',
      registeredAt: new Date().toISOString()
    };

    // Save back to db
    const updatedParticipants = [...participants, newParticipant];
    setParticipants(updatedParticipants);
    localStorage.setItem('ep_participants', JSON.stringify(updatedParticipants));

    // Success response trigger
    setRegisteredParticipant(newParticipant);
    setShowConfetti(true);

    // Reset RSVP fields
    setRsvpPhone('');
    setRsvpMajor('');
  };

  // Helper: Copy ticket code
  const handleCopyTicketCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  // Associate specific event covers with high-quality generated student images
  const getEventImage = (eventId: string, index: number) => {
    if (eventId === 'event_1') {
      return '/src/assets/images/student_event_hero_1779421304942.png';
    }
    if (eventId === 'event_2') {
      return '/src/assets/images/student_activities_1779421324747.png';
    }
    // Colorful, geometric, and aesthetic academic stock fallback illustrations via beautiful patterns
    const gradients = [
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80', // Seminar Hall
      'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&auto=format&fit=crop&q=80', // Meeting Group
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=80', // Students working
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80'  // Group college
    ];
    return gradients[index % gradients.length];
  };

  const getEventMajorPoints = (eventItem: Event) => {
    switch (eventItem.id) {
      case 'event_1':
        return [
          'Informasi Beasiswa Internasional: LPDP, Chevening, Fulbright, & MEXT langsung dari penerima award handal.',
          'Review Jitu CV/ATS: Bedah tuntas struktur resume standar lamaran korporasi multinasional.',
          'Networking Eksklusif: Gabung bersama grup alumni yang didampingi mentor beasiswa berpengalaman.',
          'Fasilitas Lengkap: E-Sertifikat Resmi bertandatangan Rektorat, materi belajar PDF, and konsumsi snack box gratis.'
        ];
      case 'event_2':
        return [
          'Dasar Figma Kerja: Cara membuat layout autolayout, prototyping interaktif, and system component modern.',
          'Slicing HTML/CSS: Mengubah desain Figma menjadi kode responsif real-time menggunakan utility Tailwind CSS.',
          'Project Mandiri: Praktek langsung membangun 1 website portofolio mahasiswa murni dalam 3 jam.',
          'Free Resources: Template Figma premium UI Kit gratis, sertifikat pelatihan HMIF, and mentoring post-event.'
        ];
      case 'event_3':
        return [
          'Sistem British Parliamentary: Pembekalan materi tentang mosi debat, adu argumentasi, and tata tertib lomba.',
          'Piala Bergilir Rektor: Kesempatan mengharumkan nama fakultas serta memperebutkan medali prestasi.',
          'Sertifikat Nasional: Semua tim terdaftar akan mendapatkan sertifikat keikutsertaan resmi universitas.',
          'Hadiah Pembinaan: Hadiah uang tunai bernilai jutaan rupiah untuk juara 1, 2, 3, serta Best Speaker.'
        ];
      default:
        return [
          'Meningkatkan keterampilan teknikal & soft skills relevan menghadapi dunia profesional pasca lulus.',
          'Sertifikat Keikutsertaan Resmi berlogo organisasi mahasiswa penyelenggara (BEM/HMJ/UKM).',
          'Diskusi kolaboratif interaktif dan bimbingan langsung di lingkungan kampus yang ramah.',
          'Fasilitas pendukung seminar (E-materi, relasi luas lintas-angkatan, & free entry ticket/konsumsi).'
        ];
    }
  };

  // Filtration logic
  const filteredEvents = events.filter(ev => {
    const matchesSearch = ev.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ev.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ev.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeCategory === 'Semua') return matchesSearch;
    return ev.type === activeCategory && matchesSearch;
  });

  const selectedEvent = events.find(ev => ev.id === selectedEventId) || null;
  const currentEventParticipantsCount = selectedEvent ? participants.filter(p => p.eventId === selectedEvent.id).length : 0;
  const targetCategoryList = ['Semua', 'Seminar', 'Workshop', 'Lomba', 'Rapat', 'Makrab', 'Pelatihan', 'Komunitas', 'Sosialisasi'];

  return (
    <div className="min-h-screen gradient-bg text-white selection:bg-pink-500 selection:text-white relative pb-20 overflow-hidden font-sans">
      {/* Background overlay decorations */}
      <div className="absolute top-0 left-[-10%] w-[60%] h-[40%] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-[-10%] w-[50%] h-[50%] bg-pink-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* HEADER BAR */}
      <nav className="sticky top-0 z-40 bg-white/5 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          
          <button
            id="btn-showcase-back"
            onClick={onNavigateBack}
            className="group flex items-center space-x-2 text-pink-300 hover:text-pink-200 transition-colors font-bold text-xs uppercase"
          >
            <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
            <span>Kembali ke Beranda</span>
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="p-1 px-2.5 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-lg text-white font-extrabold text-[11px] leading-tight">
              PORTAL EVENT MAHASISWA
            </div>
          </div>

          <div>
            {currentUser ? (
              <button
                id="btn-showcase-go-dash"
                onClick={onGoToDashboard}
                className="px-4 py-1.5 bg-purple-500/20 hover:bg-purple-500/35 text-purple-200 border border-purple-400/30 rounded-xl text-xs font-bold transition flex items-center space-x-1"
              >
                <span>Masuk Dashboard Panitia</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <span className="text-xs text-white/50 font-mono">Status: Public Guest</span>
            )}
          </div>

        </div>
      </nav>

      {/* BODY CONTENT CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 relative">

        <AnimatePresence mode="wait">
          
          {/* STATE A: digital boarding pass e-ticket */}
          {registeredParticipant && selectedEvent && (
            <motion.div
              key="ticket-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-md mx-auto space-y-6 pt-4"
            >
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center p-3 bg-green-500/20 text-green-300 rounded-full animate-bounce">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-black text-white">Pendaftaran Berhasil!</h2>
                <p className="text-xs text-white/80">
                  Selamat, data registrasi mahasiswa Anda telah berhasil direkam. Tunjukkan e-tiket di bawah ini pada saat registrasi ulang di lokasi auditorium.
                </p>
              </div>

              {/* TICKET UI DESIGN */}
              <div className="bg-white text-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/20 relative">
                
                {/* Visual side notches representing realistic paper tickets */}
                <div className="absolute top-[320px] -left-3.5 w-7 h-7 bg-[#0b0416] rounded-full border-r border-slate-200 z-10" />
                <div className="absolute top-[320px] -right-3.5 w-7 h-7 bg-[#0b0416] rounded-full border-l border-slate-200 z-10" />

                {/* Cover Header Image */}
                <div className="relative h-32 bg-slate-900 overflow-hidden">
                  <img 
                    src={getEventImage(selectedEvent.id, 0)} 
                    alt="Cover" 
                    className="w-full h-full object-cover opacity-80"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                    <div>
                      <span className="text-[9px] bg-pink-500 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {selectedEvent.type}
                      </span>
                      <h3 className="text-sm font-black text-white mt-1.5 leading-tight line-clamp-1">{selectedEvent.title}</h3>
                    </div>
                  </div>
                </div>

                {/* Ticket Details Body-Upper */}
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pendaftar</span>
                      <span className="text-xs font-black text-slate-800 line-clamp-1">{registeredParticipant.name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">NIM / Jurusan</span>
                      <span className="text-xs font-black text-slate-800 line-clamp-1">{rsvpMajor || 'Mahasiswa Aktif'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Fakultas</span>
                      <span className="text-xs font-bold text-slate-700">{rsvpFaculty}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Kontak WA/Tlg</span>
                      <span className="text-xs font-mono font-bold text-slate-700">{registeredParticipant.phone}</span>
                    </div>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-slate-100">
                    <div className="flex items-center space-x-1.5 text-xs text-slate-600">
                      <CalendarIcon className="h-3.5 w-3.5 text-pink-500 shrink-0" />
                      <span>{selectedEvent.date} &bull; Pukul {selectedEvent.time} WIB</span>
                    </div>
                    <div className="flex items-start space-x-1.5 text-xs text-slate-600">
                      <MapPin className="h-3.5 w-3.5 text-purple-600 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{selectedEvent.location}</span>
                    </div>
                  </div>
                </div>

                {/* Perforated divider line and scan info */}
                <div className="border-t-2 border-dashed border-slate-200 my-1 relative" />

                {/* QR Code and Ticket Foot */}
                <div className="p-6 bg-slate-50 flex flex-col items-center space-y-4 text-center">
                  
                  {/* Decorative modern simulated QR code */}
                  <div className="p-3 bg-white border-2 border-pink-400/40 rounded-2xl relative shadow-md group">
                    <div className="w-32 h-32 bg-slate-100 flex flex-col items-center justify-center relative p-1">
                      <QrCode className="w-full h-full text-slate-800" />
                      <div className="absolute inset-0 m-auto w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center shadow-lg">
                        <CalendarIcon className="h-4 w-4 text-pink-500" />
                      </div>
                    </div>
                    <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-pink-500 rounded-full animate-ping" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">KODE TIKET RESMI</span>
                    <div className="flex items-center justify-center space-x-1.5">
                      <span className="font-mono text-sm font-black text-slate-900 bg-slate-200/60 px-2.5 py-1 rounded-lg">
                        {registeredParticipant.ticketCode}
                      </span>
                      <button 
                        onClick={() => handleCopyTicketCode(registeredParticipant.ticketCode)}
                        className="p-1 px-1.5 bg-slate-200 text-slate-600 hover:text-pink-600 rounded-md hover:bg-slate-300 transition"
                        title="Salin Kode"
                      >
                        {copyFeedback ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Trust footer sign */}
                  <div className="text-[10px] text-slate-500 font-sans">
                    E-Tiket ini valid secara akademis didukung oleh <strong>EventPlannerKu</strong>
                  </div>
                </div>

              </div>

              {/* Action Buttons with explicit Back flow */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setRegisteredParticipant(null);
                    setSelectedEventId(null);
                  }}
                  className="flex-1 px-5 py-3.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-2xl shadow-lg shadow-pink-500/10 hover:opacity-90 transition flex items-center justify-center space-x-2"
                >
                  <Compass className="h-4 w-4" />
                  <span>Daftar Event Lainnya</span>
                </button>
                <button
                  onClick={() => {
                    setRegisteredParticipant(null);
                    setSelectedEventId(null);
                    onNavigateBack();
                  }}
                  className="px-5 py-3.5 bg-white/10 hover:bg-white/15 text-white border border-white/20 font-bold rounded-2xl transition flex items-center justify-center space-x-1.5"
                >
                  <Home className="h-4 w-4" />
                  <span>Kembali ke Beranda</span>
                </button>
              </div>

            </motion.div>
          )}

          {/* STATE B: Event detail description page ("halaman tampilan acara yang lengkap") */}
          {selectedEventId && !registeredParticipant && selectedEvent && (
            <motion.div
              key="event-complete-detail"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              
              {/* Back button to Directory list */}
              <div>
                <button
                  id="btn-detail-back-to-grid"
                  onClick={() => setSelectedEventId(null)}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white/10 border border-white/15 text-pink-300 rounded-xl text-xs font-bold hover:bg-white/15 transition-all text-left"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Kembali ke Katalog Event</span>
                </button>
              </div>

              {/* TWO COLUMN COMPREHENSIVE DETAIL DISPLAY */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* LEFT COLUMN: Hero visual cover & specifications info */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Glowing card border container */}
                  <div className="relative glass rounded-3xl overflow-hidden border border-white/15 shadow-2xl">
                    {/* Glowing blur header */}
                    <div className="absolute top-0 right-0 w-[40%] h-[30%] bg-pink-500/10 rounded-full blur-[80px]" />
                    
                    {/* Cover graphic */}
                    <div className="h-64 sm:h-80 w-full relative">
                      <img 
                        src={getEventImage(selectedEvent.id, 0)} 
                        alt={selectedEvent.title} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0e0a1b] via-[#0e0a1b]/45 to-transparent" />
                      
                      {/* Floating type badge overlay */}
                      <div className="absolute top-4 left-4 flex gap-2">
                        <span className="px-3.5 py-1 bg-pink-600/90 text-white font-black rounded-full text-[10px] uppercase tracking-wider shadow-md font-sans">
                          {selectedEvent.type}
                        </span>
                        <span className="px-3 py-1 bg-black/50 text-emerald-300 font-bold border border-emerald-500/30 rounded-full text-[10px] uppercase tracking-wider shadow-md flex items-center space-x-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Pendaftaran Aktif</span>
                        </span>
                      </div>
                    </div>

                    {/* Meta details body pad */}
                    <div className="p-6 sm:p-8 space-y-6">
                      <div className="space-y-3">
                        <h1 className="font-sans text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                          {selectedEvent.title}
                        </h1>
                        <div className="flex items-center space-x-2 text-xs text-white/60">
                          <GraduationCap className="h-4 w-4 text-purple-400" />
                          <span>Diselenggarakan oleh: <strong>Panitia Organisasi {currentUser?.organization || 'Badan Eksekutif Mahasiswa (BEM)'}</strong></span>
                        </div>
                      </div>

                      <hr className="border-white/10" />

                      {/* QUICK METRICS GRID */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        
                        <div className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-1">
                          <span className="text-[9px] text-slate-400 font-extrabold block uppercase tracking-wider">Tanggal</span>
                          <span className="text-xs font-black text-white block">{selectedEvent.date}</span>
                        </div>
                        
                        <div className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-1">
                          <span className="text-[9px] text-slate-400 font-extrabold block uppercase tracking-wider">Waktu Mulai</span>
                          <span className="text-xs font-black text-white block">Pukul {selectedEvent.time} WIB</span>
                        </div>

                        <div className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-1">
                          <span className="text-[9px] text-slate-400 font-extrabold block uppercase tracking-wider">Tiket Masuk</span>
                          <span className="text-xs font-black text-pink-300 block">
                            {selectedEvent.ticketPrice === 0 ? 'Gratis' : `Rp${selectedEvent.ticketPrice.toLocaleString('id-ID')}`}
                          </span>
                        </div>

                        <div className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-1">
                          <span className="text-[9px] text-slate-400 font-extrabold block uppercase tracking-wider">Sisa Kuota</span>
                          <span className="text-xs font-black text-purple-300 block">
                            {selectedEvent.capacity - currentEventParticipantsCount} / {selectedEvent.capacity} Kursi
                          </span>
                        </div>

                      </div>

                      {/* Rich Description */}
                      <div className="space-y-3 font-sans">
                        <h3 className="font-bold text-sm text-pink-300">Deskripsi Lengkap Acara</h3>
                        <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
                          {selectedEvent.description}
                        </p>
                        <p className="text-xs text-white/70 leading-relaxed">
                          Acara ini merupakan sarana komprehensif bagi segenap jajaran mahasiswa untuk membekali diri menyongsong iklim kompetisi global, kerja praktek kreatif, dan kolaborasi berdaya saing tinggi. Mari jalin sinergi kebersamaan lewat kegiatan bermutasi tinggi.
                        </p>
                      </div>

                      {/* Segmented points of interest */}
                      <div className="space-y-3 font-sans pt-2">
                        <h4 className="font-bold text-sm text-pink-300">Materi Pokok & Benefit Mahasiswa</h4>
                        <ul className="space-y-2 text-xs sm:text-sm text-white/80">
                          {getEventMajorPoints(selectedEvent).map((point, i) => (
                            <li key={i} className="flex items-start space-x-2">
                              <CheckCircle2 className="h-4.5 w-4.5 text-green-400 shrink-0 mt-0.5" />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                    </div>
                  </div>

                </div>

                {/* RIGHT COLUMN: RSVP Booking registration form & capacity tracking */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* RSVP REGISTRATION PANEL */}
                  <div className="glass border border-white/15 rounded-3xl p-6 sm:p-8 space-y-6 bg-gradient-to-b from-[#110926] via-[#110926]/40 to-transparent relative shadow-2xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-purple-600 to-pink-400 rounded-t-full" />
                    
                    <div className="space-y-1">
                      <h3 className="font-sans text-xl font-extrabold text-white">Formulir Registrasi Mandiri</h3>
                      <p className="text-xs text-white/75 font-sans">
                        Silakan daftarkan diri Anda di bawah untuk mengamankan satu tiket boarding pass QR acara.
                      </p>
                    </div>

                    {/* Capacity bar review */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-medium text-white/75">
                        <span>Pendaftar Terdaftar: {currentEventParticipantsCount}</span>
                        <span>Maksimal {selectedEvent.capacity} Kursi</span>
                      </div>
                      <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((currentEventParticipantsCount / selectedEvent.capacity) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-pink-300/90 font-bold block bg-pink-500/10 border border-pink-400/20 px-2 py-1 rounded w-max">
                        {selectedEvent.capacity - currentEventParticipantsCount} Kursi Masih Tersedia
                      </span>
                    </div>

                    <hr className="border-white/10" />

                    {rsvpError && (
                      <div className="p-3 bg-red-600/30 border border-red-500/30 text-red-200 text-xs font-semibold rounded-xl">
                        {rsvpError}
                      </div>
                    )}

                    {/* Real input form */}
                    <form onSubmit={(e) => handleRsvpSubmit(e, selectedEvent)} className="space-y-4">
                      
                      <div>
                        <label className="block text-[10px] font-bold text-pink-300 uppercase tracking-wider mb-1.5">Nama Lengkap Mahasiswa</label>
                        <input 
                          type="text" 
                          required
                          value={rsvpName}
                          onChange={(e) => setRsvpName(e.target.value)}
                          placeholder="Contoh: Muhammad Akhdan"
                          className="w-full px-4 py-3 bg-black/30 border border-white/15 focus:border-pink-500 text-white rounded-xl placeholder-white/30 text-xs font-sans outline-none focus:ring-1 focus:ring-pink-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-pink-300 uppercase tracking-wider mb-1.5">Alamat Email Aktif/Kampus</label>
                        <input 
                          type="email" 
                          required
                          value={rsvpEmail}
                          onChange={(e) => setRsvpEmail(e.target.value)}
                          placeholder="Contoh: akhdan@mail.univ.ac.id"
                          className="w-full px-4 py-3 bg-black/30 border border-white/15 focus:border-pink-500 text-white rounded-xl placeholder-white/30 text-xs font-sans outline-none focus:ring-1 focus:ring-pink-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-pink-300 uppercase tracking-wider mb-1.5">Nomor Handphone (WhatsApp/Telegram)</label>
                        <input 
                          type="tel" 
                          required
                          value={rsvpPhone}
                          onChange={(e) => setRsvpPhone(e.target.value)}
                          placeholder="Contoh: 0812XXXXXXXX"
                          className="w-full px-4 py-3 bg-black/30 border border-white/15 focus:border-pink-500 text-white rounded-xl placeholder-white/30 text-xs font-sans outline-none focus:ring-1 focus:ring-pink-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-pink-300 uppercase tracking-wider mb-1.5">NIM / S1 Prodi</label>
                          <input 
                            type="text" 
                            required
                            value={rsvpMajor}
                            onChange={(e) => setRsvpMajor(e.target.value)}
                            placeholder="S1 Teknik Elektro"
                            className="w-full px-4 py-3 bg-black/30 border border-white/15 focus:border-pink-500 text-white rounded-xl placeholder-white/30 text-xs font-sans outline-none focus:ring-1 focus:ring-pink-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-pink-300 uppercase tracking-wider mb-1.5">Fakultas</label>
                          <select 
                            value={rsvpFaculty}
                            onChange={(e) => setRsvpFaculty(e.target.value)}
                            className="w-full px-3 py-3 bg-black/30 border border-white/15 focus:border-pink-500 text-white rounded-xl text-xs font-sans outline-none focus:ring-1 focus:ring-pink-500 [&>option]:bg-slate-950"
                          >
                            <option value="Fakultas Ilmu Komputer">Fak. Ilmu Komp</option>
                            <option value="Fakultas Teknik">Fakultas Teknik</option>
                            <option value="Fakultas MIPA">Fakultas MIPA</option>
                            <option value="Fakultas Ekonomi">Fakultas Ekonomi</option>
                            <option value="Fakultas Kedokteran">Fak. Kedokteran</option>
                            <option value="Fakultas Ilmu Sosial Politik">FISIP</option>
                            <option value="Fakultas Hukum">Fakultas Hukum</option>
                            <option value="Pascasarjana / Diploma">Diploma/Lain</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-4 mt-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-sans font-bold rounded-2xl shadow-xl shadow-pink-500/10 hover:opacity-90 transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center space-x-2"
                      >
                        <Ticket className="h-5 w-5" />
                        <span>Konfirmasi & Dapatkan Tiket</span>
                      </button>

                    </form>

                    <p className="text-[10px] text-justify text-slate-400 font-sans leading-relaxed">
                      Catatan: Pengisian data di atas aman dan hanya digunakan oleh Pengurus Organisasi untuk penerbitan E-Sertifikat serta verifikasi absensi kehadiran seminar.
                    </p>

                  </div>

                </div>

              </div>
              
            </motion.div>
          )}

          {/* STATE C: Event list directory catalog (index grid) */}
          {!selectedEventId && !registeredParticipant && (
            <motion.div
              key="event-directory-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Directory Welcome Banner layout */}
              <div className="text-center max-w-2xl mx-auto space-y-3">
                <div className="inline-flex items-center space-x-1 px-3 py-1 bg-white/10 text-pink-300 border border-white/10 rounded-full text-xs font-semibold animate-pulse">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Jelajahi Berbagai Kegiatan Aktual Mahasiswa</span>
                </div>
                <h1 className="font-sans text-3xl sm:text-4xl font-extrabold text-white">
                  Direktori Kegiatan Kampus Aktif
                </h1>
                <p className="text-sm text-white/70 max-w-xl mx-auto leading-relaxed">
                  Temukan seminar beasiswa, bedah karya, rapat koordinasi anggota, hingga malam keakraban jurusan. Klik pada kartu event pilihan untuk mendaftar.
                </p>
              </div>

              {/* SEARCH & FILTER MENU CONTROLS */}
              <div className="glass p-5 rounded-3xl border border-white/10 space-y-4 shadow-xl">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                  
                  {/* Search Bar Input */}
                  <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-white/50" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari judul seminar, lomba, atau lokasi gedung kampus..."
                      className="w-full pl-10 pr-4 py-3 bg-black/25 border border-white/10 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-white rounded-2xl text-xs outline-none placeholder-white/30"
                    />
                  </div>

                  {/* Quick stats on event counter */}
                  <div className="text-xs text-white/70 shrink-0 font-medium font-sans">
                    Menampilkan <strong className="text-pink-300">{filteredEvents.length}</strong> event yang tersedia
                  </div>

                </div>

                {/* Categories Tab scrolling filter */}
                <div className="flex flex-wrap gap-2 pt-1.5">
                  {targetCategoryList.map((cat) => {
                    const iconMap = (cName: string) => {
                      switch (cName) {
                        case 'Semua': return <Compass className="h-3.5 w-3.5" />;
                        case 'Seminar': return <GraduationCap className="h-3.5 w-3.5" />;
                        case 'Workshop': return <BookOpen className="h-3.5 w-3.5" />;
                        case 'Lomba': return <Award className="h-3.5 w-3.5" />;
                        default: return <Info className="h-3.5 w-3.5" />;
                      }
                    };

                    const isAct = activeCategory === cat;
                    const catCount = cat === 'Semua' ? events.length : events.filter(e => e.type === cat).length;

                    return (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer border ${
                          isAct 
                            ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-transparent' 
                            : 'bg-white/5 text-white/70 hover:bg-white/10 border-white/10 hover:text-white'
                        }`}
                      >
                        {iconMap(cat)}
                        <span>{cat}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-sans font-black ${isAct ? 'bg-white/30 text-white' : 'bg-white/10 text-white/50'}`}>
                          {catCount}
                        </span>
                      </button>
                    );
                  })}
                </div>

              </div>

              {/* EVENTS CARDS DIRECTORY GRID */}
              {filteredEvents.length === 0 ? (
                <div className="text-center py-20 bg-white/5 border border-dashed border-white/10 rounded-2xl min-h-[300px] flex flex-col justify-center items-center space-y-3">
                  <div className="p-3 bg-white/10 rounded-full text-slate-400">
                    <Search className="h-8 w-8" />
                  </div>
                  <h3 className="font-bold text-lg text-white">Event Tidak Ditemukan</h3>
                  <p className="text-sm text-white/70 max-w-sm mx-auto leading-relaxed">
                    Kami tidak dapat menemukan nama acara "{searchQuery}" di kategori ini. Silakan coba kata kunci lain atau pilih filter kategori yang berbeda.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEvents.map((ev, index) => {
                    const evParts = participants.filter(p => p.eventId === ev.id);
                    const remSeats = Math.max(ev.capacity - evParts.length, 0);
                    const fillPercent = Math.round((evParts.length / ev.capacity) * 100);

                    return (
                      <div 
                        key={ev.id} 
                        className="glass border border-white/10 rounded-3xl overflow-hidden hover:border-pink-500/50 shadow-lg hover:shadow-2xl hover:shadow-pink-500/5 transition duration-300 flex flex-col justify-between group"
                      >
                        
                        {/* Event cover backdrop image */}
                        <div className="h-44 relative overflow-hidden bg-slate-900 border-b border-white/10">
                          <img 
                            src={getEventImage(ev.id, index)} 
                            alt={ev.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                          
                          {/* Top badge overlay */}
                          <div className="absolute top-3 left-3 flex gap-1.5 items-center">
                            <span className="text-[9px] bg-pink-500 text-white font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              {ev.type}
                            </span>
                            {ev.ticketPrice === 0 && (
                              <span className="text-[9px] bg-green-500 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Free Entry
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Event content information */}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <h3 className="font-sans font-bold text-base text-white group-hover:text-pink-300 transition-colors line-clamp-2 leading-snug">
                              {ev.title}
                            </h3>
                            <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">
                              {ev.description}
                            </p>
                          </div>

                          {/* Logistics Info blocks */}
                          <div className="space-y-1.5 text-xs text-white/70 font-sans border-t border-white/5 pt-3">
                            <div className="flex items-center space-x-2">
                              <CalendarIcon className="h-3.5 w-3.5 text-pink-400 shrink-0" />
                              <span className="truncate">{ev.date} &bull; Pukul {ev.time} WIB</span>
                            </div>
                            <div className="flex items-start space-x-2">
                              <MapPin className="h-3.5 w-3.5 text-purple-400 shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{ev.location}</span>
                            </div>
                          </div>

                          {/* Capacity status progress bar */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-[10px] text-white/70">
                              <span>Terisi: {evParts.length} / {ev.capacity} Mahasiswa</span>
                              <span className={remSeats <= 10 ? 'text-rose-400 font-bold' : ''}>
                                {remSeats === 0 ? 'Full' : `${remSeats} Kursi Sisa`}
                              </span>
                            </div>
                            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${remSeats <= 10 ? 'bg-rose-500' : 'bg-gradient-to-r from-pink-500 to-purple-500'}`}
                                style={{ width: `${Math.min(fillPercent, 100)}%` }}
                              />
                            </div>
                          </div>

                        </div>

                        {/* Footer action */}
                        <div className="p-4 bg-white/5 border-t border-white/10 flex items-center justify-between">
                          <span className="text-xs font-black text-pink-300">
                            {ev.ticketPrice === 0 ? 'Gratis' : `Rp${ev.ticketPrice.toLocaleString('id-ID')}`}
                          </span>
                          
                          <button
                            onClick={() => {
                              setSelectedEventId(ev.id);
                              // Refresh latest fields
                              setRsvpError('');
                            }}
                            className="px-4 py-1.5 bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1 shadow shadow-pink-500/25 cursor-pointer"
                          >
                            <span>Daftar / Detail</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </motion.div>
          )}

        </AnimatePresence>
      </main>

    </div>
  );
}
