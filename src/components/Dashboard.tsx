import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, Legend, CartesianGrid, LineChart, Line, Cell
} from 'recharts';
import { 
  Calendar, Plus, Search, Users, QrCode, Ticket, 
  BarChart3, CheckCircle, XCircle, Trash2, LogOut, 
  MapPin, Clock, ArrowUpRight, Download, UserCheck, 
  Smile, Layers, Settings, Sparkles, Filter, 
  UserPlus, CreditCard, Award, HelpCircle, RefreshCw
} from 'lucide-react';
import { Event, Participant, User, SaaSPlan } from '../types';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  onUpdateUserPlan: (newPlan: SaaSPlan) => void;
}

export default function Dashboard({ user, onLogout, onUpdateUserPlan }: DashboardProps) {
  // Database States
  const [events, setEvents] = useState<Event[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  
  // Navigation
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'events' | 'peserta' | 'scanner' | 'saas'>('ringkasan');
  
  // Event filtration
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  
  // Create Event Form state
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventCapacity, setNewEventCapacity] = useState(100);
  const [newEventPrice, setNewEventPrice] = useState(0);
  const [newEventType, setNewEventType] = useState<'Seminar' | 'Workshop' | 'Pelatihan' | 'Komunitas' | 'Sosialisasi'>('Seminar');
  const [eventFormError, setEventFormError] = useState('');

  // Create Participant Form state
  const [showAddPartModal, setShowAddPartModal] = useState(false);
  const [newPartName, setNewPartName] = useState('');
  const [newPartEmail, setNewPartEmail] = useState('');
  const [newPartPhone, setNewPartPhone] = useState('');
  const [newPartEventId, setNewPartEventId] = useState('');
  const [partFormError, setPartFormError] = useState('');

  // Scanner state
  const [manualTicketInput, setManualTicketInput] = useState('');
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    participant?: Participant;
    event?: Event;
  } | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Selected participant for ticket rendering
  const [viewingTicketParticipant, setViewingTicketParticipant] = useState<Participant | null>(null);

  // Load database from localStorage
  const loadDatabase = () => {
    try {
      const savedEvents = localStorage.getItem('ep_events');
      const savedParts = localStorage.getItem('ep_participants');
      if (savedEvents) setEvents(JSON.parse(savedEvents));
      if (savedParts) setParticipants(JSON.parse(savedParts));
    } catch (e) {
      console.error("Gagal memuat database localStorage", e);
    }
  };

  useEffect(() => {
    loadDatabase();
  }, []);

  const saveEventsToStorage = (updatedEvents: Event[]) => {
    setEvents(updatedEvents);
    localStorage.setItem('ep_events', JSON.stringify(updatedEvents));
  };

  const saveParticipantsToStorage = (updatedParts: Participant[]) => {
    setParticipants(updatedParts);
    localStorage.setItem('ep_participants', JSON.stringify(updatedParts));
  };

  // Helper computations
  const totalEvents = events.length;
  const totalParticipants = participants.length;
  const totalAttended = participants.filter(p => p.status === 'Attended').length;
  const attendanceRate = totalParticipants > 0 ? Math.round((totalAttended / totalParticipants) * 100) : 0;

  // Event limit based on user subscription plan
  // Free: max 1 event
  const isEventLimitReached = user.plan === 'free' && totalEvents >= 1;

  // Handle Event submit
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    setEventFormError('');

    if (isEventLimitReached) {
      setEventFormError('Batas maksimum pendaftaran event untuk Free Plan telah tercapai (Maksimal 1 event). Silakan lakukan upgrade paket di tab Bisnis & SaaS!');
      return;
    }

    if (!newEventTitle || !newEventDate || !newEventTime || !newEventLocation) {
      setEventFormError('Silakan lengkapi kolom judul, tanggal, jam, dan lokasi.');
      return;
    }

    const newEvent: Event = {
      id: `event_${Date.now()}`,
      userId: user.id,
      title: newEventTitle,
      description: newEventDesc || 'Tidak ada deskripsi rinci.',
      date: newEventDate,
      time: newEventTime,
      location: newEventLocation,
      type: newEventType,
      capacity: Number(newEventCapacity) || 100,
      ticketPrice: Number(newEventPrice) || 0,
      status: 'Active'
    };

    const updated = [...events, newEvent];
    saveEventsToStorage(updated);
    
    // Clear forms
    setNewEventTitle('');
    setNewEventDesc('');
    setNewEventDate('');
    setNewEventTime('');
    setNewEventLocation('');
    setNewEventCapacity(100);
    setNewEventPrice(0);
    setNewEventType('Seminar');
    setShowAddEventModal(false);
  };

  // Handle manual participant registration
  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    setPartFormError('');

    const targetEventId = newPartEventId || (events[0] ? events[0].id : '');
    if (!targetEventId) {
      setPartFormError('Belum ada event yang aktif untuk menambahkan peserta.');
      return;
    }

    if (!newPartName || !newPartEmail || !newPartPhone) {
      setPartFormError('Silakan lengkapi nama, email, dan telepon peserta.');
      return;
    }

    // Check capacity limit
    const targetEvent = events.find(ev => ev.id === targetEventId);
    if (targetEvent) {
      const currentRegCount = participants.filter(p => p.eventId === targetEventId).length;
      if (currentRegCount >= targetEvent.capacity) {
        setPartFormError('Kapasitas pendaftar untuk event ini sudah penuh!');
        return;
      }
    }

    // Create unique ticket code: EV<event_num>-<NamePrefix><random>
    const namePrefix = newPartName.substring(0, 3).toUpperCase();
    const randNum = Math.floor(10 + Math.random() * 90);
    const eventIndex = events.findIndex(ev => ev.id === targetEventId) + 1;
    const ticketCode = `EV${eventIndex > 0 ? eventIndex : 'X'}-${namePrefix}${randNum}`;

    const newParticipant: Participant = {
      id: `part_${Date.now()}`,
      eventId: targetEventId,
      name: newPartName,
      email: newPartEmail,
      phone: newPartPhone,
      ticketCode,
      status: 'Registered',
      registeredAt: new Date().toISOString()
    };

    const updated = [...participants, newParticipant];
    saveParticipantsToStorage(updated);

    // Reset forms
    setNewPartName('');
    setNewPartEmail('');
    setNewPartPhone('');
    setNewPartEventId('');
    setShowAddPartModal(false);
  };

  // Trigger registration directly from Event Detail card click
  const registerGuestDirectly = (eventId: string) => {
    setNewPartEventId(eventId);
    setShowAddPartModal(true);
  };

  // Delete event
  const handleDeleteEvent = (eventId: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus Event ini beserta seluruh pendaftar di dalamnya?")) {
      const updatedEvents = events.filter(e => e.id !== eventId);
      const updatedParticipants = participants.filter(p => p.eventId !== eventId);
      saveEventsToStorage(updatedEvents);
      saveParticipantsToStorage(updatedParticipants);
      if (selectedEventId === eventId) {
        setSelectedEventId('all');
      }
    }
  };

  // Delete participant
  const handleDeleteParticipant = (partId: string) => {
    if (confirm("Apakah Anda yakin ingin membatalkan/menghapus pendaftar ini?")) {
      const updated = participants.filter(p => p.id !== partId);
      saveParticipantsToStorage(updated);
      if (viewingTicketParticipant?.id === partId) {
        setViewingTicketParticipant(null);
      }
    }
  };

  // Manual Check-in toggle
  const toggleAttendanceStatus = (partId: string) => {
    const updated = participants.map(p => {
      if (p.id === partId) {
        const isCurrentlyRegistered = p.status === 'Registered';
        return {
          ...p,
          status: isCurrentlyRegistered ? 'Attended' as const : 'Registered' as const,
          attendedAt: isCurrentlyRegistered ? new Date().toISOString() : undefined
        };
      }
      return p;
    });
    saveParticipantsToStorage(updated);
    
    // update current ticket viewing details if active
    const updatedViewing = updated.find(p => p.id === partId);
    if (updatedViewing && viewingTicketParticipant?.id === partId) {
      setViewingTicketParticipant(updatedViewing);
    }
  };

  // Execute Ticketing QR Attendance Scan Simulation
  const handlePerformScan = (codeToScan?: string) => {
    setScanResult(null);
    const code = (codeToScan || manualTicketInput).trim().toUpperCase();
    if (!code) {
      setScanResult({
        success: false,
        message: 'Silakan masukkan atau klik salah satu kode tiket peserta untuk disimulasikan!'
      });
      return;
    }

    const matchedPart = participants.find(p => p.ticketCode.toUpperCase() === code);
    if (!matchedPart) {
      setScanResult({
        success: false,
        message: `Kode tiket "${code}" tidak ditemukan dalam sistem kami.`
      });
      return;
    }

    const matchedEvent = events.find(ev => ev.id === matchedPart.eventId);

    if (matchedPart.status === 'Attended') {
      setScanResult({
        success: false,
        message: `Peringatan: Tiket atas nama ${matchedPart.name} telah digunakan untuk absensi masukan pukul ${new Date(matchedPart.attendedAt || '').toLocaleTimeString('id-ID')} WIB.`,
        participant: matchedPart,
        event: matchedEvent
      });
      return;
    }

    // Success Scan Process
    const updatedParts = participants.map(p => {
      if (p.id === matchedPart.id) {
        return {
          ...p,
          status: 'Attended' as const,
          attendedAt: new Date().toISOString()
        };
      }
      return p;
    });
    
    saveParticipantsToStorage(updatedParts);
    setManualTicketInput('');

    setScanResult({
      success: true,
      message: `BERHASIL! Selamat datang, ${matchedPart.name}. Absensi kehadiran Anda telah sukses terekam secara otomatis ke cloud server.`,
      participant: { ...matchedPart, status: 'Attended', attendedAt: new Date().toISOString() },
      event: matchedEvent
    });
  };

  // Filtered Participants List based on selected event + search queries
  const filteredParticipants = participants.filter(p => {
    const matchesEvent = selectedEventId === 'all' || p.eventId === selectedEventId;
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.ticketCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery);
    return matchesEvent && matchesSearch;
  });

  // Export Data simulated trigger (CSV download simulation)
  const handleExportCSV = (eventId: string = 'all') => {
    const targetName = eventId === 'all' ? 'semua-peserta' : (events.find(ev => ev.id === eventId)?.title.substring(0, 15) || 'event');
    const exportData = participants.filter(p => eventId === 'all' || p.eventId === eventId);
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID Peserta,Nama Lengkap,Email,No Telepon,Kode Tiket QR,Status Kehadiran,Terdaftar Pada,Absen Pada\n";
    
    exportData.forEach(p => {
      csvContent += `"${p.id}","${p.name}","${p.email}","${p.phone}","${p.ticketCode}","${p.status === 'Attended' ? 'Hadir' : 'Belum Hadir'}","${p.registeredAt}","${p.attendedAt || '-'}"\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan-SmartEvent-${targetName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Mock charts source preparation
  const getEventChartData = () => {
    return events.map(ev => {
      const evParts = participants.filter(p => p.eventId === ev.id);
      const isAttendedCount = evParts.filter(p => p.status === 'Attended').length;
      return {
        name: ev.title.length > 25 ? ev.title.substring(0, 22) + '...' : ev.title,
        'Pendaftar': evParts.length,
        'Hadir (Absen)': isAttendedCount,
        'Rasio (%)': evParts.length > 0 ? Math.round((isAttendedCount / evParts.length) * 100) : 0
      };
    });
  };

  const getSaaSAnalyticWidgets = () => {
    // Pro benefits
    if (user.plan === 'free') {
      return (
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-3xl p-6 text-center space-y-3">
          <Sparkles className="h-10 w-10 text-purple-600 mx-auto animate-bounce" />
          <h4 className="font-sans font-extrabold text-purple-950 text-base">Dashboard Analitik Terbatas</h4>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            Anda menggunakan **Free Plan**. Untuk mendapatkan data grafik visual pendaftaran, ekspor laporan dan visualisasi diagram pendaftaran yang interaktif ini, silakan upgrade ke **Basic / Pro Plan**!
          </p>
          <button 
            id="analytics-upgrade-now"
            onClick={() => setActiveTab('saas')}
            className="px-5 py-2.5 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700 transition"
          >
            Upgrade Layanan Sekarang
          </button>
        </div>
      );
    }

    const data = getEventChartData();

    if (data.length === 0) {
      return (
        <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-500">
          <Calendar className="h-10 w-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-semibold">Belum ada data event visualisasi.</p>
          <p className="text-xs text-slate-400">Silakan tambahkan event baru dan daftarkan peserta terlebih dahulu.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 border border-slate-100 shadow-sm rounded-3xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-sans font-bold text-sm text-slate-900">Statistik Registrasi & Kehadiran per Event</h4>
            <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">Unit: Orang</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 11, background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Pendaftar" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Hadir (Absen)" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 border border-slate-100 shadow-sm rounded-3xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-sans font-bold text-sm text-slate-900">Efektivitas Tingkat Presentase Kehadiran</h4>
            <span className="text-[10px] bg-pink-100 text-pink-800 font-bold px-2 py-0.5 rounded-full">Unit: Persen (%)</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ fontSize: 11, background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="Rasio (%)" stroke="#ec4899" strokeWidth={3} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800 font-sans selection:bg-pink-500 selection:text-white">
      {/* SIDEBAR NAVIGATION Panel */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800">
        <div>
          {/* Brand header */}
          <div className="p-6 flex items-center space-x-2 border-b border-slate-800/80">
            <div className="p-1.5 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-lg text-white">
              <Calendar className="h-5 w-5" />
            </div>
            <span className="font-bold text-base text-white tracking-tight">EventPlannerKu</span>
          </div>

          {/* User Profile Summary */}
          <div className="p-4 mx-3 my-4 bg-slate-800/50 border border-slate-800 rounded-2xl flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-xl text-white font-sans text-xs font-black uppercase shadow-inner">
              {user.name.substring(0,2)}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-slate-100 truncate">{user.name}</h4>
              <p className="text-[10px] text-slate-400 truncate">{user.organization}</p>
              <div className="mt-1 inline-flex items-center space-x-1 px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/35 text-[9px] font-bold uppercase rounded-full">
                <Sparkles className="h-2 w-2 text-pink-400" />
                <span>{user.plan === 'free' ? 'Free Member' : user.plan === 'basic' ? 'Basic Member' : 'Pro Member'}</span>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="px-3 space-y-1">
            <button
              id="menu-tab-ringkasan"
              onClick={() => setActiveTab('ringkasan')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold transition ${activeTab === 'ringkasan' ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Ringkasan & Laporan</span>
            </button>

            <button
              id="menu-tab-events"
              onClick={() => setActiveTab('events')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold transition ${activeTab === 'events' ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
            >
              <Calendar className="h-4 w-4" />
              <span>Kelola Event</span>
            </button>

            <button
              id="menu-tab-peserta"
              onClick={() => setActiveTab('peserta')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold transition ${activeTab === 'peserta' ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
            >
              <Users className="h-4 w-4" />
              <span>Kelola Peserta</span>
            </button>

            <button
              id="menu-tab-scanner"
              onClick={() => setActiveTab('scanner')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold transition ${activeTab === 'scanner' ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
            >
              <QrCode className="h-4 w-4" />
              <span>E-Tiket & Scanner</span>
            </button>

            <button
              id="menu-tab-saas"
              onClick={() => setActiveTab('saas')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold transition ${activeTab === 'saas' ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
            >
              <Layers className="h-4 w-4" />
              <span>Bisnis & SaaS Info</span>
            </button>
          </nav>
        </div>

        {/* Logout action */}
        <div className="p-4 border-t border-slate-800/80">
          <button
            id="btn-logout"
            onClick={onLogout}
            className="w-full flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 font-bold transition"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Keluar Sistem</span>
          </button>
          <div className="mt-4 text-center text-[9px] text-slate-600">
            Event Planner Ku &bull; 2026
          </div>
        </div>
      </aside>

      {/* MAIN VIEWING SURFACE */}
      <main className="flex-1 overflow-y-auto px-4 md:px-8 py-8 space-y-6">
        
        {/* TOP STATUS BAR CONTAINER */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200/80 pb-4 gap-4">
          <div>
            <span className="text-xs text-slate-400 font-mono block">SISTEM CLOUD / DASHBOARD AKUN</span>
            <h1 className="font-sans font-extrabold text-2xl text-slate-900">
              {activeTab === 'ringkasan' && 'SmartEvent Planner Dashboard'}
              {activeTab === 'events' && 'Kelola Pendaftaran Event'}
              {activeTab === 'peserta' && 'Manajemen Database Peserta'}
              {activeTab === 'scanner' && 'E-Tiket & Scanner Absensi'}
              {activeTab === 'saas' && 'Status Bisnis & Informasi SWOT'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-2.5">
            {/* Realtime Local time widget representation */}
            <div className="hidden lg:block p-2 px-3 bg-white border border-slate-100 rounded-xl text-[10px] text-slate-500 font-mono">
              Lokasi server: Singapore &bull; 2026-05-21
            </div>
            
            {/* Quick Trigger Actions */}
            <button
              id="header-btn-new-event"
              onClick={() => setShowAddEventModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Buat Event Baru</span>
            </button>
          </div>
        </header>

        {/* TAB 1: RINGKASAN & LAPORAN */}
        {activeTab === 'ringkasan' && (
          <div className="space-y-6">
            
            {/* STATISTICS GRID COUNTERS */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-white p-5 border border-slate-100 shadow-sm rounded-2xl flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 font-medium block">Total Event Aktif</span>
                  <span className="font-sans text-2xl font-black text-slate-950">{totalEvents}</span>
                </div>
                <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                  <Calendar className="h-5 w-5" />
                </div>
              </div>

              <div className="bg-white p-5 border border-slate-100 shadow-sm rounded-2xl flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 font-medium block">Total Pendaftar Resmi</span>
                  <span className="font-sans text-2xl font-black text-slate-950">{totalParticipants}</span>
                </div>
                <div className="p-3 bg-pink-100 text-pink-500 rounded-xl">
                  <Users className="h-5 w-5" />
                </div>
              </div>

              <div className="bg-white p-5 border border-slate-100 shadow-sm rounded-2xl flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 font-medium block">Total Kehadiran Fisik</span>
                  <span className="font-sans text-2xl font-black text-slate-950">{totalAttended}</span>
                </div>
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                  <CheckCircle className="h-5 w-5" />
                </div>
              </div>

              <div className="bg-white p-5 border border-slate-100 shadow-sm rounded-2xl flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 font-medium block">Rasio Kehadiran</span>
                  <span className="font-sans text-2xl font-black text-slate-950">{attendanceRate}%</span>
                </div>
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                  <UserCheck className="h-5 w-5" />
                </div>
              </div>

            </section>

            {/* CHARTS CONTAINER widgets block */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-sans font-extrabold text-base text-slate-900 flex items-center space-x-2">
                  <span>Visualisasi Laporan Grafik Real-Time</span>
                  <span className="text-[10px] bg-purple-100 text-purple-900 border border-purple-200 font-bold px-2.5 py-0.5 rounded-full uppercase">SaaS Pro Analytics</span>
                </h3>
              </div>
              {getSaaSAnalyticWidgets()}
            </section>

            {/* RECENT REGISTRATIONS AND ACTION LINKS */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Recent Event summaries */}
              <div className="lg:col-span-2 bg-white p-6 border border-slate-100 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-sans font-bold text-sm text-slate-950">Aksi Manajemen Laporan Lengkap</h4>
                  <button 
                    onClick={loadDatabase}
                    className="flex items-center space-x-1 text-xs text-purple-600 hover:text-purple-700 font-semibold"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Refresh</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-120/60 flex flex-col justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 mb-1">Unduh Semua Data Peserta</h5>
                      <p className="text-[10px] text-slate-500 leading-relaxed mb-4">Merapikan rekapitulasi data pendaftaran dari seluruh rangkaian event ke format berkas Excel/CSV.</p>
                    </div>
                    <button
                      id="export-sc-all"
                      onClick={() => handleExportCSV('all')}
                      className="px-4 py-2 bg-white hover:bg-slate-100 text-purple-700 border border-purple-200 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Berita Acara (.CSV)</span>
                    </button>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-120/60 flex flex-col justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 mb-1">Buka Sistem Absensi Tap QR</h5>
                      <p className="text-[10px] text-slate-500 leading-relaxed mb-4">Lakukan simulasi scan e-tiket dengan kamera scanner untuk verifikasi pendaftaran di meja registrasi.</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('scanner')}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2 shadow-sm"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      <span>Masuk Scan Loker</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Instant plan benefits widget summary */}
              <div className="bg-gradient-to-tr from-slate-900 to-purple-950 p-6 text-white rounded-3xl flex flex-col justify-between shadow-lg">
                <div className="space-y-3">
                  <div className="inline-flex space-x-1 items-center px-2 py-0.5 bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 rounded-full text-[9px] font-bold tracking-wider uppercase">
                    <Sparkles className="h-2 w-2" />
                    <span>Upgrade Cloud Tersedia</span>
                  </div>
                  <h4 className="font-sans font-extrabold text-base leading-snug">Butuh Integrasi Khusus Komunitas?</h4>
                  <p className="text-[10px] text-purple-200 leading-relaxed">
                    Tingkatkan ke **Pro Plan (Rp99.000 / bln)** untuk mencakup prioritas respon CS, diagram detail ekspor absensi harian, dan kustomisasi tiket berlogo kampus atau instansi.
                  </p>
                </div>
                
                <button
                  onClick={() => setActiveTab('saas')}
                  className="w-full mt-4 py-2.5 bg-white text-purple-950 font-sans text-xs font-bold rounded-xl hover:bg-purple-100 transition flex items-center justify-center space-x-2"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>Update Paket Langganan</span>
                </button>
              </div>

            </section>

          </div>
        )}

        {/* TAB 2: KELOLA EVENT (EVENTS LIST) */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            
            {/* Upper Action block info */}
            <div className="bg-white border border-slate-120 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-sans font-bold text-sm text-slate-900">Total Event Terdaftar ({totalEvents})</h3>
                <p className="text-xs text-slate-500">
                  {user.plan === 'free' ? 'Batas maksimal Anda: 1 Event (Paket Free)' : 'Paket Anda: Unlimited Event (Akses Penuh)'}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                {user.plan === 'free' && isEventLimitReached && (
                  <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-1 rounded-lg">Batas Free Tercapai</span>
                )}
                <button
                  id="btn-add-event-grid"
                  onClick={() => setShowAddEventModal(true)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 ${user.plan === 'free' && isEventLimitReached ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
                  disabled={user.plan === 'free' && isEventLimitReached}
                >
                  <Plus className="h-4 w-4" />
                  <span>Buat Event Baru</span>
                </button>
              </div>
            </div>

            {eventFormError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl">
                {eventFormError}
              </div>
            )}

            {/* EVENTS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((ev, index) => {
                const evParts = participants.filter(p => p.eventId === ev.id);
                const evAttended = evParts.filter(p => p.status === 'Attended').length;
                const capacityPercentage = Math.round((evParts.length / ev.capacity) * 100);

                return (
                  <div key={ev.id} className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between">
                    
                    {/* Event Banner Mimic Gradient */}
                    <div className={`h-24 p-4 flex flex-col justify-between bg-gradient-to-tr ${
                      index % 3 === 0 ? 'from-purple-600 to-pink-500' : 
                      index % 3 === 1 ? 'from-indigo-600 to-purple-500' :
                      'from-pink-600 to-purple-500'
                    } text-white`}>
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full w-max text-white">
                        {ev.type}
                      </span>
                      <h4 className="font-sans font-bold text-xs line-clamp-2 leading-tight text-white">{ev.title}</h4>
                    </div>

                    {/* Event Body Detail */}
                    <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-2.5">
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{ev.description}</p>
                        
                        <div className="space-y-1.5 text-xs text-slate-600 font-sans">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                            <span>{ev.date} &bull; Pukul {ev.time} WIB</span>
                          </div>
                          <div className="flex items-start space-x-2">
                            <MapPin className="h-3.5 w-3.5 text-pink-500 shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{ev.location}</span>
                          </div>
                        </div>
                      </div>

                      {/* Attendee capacity meter */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[11px] font-medium text-slate-600">
                          <span>Terisi: {evParts.length} / {ev.capacity} Kuota</span>
                          <span className={`${capacityPercentage >= 90 ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>{capacityPercentage}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${capacityPercentage >= 90 ? 'bg-rose-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}
                            style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Simple detail metrics */}
                      <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-center">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">Absensi Hadir</span>
                          <span className="font-sans text-sm font-bold text-slate-800">{evAttended} Peserta</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">Tiket Masuk</span>
                          <span className="font-sans text-sm font-bold text-slate-800">
                            {ev.ticketPrice === 0 ? 'Gratis' : `Rp${ev.ticketPrice.toLocaleString('id-ID')}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Action footer */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-1">
                      
                      <button
                        title="Tambahkan Peserta Manual"
                        onClick={() => registerGuestDirectly(ev.id)}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-purple-600 text-xs font-semibold rounded-xl transition flex items-center space-x-1"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Daftar Tamu</span>
                      </button>

                      <div className="flex items-center space-x-1">
                        <button
                          title="Laporan CSV Event ini"
                          onClick={() => handleExportCSV(ev.id)}
                          className="p-1 px-2.5 bg-white border border-slate-200 text-slate-600 hover:text-purple-600 rounded-xl hover:bg-slate-100 transition"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedEventId(ev.id);
                            setActiveTab('peserta');
                          }}
                          className="px-3 py-1.5 bg-purple-100 text-purple-700 hover:bg-purple-200 text-xs font-bold rounded-xl transition"
                        >
                          Mengatur
                        </button>
                        <button
                          title="Hapus Event"
                          onClick={() => handleDeleteEvent(ev.id)}
                          className="p-1.5 bg-white text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                    </div>

                  </div>
                );
              })}

              {events.length === 0 && (
                <div className="col-span-1 md:col-span-2 lg:col-span-3 p-12 text-center border-2 border-dashed border-slate-200 bg-white rounded-3xl text-slate-500">
                  <Calendar className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-semibold">Anda belum membuat Event satupun.</p>
                  <p className="text-xs text-slate-400 mb-4">Siapkan pendaftaran seminar atau workshop Anda dengan menekan tombol di bawah ini.</p>
                  <button
                    onClick={() => setShowAddEventModal(true)}
                    className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700 transition"
                  >
                    Mulai Buat Event Pertama
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 3: KELOLA PESERTA (PARTICIPANT LIST & TOOLS) */}
        {activeTab === 'peserta' && (
          <div className="space-y-6">
            
            {/* Filtering block & Toolbar */}
            <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
              
              {/* Event Filter Selection */}
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center flex-1">
                <span className="text-xs font-bold text-slate-500 uppercase flex items-center space-x-1 shrink-0">
                  <Filter className="h-3.5 w-3.5 text-purple-600" />
                  <span>Saring Acara:</span>
                </span>
                <select
                  id="select-filter-event"
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 w-full sm:max-w-xs"
                >
                  <option value="all">Semua Event Aktif ({totalParticipants} pendaftar)</option>
                  {events.map(ev => {
                    const count = participants.filter(p => p.eventId === ev.id).length;
                    return (
                      <option key={ev.id} value={ev.id}>{ev.title.substring(0,35)}... ({count})</option>
                    );
                  })}
                </select>
              </div>

              {/* Text Search Bar */}
              <div className="relative w-full md:max-w-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  id="search-input-part"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, email, kode..."
                  className="block w-full pl-9 pr-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              {/* Instant Registration Direct Button */}
              <div className="flex gap-2">
                <button
                  id="btn-add-part-tbl"
                  onClick={() => setShowAddPartModal(true)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-purple-700 border border-purple-200 hover:border-purple-300 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Daftar Manual</span>
                </button>
                <button
                  id="btn-export-part-tbl"
                  onClick={() => handleExportCSV(selectedEventId)}
                  className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition flex items-center justify-center"
                  title="Unduh laporan CSV pendaftar tersaring"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>

            </div>

            {partFormError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl">
                {partFormError}
              </div>
            )}

            {/* TABLE OF REGISTERED PARTICIPANTS */}
            <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-55/80 backdrop-blur">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Detail Peserta</th>
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kontak</th>
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Event Asosiasi</th>
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kode Tiket</th>
                      <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kehadiran H-Day</th>
                      <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest">Aksi Alat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredParticipants.map(part => {
                      const matchedEvent = events.find(ev => ev.id === part.eventId);
                      return (
                        <tr key={part.id} className="hover:bg-purple-50/10 transition">
                          
                          {/* Profile name and avatar representation */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-100 to-pink-100 font-sans text-xs font-bold flex items-center justify-center text-purple-700 uppercase">
                                {part.name.substring(0,2)}
                              </div>
                              <div>
                                <h5 className="text-xs font-bold text-slate-900">{part.name}</h5>
                                <span className="text-[10px] text-slate-400">ID: {part.id.substring(5,11)}</span>
                              </div>
                            </div>
                          </td>

                          {/* Contact email phone */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-0.5">
                              <p className="text-xs text-slate-700 font-medium">{part.email}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{part.phone}</p>
                            </div>
                          </td>

                          {/* Event associations */}
                          <td className="px-6 py-4">
                            <span className="text-xs text-slate-800 font-medium block max-w-[150px] truncate leading-tight">
                              {matchedEvent ? matchedEvent.title : 'Event tidak aktif'}
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">{matchedEvent?.type}</span>
                          </td>

                          {/* Ticket code and simulated QR access */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setViewingTicketParticipant(part);
                                setActiveTab('scanner');
                              }}
                              className="text-xs font-mono font-bold text-purple-600 hover:text-purple-700 hover:underline flex items-center space-x-1"
                              title="Lihat Tiket QR Digital"
                            >
                              <Ticket className="h-3 w-3 inline text-pink-500 shrink-0" />
                              <span>{part.ticketCode}</span>
                            </button>
                          </td>

                          {/* Check in status status */}
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex justify-center">
                              <button
                                onClick={() => toggleAttendanceStatus(part.id)}
                                className={`px-2.5 py-1 text-[10px] font-bold rounded-full transition ${part.status === 'Attended' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}
                              >
                                {part.status === 'Attended' ? 'Hadir' : 'Belum Absen'}
                              </button>
                            </div>
                          </td>

                          {/* Action tools */}
                          <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                            <div className="flex items-center justify-end space-x-2">
                              {/* Quick scan checker */}
                              <button
                                onClick={() => {
                                  setViewingTicketParticipant(part);
                                  handlePerformScan(part.ticketCode);
                                  setActiveTab('scanner');
                                }}
                                className="p-1 px-2 text-[10px] font-bold text-purple-600 border border-purple-200 bg-purple-50 hover:bg-purple-100 rounded-lg transition"
                                title="Lakukan Scan Kehadiran Instan"
                              >
                                Scan
                              </button>
                              
                              <button
                                onClick={() => handleDeleteParticipant(part.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 border border-slate-200 rounded-lg transition"
                                title="Batalkan Pendaftaran"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })}

                    {filteredParticipants.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-xs">
                          <Users className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                          <p className="font-semibold">Tidak ada peserta yang cocok dengan filter atau pencarian Anda.</p>
                          <p className="text-slate-400">Masukkan nama peserta lain atau daftarkan tamu secara manual.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: E-TIKET & SCANNER (TICKETING & WEB ATTENDANCE SCANNER) */}
        {activeTab === 'scanner' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Box: Web QR-Code Attendance Scanner simulation */}
            <div className="lg:col-span-7 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-6">
              
              <div className="space-y-2">
                <span className="text-purple-600 text-xs font-bold uppercase tracking-wider block">Real-Time Verification</span>
                <h3 className="font-sans font-extrabold text-lg text-slate-950">Scanner Kehadiran / Absensi QR</h3>
                <p className="text-xs text-slate-500">
                  Simulasikan proses pemindaian tiket pendaftaran di pintu masuk seminar. Sistem akan memvalidasi id, menandai kehadiran peserta, dan memperbarui grafik dashboard secara instan.
                </p>
              </div>

              {/* MOCK SCANNER VIEWPORT */}
              <div className="border-4 border-slate-200 rounded-3xl overflow-hidden bg-slate-950 relative aspect-[1.3] shadow-inner flex flex-col items-center justify-between p-6">
                
                {/* Simulated Laser scan beam line */}
                <div className="absolute top-1/4 left-10 right-10 h-0.5 bg-pink-500 shadow-md shadow-pink-500 animate-pulse -translate-y-1/2"></div>
                
                {/* Hologram decoration dots grid */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent flex items-center justify-center opacity-85">
                  <div className="w-52 h-52 border border-purple-500/40 border-dashed rounded-2xl flex items-center justify-center">
                    <QrCode className="h-24 w-24 text-purple-400/30 animate-pulse" />
                  </div>
                </div>

                {/* Simulated scan green popup state */}
                {scanResult && (
                  <div className={`absolute inset-0 flex items-center justify-center p-6 bg-slate-950/90 text-center ${scanResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                    <div className="space-y-4 max-w-sm">
                      <div className="mx-auto w-12 h-12 rounded-full border border-current flex items-center justify-center mb-1">
                        {scanResult.success ? <CheckCircle className="h-6 w-6 stroke-[3]" /> : <XCircle className="h-6 w-6 stroke-[3]" />}
                      </div>
                      <h4 className="font-sans font-bold text-base uppercase tracking-wider">{scanResult.success ? 'SCAN SUKSES' : 'SCAN GAGAL'}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed font-semibold">{scanResult.message}</p>
                      
                      {scanResult.participant && (
                        <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex items-center space-x-3 text-left">
                          <div className="p-2 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-xl text-white font-sans text-xs font-black">
                            {scanResult.participant.name.substring(0,2)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{scanResult.participant.name}</p>
                            <p className="text-[9px] text-slate-400 font-mono">{scanResult.participant.ticketCode} &bull; {scanResult.participant.email}</p>
                            {scanResult.event && (
                              <p className="text-[9px] text-purple-300 truncate font-semibold mt-0.5">{scanResult.event.title}</p>
                            )}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => setScanResult(null)}
                        className="p-1 px-4 text-xs font-bold text-slate-300 hover:text-white border border-slate-700 bg-slate-900 hover:bg-slate-800 rounded-xl transition"
                      >
                        Scan Berikutnya
                      </button>
                    </div>
                  </div>
                )}

                {/* Mock Camera details header */}
                <div className="w-full relative flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 bg-slate-900/80 px-2.5 py-1 rounded-full text-[9px] text-slate-400 font-bold border border-slate-800">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                    <span>LIVE HD SCANNER FEED</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500">CO-WEB CAM REQ 1</span>
                </div>

                <div className="relative text-center max-w-xs space-y-1">
                  <span className="text-[10px] text-slate-400 block tracking-wider uppercase font-extrabold text-center mx-auto">Target Pembaca Tiket QR</span>
                  <p className="text-[9px] text-slate-500">Posisikan kode batang di dalam kotak penembak garis laser.</p>
                </div>

              </div>

              {/* MANUAL SIMULATION ACTION BAR */}
              <div className="space-y-3.5 pt-2">
                <label htmlFor="manual-ticket-id" className="block text-xs font-bold text-slate-700 uppercase tracking-widest">
                  Input / Pilih Simulator Tiket Terdaftar
                </label>
                
                <div className="flex gap-2">
                  <input
                    id="manual-ticket-id"
                    type="text"
                    value={manualTicketInput}
                    onChange={(e) => setManualTicketInput(e.target.value)}
                    placeholder="Masukkan Kode Tiket (Contoh: EV1-AND89)"
                    className="flex-1 px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase"
                  />
                  <button
                    id="btn-scan-submit"
                    onClick={() => handlePerformScan()}
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-purple-100 flex items-center space-x-1"
                  >
                    <QrCode className="h-4 w-4 shrink-0" />
                    <span>Konfirmasi Scan</span>
                  </button>
                </div>

                {/* Quick picker items of registered users that are not yet checked, for extreme simulation usability */}
                <div className="space-y-2 bg-slate-50 p-4 border border-slate-100 rounded-2xl">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Simulator Klik Cepat Tiket Peserta:</span>
                  <div className="flex flex-wrap gap-2">
                    {participants.filter(p => p.status === 'Registered').map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setManualTicketInput(p.ticketCode);
                          setViewingTicketParticipant(p);
                        }}
                        className={`p-1.5 px-3 bg-white text-slate-700 border border-slate-200 hover:border-purple-300 rounded-xl text-[10px] font-semibold flex items-center space-x-1.5 text-left transition ${manualTicketInput === p.ticketCode ? 'ring-2 ring-purple-600 text-purple-700 bg-purple-50/20' : ''}`}
                      >
                        <Ticket className="h-3 w-3 text-pink-500" />
                        <div>
                          <strong>{p.name}</strong> &bull; <span className="font-mono text-slate-400">{p.ticketCode}</span>
                        </div>
                      </button>
                    ))}

                    {participants.filter(p => p.status === 'Registered').length === 0 && (
                      <span className="text-[10px] text-slate-400 italic">Seluruh peserta terdaftar telah melakukan check-in / absensi!</span>
                    )}
                  </div>
                </div>

              </div>

            </div>

            {/* Right Box: Custom Digital E-Ticket Admission graphic card */}
            <div className="lg:col-span-5 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
              
              <div className="space-y-1">
                <span className="text-pink-500 text-xs font-bold uppercase tracking-wider block">E-Ticket Previewer</span>
                <h3 className="font-sans font-bold text-sm text-slate-900">Kartu Penerimaan Tiket Digital</h3>
              </div>

              {viewingTicketParticipant ? (
                (() => {
                  const ev = events.find(e => e.id === viewingTicketParticipant.eventId);
                  return (
                    <div className="space-y-4">
                      
                      {/* TICKET ARTWORK DESIGN CARD */}
                      <div className="border border-slate-150 rounded-2xl overflow-hidden bg-slate-50 relative shadow-sm">
                        
                        {/* Header event color brand indicator */}
                        <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-4 text-white">
                          <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider mb-2">
                            <span>TIKET VALID DIGITAL</span>
                            <span className="bg-white/20 px-2 py-0.5 rounded-full">{ev?.type || 'EVENT'}</span>
                          </div>
                          <h4 className="font-sans font-bold text-xs line-clamp-1 text-white">{ev?.title || 'Judul Event'}</h4>
                        </div>

                        {/* Ticket middle perforated cut-out section divider */}
                        <div className="flex items-center justify-between px-1 bg-white relative">
                          <div className="w-3.5 h-3.5 bg-slate-50 border-r border-slate-150 rounded-full -ml-[11px]" />
                          <div className="flex-1 border-t border-dashed border-slate-200 mx-2" />
                          <div className="w-3.5 h-3.5 bg-slate-50 border-l border-slate-150 rounded-full -mr-[11px]" />
                        </div>

                        {/* Ticket attendee body content details */}
                        <div className="p-4 bg-white space-y-4">
                          
                          <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase block mb-0.5">Nama Peserta</span>
                              <strong className="text-slate-900 font-bold truncate block">{viewingTicketParticipant.name}</strong>
                              <span className="text-[9px] text-slate-400 block truncate">{viewingTicketParticipant.email}</span>
                            </div>

                            <div>
                              <span className="text-[10px] text-slate-400 uppercase block mb-0.5">Kode Masuk</span>
                              <strong className="text-purple-700 font-mono font-bold truncate block tracking-wider uppercase">{viewingTicketParticipant.ticketCode}</strong>
                              <span className={`text-[9px] font-bold uppercase ${viewingTicketParticipant.status === 'Attended' ? 'text-emerald-600' : 'text-blue-500'}`}>
                                Status: {viewingTicketParticipant.status === 'Attended' ? 'Selesai Absen' : 'Terdaftar'}
                              </span>
                            </div>
                          </div>

                          <div className="text-xs font-sans border-t border-slate-100 pt-3 space-y-2">
                            <div className="flex items-center space-x-2 text-slate-600">
                              <Calendar className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                              <span>{ev?.date || '2026-06-15'} &bull; {ev?.time || '09:00'} WIB</span>
                            </div>
                            <div className="flex items-start space-x-2 text-slate-600">
                              <MapPin className="h-3.5 w-3.5 text-pink-500 shrink-0 mt-0.5" />
                              <span className="line-clamp-1 leading-snug">{ev?.location || 'Gedung Rektorat Lt.3'}</span>
                            </div>
                          </div>

                        </div>

                        {/* QR section footer cut */}
                        <div className="p-4 bg-slate-50 border-t border-slate-150 flex flex-col items-center space-y-2">
                          
                          <div className="p-2.5 bg-white border border-slate-200 rounded-xl">
                            {/* Draw beautiful mock barcode QR with canvas CSS styling */}
                            <div className="grid grid-cols-4 gap-0.5 w-16 h-16 animate-pulse">
                              <div className="bg-slate-900"></div><div className="bg-white"></div><div className="bg-slate-900"></div><div className="bg-slate-900"></div>
                              <div className="bg-slate-900"></div><div className="bg-slate-900"></div><div className="bg-white"></div><div className="bg-slate-900"></div>
                              <div className="bg-white"></div><div className="bg-slate-900"></div><div className="bg-slate-900"></div><div className="bg-white"></div>
                              <div className="bg-slate-900"></div><div className="bg-white"></div><div className="bg-slate-900"></div><div className="bg-slate-900"></div>
                            </div>
                          </div>
                          
                          <span className="font-mono text-[9px] text-slate-400 font-semibold uppercase">{viewingTicketParticipant.ticketCode}</span>
                        </div>

                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleAttendanceStatus(viewingTicketParticipant.id)}
                          className="flex-1 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-purple-600 text-xs font-bold rounded-xl transition"
                        >
                          Tandai {viewingTicketParticipant.status === 'Attended' ? 'Belum Absen' : 'Selesai Absen'}
                        </button>
                        
                        <button
                          onClick={() => window.print()}
                          className="py-1.5 px-3 bg-purple-100 text-purple-700 hover:bg-purple-200 text-xs font-bold rounded-xl transition flex items-center space-x-1"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Simpan PDF</span>
                        </button>
                      </div>

                    </div>
                  );
                })()
              ) : (
                <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400">
                  <Ticket className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-semibold">Tunjuk tiket peserta untuk menampilkan detail QR.</p>
                  <p className="text-[10px] text-slate-400">Pilah di tabel Kelola Peserta atau ketik kode di samping untuk memuat tiket.</p>
                </div>
              )}

            </div>

          </div>
        )}

        {/* TAB 5: BISNIS & SaaS INFO */}
        {activeTab === 'saas' && (
          <div className="space-y-6">
            
            {/* SaaS Subscription Manager Widget */}
            <section className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-6">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <span className="text-purple-600 text-xs font-bold uppercase tracking-wider block">SAAS CONTROL PORTAL</span>
                  <h3 className="font-sans font-extrabold text-lg text-slate-950">Aksi Modifikasi Paket Layanan</h3>
                  <p className="text-xs text-slate-500">
                    Ubah membership tiers untuk secara saksama melatih/menguji perubahan fitur kustom pembatasan kuota dan analytics diagram.
                  </p>
                </div>
                
                <div className="p-3 bg-gradient-to-tr from-purple-100 to-pink-100 border border-purple-205 rounded-full text-purple-700">
                  <CreditCard className="h-6 w-6" />
                </div>
              </div>

              {/* Status indicator */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Active check-marks */}
                <div className={`p-5 rounded-2xl border transition ${user.plan === 'free' ? 'border-purple-600 bg-purple-50/15' : 'border-slate-150'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-sans font-bold text-xs text-slate-900">Uji Coba (Free Plan)</h4>
                    {user.plan === 'free' && (
                      <span className="bg-purple-600 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-full">Aktif</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed mb-4">Batasan maksimal 1 event di platform utama.</p>
                  <button
                    disabled={user.plan === 'free'}
                    onClick={() => onUpdateUserPlan('free')}
                    className={`w-full py-1.5 text-xs font-bold rounded-xl transition ${user.plan === 'free' ? 'bg-purple-200 text-purple-700 cursor-not-allowed' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}`}
                  >
                    Set Paket Free
                  </button>
                </div>

                <div className={`p-5 rounded-2xl border transition ${user.plan === 'basic' ? 'border-purple-600 bg-purple-50/15' : 'border-slate-150'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-sans font-bold text-xs text-slate-900">Standard (Basic Plan)</h4>
                    {user.plan === 'basic' && (
                      <span className="bg-purple-600 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-full">Aktif</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed mb-4">Akses pendaftaran e-tiket QR tak terbatas, tanpa analitik.</p>
                  <button
                    disabled={user.plan === 'basic'}
                    onClick={() => onUpdateUserPlan('basic')}
                    className={`w-full py-1.5 text-xs font-bold rounded-xl transition ${user.plan === 'basic' ? 'bg-purple-200 text-purple-700 cursor-not-allowed' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}`}
                  >
                    Upgrade Paket Basic
                  </button>
                </div>

                <div className={`p-5 rounded-2xl border transition ${user.plan === 'pro' ? 'border-purple-600 bg-purple-50/15' : 'border-slate-150'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-sans font-bold text-xs text-slate-900">Korporat (Pro Plan)</h4>
                    {user.plan === 'pro' && (
                      <span className="bg-purple-600 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-full">Aktif</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed mb-4">Buka visualisasi analitik penuh dan layanan prioritas.</p>
                  <button
                    disabled={user.plan === 'pro'}
                    onClick={() => onUpdateUserPlan('pro')}
                    className={`w-full py-1.5 text-xs font-bold rounded-xl transition ${user.plan === 'pro' ? 'bg-purple-200 text-purple-700 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-pink-500 text-white font-sans text-xs font-bold'}`}
                  >
                    Upgrade Paket Pro
                  </button>
                </div>

              </div>

            </section>

            {/* SWOT PORTRAYAL ACCESSIBLE VISUALLY */}
            <section className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
              
              <div className="space-y-1">
                <span className="text-pink-500 text-xs font-bold uppercase tracking-wider block">Strategi SWOT Bisnis</span>
                <h3 className="font-sans font-extrabold text-base text-slate-950">SWOT Matrix Diagram Dashboard</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Evaluasi andal tentang prospek SmartEvent Planner dalam mendukung iklim seminar nasional di Indonesia :
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                
                <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl">
                  <h4 className="font-bold text-emerald-800 flex items-center space-x-1 mb-1.5">
                    <Award className="h-4 w-4" />
                    <span>STRENGTH (Kekuatan)</span>
                  </h4>
                  <ul className="space-y-1 pl-1 text-[11px] text-slate-600">
                    <li>&bull; Sistem mandiri berbasis cloud, diakses di mana saja.</li>
                    <li>&bull; Tampilan UI/UX ringkas, sangat mudah didalami oleh panitia awam.</li>
                    <li>&bull; Absensi scan berkecepatan tinggi kurangi kemacetan.</li>
                  </ul>
                </div>

                <div className="p-4 bg-amber-50/60 border border-amber-100 rounded-2xl">
                  <h4 className="font-bold text-amber-800 flex items-center space-x-1 mb-1.5">
                    <HelpCircle className="h-4 w-4" />
                    <span>WEAKNESS (Kelemahan)</span>
                  </h4>
                  <ul className="space-y-1 pl-1 text-[11px] text-slate-600">
                    <li>&bull; Bergantung seutuhnya pada keterlibatan sinyal internet.</li>
                    <li>&bull; Dioptimalisasikan untuk seminar & pelatihan saja.</li>
                  </ul>
                </div>

                <div className="p-4 bg-purple-50/60 border border-purple-100 rounded-2xl">
                  <h4 className="font-bold text-purple-800 flex items-center space-x-1 mb-1.5">
                    <ArrowUpRight className="h-4 w-4" />
                    <span>OPPORTUNITY (Peluang)</span>
                  </h4>
                  <ul className="space-y-1 pl-1 text-[11px] text-slate-600">
                    <li>&bull; Jumlah seminar dan edukasi terus meroket tinggi.</li>
                    <li>&bull; Kecenderungan masyarakat menyederhanakan tiket digital.</li>
                    <li>&bull; Tingginya migrasi panitia dari form manual ke platform SaaS.</li>
                  </ul>
                </div>

                <div className="p-4 bg-rose-50/60 border border-rose-100 rounded-2xl">
                  <h4 className="font-bold text-rose-800 flex items-center space-x-1 mb-1.5">
                    <XCircle className="h-4 w-4" />
                    <span>THREAT (Ancaman)</span>
                  </h4>
                  <ul className="space-y-1 pl-1 text-[11px] text-slate-600">
                    <li>&bull; Kekompetitifan platform luar negeri bermodal besar.</li>
                    <li>&bull; Laju migrasi dev frameworks yang harus dipantau intensif.</li>
                  </ul>
                </div>

              </div>

            </section>

          </div>
        )}

      </main>

      {/* FULL INLINE ADD NEW EVENT MODAL DIALOG */}
      {showAddEventModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-100 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            
            <button
              onClick={() => setShowAddEventModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <XCircle className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-2 text-purple-600">
              <Calendar className="h-5 w-5" />
              <h3 className="font-sans font-bold text-base text-slate-900">Buat Formulir Event Baru</h3>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3 text-xs">
              
              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider">Judul Event</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Seminar Nasional AI untuk Pendidikan"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider">Kategori Kegiatan</label>
                  <select
                    value={newEventType}
                    onChange={(e: any) => setNewEventType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 font-semibold"
                  >
                    <option value="Seminar">Seminar</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Pelatihan">Pelatihan</option>
                    <option value="Komunitas">Komunitas</option>
                    <option value="Sosialisasi">Sosialisasi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider">Kapasitas Kursi (Kuota)</label>
                  <input
                    type="number"
                    value={newEventCapacity}
                    onChange={(e) => setNewEventCapacity(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider">Jam Pelaksanaan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 09:00"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider">Lokasi / Tautan Google Maps</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Auditorium Rektorat Lt.3, UI Depok"
                  value={newEventLocation}
                  onChange={(e) => setNewEventLocation(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider">Harga Tiket Masuk (Rp)</label>
                  <input
                    type="number"
                    placeholder="Isi 0 jika Gratis"
                    value={newEventPrice}
                    onChange={(e) => setNewEventPrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 font-semibold"
                  />
                </div>
                
                <div className="flex flex-col justify-end">
                  <span className="text-[10px] text-slate-400 block pb-1 italic">Harga tiket untuk digital ticketing.</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider">Rincian Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Menyajikan pokok bahasan, speaker, dan fasilitas..."
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 font-semibold"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddEventModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition text-slate-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition shadow-sm"
                >
                  Konfirmasi Buat
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* FULL INLINE ADD NEW PARTICIPANT GUEST MODAL DIALOG */}
      {showAddPartModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-100 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative space-y-4">
            
            <button
              onClick={() => setShowAddPartModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <XCircle className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-2 text-pink-500">
              <UserPlus className="h-5 w-5" />
              <h3 className="font-sans font-bold text-base text-slate-950">Daftar Tamu Peserta</h3>
            </div>

            <form onSubmit={handleAddParticipant} className="space-y-3.5 text-xs">
              
              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider">Hubungkan Dengan Event</label>
                <select
                  value={newPartEventId}
                  onChange={(e) => setNewPartEventId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 font-bold"
                >
                  <option value="">-- Pilih Event Aktif --</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.title.substring(0,35)}...</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider">Nama Lengkap Peserta</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rian Rosyadi"
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider">Alamat Email</label>
                <input
                  type="email"
                  required
                  placeholder="Contoh: rian.kur@gmail.com"
                  value={newPartEmail}
                  onChange={(e) => setNewPartEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider">Nomor Handphone (WhatsApp)</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 0812345678"
                  value={newPartPhone}
                  onChange={(e) => setNewPartPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddPartModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition text-slate-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl transition shadow-sm"
                >
                  Daftarkan Tamu
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
