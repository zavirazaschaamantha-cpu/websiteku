import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, Legend, CartesianGrid, LineChart, Line, Cell
} from 'recharts';
import { 
  Calendar, Plus, Search, Users, QrCode, Ticket, 
  BarChart3, CheckCircle, XCircle, Trash2, LogOut, 
  MapPin, Clock, ArrowUpRight, Download, UserCheck, 
  Smile, Layers, Settings, Sparkles, Filter, 
  UserPlus, CreditCard, Award, HelpCircle, RefreshCw, GraduationCap, Upload, MessageSquare
} from 'lucide-react';
import { Event, Participant, User, SaaSPlan } from '../types';
import StudentDashboard from './StudentDashboard';
import EventPlanner from './EventPlanner';
import CertificateDesigner from './CertificateDesigner';
import ChatRoom from './ChatRoom';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocFromServer, query } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  onUpdateUserPlan: (newPlan: SaaSPlan) => void;
  onViewPublicShowcase?: () => void;
}

export default function Dashboard({ user, onLogout, onUpdateUserPlan, onViewPublicShowcase }: DashboardProps) {
  // Database States
  const [events, setEvents] = useState<Event[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  
  // Navigation
  const [roleMode, setRoleMode] = useState<'panitia' | 'peserta'>(user.role === 'mahasiswa' ? 'peserta' : 'panitia');
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'events' | 'peserta' | 'scanner' | 'saas' | 'planner' | 'sertifikat' | 'chat'>('ringkasan');
  
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
  const [newEventType, setNewEventType] = useState<'Seminar' | 'Workshop' | 'Lomba' | 'Rapat' | 'Makrab' | 'Pelatihan' | 'Komunitas' | 'Sosialisasi'>('Seminar');
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

  // Real device camera states for actual QR scanner
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Selected participant for ticket rendering
  const [viewingTicketParticipant, setViewingTicketParticipant] = useState<Participant | null>(null);
  const [attendanceMethod, setAttendanceMethod] = useState<'scan' | 'manual'>('scan');

  // Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentTargetPlan, setPaymentTargetPlan] = useState<SaaSPlan | null>(null);
  const [paymentPrice, setPaymentPrice] = useState<number>(0);
  const [paymentSelectedMethod, setPaymentSelectedMethod] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<'select' | 'processing' | 'instruction' | 'success'>('select');
  const [paymentEWalletPhone, setPaymentEWalletPhone] = useState<string>('');
  const [paymentVaNumber, setPaymentVaNumber] = useState<string>('');
  const [paymentError, setPaymentError] = useState<string>('');
  const [paymentPromoCode, setPaymentPromoCode] = useState<string>('');
  const [paymentDiscount, setPaymentDiscount] = useState<number>(0);
  const [paymentInvoiceId, setPaymentInvoiceId] = useState<string>('');

  const getVaPrefix = (method: string) => {
    switch (method) {
      case 'bank_bca': return '88301';
      case 'bank_mandiri': return '89407';
      case 'bank_bni': return '82770';
      case 'bank_bri': return '80777';
      case 'bank_permata': return '84440';
      default: return '88000';
    }
  };

  const handleSelectPaymentMethod = (method: string) => {
    setPaymentSelectedMethod(method);
    setPaymentError('');
    if (method.startsWith('bank_')) {
      const prefix = getVaPrefix(method);
      const randomVa = prefix + Math.floor(10000000 + Math.random() * 90000000).toString();
      setPaymentVaNumber(randomVa);
    }
  };

  const handleApplyPromoCode = () => {
    setPaymentError('');
    const code = paymentPromoCode.trim().toUpperCase();
    if (!code) {
      setPaymentDiscount(0);
      return;
    }
    
    if (code === 'DISKON20') {
      const discVal = Math.round(paymentPrice * 0.2);
      setPaymentDiscount(discVal);
    } else if (code === 'EVENTKUHEBAT') {
      const discVal = Math.round(paymentPrice * 0.5);
      setPaymentDiscount(discVal);
    } else if (code === 'PROMOAKHIRTAHUN') {
      const discVal = Math.round(paymentPrice * 0.3);
      setPaymentDiscount(discVal);
    } else {
      setPaymentError('Kode voucher tidak valid atau sudah kedaluwarsa.');
      setPaymentDiscount(0);
    }
  };

  const handleTriggerUpgrade = (plan: SaaSPlan) => {
    setPaymentTargetPlan(plan);
    const basePrice = plan === 'basic' ? 49000 : plan === 'pro' ? 99000 : 0;
    setPaymentPrice(basePrice);
    setPaymentPromoCode('');
    setPaymentDiscount(0);
    setPaymentSelectedMethod(null);
    setPaymentStep('select');
    setPaymentEWalletPhone('');
    setPaymentError('');
    
    const rand = Math.floor(1000 + Math.random() * 9000);
    setPaymentInvoiceId(`INV-20260522-${rand}`);
    
    setShowPaymentModal(true);
  };

  const handleProcessPayment = () => {
    if (!paymentSelectedMethod) {
      setPaymentError('Harap pilih salah satu metode pembayaran yang Anda inginkan.');
      return;
    }

    if (paymentSelectedMethod.startsWith('wallet_')) {
      if (!paymentEWalletPhone) {
        setPaymentError('Harap masukkan nomor HP terdaftar e-wallet Anda.');
        return;
      }
      if (paymentEWalletPhone.length < 10) {
        setPaymentError('Nomor handphone tidak valid (minimal 10 digit).');
        return;
      }
    }

    setPaymentError('');
    setPaymentStep('processing');
    
    // Simulate API connecting delay to mimic real high-end payment gateway setup (like Midtrans, Xendit, etc.)
    setTimeout(() => {
      setPaymentStep('instruction');
    }, 1500);
  };

  const handleSimulatePaymentSuccess = () => {
    setPaymentStep('success');
    if (paymentTargetPlan) {
      onUpdateUserPlan(paymentTargetPlan);
    }
  };

  // Load database from localStorage & sync with Firestore
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

    let unsubEvents: (() => void) | null = null;
    let unsubParts: (() => void) | null = null;

    const unsubscribeAuth = auth.onAuthStateChanged(async (currentUser) => {
      // Clean up previous listeners if any to prevent memory leaks or dual bindings
      if (unsubEvents) {
        unsubEvents();
        unsubEvents = null;
      }
      if (unsubParts) {
        unsubParts();
        unsubParts = null;
      }

      if (currentUser) {
        console.log("Firebase Authenticated Successfully: ", currentUser.uid, currentUser.isAnonymous ? "Anonymous User" : "Google User");

        // 1. Validate background connection state
        try {
          await getDocFromServer(doc(db, 'test', 'connection'));
        } catch (e) {
          console.warn("Firestore connection confirmation failed or offline state:", e);
        }

        // 2. Real-time events sync snapshot
        unsubEvents = onSnapshot(collection(db, 'events'), (snapshot) => {
          const remoteEvents: Event[] = [];
          snapshot.forEach((snapDoc) => {
            remoteEvents.push(snapDoc.data() as Event);
          });
          if (remoteEvents.length > 0) {
            setEvents(remoteEvents);
            localStorage.setItem('ep_events', JSON.stringify(remoteEvents));
          }
        }, (err) => {
          console.warn("Real-time cloud events sync is limited or restricted for current privileges: ", err.message);
        });

        // 3. Real-time participants sync snapshot
        unsubParts = onSnapshot(collection(db, 'participants'), (snapshot) => {
          const remoteParts: Participant[] = [];
          snapshot.forEach((snapDoc) => {
            remoteParts.push(snapDoc.data() as Participant);
          });
          if (remoteParts.length > 0) {
            setParticipants(remoteParts);
            localStorage.setItem('ep_participants', JSON.stringify(remoteParts));
          }
        }, (err) => {
          console.warn("Real-time cloud participants sync is limited or restricted for current privileges: ", err.message);
        });

      } else {
        console.log("Not signed in. Running in offline-first LocalStorage mode.");
        
        // Attempt anonymous fallback sign-in
        try {
          await signInAnonymously(auth);
        } catch (authErr: any) {
          if (authErr.code === 'auth/admin-restricted-operation') {
            console.log(
              "Firestore Sync Info: Anonymous authentication is disabled in your Firebase Console. " +
              "This is the standard secure default. Cloud state synchronization will become active " +
              "as soon as you authenticate using the Google Login option."
            );
          } else {
            console.warn("Standard anonymous authentication failed: ", authErr.message);
          }
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubEvents) unsubEvents();
      if (unsubParts) unsubParts();
    };
  }, []);

  const saveEventsToStorage = async (updatedEvents: Event[]) => {
    setEvents(updatedEvents);
    localStorage.setItem('ep_events', JSON.stringify(updatedEvents));

    // Refuse database writes if not explicitly authenticated with an active session
    if (!auth.currentUser) return;

    try {
      // Find deleted events and delete from Firestore
      const deleted = events.filter(e => !updatedEvents.some(u => u.id === e.id));
      for (const del of deleted) {
        await deleteDoc(doc(db, 'events', del.id));
      }

      // Add or update events
      for (const ev of updatedEvents) {
        await setDoc(doc(db, 'events', ev.id), ev);
      }
    } catch (error) {
      console.warn("Firestore cloud events write error (falling back to offline local state):", error);
    }
  };

  const saveParticipantsToStorage = async (updatedParts: Participant[]) => {
    setParticipants(updatedParts);
    localStorage.setItem('ep_participants', JSON.stringify(updatedParts));

    // Refuse database writes if not explicitly authenticated with an active session
    if (!auth.currentUser) return;

    try {
      // Find deleted participants
      const deleted = participants.filter(p => !updatedParts.some(u => u.id === p.id));
      for (const del of deleted) {
        await deleteDoc(doc(db, 'participants', del.id));
      }

      // Add or update participants
      for (const part of updatedParts) {
        await setDoc(doc(db, 'participants', part.id), part);
      }
    } catch (error) {
      console.warn("Firestore cloud participants write error (falling back to offline local state):", error);
    }
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
    let rawCode = (codeToScan || manualTicketInput).trim();
    let code = rawCode.toUpperCase();

    // Support scanning a full URL (e.g., if scanned from a phone camera opening a link)
    if (rawCode.includes('?') || rawCode.includes('=')) {
      try {
        const paramString = rawCode.split('?')[1] || rawCode;
        const params = new URLSearchParams(paramString);
        const ticketParam = params.get('scan_ticket') || params.get('ticket') || params.get('code');
        if (ticketParam) {
          code = ticketParam.trim().toUpperCase();
        }
      } catch (urlErr) {
        console.warn("Failed to extract ticket query param", urlErr);
      }
    }

    // Support extracting TK-XXXX pattern from any URL or string if it's nested
    const matchTk = /TK-[A-Z0-9]+/i.exec(rawCode);
    if (matchTk) {
      code = matchTk[0].toUpperCase();
    }

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

  const stopRealScanning = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.error("Gagal menghentikan kamera", err);
      }
    }
    setIsCameraActive(false);
  };

  const startRealScanning = async () => {
    setCameraError(null);
    try {
      // Create a element region if not exists and initialize
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("html5qr-code-full-region");
      }
      
      if (html5QrCodeRef.current.isScanning) {
        return;
      }

      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        {
          fps: 15,
          qrbox: (width, height) => {
            const minSize = Math.min(width, height);
            const boxSize = Math.floor(minSize * 0.7);
            return { width: boxSize, height: boxSize };
          }
        },
        (decodedText) => {
          // Play success beep
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(900, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.12);
          } catch (audioErr) {
            console.warn("Audio beeper error", audioErr);
          }
          // Process attendance scan
          handlePerformScan(decodedText);
        },
        () => {
          // Ignore verbose scanner logs
        }
      );
      setIsCameraActive(true);
    } catch (err: any) {
      console.error("Gagal menaruh feed kamera", err);
      setCameraError(err?.message || "Hak akses kamera tidak diizinkan atau perangkat kamera tidak ditemukan.");
      setIsCameraActive(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'scanner' || attendanceMethod !== 'scan') {
      stopRealScanning();
    }
    return () => {
      // Graceful scanner shutdown on tab changes / unmount
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
    };
  }, [activeTab, attendanceMethod]);

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

  // Import Data from Excel/CSV or JSON file
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const imported = JSON.parse(text);
          if (Array.isArray(imported)) {
            const isValid = imported.every(item => item.id && item.name && item.ticketCode);
            if (!isValid) {
              alert("Format file JSON tidak standar untuk data peserta.");
              return;
            }
            const merged = [...participants];
            imported.forEach(imp => {
              const idx = merged.findIndex(p => p.ticketCode.toUpperCase() === imp.ticketCode.toUpperCase() || p.id === imp.id);
              if (idx !== -1) {
                merged[idx] = { ...merged[idx], ...imp };
              } else {
                merged.push({
                  id: imp.id || `part_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                  eventId: imp.eventId || (events[0]?.id || 'event_1'),
                  name: imp.name,
                  email: imp.email || 'imported@event.com',
                  phone: imp.phone || '-',
                  ticketCode: imp.ticketCode,
                  status: (imp.status === 'Attended' || imp.status === 'Hadir') ? 'Attended' : 'Registered',
                  registeredAt: imp.registeredAt || new Date().toISOString(),
                  attendedAt: imp.attendedAt || undefined
                });
              }
            });
            saveParticipantsToStorage(merged);
            alert(`Berhasil mengimpor & mensinkronisasikan ${imported.length} data absensi dari file JSON!`);
          } else {
            alert("File JSON harus berupa array berisi data peserta.");
          }
        } else if (file.name.endsWith('.csv')) {
          const lines = text.split('\n');
          if (lines.length <= 1) {
            alert("File CSV kosong atau tidak memiliki baris data.");
            return;
          }
          const merged = [...participants];
          let importCount = 0;
          
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const matches = line.split(',');
            if (matches.length < 5) continue;
            
            const idDoc = matches[0]?.replace(/"/g, '') || '';
            const nameDoc = matches[1]?.replace(/"/g, '') || '';
            const emailDoc = matches[2]?.replace(/"/g, '') || '';
            const phoneDoc = matches[3]?.replace(/"/g, '') || '';
            const ticketCodeDoc = matches[4]?.replace(/"/g, '') || '';
            const statusDoc = matches[5]?.replace(/"/g, '') || '';
            const registeredAtDoc = matches[6]?.replace(/"/g, '') || '';
            const attendedAtDoc = matches[7]?.replace(/"/g, '') || '';
            
            if (nameDoc && ticketCodeDoc) {
              const isAttended = statusDoc === 'Hadir' || statusDoc === 'Attended';
              const idx = merged.findIndex(p => p.ticketCode.toUpperCase() === ticketCodeDoc.toUpperCase() || p.id === idDoc);
              
              if (idx !== -1) {
                merged[idx] = {
                  ...merged[idx],
                  status: isAttended ? 'Attended' : 'Registered',
                  attendedAt: isAttended ? (attendedAtDoc && attendedAtDoc !== '-' ? attendedAtDoc : new Date().toISOString()) : undefined
                };
              } else {
                merged.push({
                  id: idDoc || `part_${Date.now()}_${i}`,
                  eventId: events[0]?.id || 'event_1',
                  name: nameDoc,
                  email: emailDoc,
                  phone: phoneDoc,
                  ticketCode: ticketCodeDoc,
                  status: isAttended ? 'Attended' : 'Registered',
                  registeredAt: registeredAtDoc || new Date().toISOString(),
                  attendedAt: isAttended ? (attendedAtDoc && attendedAtDoc !== '-' ? attendedAtDoc : new Date().toISOString()) : undefined
                });
              }
              importCount++;
            }
          }
          saveParticipantsToStorage(merged);
          alert(`Berhasil mengimpor & mensinkronisasikan ${importCount} data absensi dari file CSV!`);
        } else {
          alert("Silakan unggah file dengan format .csv atau .json");
        }
      } catch (err) {
        console.error(err);
        alert("Gagal mengurai file. Pastikan format file sesuai.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
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
            onClick={() => { setActiveTab('saas'); handleTriggerUpgrade('pro'); }}
            className="px-5 py-2.5 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700 transition cursor-pointer"
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
              {user.role === 'mahasiswa' ? (
                <div className="mt-1 inline-flex items-center space-x-1 px-2 py-0.5 bg-pink-500/20 text-pink-300 border border-pink-500/35 text-[9px] font-bold uppercase rounded-full">
                  <GraduationCap className="h-3 w-3 text-pink-400" />
                  <span>Mahasiswa Aktif</span>
                </div>
              ) : (
                <div className="mt-1 inline-flex items-center space-x-1 px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/35 text-[9px] font-bold uppercase rounded-full">
                  <Sparkles className="h-2 w-2 text-pink-400" />
                  <span>{user.plan === 'free' ? 'Free Member' : user.plan === 'basic' ? 'Basic Member' : 'Pro Member'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="px-3 space-y-1">
            {roleMode === 'peserta' ? (
              <>
                <div className="p-3 bg-pink-500/10 border border-pink-500/15 rounded-xl mb-3">
                  <p className="text-[10px] text-pink-300 font-sans leading-relaxed text-center">
                    Anda sedang login dengan identitas <strong className="text-white">{user.name}</strong> sebagai mahasiswa aktif.
                  </p>
                </div>
                
                <div className="space-y-1">
                  <div className="px-4 py-2 text-[9px] text-slate-500 font-bold uppercase tracking-wider block font-mono">
                    Utilitas Peserta
                  </div>
                  <button
                    id="menu-tab-peserta-home"
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold bg-pink-500/10 text-pink-300 border border-pink-500/25 cursor-default text-left"
                  >
                    <Ticket className="h-4 w-4 text-pink-400" />
                    <span>Layanan Portofolio Anda</span>
                  </button>
                </div>
              </>
            ) : (
              <>
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
                  id="menu-tab-planner"
                  onClick={() => setActiveTab('planner')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold transition ${activeTab === 'planner' ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Planner Otomatis</span>
                </button>

                <button
                  id="menu-tab-sertifikat"
                  onClick={() => setActiveTab('sertifikat')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold transition ${activeTab === 'sertifikat' ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
                >
                  <Award className="h-4 w-4" />
                  <span>Desain Sertifikat</span>
                </button>

                <button
                  id="menu-tab-chat"
                  onClick={() => setActiveTab('chat')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold transition ${activeTab === 'chat' ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Kanal Chat Luar</span>
                </button>

                <button
                  id="menu-tab-saas"
                  onClick={() => setActiveTab('saas')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold transition ${activeTab === 'saas' ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
                >
                  <Layers className="h-4 w-4" />
                  <span>Bisnis & SaaS Info</span>
                </button>
              </>
            )}

            {onViewPublicShowcase && (
              <button
                id="menu-tab-public-portal"
                onClick={onViewPublicShowcase}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold text-pink-400 hover:bg-pink-500/10 hover:text-pink-300 transition-colors"
              >
                <ArrowUpRight className="h-4 w-4 text-pink-400 shrink-0" />
                <span>Lihat Portal Event &bull; Live</span>
              </button>
            )}
          </nav>
        </div>

        {/* Logout action */}
        <div className="p-4 border-t border-slate-800/80 space-y-2">
          {onViewPublicShowcase && (
            <button
              id="btn-return-landing-sb"
              onClick={onViewPublicShowcase}
              className="w-full flex items-center space-x-2 px-4 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-850 hover:text-slate-200 font-bold transition-all"
            >
              <ArrowUpRight className="h-4 w-4 text-slate-500" />
              <span>Kembali ke Home</span>
            </button>
          )}

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
              {roleMode === 'peserta' ? (
                'Portal Pendataan Kehadiran Mahasiswa'
              ) : (
                <>
                  {activeTab === 'ringkasan' && 'SmartEvent Planner Dashboard'}
                  {activeTab === 'events' && 'Kelola Pendaftaran Event'}
                  {activeTab === 'peserta' && 'Manajemen Database Peserta'}
                  {activeTab === 'scanner' && 'E-Tiket & Scanner Absensi'}
                  {activeTab === 'planner' && 'Perumusan Struktur & Rangkaian Acara (Planner)'}
                  {activeTab === 'sertifikat' && 'Kustomisasi Desain E-Sertifikat'}
                  {activeTab === 'chat' && 'Kamar Koordinasi & Komunikasi Live'}
                  {activeTab === 'saas' && 'Status Bisnis & Informasi SWOT'}
                </>
              )}
            </h1>
          </div>
          
          <div className="flex items-center space-x-2.5">
            {/* Realtime Local time widget representation */}
            <div className="hidden lg:block p-2 px-3 bg-white border border-slate-100 rounded-xl text-[10px] text-slate-500 font-mono">
              Role Aktif: {roleMode === 'peserta' ? 'Akses Mahasiswa/Peserta' : 'Akses Panitia/BEM'} &bull; 2026-05-22
            </div>
            
            {/* Quick Trigger Actions */}
            {roleMode === 'panitia' && (
              <button
                id="header-btn-new-event"
                onClick={() => setShowAddEventModal(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Buat Event Baru</span>
              </button>
            )}
          </div>
        </header>

        {roleMode === 'peserta' ? (
          <StudentDashboard
            user={user}
            events={events}
            participants={participants}
            onSaveParticipants={saveParticipantsToStorage}
            onViewEvents={onViewPublicShowcase || (() => {})}
          />
        ) : (
          <>
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
                  onClick={() => { setActiveTab('saas'); handleTriggerUpgrade('pro'); }}
                  className="w-full mt-4 py-2.5 bg-white text-purple-950 font-sans text-xs font-bold rounded-xl hover:bg-purple-100 transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>Update Paket Langganan</span>
                </button>
              </div>

            </section>

            {/* EVENT REPORT RECAP AND DOWNLOADS BY EVENT */}
            <section className="bg-white p-6 border border-slate-150 rounded-3xl space-y-4 shadow-sm" id="event-reports-recap-section">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3 gap-2">
                <div>
                  <h4 className="font-sans font-extrabold text-base text-slate-900 flex items-center space-x-1.5">
                    <Download className="h-4 w-4 text-purple-600 animate-bounce" />
                    <span>Rekapan Data Kehadiran per Acara</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Unduh file rekapitulasi / berita acara presensi pasca-acara secara mandiri per kegiatan.
                  </p>
                </div>
                
                <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-150">
                  Total Acara: {events.length}
                </span>
              </div>

              {events.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400 font-semibold">Belum ada daftar acara untuk menampilkan laporan rekapan.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                        <th className="py-2.5 px-3">Nama Kegiatan / Ormawa</th>
                        <th className="py-2.5 px-3">Tanggal & Waktu</th>
                        <th className="py-2.5 px-3 text-center">Registrasi</th>
                        <th className="py-2.5 px-3 text-center">Hadir</th>
                        <th className="py-2.5 px-3 text-center">Rasio %</th>
                        <th className="py-2.5 px-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {events.map((ev) => {
                        const eventParticipants = participants.filter(p => p.eventId === ev.id);
                        const totalReg = eventParticipants.length;
                        const totalAtt = eventParticipants.filter(p => p.status === 'Attended').length;
                        const rate = totalReg === 0 ? 0 : Math.round((totalAtt / totalReg) * 100);
                        
                        return (
                          <tr key={ev.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-3">
                              <span className="font-bold text-slate-900 block font-sans">{ev.title}</span>
                              <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded uppercase">{ev.type}</span>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span>{ev.date}</span>
                              <span className="text-[10px] text-slate-400 block">{ev.time} WIB &bull; {ev.location}</span>
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-slate-800">{totalReg} Orang</td>
                            <td className="py-3 px-3 text-center font-bold text-emerald-600">{totalAtt} Orang</td>
                            <td className="py-3 px-3 text-center">
                              <span className={`inline-block font-mono font-extrabold px-2 py-0.5 rounded text-[10px] ${
                                rate >= 80 ? 'bg-emerald-100 text-emerald-800' : rate >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {rate}%
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleExportCSV(ev.id)}
                                className="px-3 py-1.5 bg-gradient-to-tr from-purple-600 to-pink-500 hover:opacity-95 text-white font-extrabold text-[10px] rounded-lg shadow-sm transition inline-flex items-center space-x-1 cursor-pointer"
                              >
                                <Download className="h-3 w-3" />
                                <span>Laporan (.CSV)</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
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
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span>{eventFormError}</span>
                {isEventLimitReached && (
                  <button
                    onClick={() => { handleTriggerUpgrade('basic'); }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition text-[10px] w-full sm:w-auto shrink-0 uppercase tracking-wider cursor-pointer font-sans"
                  >
                    Upgrade Sekarang
                  </button>
                )}
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
                <span className="text-purple-600 text-xs font-bold uppercase tracking-wider block font-mono">DASHBOARD PRESENSI PINDAI</span>
                <h3 className="font-sans font-extrabold text-lg text-slate-950">Metode Validasi Kehadiran Peserta</h3>
                <p className="text-xs text-slate-500">
                  Pilih opsi di bawah untuk mencatatkan absensi. Data secara otomatis terhubung secara real-time ke database penyimpanan file lokal (<span className="font-mono text-purple-600 font-bold">LocalStorage ep_participants</span>).
                </p>
              </div>

              {/* TABS SELECTOR FOR ATTENDANCE METHOD */}
              <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200/60 flex max-w-sm" id="method-tab-container">
                <button
                  id="tab-method-scan"
                  type="button"
                  onClick={() => {
                    setAttendanceMethod('scan');
                    setScanResult(null);
                  }}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                    attendanceMethod === 'scan'
                      ? 'bg-gradient-to-tr from-purple-600 to-pink-500 text-white shadow font-black'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <QrCode className="h-3.5 w-3.5" />
                  <span>Scan QR Code</span>
                </button>
                
                <button
                  id="tab-method-manual"
                  type="button"
                  onClick={() => {
                    setAttendanceMethod('manual');
                    setScanResult(null);
                  }}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                    attendanceMethod === 'manual'
                      ? 'bg-gradient-to-tr from-purple-600 to-pink-500 text-white shadow font-black'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Ticket className="h-3.5 w-3.5" />
                  <span>Ketik Boarding Pass</span>
                </button>
              </div>

              {attendanceMethod === 'scan' ? (
                <div className="space-y-4 animate-fade-in" id="attendance-section-scan">
                  {/* REAL CAMERA SCANNER VIEWPORT */}
                  <div className="border-4 border-slate-200 rounded-3xl overflow-hidden bg-slate-950 relative aspect-[1.3] shadow-inner flex flex-col items-center justify-between p-4 min-h-[300px]">
                    
                    {/* Real HTML5 Camera Player Region */}
                    <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-black flex items-center justify-center">
                      <div id="html5qr-code-full-region" className="w-full h-full object-cover"></div>
                    </div>

                    {/* Camera Offline Overlay / Start button */}
                    {!isCameraActive && (
                      <div className="absolute inset-0 bg-slate-900/90 z-10 flex flex-col items-center justify-center p-6 text-center space-y-4">
                        <div className="w-16 h-16 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center justify-center animate-pulse">
                          <QrCode className="h-8 w-8 text-pink-400" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-white">Kamera Belum Aktif</p>
                          <p className="text-[10px] text-slate-400 max-w-xs leading-relaxed">
                            Izinkan akses browser untuk memindai kode QR fisik (tiket/boarding pass) langsung dari kamera laptop/hp Anda.
                          </p>
                        </div>
                        {cameraError && (
                          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] p-2 py-1.5 rounded-lg max-w-xs leading-normal font-mono">
                            {cameraError}
                          </div>
                        )}
                        <button
                          id="btn-trigger-camera"
                          type="button"
                          onClick={startRealScanning}
                          className="px-6 py-2 bg-gradient-to-tr from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-purple-900/40 transform hover:scale-105 transition cursor-pointer"
                        >
                          Aktifkan Kamera Sekarang
                        </button>
                      </div>
                    )}

                    {/* Laser Scanner animation effect when camera is active */}
                    {isCameraActive && !scanResult && (
                      <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-pink-500 shadow-md shadow-pink-500 animate-pulse -translate-y-1/2 z-10 pointer-events-none"></div>
                    )}

                    {/* Simulated scan green/red popup state */}
                    {scanResult && (
                      <div className={`absolute inset-0 flex items-center justify-center p-6 bg-slate-950/95 text-center z-20 ${scanResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                        <div className="space-y-3.5 max-w-sm">
                          <div className="mx-auto w-12 h-12 rounded-full border border-current flex items-center justify-center mb-1">
                            {scanResult.success ? <CheckCircle className="h-6 w-6 stroke-[3]" /> : <XCircle className="h-6 w-6 stroke-[3]" />}
                          </div>
                          <h4 className="font-sans font-bold text-sm uppercase tracking-wider">{scanResult.success ? 'ABSENSI BERHASIL' : 'SCAN GAGAL'}</h4>
                          <p className="text-xs text-slate-300 leading-relaxed font-semibold">{scanResult.message}</p>
                          
                          {scanResult.participant && (
                            <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex items-center space-x-3 text-left">
                              <div className="p-2 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-xl text-white font-sans text-xs font-black min-w-[28px] text-center shrink-0">
                                {scanResult.participant.name.substring(0,2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate">{scanResult.participant.name}</p>
                                <p className="text-[9px] text-slate-400 font-mono truncate">{scanResult.participant.ticketCode} &bull; {scanResult.participant.email}</p>
                                {scanResult.event && (
                                  <p className="text-[9px] text-purple-300 truncate font-semibold mt-0.5">{scanResult.event.title}</p>
                                )}
                              </div>
                            </div>
                          )}

                          <button
                            id="btn-scan-again-camera"
                            type="button"
                            onClick={() => setScanResult(null)}
                            className="p-1.5 px-5 text-xs font-bold text-slate-300 hover:text-white border border-slate-700 bg-slate-900 hover:bg-slate-800 rounded-xl transition cursor-pointer"
                          >
                            Pindai Berikutnya
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Camera Control HUD Overlay top & bottom */}
                    <div className="w-full relative flex items-center justify-between z-10 pointer-events-none">
                      <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold border ${isCameraActive ? 'bg-emerald-950/90 text-emerald-400 border-emerald-800' : 'bg-slate-900/80 text-slate-400 border-slate-800'}`}>
                        <span className={`w-2 h-2 rounded-full ${isCameraActive ? 'bg-emerald-500 animate-ping' : 'bg-slate-500'}`}></span>
                        <span>{isCameraActive ? 'KAMERA AKTIF' : 'KAMERA MATI'}</span>
                      </div>
                      
                      {isCameraActive && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            stopRealScanning();
                          }}
                          className="pointer-events-auto px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-bold rounded-lg transition"
                        >
                          Matikan Kamera
                        </button>
                      )}
                    </div>

                    <div className="relative text-center max-w-xs space-y-1 z-10 pointer-events-none pb-2 bg-slate-950/60 p-2 rounded-xl backdrop-blur-[2px]">
                      <span className="text-[10px] text-slate-300 block tracking-wider uppercase font-extrabold text-center mx-auto">Arahkan Tiket QR</span>
                      <p className="text-[8px] text-slate-400">Posisikan Kode QR atau hologram tiket tepat di tengah lensa kamera.</p>
                    </div>

                  </div>

                  {/* Quick picker items of registered users that are not yet checked, for extreme simulation usability */}
                  <div className="space-y-2 bg-slate-50 p-4 border border-slate-100 rounded-2xl">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Simulator Klik untuk Pindai QR Tiket:</span>
                    <div className="flex flex-wrap gap-2">
                      {participants.filter(p => p.status === 'Registered').map(p => (
                        <button
                          key={p.id}
                          id={`simulate-scan-${p.id}`}
                          onClick={() => {
                            setViewingTicketParticipant(p);
                            handlePerformScan(p.ticketCode);
                          }}
                          className="p-1.5 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-purple-300 rounded-xl text-[10px] font-semibold flex items-center space-x-1.5 text-left transition cursor-pointer"
                        >
                          <QrCode className="h-3.5 w-3.5 text-purple-600" />
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
              ) : (
                <div className="space-y-4 animate-fade-in" id="attendance-section-manual">
                  {/* MANUAL INPUT FORM */}
                  <div className="bg-slate-50 p-6 border border-slate-100 rounded-2xl space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Verifikasi Manual Boarding Pass</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Masukkan kode boarding pass peserta (contoh: <span className="font-mono font-bold bg-slate-200 text-slate-700 px-1 rounded">EV1-AND89</span>) yang tertera di kartu tiket mahasiswa untuk absensi langsung gratis.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        id="manual-ticket-id"
                        type="text"
                        value={manualTicketInput}
                        onChange={(e) => setManualTicketInput(e.target.value)}
                        placeholder="Masukkan Kode Tiket (Contoh: EV1-AND89)"
                        className="flex-1 px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase font-mono"
                      />
                      <button
                        id="btn-scan-submit"
                        onClick={() => handlePerformScan()}
                        className="px-5 py-2.5 bg-gradient-to-tr from-purple-600 to-pink-500 text-white text-xs font-bold rounded-xl transition shadow-md hover:opacity-95 flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <UserCheck className="h-4 w-4 shrink-0" />
                        <span>Verifikasi & Hadirkan</span>
                      </button>
                    </div>

                    {scanResult && (
                      <div className={`p-4 rounded-xl border ${scanResult.success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'} text-xs font-medium`}>
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 shrink-0">
                            {scanResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                          </div>
                          <div>
                            <span className="font-bold block uppercase tracking-wider mb-1">
                              {scanResult.success ? 'ABSENSI BERHASIL' : 'DITOLAK / DUPLIKAT'}
                            </span>
                            <p className="leading-relaxed">{scanResult.message}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Click board for ease of manual verification */}
                  <div className="space-y-2 bg-slate-50 p-4 border border-slate-100 rounded-2xl">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Daftar Pintas Salin Kode Boarding Pass:</span>
                    <div className="flex flex-wrap gap-2">
                      {participants.filter(p => p.status === 'Registered').map(p => (
                        <button
                          key={p.id}
                          id={`quick-add-${p.id}`}
                          onClick={() => {
                            setManualTicketInput(p.ticketCode);
                            setViewingTicketParticipant(p);
                          }}
                          className={`p-1.5 px-3 bg-white text-slate-700 border border-slate-200 hover:border-purple-300 rounded-xl text-[10px] font-semibold flex items-center space-x-1.5 text-left transition cursor-pointer ${manualTicketInput === p.ticketCode ? 'ring-2 ring-purple-600 text-purple-700 bg-purple-50/20' : ''}`}
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
              )}

              {/* CONNECT FILE DATABASE INTEGRATION PANEL */}
              <div className="border-t border-slate-150 pt-5 space-y-3.5" id="file-sync-integration-panel">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse inline-block"></span>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">
                      File Database Hubungan & Sinkronisasi
                    </h4>
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono">FILE PERSISTENT (AUTOMATIC)</span>
                </div>

                <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-900 leading-snug">Metode Ekspor / Impor Backup File Absensi</p>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Setiap absensi (scan / boarding pass) disimpan permanen pada sistem. Anda dapat mengekspor data ini ke excel .CSV, atau mengimpor file backup absensi eksternal.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                      id="btn-export-attendance-csv"
                      type="button"
                      onClick={() => handleExportCSV('all')}
                      className="py-1.5 px-2.5 bg-slate-950 text-white font-sans text-[10px] font-bold rounded-xl transition flex items-center space-x-1 hover:bg-slate-850 shrink-0 cursor-pointer shadow"
                    >
                      <Download className="h-3 w-3" />
                      <span>Ekspor CSV</span>
                    </button>

                    <label
                      id="label-import-attendance-file"
                      htmlFor="input-import-attendance"
                      className="py-1.5 px-2.5 bg-pink-100 hover:bg-pink-150 border border-pink-200 text-pink-700 font-sans text-[10px] font-bold rounded-xl transition flex items-center space-x-1 shrink-0 cursor-pointer shadow"
                    >
                      <Upload className="h-3 w-3" />
                      <span>Impor File</span>
                    </label>
                    <input
                      id="input-import-attendance"
                      type="file"
                      accept=".csv,.json"
                      onChange={handleImportFile}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Right Box: Custom Digital E-Ticket Admission graphic card */}
            <div className="lg:col-span-5 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
              
              <div className="space-y-1">
                <span className="text-pink-500 text-xs font-bold uppercase tracking-wider block font-mono">E-Ticket Previewer</span>
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
                            {/* Real scannable QR Code generated via direct API */}
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=0f172a&data=${encodeURIComponent(
                                viewingTicketParticipant.ticketCode
                              )}`}
                              alt={`QR Code ${viewingTicketParticipant.ticketCode}`}
                              className="w-20 h-20 object-contain selection:bg-transparent"
                            />
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
                    onClick={() => handleTriggerUpgrade('basic')}
                    className={`w-full py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${user.plan === 'basic' ? 'bg-purple-200 text-purple-700 cursor-not-allowed' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}`}
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
                    onClick={() => handleTriggerUpgrade('pro')}
                    className={`w-full py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${user.plan === 'pro' ? 'bg-purple-200 text-purple-700 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-pink-500 text-white font-sans text-xs font-bold'}`}
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

        {/* TAB 6: PLANNER OTOMATIS */}
        {activeTab === 'planner' && (
          <EventPlanner />
        )}

        {/* TAB 7: DESAIN SERTIFIKAT */}
        {activeTab === 'sertifikat' && (
          <CertificateDesigner />
        )}

        {/* TAB 8: KANAL CHAT LIVE */}
        {activeTab === 'chat' && (
          <ChatRoom user={user} events={events} participants={participants} />
        )}
      </>
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
                    <option value="Lomba">Lomba Akademik / Esports</option>
                    <option value="Rapat">Rapat Anggota / Sidang</option>
                    <option value="Makrab">Malam Keakraban (Makrab)</option>
                    <option value="Pelatihan">Pelatihan / LDKM</option>
                    <option value="Komunitas">Komunitas Mahasiswa</option>
                    <option value="Sosialisasi">Sosialisasi Kampus</option>
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

      {/* INDONESIAN PAYMENT GATEWAY SUBSCRIPTION CHECKOUT MODAL */}
      {showPaymentModal && paymentTargetPlan && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-100 rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl relative space-y-6 max-h-[92vh] overflow-y-auto font-sans text-slate-800">
            
            {/* Close Button */}
            {paymentStep !== 'processing' && paymentStep !== 'success' && (
              <button
                onClick={() => setShowPaymentModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-650 transition p-1 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <XCircle className="h-6 w-6" />
              </button>
            )}

            {/* Modal Header */}
            <header className="border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2.5 text-pink-500">
                <CreditCard className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-widest font-mono">Simulasi Midtrans Payment Gateway</span>
              </div>
              <h3 className="font-sans font-black text-xl text-slate-900 mt-1">Pembayaran Langganan Paket SaaS</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih salah satu metode pembayaran Indonesia yang sah di bawah untuk mengaktifkan keanggotaan premium Anda.
              </p>
            </header>

            {/* STEP 1: METODE SELECTION */}
            {paymentStep === 'select' && (
              <div className="space-y-6 text-sm">
                
                {/* Billing Summary Board */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Paket Terpilih</span>
                    <h4 className="font-sans font-extrabold text-base text-purple-955">
                      {paymentTargetPlan === 'basic' ? 'Basic Plan (Standard)' : 'Pro Plan (Korporat)'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Berlaku selama 30 hari &bull; Diperbarui secara otomatis.
                    </p>
                  </div>
                  <div className="bg-white border border-slate-150 rounded-xl p-3 flex flex-col justify-between text-xs font-sans">
                    <div className="flex justify-between items-center text-slate-500 mb-1">
                      <span>Harga Paket:</span>
                      <span className="font-semibold text-slate-800">Rp{paymentPrice.toLocaleString('id-ID')}</span>
                    </div>
                    {paymentDiscount > 0 && (
                      <div className="flex justify-between items-center text-emerald-600 mb-1">
                        <span>Potongan Kode Promo:</span>
                        <span className="font-bold">- Rp{paymentDiscount.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-slate-500 mb-1">
                      <span>Biaya Administrasi:</span>
                      <span className="font-semibold text-slate-800">Rp2.500</span>
                    </div>
                    <div className="border-t border-dashed border-slate-100 mt-1.5 pt-1.5 flex justify-between items-center font-bold text-slate-950">
                      <span className="text-purple-900">Total Tagihan:</span>
                      <span className="text-pink-600 text-sm">Rp{(paymentPrice - paymentDiscount + 2500).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                {/* Voucher Promotions code input */}
                <div className="space-y-1.5 bg-gradient-to-r from-pink-50 to-purple-50 border border-purple-100 p-3.5 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-pink-700 tracking-wider block">Gunakan Kode Voucher / Promo diskon</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={paymentPromoCode}
                      onChange={(e) => setPaymentPromoCode(e.target.value)}
                      placeholder="Contoh: EVENTKUHEBAT , DISKON20 , PROMOAKHIRTAHUN"
                      className="flex-1 bg-white border border-slate-200 p-2 rounded-xl text-xs font-semibold placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-pink-500 focus:bg-white uppercase tracking-wider"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromoCode}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Klaim
                    </button>
                  </div>
                  <p className="text-[9px] text-purple-600 leading-snug font-sans">
                    *Gunakan <strong className="font-black text-pink-600">EVENTKUHEBAT</strong> (Potongan 50%) &bull; <strong className="font-black text-pink-600">DISKON20</strong> (Potongan 20%) &bull; <strong className="font-black text-pink-600">PROMOAKHIRTAHUN</strong> (Potongan 30%)
                  </p>
                </div>

                {/* List Payment Channels Category wise */}
                <div className="space-y-4">
                  <span className="text-xs font-bold text-slate-900 uppercase block tracking-wider font-sans">Metode Pembayaran Tersedia</span>
                  
                  {/* Category A: Bank Virtual Account */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider font-sans">Kategori 1: Transfer Virtual Account Bank</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleSelectPaymentMethod('bank_bca')}
                        className={`p-3 rounded-xl border transition flex flex-col justify-between items-center h-20 relative cursor-pointer ${paymentSelectedMethod === 'bank_bca' ? 'border-pink-500 bg-pink-50/20 ring-1 ring-pink-500 text-slate-900 shadow-sm' : 'border-slate-150 hover:bg-slate-50 text-slate-650'}`}
                      >
                        <span className="text-[12px] font-black text-blue-800 tracking-wide block uppercase font-mono mt-1">BCA</span>
                        <span className="text-[9px] font-bold block">BCA VA</span>
                        {paymentSelectedMethod === 'bank_bca' && <span className="absolute -top-1 -right-1 bg-pink-500 text-white p-0.5 rounded-full text-[8px] font-black">✓</span>}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectPaymentMethod('bank_mandiri')}
                        className={`p-3 rounded-xl border transition flex flex-col justify-between items-center h-20 relative cursor-pointer ${paymentSelectedMethod === 'bank_mandiri' ? 'border-pink-500 bg-pink-50/20 ring-1 ring-pink-500 text-slate-900 shadow-sm' : 'border-slate-150 hover:bg-slate-50 text-slate-650'}`}
                      >
                        <span className="text-[11px] font-black text-amber-500 tracking-wide block uppercase italic font-sans mt-1">mandiri</span>
                        <span className="text-[9px] font-bold block font-sans">Mandiri VA</span>
                        {paymentSelectedMethod === 'bank_mandiri' && <span className="absolute -top-1 -right-1 bg-pink-500 text-white p-0.5 rounded-full text-[8px] font-black">✓</span>}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectPaymentMethod('bank_bni')}
                        className={`p-3 rounded-xl border transition flex flex-col justify-between items-center h-20 relative cursor-pointer ${paymentSelectedMethod === 'bank_bni' ? 'border-pink-500 bg-pink-50/20 ring-1 ring-pink-500 text-slate-900 shadow-sm' : 'border-slate-150 hover:bg-slate-50 text-slate-655'}`}
                      >
                        <span className="text-[12px] font-black text-orange-650 tracking-wide block uppercase font-mono mt-1">BNI</span>
                        <span className="text-[9px] font-bold block">BNI VA</span>
                        {paymentSelectedMethod === 'bank_bni' && <span className="absolute -top-1 -right-1 bg-pink-500 text-white p-0.5 rounded-full text-[8px] font-black">✓</span>}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectPaymentMethod('bank_bri')}
                        className={`p-3 rounded-xl border transition flex flex-col justify-between items-center h-20 relative cursor-pointer ${paymentSelectedMethod === 'bank_bri' ? 'border-pink-500 bg-pink-50/20 ring-1 ring-pink-500 text-slate-900 shadow-sm' : 'border-slate-150 hover:bg-slate-50 text-slate-650'}`}
                      >
                        <span className="text-[12px] font-black text-indigo-700 tracking-wide block uppercase font-mono mt-1">BRI</span>
                        <span className="text-[9px] font-bold block">BRI VA</span>
                        {paymentSelectedMethod === 'bank_bri' && <span className="absolute -top-1 -right-1 bg-pink-500 text-white p-0.5 rounded-full text-[8px] font-black">✓</span>}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectPaymentMethod('bank_permata')}
                        className={`p-3 rounded-xl border transition flex flex-col justify-between items-center h-20 relative cursor-pointer ${paymentSelectedMethod === 'bank_permata' ? 'border-pink-500 bg-pink-50/20 ring-1 ring-pink-500 text-slate-900 shadow-sm' : 'border-slate-150 hover:bg-slate-50 text-slate-650'}`}
                      >
                        <span className="text-[10px] font-black text-emerald-800 tracking-normal block uppercase font-mono mt-1">PERMATA</span>
                        <span className="text-[9px] font-bold block font-sans">Permata VA</span>
                        {paymentSelectedMethod === 'bank_permata' && <span className="absolute -top-1 -right-1 bg-pink-500 text-white p-0.5 rounded-full text-[8px] font-black">✓</span>}
                      </button>
                    </div>
                  </div>

                  {/* Category B: Digital Wallet E-Wallets */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Kategori 2: Dompet Digital E-Wallet & QRIS</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleSelectPaymentMethod('wallet_dana')}
                        className={`p-3 rounded-xl border transition flex flex-col justify-between items-center h-20 relative cursor-pointer ${paymentSelectedMethod === 'wallet_dana' ? 'border-pink-500 bg-pink-50/20 ring-1 ring-pink-500 text-slate-900 shadow-sm' : 'border-slate-150 hover:bg-slate-50 text-slate-650'}`}
                      >
                        <span className="text-[12px] font-bold text-sky-500 tracking-wide block uppercase font-sans mt-0.5">DANA</span>
                        <span className="text-[9px] font-bold text-slate-400">Instan Pay</span>
                        {paymentSelectedMethod === 'wallet_dana' && <span className="absolute -top-1 -right-1 bg-pink-500 text-white p-0.5 rounded-full text-[8px] font-black">✓</span>}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectPaymentMethod('wallet_gopay')}
                        className={`p-3 rounded-xl border transition flex flex-col justify-between items-center h-20 relative cursor-pointer ${paymentSelectedMethod === 'wallet_gopay' ? 'border-pink-500 bg-pink-50/20 ring-1 ring-pink-500 text-slate-900 shadow-sm' : 'border-slate-150 hover:bg-slate-50 text-slate-650'}`}
                      >
                        <span className="text-[12px] font-bold text-emerald-600 tracking-wide block uppercase font-mono mt-0.5">GoPay</span>
                        <span className="text-[9px] font-bold text-slate-400">Gojek Pay</span>
                        {paymentSelectedMethod === 'wallet_gopay' && <span className="absolute -top-1 -right-1 bg-pink-500 text-white p-0.5 rounded-full text-[8px] font-black">✓</span>}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectPaymentMethod('wallet_ovo')}
                        className={`p-3 rounded-xl border transition flex flex-col justify-between items-center h-20 relative cursor-pointer ${paymentSelectedMethod === 'wallet_ovo' ? 'border-pink-500 bg-pink-50/20 ring-1 ring-pink-500 text-slate-900 shadow-sm' : 'border-slate-150 hover:bg-slate-50 text-slate-650'}`}
                      >
                        <span className="text-[12px] font-extrabold text-purple-700 tracking-wide block uppercase font-mono mt-0.5">OVO</span>
                        <span className="text-[9px] font-bold text-slate-400">Ovo Cash</span>
                        {paymentSelectedMethod === 'wallet_ovo' && <span className="absolute -top-1 -right-1 bg-pink-500 text-white p-0.5 rounded-full text-[8px] font-black">✓</span>}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectPaymentMethod('wallet_shopeepay')}
                        className={`p-3 rounded-xl border transition flex flex-col justify-between items-center h-20 relative cursor-pointer ${paymentSelectedMethod === 'wallet_shopeepay' ? 'border-pink-500 bg-pink-50/20 ring-1 ring-pink-500 text-slate-900 shadow-sm' : 'border-slate-150 hover:bg-slate-50 text-slate-650'}`}
                      >
                        <span className="text-[11px] font-extrabold text-orange-550 tracking-tight block uppercase font-sans mt-0.5">ShopeePay</span>
                        <span className="text-[9px] font-bold text-slate-400 font-mono">SeaMoney</span>
                        {paymentSelectedMethod === 'wallet_shopeepay' && <span className="absolute -top-1 -right-1 bg-pink-500 text-white p-0.5 rounded-full text-[8px] font-black">✓</span>}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectPaymentMethod('qris')}
                        className={`p-3 rounded-xl border transition flex flex-col justify-between items-center h-20 relative cursor-pointer ${paymentSelectedMethod === 'qris' ? 'border-pink-500 bg-pink-50/20 ring-1 ring-pink-500 text-slate-900 shadow-sm' : 'border-slate-150 hover:bg-slate-50 text-slate-650'}`}
                      >
                        <div className="flex font-black tracking-normal mt-0.5">
                          <span className="text-red-500 text-[10px]">Q</span>
                          <span className="text-blue-800 text-[10px]">R</span>
                          <span className="text-teal-600 text-[10px]">I</span>
                          <span className="text-amber-500 text-[10px]">S</span>
                        </div>
                        <span className="text-[8px] font-extrabold block bg-[#65748b]/10 text-slate-600 px-1 py-0.5 rounded font-sans">Logo QR</span>
                        {paymentSelectedMethod === 'qris' && <span className="absolute -top-1 -right-1 bg-pink-500 text-white p-0.5 rounded-full text-[8px] font-black">✓</span>}
                      </button>
                    </div>
                  </div>

                </div>

                {/* Sub Options: Phone Number for E-Wallet trigger */}
                {paymentSelectedMethod && paymentSelectedMethod.startsWith('wallet_') && (
                  <div className="space-y-1.5 p-4 border border-slate-150 bg-slate-50 rounded-2xl animate-fade-in font-sans">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Nomor Handphone Terdaftar ({paymentSelectedMethod === 'wallet_dana' ? 'DANA' : paymentSelectedMethod === 'wallet_gopay' ? 'Link GoPay' : paymentSelectedMethod === 'wallet_ovo' ? 'OVO ID' : 'ShopeePay Wallet'})
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-xs">+62</span>
                      <input
                        type="text"
                        value={paymentEWalletPhone}
                        onChange={(e) => setPaymentEWalletPhone(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="812XXXXXXXX (Masukkan nomor HP tanpa angka 0 di depan)"
                        className="block w-full pl-12 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-pink-500 text-xs font-semibold"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 italic block">Kami akan mengirimkan notifikasi push konfirmasi pembayaran atau verifikasi OTP ke nomor HP di atas.</span>
                  </div>
                )}

                {paymentError && (
                  <div className="p-3 bg-red-100 border border-red-200 text-red-800 text-xs font-bold rounded-xl font-sans">
                    {paymentError}
                  </div>
                )}

                {/* CTAs */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="px-5 py-2.5 border border-slate-200 text-slate-600 font-extrabold text-xs rounded-xl hover:bg-slate-50 transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleProcessPayment}
                    className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-pink-500/10 transition flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Lanjutkan Pembayaran</span>
                  </button>
                </div>

              </div>
            )}

            {/* STEP 2: PROCESSING (SPINNER GATEWAY) */}
            {paymentStep === 'processing' && (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 font-sans text-slate-800">
                <div className="relative flex items-center justify-center">
                  <div className="animate-spin rounded-full h-16 h-16 w-16 w-16 border-4 border-pink-200 border-t-pink-500"></div>
                  <CreditCard className="h-6 w-6 text-purple-600 absolute animate-pulse" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">Menghubungkan ke Saluran Secure Payment...</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Mohon menunggu sebentar, invoice {paymentInvoiceId} sedang diproses secara aman oleh gateway simulator Midtrans Indonesia.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 3: TRANSACTION INSTRUCTIONS / SIMULATION COMPONENT */}
            {paymentStep === 'instruction' && (
              <div className="space-y-6 text-sm">
                
                {/* Visual reminder count-down bar */}
                <div className="bg-amber-50 border border-amber-100 p-3 rounded-2xl flex items-center justify-between text-amber-900 text-xs">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 shrink-0 text-amber-600" />
                    <span className="font-medium">Selesaikan Pembayaran Sebelum Kedaluwarsa:</span>
                  </div>
                  <strong className="font-mono text-amber-700">23:59:45</strong>
                </div>

                {/* Main Instruction Body depends on type */}
                {paymentSelectedMethod && (
                  (() => {
                    // Scenario A: Virtual Account
                    if (paymentSelectedMethod.startsWith('bank_')) {
                      const bankName = paymentSelectedMethod === 'bank_bca' ? 'BCA' : paymentSelectedMethod === 'bank_mandiri' ? 'Mandiri' : paymentSelectedMethod === 'bank_bni' ? 'BNI' : paymentSelectedMethod === 'bank_bri' ? 'BRI' : 'Permata';
                      return (
                        <div className="space-y-4 font-sans">
                          <div className="p-5 border border-slate-150 bg-slate-50 rounded-2xl space-y-3 text-center">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block font-sans">NOMOR VIRTUAL ACCOUNT {bankName}</span>
                            <div className="flex items-center justify-center space-x-2.5">
                              <span className="font-mono font-black text-2xl text-slate-900 tracking-wider">
                                {paymentVaNumber}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(paymentVaNumber);
                                  alert('Nomor Virtual Account disalin ke clipboard!');
                                }}
                                className="p-1.5 px-3 border border-pink-300 bg-pink-50 hover:bg-pink-100 text-pink-600 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                              >
                                <span>Salin</span>
                              </button>
                            </div>
                            <div className="text-[11px] text-slate-500 max-w-md mx-auto leading-relaxed font-sans">
                              Atas Nama Merchant: <strong className="text-slate-800 font-bold">EventPlannerKu Premium</strong> &bull; Total tagihan yang harus ditransfer persis: <strong className="text-pink-600">Rp{(paymentPrice - paymentDiscount + 2500).toLocaleString('id-ID')}</strong>
                            </div>
                          </div>

                          <div className="space-y-2 border border-slate-100 p-4 rounded-2xl bg-white">
                            <span className="text-xs font-bold text-slate-800 uppercase block tracking-wider mb-2 font-sans">Petunjuk Pembayaran Mudah :</span>
                            <div className="space-y-2.5 text-xs text-slate-600 font-sans leading-relaxed">
                              <div>
                                <strong className="text-slate-900 block font-bold">Opsi 1: Lewat Mobile Banking (m-Banking)</strong>
                                <p className="text-slate-500 pl-3">Buka aplikasi m-Banking Anda &rarr; Pilih menu <strong className="text-slate-800">Transfer / Virtual Account</strong> &rarr; Masukkan kode <strong className="font-mono text-purple-700 font-bold">{paymentVaNumber}</strong> &rarr; Layar m-Banking akan mengonfirmasi nominal, pastikan nominal terisi betul, lalu masukkan PIN m-Banking Anda.</p>
                              </div>
                              <div className="border-t border-slate-100 pt-2 font-sans">
                                <strong className="text-slate-900 block font-bold">Opsi 2: Lewat ATM Fisik</strong>
                                <p className="text-slate-500 pl-3 font-sans">Masukkan kartu & PIN &rarr; Pilih menu <strong className="text-slate-800">Transaksi Lainnya</strong> / <strong className="text-slate-800">Pembayaran</strong> &rarr; Pilih <strong className="text-slate-800">Virtual Account / Layanan Multi</strong> &rarr; Masukkan nomor VA di atas &rarr; Tekan <strong className="text-slate-800">YA / BAYAR</strong>.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Scenario B: E-Wallet DANA/OVO/GoPay
                    if (paymentSelectedMethod.startsWith('wallet_')) {
                      const walletBrand = paymentSelectedMethod === 'wallet_dana' ? 'DANA Link' : paymentSelectedMethod === 'wallet_gopay' ? 'GoPay App' : paymentSelectedMethod === 'wallet_ovo' ? 'OVO PUSH' : 'ShopeePay Direct';
                      return (
                        <div className="space-y-4 font-sans text-slate-800">
                          <div className="p-5 border border-slate-150 bg-slate-50 rounded-2xl text-center space-y-3">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block font-sans">PENGIRIMAN PUSH NOTIFICATION KE HP</span>
                            <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold font-sans">
                              <span>Nomor Handphone Terdeteksi: +62 {paymentEWalletPhone}</span>
                            </div>
                            <h4 className="font-sans font-black text-slate-900 text-base">Cek Layar Smartphone Anda Sekarang!</h4>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed font-sans">
                              Permintaan otorisasi pembayaran subscription sebesar <strong className="text-pink-600 font-bold">Rp{(paymentPrice - paymentDiscount + 2500).toLocaleString('id-ID')}</strong> telah dikirimkan secara instan ke aplikasi <strong className="text-slate-850 font-bold">{walletBrand}</strong> di handphone Anda. Silakan buka aplikasi dan konfirmasi pemindahan saldo sebelum waktu habis.
                            </p>
                          </div>
                        </div>
                      );
                    }

                    // Scenario C: QRIS Code Screen
                    if (paymentSelectedMethod === 'qris') {
                      return (
                        <div className="space-y-4 font-sans text-slate-800">
                          <div className="p-5 border border-slate-150 bg-slate-50 rounded-2xl text-center flex flex-col items-center space-y-3">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block font-sans">DOKUMEN QRIS GPN NASIONAL STANDAR</span>
                            
                            {/* Visual QRIS Standard Logo card representation */}
                            <div className="bg-white p-4 border border-slate-200 rounded-2xl flex flex-col items-center space-y-2 shadow-sm font-sans">
                              <div className="bg-[#1e3a8a] text-white text-[10px] font-black px-4 py-1 rounded w-full tracking-widest text-center flex justify-around items-center font-sans">
                                <span>QRIS</span>
                                <span className="text-[6px] font-normal opacity-70">GPN INDONESIA APPROVED</span>
                              </div>
                              <div className="p-2 border border-slate-100 rounded-lg bg-pink-500/5 select-none relative">
                                {/* Simulated complex QR matrix box */}
                                <div className="grid grid-cols-7 gap-1 w-36 h-36 p-1.5 bg-white">
                                  {/* Corner clusters */}
                                  <div className="bg-slate-900 p-1"><div className="bg-white h-full w-full"></div></div>
                                  <div className="bg-slate-900"></div><div className="bg-slate-900"></div><div className="bg-white"></div><div className="bg-slate-900"></div><div className="bg-slate-900"></div>
                                  <div className="bg-slate-900 p-1"><div className="bg-white h-full w-full"></div></div>

                                  <div className="bg-white"></div><div className="bg-slate-900"></div><div className="bg-white"></div><div className="bg-slate-900"></div><div className="bg-white"></div><div className="bg-slate-900"></div><div className="bg-white"></div>

                                  <div className="bg-slate-900"></div><div className="bg-white"></div><div className="bg-slate-900"></div><div className="bg-white"></div><div className="bg-slate-900"></div><div className="bg-white"></div><div className="bg-slate-900"></div>

                                  <div className="bg-white"></div><div className="bg-slate-900"></div><div className="bg-white"></div><div className="bg-[#ec4899] p-0.5 rounded"><div className="bg-white h-full w-full rounded-sm"></div></div><div className="bg-white"></div><div className="bg-slate-900"></div><div className="bg-white"></div>

                                  <div className="bg-slate-900"></div><div className="bg-white"></div><div className="bg-slate-900"></div><div className="bg-white"></div><div className="bg-slate-900"></div><div className="bg-white"></div><div className="bg-slate-900"></div>

                                  <div className="bg-white"></div><div className="bg-slate-900"></div><div className="bg-white"></div><div className="bg-slate-900"></div><div className="bg-white"></div><div className="bg-slate-900"></div><div className="bg-white"></div>

                                  <div className="bg-slate-900 p-1"><div className="bg-white h-full w-full"></div></div>
                                  <div className="bg-white"></div><div className="bg-slate-900"></div><div className="bg-white"></div><div className="bg-slate-900"></div><div className="bg-slate-900"></div>
                                  <div className="bg-slate-900 p-1"><div className="bg-white h-full w-full"></div></div>
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <span className="bg-white text-pink-600 font-mono text-[8px] font-black px-1.5 py-0.5 border border-pink-300 rounded shadow-sm">GPN</span>
                                </div>
                              </div>
                              <span className="font-bold text-[9px] text-[#1e293b] tracking-wider uppercase font-mono">NMID: ID103011245678</span>
                            </div>

                            <p className="text-xs text-slate-500 max-w-sm leading-relaxed font-sans">
                              Pindai Kode QRIS di atas menggunakan aplikasi m-Banking (BCA, Mandiri, BRI, dll) atau dompet digital (DANA, Gopay, OVO, LinkAja, ShopeePay) Anda. Nominal sebesar <strong className="text-pink-600">Rp{(paymentPrice - paymentDiscount + 2500).toLocaleString('id-ID')}</strong> akan langsung tertera secara otomatis.
                            </p>
                          </div>
                        </div>
                      );
                    }
                  })()
                )}

                {/* Simulator Success Trigger Panel */}
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl space-y-2.5 text-center font-sans">
                  <div className="flex items-center justify-center space-x-1 text-emerald-800">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-bold uppercase tracking-wide">Simulator Instant Testing Evaluasi</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 max-w-md mx-auto">
                    Tanpa memotong saldo asli, tekan tombol di bawah ini untuk mensimulasikan webhook dari server bank/fintech menyatakan bahwa pembayaran Anda telah sukses diselesaikan!
                  </p>
                  <button
                    type="button"
                    onClick={handleSimulatePaymentSuccess}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/10 transition cursor-pointer"
                  >
                    Simulasikan Pembayaran Berhasil Sekarang
                  </button>
                </div>

                {/* CTAs */}
                <div className="flex justify-between gap-3 pt-4 border-t border-slate-100 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentStep('select')}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-750 font-bold rounded-xl transition cursor-pointer"
                  >
                    Kembali & Ubah Metode
                  </button>
                  <span className="text-[10px] text-slate-400 self-center font-mono">ID Tagihan: {paymentInvoiceId}</span>
                </div>

              </div>
            )}

            {/* STEP 4: SUCCESS INVOICE (RECEIPT) */}
            {paymentStep === 'success' && (
              <div className="space-y-6">
                
                {/* Upper Splash Success animation header */}
                <div className="text-center space-y-2">
                  <div className="inline-flex p-3 bg-emerald-100 rounded-full text-emerald-600 animate-bounce">
                    <CheckCircle className="h-10 w-10 fill-emerald-600 text-white" />
                  </div>
                  <h4 className="font-sans font-black text-slate-900 text-lg leading-snug">Pembayaran Langganan Sukses Terkonfirmasi!</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Selamat! Akun Anda telah resmi dideklarasikan sebagai keanggotaan Premium. Seluruh batasan fitur pada platform Anda telah dihapuskan secara instan.
                  </p>
                </div>

                {/* HIGH FIDELITY INVOICE BLOCK */}
                <div id="saas-invoice-block" className="border border-slate-200 rounded-2xl bg-slate-50 overflow-hidden font-sans text-xs">
                  
                  {/* Invoice Header details */}
                  <div className="bg-gradient-to-r from-purple-950 to-slate-900 text-white p-4 flex justify-between items-center">
                    <div>
                      <span className="text-[8px] text-purple-300 font-black uppercase tracking-wider block">INVOICE PEMBAYARAN</span>
                      <strong className="text-sm font-mono tracking-wider font-extrabold">{paymentInvoiceId}</strong>
                    </div>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold px-3 py-1 rounded-full text-[10px] uppercase font-mono tracking-wider">
                      Lunas (Paid)
                    </span>
                  </div>

                  {/* Invoice Body elements */}
                  <div className="p-5 space-y-4 text-slate-800">
                    
                    {/* Customer details Grid */}
                    <div className="grid grid-cols-2 gap-4 border-b border-slate-105 pb-3">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase block mb-0.5">Diterbitkan Kepada:</span>
                        <strong className="text-slate-900 block font-bold truncate">{user.name}</strong>
                        <span className="text-[10px] text-slate-500 block truncate">{user.email}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase block mb-0.5">Status Instansi / Komunitas:</span>
                        <strong className="text-slate-900 block font-bold truncate">{user.organization}</strong>
                        <span className="text-[10px] text-slate-500 block truncate font-sans">Level: {user.plan === 'pro' ? 'Corporate Pro Member' : 'Standard Basic Member'}</span>
                      </div>
                    </div>

                    {/* Transaction dates Grid */}
                    <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-sans border-b border-slate-105 pb-3 bg-white p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase block font-sans">Tanggal Pembayaran</span>
                        <strong className="text-slate-800 font-bold font-sans">22 Mei 2026</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase block font-sans">Metode Pembayaran</span>
                        <strong className="text-slate-800 font-bold uppercase font-sans">
                          {paymentSelectedMethod ? paymentSelectedMethod.replace(/_/g, ' ') : 'MOCK'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-405 uppercase block font-sans">Siklus Kedaluwarsa</span>
                        <strong className="text-slate-800 font-bold font-sans">22 Juni 2026</strong>
                      </div>
                    </div>

                    {/* Breakdown items tabular representation */}
                    <div className="space-y-1.5 font-sans pt-1">
                      <span className="text-[9px] text-slate-400 uppercase font-bold block tracking-wider">Rincian Perhitungan Biaya :</span>
                      
                      <div className="space-y-1 text-slate-600">
                        <div className="flex justify-between items-center text-slate-700 font-sans">
                          <span>1x Biaya Aktivasi Paket {paymentTargetPlan === 'basic' ? 'Basic Premium' : 'Pro Premium (Korporat)'}</span>
                          <span className="font-mono">Rp{paymentPrice.toLocaleString('id-ID')}</span>
                        </div>
                        {paymentDiscount > 0 && (
                          <div className="flex justify-between items-center text-emerald-600 font-medium font-sans">
                            <span>Pemotongan Kode Kupon Promo ({paymentPromoCode.toUpperCase()})</span>
                            <span className="font-mono font-bold">- Rp{paymentDiscount.toLocaleString('id-ID')}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-slate-700 font-sans">
                          <span>Biaya Layanan Midtrans Secure Payment Gateway</span>
                          <span className="font-mono">Rp2.500</span>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 mt-2 pt-2 flex justify-between items-center text-slate-950 font-black text-xs font-sans">
                        <span className="text-purple-950 uppercase font-sans">TOTAL TRANSAKSI LUNAS (IDR)</span>
                        <span className="text-pink-600 font-mono text-sm font-bold">
                          Rp{(paymentPrice - paymentDiscount + 2500).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Anti AI Slop simple authentic disclaimer credit */}
                  <div className="bg-slate-100 p-3 text-center text-[9px] text-slate-400 italic font-mono border-t border-slate-150">
                    Sistem Pembayaran Terakreditasi API &bull; EventPlannerKu Premium
                  </div>

                </div>

                {/* CTAs Success Receipt */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl transition flex items-center justify-center space-x-2 border border-slate-200 cursor-pointer"
                  >
                    <Download className="h-4 w-4 shrink-0 text-slate-600" />
                    <span className="font-sans">Unduh / Cetak Invoice (.PDF)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentModal(false);
                    }}
                    className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl transition shadow-lg shadow-purple-650/10 cursor-pointer"
                  >
                    <span className="font-sans">Selesai & Tutup Portal</span>
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
