import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { 
  collection, query, where, onSnapshot, doc, setDoc, limit 
} from 'firebase/firestore';
import { 
  Send, MessageSquare, Phone, Shield, Calendar, GraduationCap, 
  User, Check, AlertCircle, Info, Hash, Clock, Users, MapPin, Sparkles, UserCheck
} from 'lucide-react';
import { User as UserType, Event, Participant } from '../types';
import { playClickSound, playMessageSentSound } from '../utils/audio';

interface ChatMessage {
  id: string;
  eventId: string;
  eventTitle: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderRole: 'mahasiswa' | 'panitia';
  text: string;
  createdAt: string;
}

interface ChatRoomProps {
  user: UserType;
  events: Event[];
  participants: Participant[];
  defaultEventId?: string;
}

export default function ChatRoom({ user, events, participants, defaultEventId }: ChatRoomProps) {
  // Chat rooms are matched to event contexts or a general support room
  const [selectedEventId, setSelectedEventId] = useState<string>(defaultEventId || 'general');
  const [cloudMessages, setCloudMessages] = useState<ChatMessage[]>([]);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeMobileView, setActiveMobileView] = useState<'rooms' | 'chat' | 'info'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync selected room if prop updates
  useEffect(() => {
    if (defaultEventId) {
      setSelectedEventId(defaultEventId);
      setActiveMobileView('chat');
    }
  }, [defaultEventId]);

  // Sync mobile view on event channel switch
  useEffect(() => {
    setActiveMobileView('chat');
  }, [selectedEventId]);

  // Derive active event details
  const activeEvent = events.find(e => e.id === selectedEventId);
  const activeEventTitle = selectedEventId === 'general' ? 'Ruang Koordinasi Umum Kampus' : (activeEvent?.title || 'Diskusi Event');

  // Contact Persons for the current scope (backup WhatsApp options)
  const getContactPersons = () => {
    if (selectedEventId === 'general') {
      return [
        { name: 'Aris Setiawan', role: 'Ketua Umum BEM', phone: '0812-7384-9902', email: 'bem@kampus.ac.id' },
        { name: 'Admin', role: 'Sekretaris & Advokasi', phone: '0857-1122-3344', email: 'admin@bem.id' }
      ];
    } else {
      return [
        { name: 'Farhan Maulana', role: 'Penanggung Jawab Acara', phone: '0899-8800-4411', email: 'farhan.pj@bem.id' },
        { name: 'Siti Rahma', role: 'Humas & Registrasi', phone: '0813-5566-7788', email: 'registration.pj@bem.id' }
      ];
    }
  };

  // Extract registered participants specifically for the currently active event channel
  const eventParticipants = React.useMemo(() => {
    if (selectedEventId === 'general') {
      // Return unique participants across all events
      const uniqueMap = new Map<string, Participant>();
      participants.forEach(p => {
        uniqueMap.set(p.email.toLowerCase(), p);
      });
      return Array.from(uniqueMap.values());
    }
    return participants.filter(p => p.eventId === selectedEventId);
  }, [participants, selectedEventId]);

  // Merge local and cloud messages dynamically, preventing duplicates by unique message ID
  const messages = React.useMemo(() => {
    const map = new Map<string, ChatMessage>();

    // 1. Populate with offline/local messages matching current eventId filter
    localMessages.forEach((msg) => {
      if (msg.eventId === selectedEventId) {
        map.set(msg.id, msg);
      }
    });

    // 2. Overlay with real-time cloud messages (primary source of truth)
    cloudMessages.forEach((msg) => {
      map.set(msg.id, msg);
    });

    // 3. Return as a single array sorted ascending by timestamp
    return Array.from(map.values()).sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [cloudMessages, localMessages, selectedEventId]);

  // Real-time listener for chat messages (combines local cross-tab listener & Firestore sync)
  useEffect(() => {
    setLoading(true);

    // Function to load backup local storage chat history
    const loadLocalChats = () => {
      try {
        const stored = localStorage.getItem('ep_chat_messages');
        if (stored) {
          setLocalMessages(JSON.parse(stored) as ChatMessage[]);
        }
      } catch (err) {
        console.error("Gagal membaca chat lokal: ", err);
      }
    };

    // Load initially
    loadLocalChats();

    // Listen to changes from other tabs/windows for instant cross-tab local sync
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ep_chat_messages') {
        loadLocalChats();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Setup real-time Cloud Firestore listener - Isolated per-event to keep data strictly separated!
    const messagesRef = collection(db, 'chat_messages');
    const q = query(
      messagesRef,
      where('eventId', '==', selectedEventId),
      limit(250)
    );

    const unsubscribeCloud = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        msgs.push({
          id: docSnap.id,
          ...data
        } as ChatMessage);
      });
      setCloudMessages(msgs);
      setLoading(false);
    }, (error) => {
      console.warn("Firestore Chat sync limited/using offline mode: ", error.message);
      setLoading(false);
    });

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      unsubscribeCloud();
    };
  }, [selectedEventId]);

  // Automatically scroll down when new messages appear
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  }, [messages.length]);

  // Handle send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newMessageData: ChatMessage = {
      id: messageId,
      eventId: selectedEventId,
      eventTitle: activeEventTitle,
      senderId: user.id || 'anonymous',
      senderName: user.name || 'User Kampus',
      senderEmail: user.email || 'user@unauthorized.com',
      senderRole: user.role === 'panitia' ? 'panitia' : 'mahasiswa',
      text: inputText.trim(),
      createdAt: new Date().toISOString()
    };

    setInputText('');
    playMessageSentSound();

    // 1. Optimistic local sync (instantly populating student and organizers in other local tabs!)
    try {
      const stored = localStorage.getItem('ep_chat_messages') || '[]';
      const chats: ChatMessage[] = JSON.parse(stored);
      chats.push(newMessageData);
      localStorage.setItem('ep_chat_messages', JSON.stringify(chats));
      setLocalMessages(chats);
    } catch (err) {
      console.error("Gagal menyimpan pesan ke penyimpanan lokal: ", err);
    }

    // 2. Cloud Firestore synchronizer
    try {
      await setDoc(doc(db, 'chat_messages', messageId), newMessageData);
    } catch (error) {
      console.warn("Koneksi cloud dilewatkan untuk pesan ini (menjaga integritas lokal):", error);
    }
  };

  // Helper function to simulate incoming questions from students or answers from organizers
  const handleSimulateChat = async (role: 'mahasiswa' | 'panitia') => {
    const studentSampleMessages = [
      "Halo kak, mau tanya apakah kegiatan ini menyediakan e-sertifikat langsung setelah acara selesai?",
      "Apakah untuk absensi kehadiran di ruangan nanti cukup menunjukkan QR Code yang ada di dashboard saja?",
      "Permisi panitia BEM, apakah besok kita wajib mengenakan jas almamater kampus untuk workshop ini?",
      "Halo, materi pembicara event hari ini apakah akan dibagikan di grup chat atau dikirim via email ya?",
      "Terima kasih panitia! Sistem e-tiketnya keren banget, langsung disken cepat laporannya."
    ];

    const panitiaSampleMessages = [
      "Halo! Tentu saja, e-sertifikat akan otomatis aktif dan bisa Anda unduh langsung pada menu 'Sertifikat Saya' setelah event ditandai selesai.",
      "Betul sekali, cukup tunjukkan QR Code pada menu 'E-Tiket Saya' di website ini untuk dipindai oleh panitia di depan pintu masuk.",
      "Selamat pagi, untuk berpakaian dimohon mengenakan pakaian bebas rapi dan sopan ya. Mengenakan almamater sangat direkomendasikan.",
      "Materi pembicara serta dokumentasi lengkap akan kami tautkan di kanal chat internal ini sesaat setelah rangkaian acara utama berakhir.",
      "Sama-sama! Kami senang sistem website ini mempermudah proses registrasi Anda. Selamat mengikuti rangkaian acara!"
    ];

    const mhsNames = ["Andi Wijaya (Fasilkom)", "Cynthia Bella (FH)", "Reza Pratama (Fikom)", "Rina Setiawati (FT)", "Bimantara (FEB)"];
    const panitiaNames = ["Farhan Maulana (PJ Acara)", "Siti Rahma (Humas BEM)", "Aris Setiawan (Ketua BEM)", "Putri Amanda (Sekretariat)"];

    const isGeneral = selectedEventId === 'general';
    const chosenText = role === 'mahasiswa' 
      ? studentSampleMessages[Math.floor(Math.random() * studentSampleMessages.length)]
      : panitiaSampleMessages[Math.floor(Math.random() * panitiaSampleMessages.length)];

    const chosenName = role === 'mahasiswa'
      ? mhsNames[Math.floor(Math.random() * mhsNames.length)]
      : panitiaNames[Math.floor(Math.random() * panitiaNames.length)];

    const randomId = `sim-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    const simulatedMsg: ChatMessage = {
      id: randomId,
      eventId: selectedEventId,
      eventTitle: activeEventTitle,
      senderId: `simulated-${role}-${Math.random().toString(36).substr(2, 4)}`,
      senderName: chosenName,
      senderEmail: `${role === 'mahasiswa' ? 'mhs' : 'bem'}-simulated@eventku.id`,
      senderRole: role,
      text: chosenText,
      createdAt: new Date().toISOString()
    };

    // Save to local storage for instant reactive UI updates
    try {
      const stored = localStorage.getItem('ep_chat_messages') || '[]';
      const chats: ChatMessage[] = JSON.parse(stored);
      chats.push(simulatedMsg);
      localStorage.setItem('ep_chat_messages', JSON.stringify(chats));
      setLocalMessages(chats);
    } catch (e) {
      console.error(e);
    }

    // Attempt to broadcast to Firestore room
    try {
      await setDoc(doc(db, 'chat_messages', randomId), simulatedMsg);
    } catch (fsErr) {
      console.log("Firestore simulated bypass:", fsErr);
    }
  };

  return (
    <div className="bg-slate-50 rounded-3xl p-1 shadow-inner border border-slate-200/60">
      
      {/* Banner explaining direct in-app chat (Why not Whatsapp) */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-950 text-white px-5 py-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 mb-2 shadow">
        <div className="flex items-center gap-3.5 text-left">
          <div className="p-3 bg-white/10 border border-white/20 rounded-xl text-pink-300">
            <MessageSquare className="h-5 w-5 animate-pulse" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-pink-300 font-sans flex items-center gap-1.5">
              <span>Sistem Chat Internal Kampus Aktif</span>
              <span className="bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full animate-bounce">DI WEBSITE</span>
            </h4>
            <p className="text-[11px] text-indigo-100 font-sans leading-relaxed">
              Anda tidak perlu keluar ke WhatsApp! Peserta dan panitia terhubung secara realtime untuk berdiskusi, bertanya, dan berkoordinasi langsung dari halaman ini.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 font-sans">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300 text-[10px] font-black">
            <span className="h-1.5 w-1.5 bg-green-400 rounded-full animate-ping" />
            <span>Koneksi Realtime Aktif</span>
          </span>
          <span className="bg-white/10 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white/95">
            Mode: Multi-User Web Sync
          </span>
        </div>
      </div>

      {/* Mobile view sub-navigation header (visible only on mobile) */}
      <div className="lg:hidden flex border-b border-slate-200 bg-white rounded-t-2xl shadow-xs mb-1.5 p-1 gap-1">
        <button
          type="button"
          onClick={() => { setActiveMobileView('rooms'); playClickSound(); }}
          className={`flex-1 py-1.5 text-center text-[10px] font-black rounded-lg transition-all ${
            activeMobileView === 'rooms' 
              ? 'bg-slate-950 text-white shadow-xs' 
              : 'text-slate-500 hover:bg-slate-105'
          }`}
        >
          📂 Saluran ({events.length + 1})
        </button>
        <button
          type="button"
          onClick={() => { setActiveMobileView('chat'); playClickSound(); }}
          className={`flex-1 py-1.5 text-center text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-1 ${
            activeMobileView === 'chat' 
              ? 'bg-slate-950 text-white shadow-xs' 
              : 'text-slate-500 hover:bg-slate-105'
          }`}
        >
          💬 Chat Live ({messages.length})
        </button>
        <button
          type="button"
          onClick={() => { setActiveMobileView('info'); playClickSound(); }}
          className={`flex-1 py-1.5 text-center text-[10px] font-black rounded-lg transition-all ${
            activeMobileView === 'info' 
              ? 'bg-slate-950 text-white shadow-xs' 
              : 'text-slate-500 hover:bg-slate-105'
          }`}
        >
          ℹ️ Detail & Kontak
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 bg-white rounded-2xl border border-slate-100 overflow-hidden h-[calc(100vh-270px)] min-h-[500px]">
        
        {/* PANEL 1: Room Selectors (Left Panel - 3 Cols) */}
        <div className={`lg:col-span-3 border-r border-slate-100 flex flex-col bg-slate-50/50 ${activeMobileView === 'rooms' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="p-4 border-b border-slate-100 bg-white space-y-2">
            <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
              <Hash className="h-4 w-4 text-pink-500 shrink-0" />
              <span>Saluran Diskusi Acara</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-sans leading-snug">
              Pilih ruangan di bawah untuk berkomunikasi per event.
            </p>
          </div>

          {/* Room List scroll wrapper */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-2 max-h-[180px] lg:max-h-none">
            
            <button
              onClick={() => { setSelectedEventId('general'); playClickSound(); }}
              className={`w-full p-2.5 rounded-xl border text-left flex items-start gap-2 transition cursor-pointer ${
                selectedEventId === 'general'
                  ? 'bg-slate-900 text-white border-transparent shadow'
                  : 'bg-white border-slate-100 hover:border-slate-200 text-slate-700'
              }`}
            >
              <div className={`p-1.5 rounded-lg shrink-0 ${selectedEventId === 'general' ? 'bg-pink-500/25 text-pink-300' : 'bg-slate-100 text-slate-500'}`}>
                <Hash className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[8px] font-black uppercase block tracking-wider opacity-80">Kanal Utama</span>
                <h4 className="text-xs font-black truncate leading-tight">Koordinasi Umum BEM</h4>
              </div>
            </button>

            <div className="px-1 py-1 pt-2">
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Diskusi Per Event:</span>
            </div>

            {events.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-[11px] font-sans">
                Belum ada event terbit.
              </div>
            ) : (
              events.map((ev) => {
                const countOfRegistered = participants.filter(p => p.eventId === ev.id).length;
                const isSelected = selectedEventId === ev.id;

                return (
                  <button
                    key={ev.id}
                    onClick={() => { setSelectedEventId(ev.id); playClickSound(); }}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-start gap-2 transition cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-transparent shadow'
                        : 'bg-white border-slate-100 hover:border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-pink-500/25 text-pink-300' : 'bg-slate-100 text-slate-400'}`}>
                      <Calendar className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center text-[7px] font-bold uppercase tracking-wider mb-0.5">
                        <span className={isSelected ? 'text-pink-300' : 'text-slate-500'}>{ev.type}</span>
                        <span className="opacity-80">{countOfRegistered} Peserta</span>
                      </div>
                      <h4 className="text-[11px] font-black truncate leading-snug">{ev.title}</h4>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Backup info below room selector */}
          <div className="p-3 bg-white border-t border-slate-100 text-[9px] text-slate-400 font-sans leading-relaxed text-left shrink-0">
            <span className="font-extrabold text-slate-700 block uppercase mb-0.5">💡 Cara Bekerja:</span>
            Pesan yang dikirimkan menggunakan server Cloud Sync, langsung terbaca di dashboard mahasiswa dan panitia per event.
          </div>
        </div>

        {/* PANEL 2: Live Chat Arena (Center Panel - 6 Cols) */}
        <div className={`lg:col-span-6 flex flex-col bg-white border-r border-slate-100 ${activeMobileView === 'chat' ? 'flex' : 'hidden lg:flex'}`}>
          
          {/* Chat Window Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
            <div className="text-left space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 shrink-0 animation-pulse" />
                <h3 className="font-extrabold text-xs text-slate-900 truncate leading-tight dark-glow">
                  {activeEventTitle}
                </h3>
              </div>
              <p className="text-[9px] text-slate-400 font-sans truncate">
                Saluran interaksi aktif &bull; Peran Anda: <strong className="text-slate-800 uppercase">{user.role === 'panitia' ? 'Panitia BEM' : 'Mahasiswa'}</strong> ({user.name})
              </p>
            </div>
          </div>

          {/* Messages Body Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/20">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-slate-400 space-y-2">
                <Clock className="h-6 w-6 animate-spin text-pink-500" />
                <span className="text-xs">Menyinkronkan percakapan kampus...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
                <div className="p-3 bg-slate-100 text-slate-400 rounded-full">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h4 className="font-extrabold text-xs text-slate-700">Belum Ada Percakapan</h4>
                <p className="text-[10px] max-w-xs leading-relaxed mx-auto font-sans">
                  Mulai ketikkan koordinasi perdana Anda di saluran <strong className="text-slate-700">{activeEventTitle}</strong> di bawah. Pembicaraan akan terhubung langsung di web!
                </p>
              </div>
            ) : (
              /* Render messages bubbles */
              messages.map((msg, index) => {
                const isMe = msg.senderId === user.id;
                
                return (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col max-w-[85%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                  >
                    {/* Sender title details */}
                    <div className="flex items-center space-x-1.5 mb-1 text-[10px] font-sans">
                      <span className="font-extrabold text-slate-800">{msg.senderName}</span>
                      {msg.senderRole === 'panitia' ? (
                        activeEvent && msg.senderId === activeEvent.userId ? (
                          <span className="px-1.5 py-0.5 rounded text-[7px] font-mono font-black uppercase tracking-wider bg-rose-600 text-white border border-rose-700 font-sans shadow-xs flex items-center gap-0.5">
                            👑 Pembuat Event (Penyelenggara)
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[7px] font-mono font-black uppercase tracking-wider bg-purple-100 text-purple-700 border border-purple-200 font-sans flex items-center gap-0.5">
                            ⚡ Panitia BEM
                          </span>
                        )
                      ) : (
                        eventParticipants.some(part => part.email.toLowerCase() === msg.senderEmail.toLowerCase()) ? (
                          <span className="px-1.5 py-0.5 rounded text-[7px] font-mono font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 font-sans shadow-xs flex items-center gap-0.5">
                            ✓ Peserta Terdaftar
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[7px] font-mono font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 font-sans flex items-center gap-0.5">
                            🎓 Mahasiswa
                          </span>
                        )
                      )}
                      <span className="text-[9px] text-slate-400">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Text bubble */}
                    <div className={`p-3 rounded-xl text-left text-xs leading-relaxed transition ${
                      isMe 
                        ? 'bg-slate-900 text-white rounded-tr-none shadow-sm' 
                        : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none shadow-sm'
                    }`}>
                      <p className="whitespace-pre-wrap select-text">{msg.text}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Messages Input Box Form Footer */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-white flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Ketik pesan Anda ke saluran ${activeEventTitle}...`}
              className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl text-xs font-semibold text-slate-800 outline-none transition"
              maxLength={1000}
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className={`p-2.5 bg-slate-950 text-white rounded-xl hover:bg-slate-800 transition shadow cursor-pointer ${
                !inputText.trim() ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

        </div>

        {/* PANEL 3: Event info & Participant List (Right Panel - 3 Cols) */}
        <div className={`lg:col-span-3 flex flex-col bg-slate-50/20 ${activeMobileView === 'info' ? 'flex' : 'hidden lg:flex'}`}>
          
          {/* Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 text-left">
            <h4 className="font-extrabold text-[11px] text-slate-900 uppercase tracking-wider flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-purple-600" />
              <span>Tim & Anggota Terhubung ({eventParticipants.length + 2})</span>
            </h4>
            <p className="text-[9px] text-slate-400 font-sans leading-tight">
              Daftar personil yang memiliki akses ke event ini di website.
            </p>
          </div>

          {/* Connected list scroll wrapper */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
            
            {/* Event Specific Specs Box (shown if not general) */}
            {selectedEventId !== 'general' && activeEvent && (
              <div className="p-3 bg-white border border-slate-100 rounded-2xl space-y-2 text-left">
                <span className="text-[7.5px] bg-purple-50 border border-purple-100 text-purple-700 font-extrabold shadow-sm px-1.5 py-0.5 rounded uppercase">
                  Informasi Event
                </span>
                <h5 className="text-xs font-black text-slate-900 leading-snug line-clamp-2">{activeEvent.title}</h5>
                
                <div className="space-y-1 text-[10px] text-slate-500 font-sans">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-purple-500 shrink-0" />
                    <span>{activeEvent.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-pink-500 shrink-0" />
                    <span className="truncate">{activeEvent.location}</span>
                  </div>
                </div>
              </div>
            )}

            {/* DIRECTING ORGANIZERS SECTION */}
            <div className="space-y-2 text-left">
              <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider block">
                Penanggung Jawab (Panitia BEM):
              </span>

              <div className="space-y-1.5">
                {/* Always active BEM organizers */}
                <div className="p-2 bg-purple-50/40 border border-purple-100/60 rounded-xl flex items-center justify-between font-sans">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-850 block leading-tight">Aris Setiawan</span>
                    <span className="text-[8px] font-bold text-purple-700 block uppercase">Ketua Umum BEM</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[8px] font-black uppercase">
                    <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                    <span>Aktif</span>
                  </span>
                </div>

                <div className="p-2 bg-purple-50/40 border border-purple-100/60 rounded-xl flex items-center justify-between font-sans">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-850 block leading-tight">
                      {user.role === 'panitia' ? `${user.name} (Anda)` : 'Siti Rahma'}
                    </span>
                    <span className="text-[8px] font-bold text-purple-700 block uppercase">Administrasi & Humas</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[8px] font-black uppercase">
                    <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                    <span>Online</span>
                  </span>
                </div>
              </div>
            </div>

            {/* REGISTERED STUDENTS LIST */}
            <div className="space-y-2 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider">
                  Peserta Terdaftar ({eventParticipants.length}):
                </span>
                <span className="bg-slate-100 text-slate-500 text-[8px] font-bold px-1 py-0.2 rounded font-mono">Web-Linked</span>
              </div>

              {eventParticipants.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center text-[10px] text-slate-400 font-sans leading-relaxed">
                  Belum ada peserta yang mendaftar ke kegiatan ini. Pendaftaran baru dari siswa akan terdeteksi di sini secara realtime.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[160px] lg:max-h-none overflow-y-auto">
                  {eventParticipants.map((part) => {
                    const isCurrentUser = part.email.toLowerCase() === user.email.toLowerCase();
                    return (
                      <div 
                        key={part.id} 
                        className={`p-2 bg-white border rounded-xl flex items-center justify-between font-sans transition ${isCurrentUser ? 'border-pink-500 bg-pink-500/5' : 'border-slate-100'}`}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <span className="text-[10px] font-bold text-slate-800 block truncate leading-tight">
                            {part.name} {isCurrentUser && <span className="text-[9px] text-pink-600 font-black shrink-0">(Anda)</span>}
                          </span>
                          <span className="text-[8px] text-slate-400 block truncate font-mono">{part.email}</span>
                        </div>
                        <span className="inline-flex items-center gap-1 px-1 py-0.5 bg-green-50 text-green-600 rounded text-[7.5px] font-bold tracking-tight">
                          <span className="w-1 h-1 rounded-full bg-green-400 animate-ping shrink-0" />
                          <span>Terhubung</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SIMULATOR ASSISTANT TRIGGERS */}
            <div className="pt-2 border-t border-slate-200/50 space-y-2 text-left">
              <div className="flex items-center gap-1 text-slate-900 font-extrabold text-[10px] uppercase tracking-wider">
                <Sparkles className="h-3 w-3 text-pink-500 shrink-0" />
                <span>Alat Simulasi Chat (Uji Coba)</span>
              </div>
              <p className="text-[9px] text-slate-400 font-sans leading-relaxed">
                Butuh mendemonstrasikan komunikasi dua arah? Klik tombol di bawah untuk membuat simulasi tanya jawab instan di web:
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSimulateChat('mahasiswa')}
                  className="p-1.5 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-[9px] font-black transition text-center shadow-xs cursor-pointer inline-flex items-center justify-center gap-1"
                >
                  <MessageSquare className="h-2.5 w-2.5" />
                  <span>Tanya (Mhs)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateChat('panitia')}
                  className="p-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[9px] font-black transition text-center shadow-xs cursor-pointer inline-flex items-center justify-center gap-1"
                >
                  <UserCheck className="h-2.5 w-2.5" />
                  <span>Jawab (BEM)</span>
                </button>
              </div>
            </div>

          </div>

          {/* Backup contact directory action */}
          <div className="p-3 bg-white border-t border-slate-100 rounded-b-2xl shrink-0 space-y-2 text-left">
            <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider block">Kontak Person Pendukung (WhatsApp):</span>
            <div className="space-y-1">
              {getContactPersons().slice(0, 1).map((cp, idx) => (
                <div key={idx} className="flex items-center justify-between text-[9px] font-sans">
                  <span className="font-bold text-slate-700 truncate max-w-[100px]">{cp.name}</span>
                  <a 
                    href={`https://wa.me/${cp.phone.replace(/[^0-9]/g, '')}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="px-1.5 py-0.5 bg-green-500 text-white rounded text-[8px] font-black"
                  >
                    WA Panitia
                  </a>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
