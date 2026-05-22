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

  // Initialize LocalStorage database tables upon startup
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
        registeredAt: new Date().toISOString()
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
