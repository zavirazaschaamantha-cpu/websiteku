import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Mail, Lock, User, Building, ShieldCheck, ArrowLeft, Star, Heart, Eye, EyeOff, GraduationCap, Sparkles } from 'lucide-react';
import { SaaSPlan, User as UserType } from '../types';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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
  const [selectedRole, setSelectedRole] = useState<'mahasiswa' | 'panitia'>('mahasiswa');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleGoogleLogin = async () => {
    setError('');
    setSuccessMsg('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);
      
      let finalUser: UserType;
      if (userSnap.exists()) {
        finalUser = userSnap.data() as UserType;
        // Keep the role from the stored document
      } else {
        // Create new user profile in Firestore
        finalUser = {
          id: user.uid,
          name: user.displayName || 'Pengguna Baru',
          email: user.email || '',
          organization: selectedRole === 'panitia' ? (organization || 'BEM Universitas') : (organization || 'Universitas Indonesia'),
          plan: selectedRole === 'mahasiswa' ? 'free' : plan,
          registeredAt: new Date().toISOString(),
          role: selectedRole
        };
        await setDoc(userDocRef, finalUser);
      }
      
      setSuccessMsg('Masuk dengan Google berhasil!');
      setTimeout(() => {
        onAuthSuccess(finalUser);
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setError('Gagal masuk menggunakan Google. Pastikan izin popup browser Anda aktif.');
    }
  };

  const handleAutofillPanitia = () => {
    setEmail('demo@eventku.id');
    setPassword('password123');
    setSelectedRole('panitia');
    setError('');
  };

  const handleAutofillMahasiswa = () => {
    setEmail('mhs@eventku.id');
    setPassword('password123');
    setSelectedRole('mahasiswa');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email || !password) {
      setError('Email dan password harus diisi.');
      return;
    }

    const savedUsersStr = localStorage.getItem('ep_users') || '[]';
    const savedUsers: UserType[] = JSON.parse(savedUsersStr);

    if (mode === 'login') {
      // Login flow
      // 1. Organizers Demo
      if (email === 'demo@eventku.id' && password === 'password123') {
        const demoUser = savedUsers.find(u => u.email === email);
        if (demoUser) {
          onAuthSuccess({ ...demoUser, role: 'panitia' });
        } else {
          const defaultUser: UserType = {
            id: 'user_demo',
            name: 'Budi Santoso',
            email: 'demo@eventku.id',
            organization: 'Badan Eksekutif Mahasiswa (BEM) Universitas',
            plan: 'pro',
            registeredAt: new Date().toISOString(),
            role: 'panitia'
          };
          savedUsers.push(defaultUser);
          localStorage.setItem('ep_users', JSON.stringify(savedUsers));
          onAuthSuccess(defaultUser);
        }
        return;
      }

      // 2. Students Demo
      if (email === 'mhs@eventku.id' && password === 'password123') {
        const mhsUser = savedUsers.find(u => u.email === email);
        if (mhsUser) {
          onAuthSuccess({ ...mhsUser, role: 'mahasiswa' });
        } else {
          const defaultMhs: UserType = {
            id: 'user_mhs_demo',
            name: 'Andi Wijaya (Mahasiswa)',
            email: 'mhs@eventku.id',
            organization: 'Fakultas Ilmu Komputer UI',
            plan: 'free',
            registeredAt: new Date().toISOString(),
            role: 'mahasiswa'
          };
          savedUsers.push(defaultMhs);
          localStorage.setItem('ep_users', JSON.stringify(savedUsers));
          onAuthSuccess(defaultMhs);
        }
        return;
      }

      // 3. Regular users
      const matchedUser = savedUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (matchedUser) {
        onAuthSuccess(matchedUser);
      } else {
        setError('Kombinasi email dan password kurang tepat atau belum terdaftar.');
      }
    } else {
      // Sign Up flow
      if (!name) {
        setError('Silakan lengkapi nama lengkap Anda.');
        return;
      }
      if (selectedRole === 'panitia' && !organization) {
        setError('Silakan lengkapi nama organisasi atau instansi kepanitiaan Anda.');
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
        organization: selectedRole === 'mahasiswa' ? (organization || 'Universitas Indonesia') : organization,
        plan: selectedRole === 'mahasiswa' ? 'free' : plan,
        registeredAt: new Date().toISOString(),
        role: selectedRole
      };

      savedUsers.push(newUser);
      localStorage.setItem('ep_users', JSON.stringify(savedUsers));
      
      setSuccessMsg(`Pendaftaran akun ${selectedRole === 'mahasiswa' ? 'Mahasiswa' : 'Panitia'} berhasil! Mengalihkan ke dashboard...`);
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

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in">
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
                {/* Role Selector Card */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-pink-200 uppercase tracking-widest mb-2 font-mono">Pilih Peran Utama</label>
                  <div className="grid grid-cols-2 gap-3" id="role-selector-signup">
                    <button
                      id="signup-role-mahasiswa"
                      type="button"
                      onClick={() => {
                        setSelectedRole('mahasiswa');
                      }}
                      className={`p-3 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
                        selectedRole === 'mahasiswa'
                          ? 'border-pink-500 bg-pink-500/10 text-white shadow-lg ring-1 ring-pink-500/20'
                          : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/50'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <GraduationCap className={`h-5 w-5 ${selectedRole === 'mahasiswa' ? 'text-pink-400' : 'text-slate-400'}`} />
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          selectedRole === 'mahasiswa' ? 'bg-pink-500/25 text-pink-300 font-extrabold' : 'bg-white/10 text-slate-300'
                        }`}>PESERTA</span>
                      </div>
                      <span className="text-xs font-extrabold block">Mahasiswa</span>
                      <span className="text-[9px] opacity-75 mt-1 leading-relaxed block">Peserta event & download sertifikat</span>
                    </button>

                    <button
                      id="signup-role-panitia"
                      type="button"
                      onClick={() => {
                        setSelectedRole('panitia');
                      }}
                      className={`p-3 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
                        selectedRole === 'panitia'
                          ? 'border-purple-500 bg-purple-500/10 text-white shadow-lg ring-1 ring-purple-500/20'
                          : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/50'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <ShieldCheck className={`h-5 w-5 ${selectedRole === 'panitia' ? 'text-purple-400' : 'text-slate-400'}`} />
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          selectedRole === 'panitia' ? 'bg-purple-500/25 text-purple-300 font-extrabold' : 'bg-white/10 text-slate-300'
                        }`}>PANITIA BEM</span>
                      </div>
                      <span className="text-xs font-extrabold block">Panitia BEM</span>
                      <span className="text-[9px] opacity-75 mt-1 leading-relaxed block">Manajemen, buat absensi & analisis scan</span>
                    </button>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label htmlFor="auth-name" className="block text-xs font-bold text-pink-200 uppercase tracking-wider mb-1.5 font-mono">Nama Lengkap</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/50">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      id="auth-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={selectedRole === 'mahasiswa' ? 'Contoh: Andi Wijaya' : 'Contoh: Bagas Pratama'}
                      className="block w-full pl-10 pr-3 py-2.5 glass-input rounded-xl focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-pink-400 text-white placeholder-white/40 text-sm transition"
                      required
                    />
                  </div>
                </div>

                {/* Organization */}
                <div>
                  <label htmlFor="auth-org" className="block text-xs font-bold text-pink-200 uppercase tracking-wider mb-1.5 font-mono">
                    {selectedRole === 'mahasiswa' ? 'Asal Universitas & Jurusan' : 'Nama Instansi / Komunitas BEM'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/50">
                      {selectedRole === 'mahasiswa' ? <GraduationCap className="h-4 w-4" /> : <Building className="h-4 w-4" />}
                    </div>
                    <input
                      id="auth-org"
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder={selectedRole === 'mahasiswa' ? 'Contoh: Universitas Indonesia / Sistem Informasi' : 'Contoh: BEM Fakultas Ilmu Komputer UI'}
                      className="block w-full pl-10 pr-3 py-2.5 glass-input rounded-xl focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-pink-400 text-white placeholder-white/40 text-sm transition"
                      required
                    />
                  </div>
                </div>

                {/* SaaS Subscription Plan Selector (Panitia Only) */}
                {selectedRole === 'panitia' && (
                  <div>
                    <label className="block text-xs font-bold text-pink-200 uppercase tracking-wider mb-1.5 font-mono">Pilih Tingkat Paket SaaS</label>
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
                )}
              </>
            )}

            {/* Email */}
            <div>
              <label htmlFor="auth-email" className="block text-xs font-bold text-pink-200 uppercase tracking-wider mb-1.5 font-mono">Alamat Email</label>
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
                  className="block w-full pl-10 pr-3 py-2.5 glass-input rounded-xl focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-pink-400 text-white placeholder-white/40 text-sm transition"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="auth-password" className="block text-xs font-bold text-pink-200 uppercase tracking-wider font-mono">Kata Sandi</label>
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
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan minimal 6 karakter"
                  className="block w-full pl-10 pr-10 py-2.5 glass-input rounded-xl focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-pink-400 text-white placeholder-white/40 text-sm transition"
                  required
                />
                <button
                  id="btn-toggle-password"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/50 hover:text-white transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
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

          {/* Google Sign In / UP Button */}
          <div className="mt-4">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink mx-4 text-[10px] text-white/40 uppercase font-mono font-bold">atau</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            <button
              id="btn-google-auth"
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-900 font-sans font-extrabold text-xs rounded-xl transition shadow-md flex items-center justify-center space-x-2 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#ea4335"
                  d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582l3.51-3.51C17.642 1.09 14.974 0 12 0 7.354 0 3.307 2.67 1.242 6.577l4.024 3.188z"
                />
                <path
                  fill="#4285f4"
                  d="M23.49 12.275c0-.825-.075-1.613-.19-2.387H12v4.513h6.44c-.277 1.463-1.1 2.7-2.341 3.537l3.65 2.831c2.13-1.963 3.741-4.851 3.741-8.5z"
                />
                <path
                  fill="#fbbc05"
                  d="M5.266 14.235L1.242 17.42A11.966 11.966 0 0 0 12 24c3.048 0 5.89-.995 8.01-2.738l-3.65-2.831c-1.164.78-2.656 1.233-4.36 1.233-3.328 0-6.148-2.247-7.15-5.265l-4.024 3.188z"
                />
                <path
                  fill="#34a853"
                  d="M12 4.909c1.817 0 3.456.626 4.738 1.836l3.51-3.51C17.64 1.143 14.97 0 12 0 7.354 0 3.307 2.67 1.242 6.577l4.024 3.188C6.276 6.74 9.096 4.909 12 4.909z"
                />
              </svg>
              <span>{mode === 'login' ? 'Masuk dengan Google' : 'Masuk dengan Google'}</span>
            </button>
          </div>

          {/* Quick Demo Autofill section */}
          {mode === 'login' && (
            <div className="mt-6 pt-5 border-t border-white/10 text-center">
              <span className="text-[10px] uppercase font-bold text-white/50 block tracking-wider mb-2.5 font-mono">Evaluasi Instan Tanpa Registrasi</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="btn-autofill-panitia"
                  type="button"
                  onClick={handleAutofillPanitia}
                  className="py-2.5 px-1.5 border border-dashed border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-sans text-[10px] font-bold rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-purple-400 flex-shrink-0" />
                  <span>Demo BEM (Panitia)</span>
                </button>
                <button
                  id="btn-autofill-mahasiswa"
                  type="button"
                  onClick={handleAutofillMahasiswa}
                  className="py-2.5 px-1.5 border border-dashed border-pink-500/40 bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 font-sans text-[10px] font-bold rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <GraduationCap className="h-3.5 w-3.5 text-pink-400 flex-shrink-0" />
                  <span>Demo Mahasiswa</span>
                </button>
              </div>
              <div className="mt-2 text-[10px] text-white/40 font-mono">
                Sandi demo: <span className="text-white/60 font-semibold">password123</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
