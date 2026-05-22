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

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authState, setAuthState] = useState<{
    show: boolean;
    mode: 'login' | 'signup';
    selectedPlan: SaaSPlan;
  }>({
    show: false,
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
        setCurrentUser(JSON.parse(activeSession));
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
        name: 'Budi Santoso',
        email: 'demo@eventku.id',
        organization: 'PT Sinergi Kreatif Nusantara',
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
    setAuthState({ ...authState, show: false });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ep_active_session');
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

  return (
    <>
      {currentUser ? (
        <Dashboard 
          user={currentUser} 
          onLogout={handleLogout}
          onUpdateUserPlan={handleUpdateUserPlan}
        />
      ) : authState.show ? (
        <Auth 
          initialMode={authState.mode}
          selectedPlan={authState.selectedPlan}
          onAuthSuccess={handleLoginSuccess}
          onNavigateBack={() => setAuthState({ ...authState, show: false })}
        />
      ) : (
        <LandingPage 
          onStartDemo={handleStartDemo}
          onNavigateToAuth={(mode, plan = 'basic') => setAuthState({
            show: true,
            mode,
            selectedPlan: plan
          })}
        />
      )}
    </>
  );
}
