/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, SaaSPlan } from './types';
import { initializeLocalStorage } from './data';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import EventShowcase from './components/EventShowcase';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'landing' | 'events-public' | 'auth' | 'dashboard'>('landing');
  const [authState, setAuthState] = useState<{
    mode: 'login' | 'signup';
    selectedPlan: SaaSPlan;
  }>({
    mode: 'login',
    selectedPlan: 'basic'
  });
  const [scannedTicket, setScannedTicket] = useState<{
    success: boolean;
    participant?: any;
    event?: any;
    message: string;
  } | null>(null);

  // Initialize LocalStorage database tables upon startup and scan intercept
  useEffect(() => {
    initializeLocalStorage();
    
    // Check if user session already logged in in this browser session
    try {
      const activeSession = localStorage.getItem('ep_active_session');
      if (activeSession) {
        const u = JSON.parse(activeSession);
        setCurrentUser(u);
        setCurrentView('dashboard');
      }
    } catch (e) {
      console.error("Gagal membaca sesi berjalan", e);
    }

    // Intercept QR code scan url parameter "?scan_ticket=..."
    const params = new URLSearchParams(window.location.search);
    const scanTicketCode = params.get('scan_ticket');
    
    if (scanTicketCode) {
      const savedPartsStr = localStorage.getItem('ep_participants') || '[]';
      const savedEventsStr = localStorage.getItem('ep_events') || '[]';
      
      let participantsList: any[] = [];
      let eventsList: any[] = [];
      
      try {
        participantsList = JSON.parse(savedPartsStr);
        eventsList = JSON.parse(savedEventsStr);
      } catch (err) {
        console.error("Gagal parse database", err);
      }
      
      const ticketCodeClean = scanTicketCode.trim().toUpperCase();
      const matchedPartIndex = participantsList.findIndex(p => p.ticketCode.toUpperCase() === ticketCodeClean);
      
      if (matchedPartIndex !== -1) {
        const participant = participantsList[matchedPartIndex];
        const associatedEvent = eventsList.find(e => e.id === participant.eventId);
        
        const wasAlreadyAttended = participant.status === 'Attended';
        const updatedPart = {
          ...participant,
          status: 'Attended' as const,
          attendedAt: participant.attendedAt || new Date().toISOString()
        };
        
        participantsList[matchedPartIndex] = updatedPart;
        localStorage.setItem('ep_participants', JSON.stringify(participantsList));
        
        setScannedTicket({
          success: true,
          participant: updatedPart,
          event: associatedEvent,
          message: wasAlreadyAttended 
            ? 'Tiket ini sudah pernah di-scan sebelumnya. Kehadiran tetap terdaftar sebagai Hadir!'
            : 'Selamat! Kehadiran/absensi Anda berhasil dicatat secara otomatis ke dalam sistem.'
        });
      } else {
        setScannedTicket({
          success: false,
          message: `Kode tiket "${ticketCodeClean}" tidak sah atau tidak ditemukan dalam sistem.`
        });
      }
      
      // Clean query parameter from address bar
      try {
        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({ path: newUrl }, '', newUrl);
      } catch (e) {
        console.error("Gagal membersihkan URL", e);
      }
    }
  }, []);

  const handleStartDemo = () => {
    // Demo login automatically logs in with Demo values
    // Check if DEMO user is present in system, otherwise reconstruct
    const savedUsersStr = localStorage.getItem('ep_users') || '[]';
    let savedUsers: User[] = JSON.parse(savedUsersStr);
    
    let demoUser = savedUsers.find(u => u.email === 'demo@eventku.id');
    if (!demoUser) {
      demoUser = {
        id: 'user_demo',
        name: 'Budi Santoso (Ketua BEM)',
        email: 'demo@eventku.id',
        organization: 'Badan Eksekutif Mahasiswa (BEM) Universitas',
        plan: 'pro', // demo users get full visual features
        registeredAt: new Date().toISOString(),
        role: 'panitia'
      };
      savedUsers.push(demoUser);
      localStorage.setItem('ep_users', JSON.stringify(savedUsers));
    }
    
    handleLoginSuccess(demoUser);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('ep_active_session', JSON.stringify(user));
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ep_active_session');
    setCurrentView('landing');
  };

  // Custom function to update current user's SaaS plan
  const handleUpdateUserPlan = (newPlan: SaaSPlan) => {
    if (!currentUser) return;

    const updatedUser = {
      ...currentUser,
      plan: newPlan
    };

    setCurrentUser(updatedUser);
    localStorage.setItem('ep_active_session', JSON.stringify(updatedUser));

    // Persist changes back to user database list
    const savedUsersStr = localStorage.getItem('ep_users') || '[]';
    let savedUsers: User[] = JSON.parse(savedUsersStr);
    savedUsers = savedUsers.map(u => u.id === currentUser.id ? updatedUser : u);
    localStorage.setItem('ep_users', JSON.stringify(savedUsers));
  };

  // ROUTING RENDERER BLOCK
  if (scannedTicket) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans text-slate-100">
        
        {/* Background ambient lighting */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 -translate-x-1/2 -translate-y-1/2 bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 translate-x-1/2 translate-y-1/2 bg-pink-500/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-md w-full glass p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6 text-center relative z-10 animate-fade-in shadow-purple-500/5">
          
          <div className="flex justify-center">
            {scannedTicket.success ? (
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-ping" />
                <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black rounded-full flex items-center justify-center relative shadow-lg">
                  <svg className="w-8 h-8 stroke-[3.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full animate-pulse" />
                <div className="w-16 h-16 bg-gradient-to-tr from-red-500 to-rose-400 text-white font-black rounded-full flex items-center justify-center relative shadow-lg animate-bounce">
                  <svg className="w-8 h-8 stroke-[3.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-pink-400 uppercase block">
              SMARTEVENT TERM VERIFIKASI
            </span>
            <h2 className="font-sans font-extrabold text-2xl text-white tracking-tight">
              {scannedTicket.success ? 'PRESENSI BERHASIL' : 'PRESENSI GAGAL'}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed font-medium px-4">
              {scannedTicket.message}
            </p>
          </div>
          
          {scannedTicket.success && scannedTicket.participant && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-3.5 antialiased">
              <div className="border-b border-white/5 pb-2.5 flex items-start gap-3">
                <div className="p-2 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-lg text-white font-sans text-xs font-black shrink-0">
                  {scannedTicket.participant.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <span className="text-[8px] font-mono text-slate-400 uppercase font-bold tracking-wider block">Identitas Peserta</span>
                  <p className="text-xs font-extrabold text-white truncate">{scannedTicket.participant.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono truncate">{scannedTicket.participant.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-xs leading-relaxed">
                <div>
                  <span className="text-[8px] font-mono text-slate-400 uppercase font-bold tracking-wider block mb-0.5">Nama Kegiatan</span>
                  <p className="font-bold text-white truncate">{scannedTicket.event?.title || 'Event Kampus'}</p>
                </div>
                <div>
                  <span className="text-[8px] font-mono text-slate-400 uppercase font-bold tracking-wider block mb-0.5">Jalur Verifikasi</span>
                  <p className="font-bold text-pink-400 font-mono text-[9px] uppercase">Link QR Scanner</p>
                </div>
                <div>
                  <span className="text-[8px] font-mono text-slate-400 uppercase font-bold tracking-wider block mb-0.5">No. Boarding Pass</span>
                  <p className="font-mono text-[10px] text-slate-300 font-bold bg-white/10 px-1.5 py-0.5 rounded inline-block">
                    {scannedTicket.participant.ticketCode}
                  </p>
                </div>
                <div>
                  <span className="text-[8px] font-mono text-slate-400 uppercase font-bold tracking-wider block mb-0.5">Waktu Check-In</span>
                  <p className="text-[10px] text-slate-300 font-mono font-bold">
                    {new Date(scannedTicket.participant.attendedAt || new Date()).toLocaleTimeString('id-ID')} WIB
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <button
            id="btn-close-scan-viewer"
            onClick={() => {
              setScannedTicket(null);
            }}
            className="w-full py-2.5 bg-gradient-to-tr from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-sans text-xs font-bold rounded-xl transition shadow-lg shrink-0 cursor-pointer"
          >
            Masuk ke Layanan Aplikasi
          </button>
          
        </div>
      </div>
    );
  }

  if (currentUser && currentView === 'dashboard') {
    return (
      <Dashboard 
        user={currentUser} 
        onLogout={handleLogout}
        onUpdateUserPlan={handleUpdateUserPlan}
        onViewPublicShowcase={() => setCurrentView('events-public')}
      />
    );
  }

  if (currentView === 'events-public') {
    return (
      <EventShowcase 
        currentUser={currentUser}
        onNavigateBack={() => {
          if (currentUser) {
            setCurrentView('dashboard');
          } else {
            setCurrentView('landing');
          }
        }}
        onGoToDashboard={() => setCurrentView('dashboard')}
      />
    );
  }

  if (currentView === 'auth') {
    return (
      <Auth 
        initialMode={authState.mode}
        selectedPlan={authState.selectedPlan}
        onAuthSuccess={handleLoginSuccess}
        onNavigateBack={() => setCurrentView('landing')}
      />
    );
  }

  return (
    <LandingPage 
      currentUser={currentUser}
      onStartDemo={handleStartDemo}
      onViewEvents={() => setCurrentView('events-public')}
      onNavigateToAuth={(mode, plan = 'basic') => {
        setAuthState({ mode, selectedPlan: plan });
        setCurrentView('auth');
      }}
      onGoToDashboard={() => setCurrentView('dashboard')}
    />
  );
}
