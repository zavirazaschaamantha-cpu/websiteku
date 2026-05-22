import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Ticket, QrCode, Award, BarChart2, Star, CheckCircle, 
  MapPin, Calendar as CalendarIcon, Search, SearchCode, Clock, 
  Download, Printer, Info, Compass, HelpCircle, GraduationCap,
  Sparkles, CheckCircle2, ChevronRight, RefreshCw, AlertTriangle
} from 'lucide-react';
import { Event, Participant, User } from '../types';

interface StudentDashboardProps {
  user: User;
  events: Event[];
  participants: Participant[];
  onSaveParticipants: (updated: Participant[]) => void;
  onViewEvents: () => void;
}

export default function StudentDashboard({ 
  user, 
  events, 
  participants, 
  onSaveParticipants, 
  onViewEvents 
}: StudentDashboardProps) {
  
  const [activeTab, setActiveTab] = useState<'tiket' | 'sertifikat' | 'statistik'>('tiket');
  
  // Participant search email defaults to user's email
  const [studentEmail, setStudentEmail] = useState(user.email);
  const [searchHistoryEmail, setSearchHistoryEmail] = useState(user.email);
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');
  
  // Currently viewed card details
  const [selectedTicket, setSelectedTicket] = useState<Participant | null>(null);
  const [showCertificateId, setShowCertificateId] = useState<string | null>(null);
  const [showFeedbackMessage, setShowFeedbackMessage] = useState('');

  // Handle reload
  const handleReloadSearch = () => {
    setSearchHistoryEmail(studentEmail);
    setShowFeedbackMessage('Sinkronisasi data e-tiket kampus berhasil dilakukan.');
    setTimeout(() => setShowFeedbackMessage(''), 3000);
  };

  // Find all registrations matching search email
  const myRegistrations = participants.filter(p => 
    p.email.toLowerCase().trim() === searchHistoryEmail.toLowerCase().trim()
  );

  // Statistics Calculation
  const attendedRegistrations = myRegistrations.filter(p => p.status === 'Attended');
  
  // Calculate simulated SKPI (Credits) - workshops 10 points, seminars 5, others 3
  const calculateSKPI = () => {
    let pts = 0;
    attendedRegistrations.forEach(reg => {
      const ev = events.find(e => e.id === reg.eventId);
      if (!ev) return;
      if (ev.type === 'Workshop') pts += 15;
      else if (ev.type === 'Seminar') pts += 10;
      else if (ev.type === 'Lomba') pts += 20;
      else pts += 5;
    });
    return pts;
  };

  const totalSKPI = calculateSKPI();

  // Cancel reservation
  const handleCancelRegistration = (partId: string) => {
    if (window.confirm('Apakah Anda yakin ingin membatalkan registrasi tiket untuk event ini? Hubungi panitia jika ini kesilapan.')) {
      const filtered = participants.filter(p => p.id !== partId);
      onSaveParticipants(filtered);
      setSelectedTicket(null);
      setShowFeedbackMessage('Pembatalan pendaftaran berhasil diproses.');
      setTimeout(() => setShowFeedbackMessage(''), 3000);
    }
  };

  // Safe print utility helper
  const handlePrintCertificate = (id: string) => {
    window.print();
  };

  // Fetch event helper
  const getEventForParticipant = (part: Participant) => {
    return events.find(ev => ev.id === part.eventId);
  };

  return (
    <div className="space-y-6">
      
      {/* CRITICAL DASHBOARD MODE ALERT HERO */}
      <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-r from-pink-900/40 via-purple-950/40 to-slate-900 border border-pink-500/20 shadow-xl">
        <div className="absolute top-0 right-0 w-[40%] h-full bg-pink-500/5 rounded-full blur-[80px]" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative">
          <div className="space-y-1.5 text-left">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-pink-500/20 text-pink-300 border border-pink-500/30 rounded-xl text-[10px] font-sans font-bold uppercase tracking-wider">
              <Sparkles className="h-3 w-3 animate-spin" />
              <span>Akses Mahasiswa Aktif Kampus</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">Selamat Datang di Portal Peserta!</h2>
            <p className="text-xs text-white/75 font-sans max-w-xl">
              Gunakan mode ini untuk mengambil e-tiket boarding pass, klaim sertifikat seminar Anda, serta memeriksa kualifikasi poin SKPI kelulusan akademik mahasiswa Anda secara instan.
            </p>
          </div>
          
          <button
            onClick={onViewEvents}
            className="px-4 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-lg shadow-pink-500/25 shrink-0"
          >
            <Compass className="h-4 w-4" />
            <span>Telusuri Katalog Event</span>
          </button>
        </div>
      </div>

      {/* QUICK STATISTICS BAR FOR THE STUDENT */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="p-5 bg-white border border-slate-100/90 rounded-2xl shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tiket Terdaftar</span>
            <div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg"><Ticket className="h-5 w-5" /></div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">{myRegistrations.length}</span>
            <span className="text-xs text-slate-400">Pendaftaran Aktif</span>
          </div>
          <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
            Menampilkan kuantitas pendaftaran seminar & workshop kampus yang Anda submit.
          </p>
        </div>

        <div className="p-5 bg-white border border-slate-100/90 rounded-2xl shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Riwayat Kehadiran</span>
            <div className="p-1.5 bg-green-50 text-green-500 rounded-lg"><CheckCircle className="h-5 w-5" /></div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">{attendedRegistrations.length}</span>
            <span className="text-xs text-slate-400">Hadir di Lokasi</span>
          </div>
          <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
            Tiket ter-scan sukses oleh panitia di pintu registrasi ulang auditorium kampus.
          </p>
        </div>

        <div className="p-5 bg-white border border-slate-100/90 rounded-2xl shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Poin SKPI Pendukung</span>
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg"><Award className="h-5 w-5" /></div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">{totalSKPI}</span>
            <span className="text-xs text-slate-400">Satuan Poin Kredit</span>
          </div>
          <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
            Akumulasi poin kelulusan mahasiswa dari seminar (+10) dan workshop (+15).
          </p>
        </div>

      </div>

      {/* SYNCHRONIZER AND TAB CONTROLLERS */}
      <div className="bg-white border border-slate-100/90 rounded-3xl p-5 shadow-sm space-y-5">
        
        {/* Email synchronizer wrapper */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div className="space-y-1.5 max-w-md">
            <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
              <RefreshCw className="h-3.5 w-3.5 text-pink-500" />
              <span>Email Sinkronisasi E-Tiket Mahasiswa</span>
            </h4>
            <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
              Secara bawaan menggunakan email login BEM Anda (<strong className="text-slate-800">{user.email}</strong>). Namun, Anda dapat memasukkan alamat email alternatif pendaftaran lainnya untuk merender tiket milik rekan sejawat.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <input 
              type="email" 
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              placeholder="Masukkan email pendaftaran..."
              className="px-3.5 py-2.5 bg-white border border-slate-200 focus:border-pink-500 text-slate-800 rounded-xl text-xs font-medium w-full md:w-64 outline-none transition"
            />
            <button
              onClick={handleReloadSearch}
              className="p-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shrink-0 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Sinkron</span>
            </button>
          </div>
        </div>

        {/* Sync Toast Feedback */}
        {showFeedbackMessage && (
          <div className="p-3 bg-green-50 text-green-700 border border-green-200 text-xs font-medium rounded-xl flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
            <span>{showFeedbackMessage}</span>
          </div>
        )}

        {/* TAB HEADER TABS */}
        <div className="flex border-b border-slate-100 pb-1 gap-2">
          
          <button
            onClick={() => {
              setActiveTab('tiket');
              setSelectedTicket(null);
            }}
            className={`px-4 py-2 border-b-2 text-xs font-extrabold transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'tiket' 
                ? 'border-pink-500 text-pink-600 font-black' 
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <Ticket className="h-4 w-4" />
            <span>E-Tiket Saya ({myRegistrations.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('sertifikat');
              setSelectedTicket(null);
            }}
            className={`px-4 py-2 border-b-2 text-xs font-extrabold transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'sertifikat' 
                ? 'border-pink-500 text-pink-600 font-black' 
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <Award className="h-4 w-4" />
            <span>Sertifikat Digital ({attendedRegistrations.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('statistik');
              setSelectedTicket(null);
            }}
            className={`px-4 py-2 border-b-2 text-xs font-extrabold transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'statistik' 
                ? 'border-pink-500 text-pink-600 font-black' 
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <BarChart2 className="h-4 w-4" />
            <span>Transkrip SKPI Kampus</span>
          </button>

        </div>

        {/* SUB CONTENT VIEW BASED ON INTERNAL TABS */}
        <div className="pt-2">

          {/* TAB 1: E-TICKET SELECTOR & RENDER */}
          {activeTab === 'tiket' && (
            <div className="space-y-6">
              
              {myRegistrations.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl space-y-3">
                  <div className="p-3 bg-slate-50 text-slate-400 rounded-full inline-block">
                    <Ticket className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-800">Tiket Tidak Ditemukan</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed font-sans">
                    Email <strong className="text-slate-700">{searchHistoryEmail}</strong> belum didaftarkan pada event aktif manapun. Silakan kunjungi portal umum dan pilih event idaman Anda.
                  </p>
                  <button 
                    onClick={onViewEvents}
                    className="px-4 py-2 bg-pink-50 text-pink-600 rounded-xl text-xs font-bold hover:bg-pink-100 transition inline-flex items-center space-x-1 font-sans"
                  >
                    <span>Daftar Event Sekarang</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column: Tickets available */}
                  <div className="lg:col-span-5 space-y-3">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Daftar Pendaftaran Aktif Anda:</span>
                    
                    {myRegistrations.map((ticketRecord) => {
                      const associatedEvent = getEventForParticipant(ticketRecord);
                      const isSelected = selectedTicket?.id === ticketRecord.id;

                      return (
                        <button
                          key={ticketRecord.id}
                          onClick={() => setSelectedTicket(ticketRecord)}
                          className={`w-full p-4 rounded-2xl border text-left transition flex items-start gap-3 cursor-pointer ${
                            isSelected 
                              ? 'border-pink-500 bg-pink-500/5 shadow' 
                              : 'border-slate-100 bg-white hover:border-slate-200'
                          }`}
                        >
                          <div className={`p-2.5 rounded-xl ${ticketRecord.status === 'Attended' ? 'bg-green-50 text-green-500' : 'bg-slate-100 text-slate-500'} shrink-0`}>
                            {ticketRecord.status === 'Attended' ? <CheckCircle className="h-5 w-5" /> : <Ticket className="h-5 w-5" />}
                          </div>

                          <div className="flex-1 min-w-0 space-y-1">
                            <span className="text-[9px] bg-slate-100 text-slate-500 font-extrabold px-1.5 py-0.5 rounded uppercase font-sans">
                              {associatedEvent?.type || 'Seminar'}
                            </span>
                            <h5 className="text-xs font-bold text-slate-900 truncate leading-snug">
                              {associatedEvent?.title || 'Event Kampus Tidak Terpaut'}
                            </h5>
                            <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-mono">
                              <span>Kode: {ticketRecord.ticketCode}</span>
                              <span>&bull;</span>
                              <span className={ticketRecord.status === 'Attended' ? 'text-green-600 font-bold' : 'text-purple-600 font-bold'}>
                                {ticketRecord.status === 'Attended' ? 'TELAH HADIR' : 'TERDAFTAR'}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center text-slate-400">
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Right Column: High-fidelity Ticket visualization */}
                  <div className="lg:col-span-7">
                    {selectedTicket ? (
                      <div className="space-y-4">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Visual Kartu Tiket Boarding Pass:</span>
                        
                        {/* Real ticket card display */}
                        <div className="bg-slate-900 text-white rounded-3xl overflow-hidden shadow-xl border border-slate-800 relative">
                          
                          {/* Inner circle side notch decoration */}
                          <div className="absolute top-[230px] -left-3 w-6 h-6 bg-white rounded-full border-r border-slate-100 z-10" />
                          <div className="absolute top-[230px] -right-3 w-6 h-6 bg-white rounded-full border-l border-slate-100 z-10" />

                          {/* Cover header */}
                          <div className="p-6 bg-gradient-to-tr from-purple-950 to-slate-900 border-b border-slate-800 space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-sans font-bold bg-pink-500/20 text-pink-300 border border-pink-400/30 px-2 py-0.5 rounded">
                                {getEventForParticipant(selectedTicket)?.type || 'Seminar'}
                              </span>
                              <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-mono">
                                <Clock className="h-3 w-3" />
                                <span>{selectedTicket.registeredAt.split('T')[0]}</span>
                              </div>
                            </div>

                            <h3 className="font-sans font-extrabold text-white text-base leading-snug">
                              {getEventForParticipant(selectedTicket)?.title}
                            </h3>
                          </div>

                          {/* Ticket attributes listing */}
                          <div className="p-6 grid grid-cols-2 gap-y-4 gap-x-2 text-left font-sans border-b border-dashed border-slate-800 select-all">
                            <div>
                              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block mb-0.5">Nama Lengkap</span>
                              <span className="text-xs font-bold text-white leading-tight block">{selectedTicket.name}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block mb-0.5">Metode Kontak</span>
                              <span className="text-xs font-mono text-white leading-tight block">{selectedTicket.phone}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block mb-0.5">Gedung / Ruang</span>
                              <span className="text-xs text-white leading-tight block">{getEventForParticipant(selectedTicket)?.location}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block mb-0.5">Jadwal Mulai</span>
                              <span className="text-xs text-pink-300 font-bold leading-tight block">
                                {getEventForParticipant(selectedTicket)?.date} &bull; Pukul {getEventForParticipant(selectedTicket)?.time} WIB
                              </span>
                            </div>
                          </div>

                          {/* Low end QR Code barcode scan section */}
                          <div className="p-6 bg-black/40 flex flex-col items-center justify-center space-y-4 text-center">
                            
                            <div className="p-3.5 bg-white border-2 border-slate-700 rounded-3xl relative shadow-md flex items-center justify-center min-w-[140px] min-h-[140px] group transition-all hover:border-pink-500 duration-300">
                              <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=0f172a&data=${encodeURIComponent(
                                  window.location.origin + '/?scan_ticket=' + selectedTicket.ticketCode
                                )}`} 
                                alt={`QR Code ${selectedTicket.ticketCode}`} 
                                className="h-32 w-32 object-contain transition-transform duration-300 group-hover:scale-105"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <span className="text-[9px] text-pink-300/80 font-medium px-4 leading-relaxed block max-w-xs -mt-1">
                              Pindai QR di atas menggunakan kamera handphone atau scanner panitia untuk mencatat absensi kehadiran secara instan.
                            </span>

                            <div className="space-y-1">
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">ID KODE BOARDING PASS</span>
                              <span className="font-mono text-sm font-black text-white bg-slate-800/80 px-3 py-1 rounded-xl">
                                {selectedTicket.ticketCode}
                              </span>
                            </div>

                            {/* Attended verification badge */}
                            <div className="pt-1.5 flex justify-center">
                              {selectedTicket.status === 'Attended' ? (
                                <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-green-500/25 text-green-300 border border-green-500/30 rounded-full text-[10px] font-bold font-sans">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>STATUS UTAMA: TELAH HADIR / TERVERIFIKASI ABSEN</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-yellow-500/25 text-yellow-300 border border-yellow-500/30 rounded-full text-[10px] font-bold font-sans">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>STATUS UTAMA: BELUM ABSEN (TUNJUKKAN QR)</span>
                                </span>
                              )}
                            </div>

                          </div>
                        </div>

                        {/* Booking management footer bar */}
                        <div className="flex gap-2.5">
                          {selectedTicket.status !== 'Attended' && (
                            <button
                              onClick={() => handleCancelRegistration(selectedTicket.id)}
                              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition flex items-center space-x-1 shrink-0 font-sans cursor-pointer"
                            >
                              <span>Batalkan Booking</span>
                            </button>
                          )}
                          <div className="flex-1 text-right">
                            <span className="text-[10px] text-slate-400 font-sans leading-snug">
                              E-Tiket ini sah untuk registrasi ulang pintu masuk kampus.
                            </span>
                          </div>
                        </div>

                      </div>
                    ) : (
                      <div className="h-full min-h-[300px] border border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center p-6 text-center space-y-2">
                        <div className="p-3 bg-slate-50 text-slate-300 rounded-full">
                          <SearchCode className="h-8 w-8" />
                        </div>
                        <h4 className="font-bold text-sm text-slate-700">Pilih Tiket yang Terdaftar</h4>
                        <p className="text-xs text-slate-400 max-w-xs leading-relaxed font-sans">
                          Silakan klik salah satu tiket di daftar sebelah kiri untuk memunculkan detail barcode QR Code absensi dan opsi pembatalan pendaftaran.
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>
          )}

          {/* TAB 2: EXQUISITE PRINTABLE AUTOMATED E-CERTIFICATE */}
          {activeTab === 'sertifikat' && (
            <div className="space-y-6">
              
              {attendedRegistrations.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-3xl space-y-3">
                  <div className="p-3 bg-slate-50 text-slate-400 rounded-full inline-block">
                    <Award className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-800 font-sans">Belum Memiliki Sertifikat Digital</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed font-sans">
                    Sertifikat hanya diterbitkan otomatis untuk kegiatan dengan status kehadiran <strong className="text-slate-600 uppercase">Telah Hadir (Attended)</strong> di sistem scanner absensi pintu masuk panitia.
                  </p>
                  <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-2xl text-[10px] text-yellow-700 max-w-md mx-auto text-justify font-sans leading-relaxed">
                    <strong>PENTING:</strong> Jika Anda sudah hadir di lokasi gedung seminar namun status tiket belum berubah menjadi Telah Hadir, silakan minta panitia divisi acara untuk mendata kode tiket Anda di panel Scanner Kehadiran Panitia.
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Option bar to switch between attended certificates */}
                  <div className="flex flex-wrap gap-2.5 items-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Klaim Sertifikat Kehadiran Resmi:</span>
                    {attendedRegistrations.map((attendedRecord) => {
                      const associatedEvent = getEventForParticipant(attendedRecord);
                      const isCurrent = showCertificateId === attendedRecord.id;

                      return (
                        <button
                          key={attendedRecord.id}
                          onClick={() => {
                            setShowCertificateId(attendedRecord.id);
                            // Set automatically
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                            isCurrent 
                              ? 'bg-slate-900 text-white' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <Award className="h-3.5 w-3.5 text-yellow-500" />
                          <span>{associatedEvent?.title ? associatedEvent.title.substring(0, 20) + '...' : 'Sertifikat'}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Render simulated Certificate frame */}
                  {showCertificateId ? (
                    (() => {
                      const activeCertificateRecord = attendedRegistrations.find(r => r.id === showCertificateId);
                      if (!activeCertificateRecord) return null;
                      const activeEvent = getEventForParticipant(activeCertificateRecord);
                      const serialCode = `CERT/E-PLNK/${activeEvent?.id.toUpperCase() || 'SEM'}/${activeCertificateRecord.id.substring(5, 11).toUpperCase()}`;

                      return (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4"
                        >
                          
                          {/* REALISTIC HIGH-FIDELITY ACADEMIC CERTIFICATE */}
                          <div 
                            id="academic-certificate-frame"
                            className="bg-stone-50 border-[16px] border-double border-amber-800 p-8 sm:p-14 text-center rounded-2xl text-slate-800 shadow-2xl relative select-none font-serif min-h-[500px] flex flex-col justify-between"
                          >
                            {/* Decorative certificate watermarks */}
                            <div className="absolute inset-0 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:16px_16px] opacity-5 pointer-events-none" />
                            
                            {/* Top emblem */}
                            <div className="space-y-3 relative">
                              <div className="w-16 h-16 bg-amber-800 rounded-full mx-auto flex items-center justify-center text-stone-100 shadow-xl border-4 border-amber-600">
                                <Award className="h-8 w-8 text-amber-300" />
                              </div>
                              <div className="space-y-1">
                                <span className="font-sans text-[10px] font-bold text-amber-800 tracking-widest block uppercase">SERTIFIKAT ELEKTRONIK PENGHARGAAAN</span>
                                <span className="font-sans text-[9px] text-slate-400 font-medium block">Nomor Seri Verifikasi: {serialCode}</span>
                              </div>
                            </div>

                            {/* Statement body */}
                            <div className="my-8 space-y-4 relative">
                              <p className="text-xs text-slate-500 font-sans italic">Dengan bangga dan penuh apresiasi akademis diberikan kepada:</p>
                              
                              <h2 className="text-xl sm:text-3xl font-black text-amber-950 underline font-sans text-center">
                                {activeCertificateRecord.name}
                              </h2>

                              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans max-w-xl mx-auto">
                                Atas partisipasi aktif dan kontribusinya sebagai <strong className="text-amber-800">PESERTA RESMI</strong> dalam kegiatan <strong className="text-slate-900">"{activeEvent?.title}"</strong> yang diselenggarakan secara sukses oleh panitia pelaksana terverifikasi bertempat di <span className="underline">{activeEvent?.location}</span> pada {activeEvent?.date}.
                              </p>
                            </div>

                            {/* Footer signatures layout */}
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 relative font-sans text-xs">
                              
                              <div className="text-left space-y-1 pl-4">
                                <span className="text-[10px] text-slate-400 block font-bold uppercase">PENILAI / DOSEN ANGGOTA</span>
                                <div className="h-10 w-24 border-b border-dotted border-slate-400 flex items-end justify-center text-[10px] text-slate-400 font-mono italic">
                                  Digitally Signed
                                </div>
                                <span className="font-bold text-slate-700 block">Dr. Ir. Hermawan Agung, M.T.</span>
                                <span className="text-[9px] text-slate-400 block">NIP. 19780211 200501 1 002</span>
                              </div>

                              <div className="text-right space-y-1 pr-4">
                                <span className="text-[10px] text-slate-400 block font-bold uppercase">KETUA PANITIA PELAKSANA</span>
                                <div className="h-10 w-24 border-b border-dotted border-slate-400 ml-auto flex items-end justify-center text-[10px] text-slate-400 font-mono italic">
                                  {activeCertificateRecord.ticketCode.substring(5, 10)}
                                </div>
                                <span className="font-bold text-slate-700 block">{user.name}</span>
                                <span className="text-[9px] text-slate-400 block">Presidium {user.organization}</span>
                              </div>

                            </div>

                          </div>

                          {/* Print download command panel */}
                          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <span className="text-xs text-slate-500 font-sans">
                              * Gunakan layout landscape (mendatar) saat melakukan pencetakan file PDF/Kertas.
                            </span>
                            <button
                              onClick={() => handlePrintCertificate(activeCertificateRecord.id)}
                              className="px-4 py-2 bg-gradient-to-tr from-pink-500 to-purple-600 text-white rounded-xl text-xs font-bold hover:opacity-90 transition flex items-center space-x-1.5 cursor-pointer shadow shadow-pink-500/10 font-sans"
                            >
                              <Printer className="h-4 w-4" />
                              <span>Cetak Sertifikat Kertas (PDF)</span>
                            </button>
                          </div>

                        </motion.div>
                      );
                    })()
                  ) : (
                    <div className="p-10 border border-dashed border-slate-100 rounded-3xl text-center space-y-3">
                      <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mx-auto">
                        <Award className="h-6 w-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">Sertifikat Telah Siap</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                        Anda telah sukses menghadiri seminar kelas terverifikasi. Silakan klik salah satu tombol nama kegiatan berikon sertifikat emas di atas untuk merender piagam resmi Anda.
                      </p>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

          {/* TAB 3: STATISTICS TRANSCRIPT (KREDIT SKPI & BADGING SYSTEM) */}
          {activeTab === 'statistik' && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* SKPI Description */}
                <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-1.5">
                    <GraduationCap className="h-5 w-5 text-purple-600" />
                    <span>Apa itu Atribut Kredit SKPI?</span>
                  </h4>
                  <p className="text-xs text-slate-600 font-sans leading-relaxed text-justify">
                    <strong>SKPI (Surat Keterangan Pendamping Ijazah)</strong> adalah dokumen rekam jejak resmi prestasi dan keikutsertaan non-akademis mahasiswa selama duduk di bangku universitas. Berdasarkan ketentuan rektorat, minimal mahasiswa wajib mengumpulkan 100 Poin Kredit sebelum dapat mendaftarkan kelulusan sidang akhir.
                  </p>
                  
                  {/* Visual threshold progress */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-xs text-slate-500 font-semibold">
                      <span>Kelayakan Wisuda: {totalSKPI} / 100 Poin</span>
                      <span>Target Minimal</span>
                    </div>
                    <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((totalSKPI / 100) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 text-purple-700 rounded-2xl border border-purple-100/50 text-[10px] leading-relaxed font-sans flex items-start gap-2.5">
                    <Info className="h-4 w-4 shrink-0 text-purple-600 mt-0.5" />
                    <p>
                      <strong>Saran Sistem:</strong> Tingkatkan keikutsertaan Anda dengan mendaftarkan diri pada kegiatan bereputasi tinggi seperti perlombaan akademik (+20) atau program workshop intensif (+15) untuk mempercepat perolehan poin wisuda.
                    </p>
                  </div>
                </div>

                {/* Badge Achievement Box */}
                <div className="p-6 bg-white border border-slate-100 rounded-3xl space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-1.5">
                    <Star className="h-5 w-5 text-amber-500 animate-spin" />
                    <span>Lencana Prestasi Mahasiswa Anda:</span>
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-3.5">
                    
                    <div className={`p-3.5 rounded-2xl border flex items-center space-x-2.5 ${totalSKPI >= 10 ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100 opacity-50'}`}>
                      <div className="p-1.5 bg-amber-500/20 text-amber-600 rounded-xl"><Star className="h-4 w-4" /></div>
                      <div>
                        <span className="text-[10px] font-black text-slate-900 block">Akademisi Pemula</span>
                        <span className="text-[9px] text-slate-500 block">Minimal 10 SKPI</span>
                      </div>
                    </div>

                    <div className={`p-3.5 rounded-2xl border flex items-center space-x-2.5 ${totalSKPI >= 30 ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100 opacity-50'}`}>
                      <div className="p-1.5 bg-amber-500/20 text-amber-600 rounded-xl"><Award className="h-4 w-4" /></div>
                      <div>
                        <span className="text-[10px] font-black text-slate-900 block">Pegiat Ilmu Jurusan</span>
                        <span className="text-[9px] text-slate-500 block">Minimal 30 SKPI</span>
                      </div>
                    </div>

                    <div className={`p-3.5 rounded-2xl border flex items-center space-x-2.5 ${totalSKPI >= 50 ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100 opacity-50'}`}>
                      <div className="p-1.5 bg-amber-500/20 text-amber-600 rounded-xl"><GraduationCap className="h-4 w-4" /></div>
                      <div>
                        <span className="text-[10px] font-black text-slate-900 block">Bintang Seminar Rektor</span>
                        <span className="text-[9px] text-slate-500 block">Minimal 50 SKPI</span>
                      </div>
                    </div>

                    <div className={`p-3.5 rounded-2xl border flex items-center space-x-2.5 ${totalSKPI >= 100 ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100 opacity-50'}`}>
                      <div className="p-1.5 bg-amber-500/20 text-amber-600 rounded-xl"><Sparkles className="h-4 w-4" /></div>
                      <div>
                        <span className="text-[10px] font-black text-slate-900 block">Legenda Kampus Raya</span>
                        <span className="text-[9px] text-slate-500 block">Minimal 100 SKPI</span>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
              
              {/* Transcript list details */}
              <div className="space-y-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Daftar Transkrip Kehadiran Resmi SKPI:</span>
                
                {attendedRegistrations.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Riwayat transkrip kehadiran Anda masih kosong.</p>
                ) : (
                  <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-inner">
                    <table className="w-full text-slate-800 text-xs table-auto">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 font-bold text-[10px] text-slate-500 font-sans uppercase">
                          <th className="p-3.5 text-left pl-6">Nama Kegiatan Resmi</th>
                          <th className="p-3.5 text-left">Jenis</th>
                          <th className="p-3.5 text-left">Tanggal</th>
                          <th className="p-3.5 text-right pr-6">PoinSKPI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {attendedRegistrations.map((attendanceRecord) => {
                          const ev = getEventForParticipant(attendanceRecord);
                          const isWorkshop = ev?.type === 'Workshop';
                          const isSeminar = ev?.type === 'Seminar';
                          const isLomba = ev?.type === 'Lomba';
                          const pts = isLomba ? 20 : isWorkshop ? 15 : isSeminar ? 10 : 5;

                          return (
                            <tr key={attendanceRecord.id} className="hover:bg-slate-50/70">
                              <td className="p-3.5 font-bold text-slate-900 pl-6 max-w-xs truncate">{ev?.title || 'Kegiatan Kehadiran'}</td>
                              <td className="p-3.5 font-sans">
                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                                  {ev?.type || 'Lain'}
                                </span>
                              </td>
                              <td className="p-3.5 font-mono text-[10px] text-slate-500">{ev?.date}</td>
                              <td className="p-3.5 font-black text-right pr-6 text-purple-600">+{pts} Poin</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
