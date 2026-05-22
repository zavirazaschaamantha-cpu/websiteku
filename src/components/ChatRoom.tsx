import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { 
  collection, query, orderBy, onSnapshot, doc, setDoc, limit 
} from 'firebase/firestore';
import { 
  Send, MessageSquare, Phone, Shield, Calendar, GraduationCap, 
  User, Check, AlertCircle, Info, Hash, Clock
} from 'lucide-react';
import { User as UserType, Event, Participant } from '../types';

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
}

export default function ChatRoom({ user, events, participants }: ChatRoomProps) {
  // Chat rooms are matched to event contexts or a general support room
  const [selectedEventId, setSelectedEventId] = useState<string>('general');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Derive active event details
  const activeEvent = events.find(e => e.id === selectedEventId);
  const activeEventTitle = selectedEventId === 'general' ? 'Ruang Koordinasi Umum Kampus' : (activeEvent?.title || 'Diskusi Event');

  // Contact Persons for the current scope
  const getContactPersons = () => {
    if (selectedEventId === 'general') {
      return [
        { name: 'Aris Setiawan', role: 'Ketua Umum BEM', phone: '0812-7384-9902', email: 'bem@kampus.ac.id' },
        { name: 'Nadia Putri', role: 'Sekretaris & Advokasi', phone: '0857-1122-3344', email: 'nadia.sek@bem.id' }
      ];
    } else {
      // Event-specific simulation CP
      return [
        { name: 'Farhan Maulana', role: 'Penanggung Jawab Acara', phone: '0899-8800-4411', email: 'farhan.pj@bem.id' },
        { name: 'Siti Rahma', role: 'Humas & Registrasi', phone: '0813-5566-7788', email: 'registration.pj@bem.id' }
      ];
    }
  };

  // Real-time listener for chat messages
  useEffect(() => {
    setLoading(true);
    const messagesRef = collection(db, 'chat_messages');
    
    // Setup a query matching the selected room, ordered by creation date
    const q = query(
      messagesRef,
      orderBy('createdAt', 'asc'),
      limit(150)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Client filtering to match eventId (simplifies composite indexes requirement in FS)
        if (data.eventId === selectedEventId) {
          msgs.push({
            id: docSnap.id,
            ...data
          } as ChatMessage);
        }
      });
      setMessages(msgs);
      setLoading(false);
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, (error) => {
      console.error("Firestore Chat Error: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedEventId]);

  // Handle send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newMessageData = {
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

    try {
      await setDoc(doc(db, 'chat_messages', messageId), newMessageData);
    } catch (error) {
      console.error("Gagal mengirim pesan chat: ", error);
      alert("Gagal mengirim pesan. Silakan periksa koneksi internet Anda.");
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-12 h-[calc(100vh-210px)] min-h-[500px]">
      
      {/* LEFT PANEL: Room Selectors & Contact Person Directory */}
      <div className="lg:col-span-4 border-r border-slate-100 flex flex-col bg-slate-50/50">
        <div className="p-4 border-b border-slate-100 bg-white space-y-2">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-pink-500" />
            <span>Saluran Chat Kampus</span>
          </h3>
          <p className="text-[10px] text-slate-400 font-sans leading-snug">
            Pilih ruangan diskusi di bawah untuk berkonsultasi langsung dengan tim panitia pelaksana.
          </p>
        </div>

        {/* Room List scroll wrapper */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[220px] lg:max-h-none">
          
          <button
            onClick={() => setSelectedEventId('general')}
            className={`w-full p-3 rounded-2xl border text-left flex items-start gap-2.5 transition cursor-pointer ${
              selectedEventId === 'general'
                ? 'bg-gradient-to-r from-slate-900 to-slate-850 text-white border-transparent shadow'
                : 'bg-white border-slate-100 hover:border-slate-200 text-slate-700'
            }`}
          >
            <div className={`p-2 rounded-xl shrink-0 ${selectedEventId === 'general' ? 'bg-pink-500/20 text-pink-300' : 'bg-slate-100 text-slate-500'}`}>
              <Hash className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-bold uppercase block tracking-wider opacity-85">Kanal BEM Utama</span>
              <h4 className="text-xs font-extrabold truncate">Koordinasi Umum Kampus</h4>
            </div>
          </button>

          <div className="px-1 py-1">
            <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Berdasarkan Event Pilihan:</span>
          </div>

          {events.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs">
              Belum ada event terbit.
            </div>
          ) : (
            events.map((ev) => {
              const countOfRegistered = participants.filter(p => p.eventId === ev.id).length;
              const isSelected = selectedEventId === ev.id;

              return (
                <button
                  key={ev.id}
                  onClick={() => setSelectedEventId(ev.id)}
                  className={`w-full p-3 rounded-2xl border text-left flex items-start gap-2.5 transition cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-slate-900 to-slate-850 text-white border-transparent shadow'
                      : 'bg-white border-slate-100 hover:border-slate-200 text-slate-700'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-pink-500/20 text-pink-300' : 'bg-slate-100 text-slate-400'}`}>
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center text-[8px] font-bold uppercase tracking-wider mb-0.5">
                      <span className={isSelected ? 'text-pink-300' : 'text-slate-400'}>{ev.type}</span>
                      <span className="opacity-90">{countOfRegistered} Peserta</span>
                    </div>
                    <h4 className="text-xs font-bold truncate leading-snug">{ev.title}</h4>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* CONTACT PERSON RAIL */}
        <div className="p-4 border-t border-slate-100 bg-white rounded-b-3xl space-y-3 shrink-0">
          <div className="flex items-center space-x-1.5">
            <Phone className="h-4 w-4 text-pink-500 shrink-0" />
            <span className="text-[10px] text-slate-950 font-black uppercase tracking-wider">Kontak Penting & Person (CP)</span>
          </div>
          
          <div className="space-y-2">
            {getContactPersons().map((cp, idx) => (
              <div key={idx} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between font-sans">
                <div className="text-left space-y-0.5">
                  <span className="text-[8px] text-slate-400 font-bold block leading-relaxed uppercase">{cp.role}</span>
                  <span className="text-xs font-bold text-slate-800 block leading-tight">{cp.name}</span>
                </div>
                <div className="text-right">
                  <a 
                    href={`https://wa.me/${cp.phone.replace(/[^0-9]/g, '')}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="px-2.5 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-[10px] font-extrabold transition-all inline-flex items-center gap-1 block"
                  >
                    <span>Hubungi WA</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-2.5 bg-blue-50/50 border border-blue-100/60 rounded-xl flex gap-1.5 items-start">
            <Info className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-[9px] text-blue-700 font-sans leading-relaxed text-left">
              Jika panitia sedang offline di sistem chat, Anda dipersilakan melakukan panggilan darurat WhatsApp via kontak person di atas.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Live Chat Arena */}
      <div className="lg:col-span-8 flex flex-col bg-white">
        
        {/* Chat Window Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
          <div className="text-left space-y-1 min-w-0">
            <h3 className="font-extrabold text-sm text-slate-900 truncate leading-tight">
              {activeEventTitle}
            </h3>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-sans">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Saluran realtime aktif</span>
              </span>
              <span>&bull;</span>
              <span>Metode: Firestore Sync</span>
            </div>
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
              <h4 className="font-bold text-sm text-slate-700">Belum Ada Riwayat Percakapan</h4>
              <p className="text-[11px] max-w-sm leading-relaxed mx-auto font-sans">
                Mulai kirimkan pertanyaan atau koordinasi perdana Anda di saluran <strong className="text-slate-700">{activeEventTitle}</strong> di atas. Panitia pelaksana akan menerima notifikasi instan.
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
                    <span className="font-bold text-slate-700">{msg.senderName}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider ${
                      msg.senderRole === 'panitia' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-pink-100 text-pink-600'
                    }`}>
                      {msg.senderRole === 'panitia' ? 'Panitia BEM' : 'Mahasiswa'}
                    </span>
                    <span className="text-[9px] text-slate-400">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Text bubble */}
                  <div className={`p-3.5 rounded-2xl text-left text-xs leading-relaxed transition ${
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
        <form onSubmit={handleSendMessage} className="p-3.5 border-t border-slate-100 bg-white flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Ketik pesan Anda ke saluran ${activeEventTitle}...`}
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 focus:border-pink-500 rounded-2xl text-xs font-semibold text-slate-800 outline-none transition"
            maxLength={1000}
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className={`p-3 bg-slate-950 text-white rounded-2xl hover:bg-slate-800 transition shadow cursor-pointer ${
              !inputText.trim() ? 'opacity-40 cursor-not-allowed' : ''
            }`}
          >
            <Send className="h-4 w-4" />
          </button>
        </form>

      </div>
    </div>
  );
}
