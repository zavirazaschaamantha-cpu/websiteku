import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Mail, Lock, User, Building, ShieldCheck, ArrowLeft, Star, Heart } from 'lucide-react';
import { SaaSPlan, User as UserType } from '../types';

interface AuthProps {
  initialMode: 'login' | 'signup';
  selectedPlan?: SaaSPlan;
  onAuthSuccess: (user: UserType) => void;
  onNavigateBack: () => void;
}

export default function Auth({ initialMode, selectedPlan = 'basic', onAuthSuccess, onNavigateBack }: AuthProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [plan, setPlan] = useState<SaaSPlan>(selectedPlan);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAutofillDemo = () => {
    setEmail('demo@eventku.id');
    setPassword('password123');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email || !password) {
      setError('Email dan password harus diaktifkan/diisi.');
      return;
    }

    const savedUsersStr = localStorage.getItem('ep_users') || '[]';
    const savedUsers: UserType[] = JSON.parse(savedUsersStr);

    if (mode === 'login') {
      // Login flow
      // Simplistic authorization for demo
      if (email === 'demo@eventku.id' && password === 'password123') {
        const demoUser = savedUsers.find(u => u.email === email);
        if (demoUser) {
          onAuthSuccess(demoUser);
        } else {
          // If demo deleted, reconstruct
          const defaultUser: UserType = {
            id: 'user_demo',
            name: 'Budi Santoso',
            email: 'demo@eventku.id',
            organization: 'PT Sinergi Kreatif Nusantara',
            plan: 'pro', // Give full analytic experience for demo
            registeredAt: new Date().toISOString()
          };
          savedUsers.push(defaultUser);
          localStorage.setItem('ep_users', JSON.stringify(savedUsers));
          onAuthSuccess(defaultUser);
        }
        return;
      }

      // Check registered email / password (dummy validation: password accepts whatever exists or matching registered user)
      const matchedUser = savedUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (matchedUser) {
        // Simple password check (accept password123 or whatever they registered with)
        onAuthSuccess(matchedUser);
      } else {
        setError('Kombinasi email dan password kurang tepat atau belum terdaftar.');
      }
    } else {
      // Sign Up flow
      if (!name || !organization) {
        setError('Silakan lengkapi nama lengkap dan nama instansi Anda.');
        return;
      }

      const emailExists = savedUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
      if (emailExists) {
        setError('Alamat email tersebut sudah terdaftar di sistem.');
        return;
      }

      const newUser: UserType = {
        id: `user_${Date.now()}`,
        name,
        email,
        organization,
        plan,
        registeredAt: new Date().toISOString()
      };

      savedUsers.push(newUser);
      localStorage.setItem('ep_users', JSON.stringify(savedUsers));
      
      setSuccessMsg('Pendaftaran akun berhasil! Mengalihkan ke dashboard...');
      setTimeout(() => {
        onAuthSuccess(newUser);
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden gradient-bg text-white">
      {/* Visual background decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pink-500/15 rounded-full blur-[120px] -z-10" />

      {/* Back button */}
      <div className="absolute top-6 left-6">
        <button
          id="btn-auth-back"
          onClick={onNavigateBack}
          className="flex items-center space-x-2 text-pink-300 hover:text-pink-200 transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-semibold font-sans">Kembali ke Home</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md mt-10">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-2xl text-white shadow-xl shadow-pink-500/25">
            <Calendar className="h-8 w-8" />
          </div>
        </div>
        <h2 className="text-center font-sans text-3xl font-extrabold text-white leading-tight">
          {mode === 'login' ? 'Masuk ke EventPlannerKu' : 'Mulai Kelola Event Anda'}
        </h2>
        <p className="mt-2 text-center text-sm text-white/70 font-sans">
          {mode === 'login' ? (
            <span>Atau, jika Anda belum memiliki akun,{' '}
              <button 
                id="link-to-signup"
                onClick={() => { setMode('signup'); setError(''); }} 
                className="font-bold text-pink-300 hover:text-pink-200 cursor-pointer"
              >
                daftar gratis di sini
              </button>
            </span>
          ) : (
            <span>Sudah memiliki akun?{' '}
              <button 
                id="link-to-login"
                onClick={() => { setMode('login'); setError(''); }} 
                className="font-bold text-pink-300 hover:text-pink-200 cursor-pointer"
              >
                masuk ke sistem
              </button>
            </span>
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass py-8 px-6 shadow-2xl rounded-3xl sm:px-10">
          
          {error && (
            <div id="auth-error" className="mb-4 p-3 bg-red-500/25 border border-red-500/30 text-red-200 text-xs font-semibold rounded-xl">
              {error}
            </div>
          )}

          {successMsg && (
            <div id="auth-success" className="mb-4 p-3 bg-green-500/25 border border-green-500/30 text-green-200 text-xs font-semibold rounded-xl">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                {/* Full Name */}
                <div>
                  <label htmlFor="auth-name" className="block text-xs font-bold text-pink-200 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/50">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      id="auth-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Contoh: Budi Santoso"
                      className="block w-full pl-10 pr-3 py-2.5 glass-input rounded-xl focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-pink-400 text-white placeholder-white/40 text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Organization */}
                <div>
                  <label htmlFor="auth-org" className="block text-xs font-bold text-pink-200 uppercase tracking-wider mb-1.5">Nama Instansi / Komunitas</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/50">
                      <Building className="h-4 w-4" />
                    </div>
                    <input
                      id="auth-org"
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="Contoh: Universitas Indonesia / Komunitas IT"
                      className="block w-full pl-10 pr-3 py-2.5 glass-input rounded-xl focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-pink-400 text-white placeholder-white/40 text-sm"
                      required
                    />
                  </div>
                </div>

                {/* SaaS Subscription Plan Selector */}
                <div>
                  <label className="block text-xs font-bold text-pink-200 uppercase tracking-wider mb-1.5">Pilih Tingkat Paket SaaS</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      id="opt-plan-free"
                      type="button"
                      onClick={() => setPlan('free')}
                      className={`p-2 rounded-xl text-center border transition flex flex-col justify-between h-20 ${plan === 'free' ? 'border-pink-500 bg-white/15 text-white ring-1 ring-pink-500/30 shadow-lg' : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/70'}`}
                    >
                      <span className="text-[10px] font-bold block">Free Plan</span>
                      <span className="text-xs font-black">Gratis</span>
                      <span className="text-[8px] opacity-60 block truncate">1 event/bln</span>
                    </button>
                    <button
                      id="opt-plan-basic"
                      type="button"
                      onClick={() => setPlan('basic')}
                      className={`p-2 rounded-xl text-center border transition flex flex-col justify-between h-20 ${plan === 'basic' ? 'border-pink-500 bg-white/15 text-white ring-1 ring-pink-500/30 shadow-lg' : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/70'}`}
                    >
                      <span className="text-[10px] font-bold block">Basic Plan</span>
                      <span className="text-xs font-black text-pink-300">Rp49rb</span>
                      <span className="text-[8px] opacity-60 block truncate">Unlimited event</span>
                    </button>
                    <button
                      id="opt-plan-pro"
                      type="button"
                      onClick={() => setPlan('pro')}
                      className={`p-2 rounded-xl text-center border transition flex flex-col justify-between h-20 ${plan === 'pro' ? 'border-pink-500 bg-white/15 text-white ring-1 ring-pink-500/30 shadow-lg' : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/70'}`}
                    >
                      <span className="text-[10px] font-bold block">Pro Plan</span>
                      <span className="text-xs font-black text-pink-200">Rp99rb</span>
                      <span className="text-[8px] opacity-60 block truncate">+ Analytics</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label htmlFor="auth-email" className="block text-xs font-bold text-pink-200 uppercase tracking-wider mb-1.5">Alamat Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/50">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Contoh: nama@domain.com"
                  className="block w-full pl-10 pr-3 py-2.5 glass-input rounded-xl focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-pink-400 text-white placeholder-white/40 text-sm"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="auth-password" className="block text-xs font-bold text-pink-200 uppercase tracking-wider">Kata Sandi</label>
                {mode === 'login' && (
                  <span className="text-[10px] font-bold text-pink-300 hover:text-white hover:underline cursor-pointer">Lupa Sandi?</span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/50">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan minimal 6 karakter"
                  className="block w-full pl-10 pr-3 py-2.5 glass-input rounded-xl focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-pink-400 text-white placeholder-white/40 text-sm"
                  required
                />
              </div>
            </div>

            <button
              id="auth-btn-submit"
              type="submit"
              className="w-full mt-4 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-sans font-bold text-sm rounded-xl transition shadow-lg shadow-pink-500/20 flex items-center justify-center space-x-1 cursor-pointer"
            >
              <span>{mode === 'login' ? 'Masuk ke Akun' : 'Daftar & Hubungkan'}</span>
            </button>
          </form>

          {/* Quick Demo Autofill section */}
          {mode === 'login' && (
            <div className="mt-6 pt-5 border-t border-white/10 text-center">
              <span className="text-[10px] uppercase font-bold text-white/50 block tracking-wider mb-2">Evaluasi Instan Tanpa Registrasi</span>
              <button
                id="btn-autofill-demo"
                type="button"
                onClick={handleAutofillDemo}
                className="w-full py-2.5 border border-dashed border-pink-500/30 bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 font-sans text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Star className="h-3.5 w-3.5 fill-pink-300" />
                <span>Autofill Akun Demo (Demo Owner)</span>
              </button>
              <div className="mt-1.5 text-[10px] text-white/40 font-mono">
                demo@eventku.id &bull; password123
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
