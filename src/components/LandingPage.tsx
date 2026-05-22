import React from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, CheckCircle2, XCircle, Users, Ticket, 
  QrCode, BarChart3, GraduationCap, Users2, Building2,
  TrendingUp, ShieldAlert, Award, ArrowRight, ArrowUpRight, Zap
} from 'lucide-react';
import { SaaSPlan, User } from '../types';

interface LandingPageProps {
  currentUser?: User | null;
  onStartDemo: () => void;
  onStartStudentDemo: () => void;
  onViewEvents: () => void;
  onNavigateToAuth: (mode: 'login' | 'signup', plan?: SaaSPlan) => void;
  onGoToDashboard: () => void;
}

export default function LandingPage({ currentUser, onStartDemo, onStartStudentDemo, onViewEvents, onNavigateToAuth, onGoToDashboard }: LandingPageProps) {
  return (
    <div className="min-h-screen gradient-bg text-white selection:bg-pink-500 selection:text-white relative overflow-hidden">
      {/* Dynamic light glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[50%] bg-pink-500/20 rounded-full blur-[130px] pointer-events-none" />

      {/* Navbar */}
      <nav id="navbar" className="sticky top-0 z-50 bg-white/5 backdrop-blur-xl border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-xl text-white shadow-lg shadow-pink-500/20">
                <Calendar className="h-6 w-6" id="brand-logo" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                <span className="font-sans font-bold text-xl bg-gradient-to-r from-white via-pink-100 to-pink-300 bg-clip-text text-transparent leading-none">
                  EventPlannerKu
                </span>
                <span className="text-[9px] font-sans font-bold px-2 py-0.5 bg-pink-500/35 border border-pink-400/30 text-pink-200 uppercase rounded-full tracking-wider mt-1 sm:mt-0 max-w-fit">
                  Edisi Kampus
                </span>
              </div>
            </div>
            
            <div className="hidden md:flex space-x-6 items-center">
              <button 
                onClick={onViewEvents} 
                className="font-sans text-sm font-bold text-pink-300 hover:text-pink-200 transition-colors cursor-pointer flex items-center space-x-1.5"
                id="btn-nav-portal-showcase"
              >
                <span>Portal Event Mahasiswa</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                </span>
              </button>
              <span className="text-white/20">|</span>
              <a href="#masalah-solusi" className="font-sans text-xs text-white/70 hover:text-pink-300 transition-colors">Masalah</a>
              <a href="#fitur" className="font-sans text-xs text-white/70 hover:text-pink-300 transition-colors">Fitur</a>
              <a href="#sasaran" className="font-sans text-xs text-white/70 hover:text-pink-300 transition-colors">Sasaran</a>
              <a href="#swot" className="font-sans text-xs text-white/70 hover:text-pink-300 transition-colors">SWOT</a>
              <a href="#harga" className="font-sans text-xs text-white/70 hover:text-pink-300 transition-colors">Harga</a>
            </div>

            <div className="flex items-center space-x-3">
              {currentUser ? (
                <button 
                  id="btn-nav-dashboard"
                  onClick={onGoToDashboard}
                  className="px-4 py-2 bg-gradient-to-tr from-pink-500 to-purple-600 hover:opacity-95 text-white font-sans text-xs font-bold rounded-xl transition shadow-lg shadow-pink-500/20 flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>Dashboard Organisasi</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <>
                  <button 
                    id="btn-nav-login"
                    onClick={() => onNavigateToAuth('login')}
                    className="px-4 py-2 font-sans text-sm font-semibold text-pink-300 hover:text-pink-200 transition"
                  >
                    Masuk
                  </button>
                  <button 
                    id="btn-nav-signup"
                    onClick={() => onNavigateToAuth('signup')}
                    className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white font-sans text-sm font-bold rounded-xl transition shadow-lg shadow-pink-500/20"
                  >
                    Daftar Akun
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header id="hero" className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 text-pink-300 border border-white/10 rounded-full text-xs font-semibold animate-pulse">
                <Zap className="h-3.5 w-3.5" />
                <span>SmartEvent Edisi Organisasi Mahasiswa & Kampus</span>
              </div>
              
              <h1 className="font-sans text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                Kelola Event Kampus & Kegiatan <span className="bg-gradient-to-r from-pink-400 via-purple-300 to-pink-300 bg-clip-text text-transparent">Lebih Rapi & Seru</span>
              </h1>
              
              <p className="font-sans text-lg text-white/80 leading-relaxed max-w-xl">
                Solusi digital terlengkap bagi BEM, Himpunan, and UKM Universitas. Atur pendaftaran seminar beasiswa online, bagikan e-tiket QR Code resmi secara gratis, dan kelola kehadiran absensi ratusan mahasiswa secepat kilat.
              </p>

              <div className="flex flex-col sm:flex-row flex-wrap gap-4 pt-2">
                <button
                  id="hero-btn-view-events"
                  onClick={onViewEvents}
                  className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-sans font-extrabold rounded-2xl shadow-xl shadow-pink-500/25 hover:opacity-95 transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Cari & Daftar Event Kampus</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
                <button
                  id="hero-btn-demo"
                  onClick={onStartDemo}
                  className="px-6 py-4 bg-white/10 border border-white/20 text-white font-sans font-bold rounded-2xl hover:bg-white/15 transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Demo Akses Panitia (BEM)</span>
                  <Zap className="h-4.5 w-4.5 text-pink-400" />
                </button>
                <button
                  id="hero-btn-demo-mhs"
                  onClick={onStartStudentDemo}
                  className="px-6 py-4 bg-pink-500/10 border border-pink-500/20 text-pink-300 font-sans font-bold rounded-2xl hover:bg-pink-500/20 transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Demo Akses Mahasiswa</span>
                  <GraduationCap className="h-4.5 w-4.5 text-pink-400" />
                </button>
              </div>

              {/* Quick stats / trust list */}
              <div className="grid grid-cols-3 gap-4 pt-6 text-center border-t border-white/15">
                <div>
                  <div className="font-sans text-2xl font-black text-pink-400">100%</div>
                  <div className="font-sans text-xs font-semibold uppercase text-white/60 tracking-wider">Berbasis Cloud</div>
                </div>
                <div>
                  <div className="font-sans text-2xl font-black text-pink-400">&lt; 1.5s</div>
                  <div className="font-sans text-xs font-semibold uppercase text-white/60 tracking-wider">Antrean Scan Tiket</div>
                </div>
                <div>
                  <div className="font-sans text-2xl font-black text-white">SaaS</div>
                  <div className="font-sans text-xs font-semibold uppercase text-white/60 tracking-wider">Khusus Mahasiswa</div>
                </div>
              </div>
            </div>

            {/* Right Interactive Mockup Graphic */}
            <div className="lg:col-span-5 relative bg-transparent">
              <div className="relative mx-auto w-full max-w-[400px]">
                {/* Visual Glassmorphism Card Stack */}
                <div className="absolute -inset-1.5 bg-gradient-to-tr from-pink-500 via-purple-600 to-pink-400 rounded-3xl blur opacity-30 animate-pulse"></div>
                
                <div className="relative glass rounded-3xl p-6 space-y-6">
                  {/* Student Event Banner Header */}
                  <div className="relative h-44 w-full rounded-2xl overflow-hidden border border-white/10 shadow-inner group">
                    <img 
                      src="/src/assets/images/student_event_hero_1779421304942.png" 
                      alt="Student Campus Event Banner" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex items-end p-4">
                      <div>
                        <span className="text-[9px] bg-pink-500 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider">E-Sertifikasi Beasiswa</span>
                        <h4 className="text-xs font-bold text-white mt-1 leading-snug">Raker Anggota & Seminar Nasional Mahasiswa UI</h4>
                      </div>
                    </div>
                  </div>

                  {/* Top Bar Decoration */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex space-x-1.5">
                      <div className="w-3 h-3 bg-red-400/80 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400/80 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400/80 rounded-full"></div>
                    </div>
                    <span className="font-mono text-xs text-white/50">smartevent-mahasiswa-live</span>
                  </div>

                  {/* Graphic Dashboard */}
                  <div className="space-y-4">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-xs text-white/60 block">Total Pendaftar Mahasiswa</span>
                        <span className="font-sans text-2xl font-extrabold text-white">1,248 <span className="text-xs text-green-300 font-normal">+18% mtd</span></span>
                      </div>
                      <div className="p-2.5 bg-pink-500 rounded-xl text-white">
                        <Users className="h-5 w-5" />
                      </div>
                    </div>

                    {/* Chart Mockup */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-white/70 block">Grafik Kehadiran Real-time di Auditorium</span>
                      <div className="flex items-end justify-between h-20 pt-2 px-2 bg-white/5 border border-white/5 rounded-xl">
                        <div className="w-4 bg-purple-500/55 rounded-t h-[30%]"></div>
                        <div className="w-4 bg-pink-500/55 rounded-t h-[45%]"></div>
                        <div className="w-4 bg-purple-400/70 rounded-t h-[60%]"></div>
                        <div className="w-4 bg-pink-400/70 rounded-t h-[50%]"></div>
                        <div className="w-4 bg-purple-500 rounded-t h-[85%]"></div>
                        <div className="w-4 bg-gradient-to-t from-pink-500 to-purple-500 rounded-t h-[100%]"></div>
                      </div>
                    </div>

                    {/* Ticket Mini Card with Code */}
                    <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-pink-500/20 text-pink-300 rounded-lg">
                          <Ticket className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Andi Wijaya (Fak. Teknik)</p>
                          <p className="text-[10px] font-mono text-white/50">EV1-AND89</p>
                        </div>
                      </div>
                      <div className="p-1 px-2.5 bg-green-500/20 text-green-300 text-[10px] font-bold rounded-full border border-green-500/25">
                        Selesai Scan
                      </div>
                    </div>

                    {/* Tiny Scan Simulation Widget */}
                    <div className="text-center p-2 border border-dashed border-pink-300/30 rounded-xl bg-pink-500/5 flex items-center justify-center space-x-2">
                      <QrCode className="h-4 w-4 text-pink-300 animate-spin" />
                      <span className="text-xs font-semibold text-pink-300">QR Scanner Absensi Aktif</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Problem & Solution Section */}
      <section id="masalah-solusi" className="py-20 bg-black/10 border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="font-sans text-xs font-bold uppercase tracking-wider text-pink-400">Masalah vs Solusi</h2>
            <p className="font-sans text-3xl sm:text-4xl font-extrabold text-white">Mengapa Anda Harus Beralih dari Catatan Manual?</p>
            <p className="font-sans text-white/70">Sistem tradisional pendaftaran di spreadsheets atau kertas sering memperlambat pekerjaan panitia dan mengecewakan peserta.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            {/* Problems card */}
            <div className="glass bg-red-950/10 border-red-500/20 rounded-3xl p-8 shadow-lg">
              <div className="flex items-center space-x-3 text-red-300 mb-6">
                <XCircle className="h-7 w-7" />
                <h3 className="font-sans text-xl font-bold">Masalah Pengelolaan Manual (Kertas / Spreadsheet)</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3">
                  <div className="mt-1.5 w-1.5 h-1.5 bg-red-400 rounded-full shrink-0" />
                  <p className="text-white/80 text-sm">
                    <strong className="text-white font-semibold block mb-0.5">Kesalahan Input Data</strong>
                    Pencatatan manual sering menyebabkan salah ketik nama atau data peserta hilang tanpa jejak.
                  </p>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="mt-1.5 w-1.5 h-1.5 bg-red-400 rounded-full shrink-0" />
                  <p className="text-white/80 text-sm">
                    <strong className="text-white font-semibold block mb-0.5">Proses Absensi Lambat</strong>
                    Saat acara mulai, antrean meluas karena panitia harus tanda tangan atau memanggil satu per satu di kertas coretan.
                  </p>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="mt-1.5 w-1.5 h-1.5 bg-red-400 rounded-full shrink-0" />
                  <p className="text-white/80 text-sm">
                    <strong className="text-white font-semibold block mb-0.5">Data Tidak Real-Time</strong>
                    Panitia kesulitan mendeteksi pasti berapa banyak pendaftar yang sudah menjejakkan kaki di lokasi hari-H.
                  </p>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="mt-1.5 w-1.5 h-1.5 bg-red-400 rounded-full shrink-0" />
                  <p className="text-white/80 text-sm">
                    <strong className="text-white font-semibold block mb-0.5">Laporan Rumit</strong>
                    Selesai acara, panitia lembur berhari-hari hanya untuk merapikan kehadiran, rekap sertifikat, dan data spreadsheet.
                  </p>
                </li>
              </ul>
            </div>

            {/* Opportunity/Solutions card */}
            <div className="glass bg-purple-950/10 border-purple-500/20 rounded-3xl p-8 shadow-lg">
              <div className="flex items-center space-x-3 text-pink-300 mb-6 font-bold">
                <CheckCircle2 className="h-7 w-7" />
                <h3 className="font-sans text-xl font-bold text-white">Solusi Modern SmartEvent Planner</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3">
                  <div className="mt-1.5 w-1.5 h-1.5 bg-pink-400 rounded-full shrink-0" />
                  <p className="text-white/80 text-sm">
                    <strong className="text-pink-200 font-semibold block mb-0.5">Form Registrasi Online Mandiri</strong>
                    Peserta mengisi data langsung secara mandiri. Valid, akurat, dan langsung terekam ke database cloud.
                  </p>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="mt-1.5 w-1.5 h-1.5 bg-pink-400 rounded-full shrink-0" />
                  <p className="text-white/80 text-sm">
                    <strong className="text-pink-200 font-semibold block mb-0.5">Tiket Digital QR Code Cepat</strong>
                    Peserta langsung mendapatkan kode tiket unik. Scan tiket instan kurangi waktu kedatangan di pintu masuk seminar.
                  </p>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="mt-1.5 w-1.5 h-1.5 bg-pink-400 rounded-full shrink-0" />
                  <p className="text-white/80 text-sm">
                    <strong className="text-pink-200 font-semibold block mb-0.5">Dashboard Grafik Real-Time</strong>
                    Pantau diagram pendaftaran, jumlah peserta, hingga rasio kehadiran langsung saat scan berlangsung.
                  </p>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="mt-1.5 w-1.5 h-1.5 bg-pink-400 rounded-full shrink-0" />
                  <p className="text-white/80 text-sm">
                    <strong className="text-pink-200 font-semibold block mb-0.5">Ekspor Laporan Satu Klik</strong>
                    Laporan kehadiran dan analisis demografi peserta rapi seketika, siap diserahkan ke founder atau direktur instansi.
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="fitur" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="font-sans text-xs font-bold uppercase tracking-wider text-pink-400">Fitur Utama Platform</h2>
            <p className="font-sans text-3xl sm:text-4xl font-extrabold text-white">Alat Bantu Manajemen Acara Terlengkap</p>
            <p className="font-sans text-white/70">Dirancang khusus untuk mengusung efisiensi seminar dan pelatihan Anda.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            
            {/* Feature 1 */}
            <div className="glass rounded-2xl p-6 shadow-sm hover:shadow-lg transition card-hover">
              <div className="w-12 h-12 bg-white/10 text-pink-300 rounded-xl flex items-center justify-center mb-5 font-bold border border-white/10">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="font-sans text-lg font-bold text-white mb-2">Event Registration System</h3>
              <p className="text-sm text-white/75 leading-relaxed">
                Pembuatan formulir pendaftaran online kustom dalam hitungan detik. Bagikan tautan unik formulir agar peserta bisa mengisi data diri dengan mudah.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass rounded-2xl p-6 shadow-sm hover:shadow-lg transition card-hover">
              <div className="w-12 h-12 bg-white/10 text-pink-300 rounded-xl flex items-center justify-center mb-5 font-bold border border-white/10">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-sans text-lg font-bold text-white mb-2">Participant Management</h3>
              <p className="text-sm text-white/75 leading-relaxed">
                Database terpusat untuk memantau, mencari, menyortir, dan memvalidasi daftar nama seluruh peserta yang terdaftar pada tiap-tiap acara.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass rounded-2xl p-6 shadow-sm hover:shadow-lg transition card-hover">
              <div className="w-12 h-12 bg-white/10 text-pink-300 rounded-xl flex items-center justify-center mb-5 font-bold border border-white/10">
                <Ticket className="h-6 w-6" />
              </div>
              <h3 className="font-sans text-lg font-bold text-white mb-2">Digital Ticketing</h3>
              <p className="text-sm text-white/75 leading-relaxed">
                Generasi otomatis tiket elektronik indah dengan QR Code unik setelah mendaftar. Tiket dapat langsung ditunjukkan oleh peserta saat memasuki lokasi seminar.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="glass rounded-2xl p-6 shadow-sm hover:shadow-lg transition card-hover">
              <div className="w-12 h-12 bg-white/10 text-pink-300 rounded-xl flex items-center justify-center mb-5 font-bold border border-white/10">
                <QrCode className="h-6 w-6" />
              </div>
              <h3 className="font-sans text-lg font-bold text-white mb-2">Attendance Scanner</h3>
              <p className="text-sm text-white/75 leading-relaxed">
                Fitur scanner instan berbasis web untuk melacak kehadiran peserta. Cukup cari kode tiket atau jalankan scanner web untuk langsung mengubah status menjadi Hadir.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="glass rounded-2xl p-6 shadow-sm hover:shadow-lg transition card-hover">
              <div className="w-12 h-12 bg-white/10 text-pink-300 rounded-xl flex items-center justify-center mb-5 font-bold border border-white/10">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="font-sans text-lg font-bold text-white mb-2">Dashboard & Reports</h3>
              <p className="text-sm text-white/75 leading-relaxed">
                Visualisasi statistik ringkas yang menampilkan diagram pendaftaran dan tingkat kehadiran peserta per hari dalam visualisasi grafik yang mudah dipahami.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gradient-to-tr from-pink-500 through-purple-600 to-indigo-600 rounded-2xl p-6 text-white flex flex-col justify-between shadow-xl border border-white/10">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full border border-white/10">Sistem SaaS Cloud</span>
                <h3 className="font-sans text-lg font-bold mt-4 mb-2">Butuh Uji Coba Langsung?</h3>
                <p className="text-xs text-white/95 leading-relaxed">
                  Kami menyediakan data awal akun demo siap pakai agar Anda dapat menguji semua alur kerja sebagai BEM/Panitia atau sebagai Mahasiswa/Peserta.
                </p>
              </div>
              <div className="mt-5 space-y-2">
                <button 
                  id="btn-trial-now-panitia"
                  onClick={onStartDemo}
                  className="w-full py-2 bg-white text-purple-900 font-sans text-xs font-extrabold rounded-xl hover:bg-white/90 transition flex items-center justify-center space-x-1.5 shadow-md cursor-pointer"
                >
                  <span>Coba Demo Panitia (BEM)</span>
                  <Zap className="h-3.5 w-3.5 text-purple-600" />
                </button>
                <button 
                  id="btn-trial-now-mahasiswa"
                  onClick={onStartStudentDemo}
                  className="w-full py-2 bg-purple-950/40 border border-white/20 text-white font-sans text-xs font-bold rounded-xl hover:bg-purple-950/60 transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <span>Coba Demo Mahasiswa</span>
                  <GraduationCap className="h-3.5 w-3.5 text-pink-300" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Target Users Section */}
      <section id="sasaran" className="py-20 bg-black/10 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="font-sans text-xs font-bold uppercase tracking-wider text-pink-400">Penyelenggara Mahasiswa</h2>
            <p className="font-sans text-3xl sm:text-4xl font-extrabold text-white">Dirancang Khusus Untuk Berbagai Komunitas Kampus</p>
            <p className="font-sans text-white/70">Mulai dari organisasi eksekutif tingkat universitas hingga perkumpulan minat hobi mahasiswa.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 text-center mb-16">
            
            <div className="p-8 glass rounded-2xl flex flex-col items-center">
              <div className="p-4 bg-white/10 text-pink-300 rounded-full mb-6 border border-white/10 font-bold">
                <GraduationCap className="h-8 w-8" />
              </div>
              <h3 className="font-sans text-xl font-bold text-white mb-3">BEM & SEMA Kampus</h3>
              <p className="text-sm text-white/70 leading-relaxed font-sans">
                Kelola pendaftaran massal Seminar Nasional, Talkshow Karir, Kampus Expo, hingga Sidang Umum Mahasiswa dengan kapasitas ratusan hingga ribuan peserta.
              </p>
            </div>

            <div className="p-8 glass rounded-2xl flex flex-col items-center">
              <div className="p-4 bg-white/10 text-pink-300 rounded-full mb-6 border border-white/10 font-bold">
                <Users2 className="h-8 w-8" />
              </div>
              <h3 className="font-sans text-xl font-bold text-white mb-3">Himpunan Mahasiswa (HMJ)</h3>
              <p className="text-sm text-white/70 leading-relaxed font-sans">
                Platform andalan untuk Workshop Pemrograman, Latihan Kepemimpinan Tingkat Jurusan (LDKJ), Lomba Esai, and Welcoming Party mahasiswa baru jurusan.
              </p>
            </div>

            <div className="p-8 glass rounded-2xl flex flex-col items-center">
              <div className="p-4 bg-white/10 text-pink-300 rounded-full mb-6 border border-white/10 font-bold">
                <Building2 className="h-8 w-8" />
              </div>
              <h3 className="font-sans text-xl font-bold text-white mb-3">UKM & Komunitas Seni/Olahraga</h3>
              <p className="text-sm text-white/70 leading-relaxed font-sans">
                Sempurna untuk menggelar Turnamen E-sports Kampus, Festival Teater, Latihan Rutin Bersama, Donor Darah, hingga kompetisi karya kreatif mahasiswa.
              </p>
            </div>

          </div>

          {/* New Interactive Display Card with generated image student_activities */}
          <div className="relative glass border border-white/15 rounded-3xl p-6 md:p-8 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-gradient-to-r from-purple-950/20 via-pink-950/10 to-transparent">
            <div className="absolute top-0 right-0 w-[30%] h-[100%] bg-pink-500/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="lg:col-span-6 space-y-4 text-left">
              <div className="inline-flex items-center space-x-1 px-2.5 py-1 bg-pink-500/25 text-pink-300 rounded-lg text-xs font-bold font-sans">
                <span>EFISIENSI ABSENSI QR KELAS & WORKSHOP KAMPUS</span>
              </div>
              <h3 className="font-sans text-2xl md:text-3xl font-extrabold text-white leading-tight">
                Absensi Seminar Universitas Tanpa Antre Berjam-jam!
              </h3>
              <p className="text-sm text-white/85 leading-relaxed font-sans">
                Kami memahami kerepotan panitia mahasiswa mengurus lembar tanda tangan manual ditiup angin di depan auditorium kampus. Dengan teknologi e-tiket QR Code dari <strong className="text-pink-300 font-bold">EventPlannerKu</strong>, panitia cukup melakukan scan cepat dari kamera smartphone seketika saat registrasi ulang dimulai.
              </p>
              <div className="flex flex-wrap gap-4 text-xs font-semibold text-pink-200">
                <span className="flex items-center space-x-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10"><CheckCircle2 className="h-4 w-4 text-pink-400" /> <span>Panitia Bebas Stres</span></span>
                <span className="flex items-center space-x-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10"><CheckCircle2 className="h-4 w-4 text-pink-400" /> <span>Peserta Antre Cepat</span></span>
                <span className="flex items-center space-x-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10"><CheckCircle2 className="h-4 w-4 text-pink-400" /> <span>Analisis Kehadiran Instan</span></span>
              </div>
            </div>
            <div className="lg:col-span-6">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/15 h-[280px]">
                <img 
                  src="/src/assets/images/student_activities_1779421324747.png" 
                  alt="Student Activities Checkin" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SWOT Section */}
      <section id="swot" className="py-20 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
            <h2 className="font-sans text-xs font-bold uppercase tracking-wider text-pink-400">Analisis SWOT Bisnis</h2>
            <p className="font-sans text-3xl sm:text-4xl font-extrabold text-white">Analisis Strategis SmartEvent Planner</p>
            <p className="font-sans text-white/70 font-sans">Evaluasi menyeluruh terhadap posisi keunggulan kompetitif, peluang, pembatasan, dan ancaman platform SaaS kami.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Strength */}
            <div className="glass p-8 rounded-3xl space-y-4">
              <div className="flex items-center space-x-3 text-emerald-300">
                <Award className="h-6 w-6" />
                <h3 className="font-sans text-lg font-bold text-white">Strength (Kekuatan)</h3>
              </div>
              <ul className="space-y-3.5 pl-2">
                <li className="flex items-start space-x-2.5 text-sm text-white/80">
                  <span className="text-emerald-400 font-bold">&#10003;</span>
                  <span>Sistem handal berbasis cloud yang dapat diakses dari mana saja tanpa instalasi.</span>
                </li>
                <li className="flex items-start space-x-2.5 text-sm text-white/80">
                  <span className="text-emerald-400 font-bold">&#10003;</span>
                  <span>Tampilan visual antarmuka platform yang ringkas, simpel, modern, dan sangat mudah dipahami.</span>
                </li>
                <li className="flex items-start space-x-2.5 text-sm text-white/80">
                  <span className="text-emerald-400 font-bold">&#10003;</span>
                  <span>Proses kedatangan dan absensi berbasis scan memangkas antrean seminar menjadi sangat cepat dan tertib.</span>
                </li>
              </ul>
            </div>

            {/* Weakness */}
            <div className="glass p-8 rounded-3xl space-y-4">
              <div className="flex items-center space-x-3 text-amber-300">
                <ShieldAlert className="h-6 w-6" />
                <h3 className="font-sans text-lg font-bold text-white">Weakness (Kelemahan)</h3>
              </div>
              <ul className="space-y-[15px] pl-2">
                <li className="flex items-start space-x-2.5 text-sm text-white/80">
                  <span className="text-amber-400 font-bold">!</span>
                  <span>Ketergantungan penuh pada kestabilan koneksi internet di lokasi pelaksanaan fisik.</span>
                </li>
                <li className="flex items-start space-x-2.5 text-sm text-white/80">
                  <span className="text-amber-400 font-bold">!</span>
                  <span>Fokus fitur saat ini dioptimalisasikan untuk seminar dan workshop saja, belum mendukung konser atau turnamen skala besar.</span>
                </li>
              </ul>
            </div>

            {/* Opportunity */}
            <div className="glass p-8 rounded-3xl space-y-4">
              <div className="flex items-center space-x-3 text-pink-300">
                <TrendingUp className="h-6 w-6" />
                <h3 className="font-sans text-lg font-bold text-white">Opportunity (Peluang)</h3>
              </div>
              <ul className="space-y-3.5 pl-2">
                <li className="flex items-start space-x-2.5 text-sm text-white/80">
                  <span className="text-pink-300 font-bold">+</span>
                  <span>Pertumbuhan kuantitas kegiatan seminar edukatif, workshop vokasional, dan peluncuran produk baru secara konsisten.</span>
                </li>
                <li className="flex items-start space-x-2.5 text-sm text-white/80">
                  <span className="text-pink-300 font-bold">+</span>
                  <span>Masyarakat modern menggemari kenyamanan sistem digital serba instan dalam format tiket mandiri.</span>
                </li>
                <li className="flex items-start space-x-2.5 text-sm text-white/80">
                  <span className="text-pink-300 font-bold">+</span>
                  <span>Tingginya keinginan para panitia event konvensional untuk mengadopsi efisiensi administrasi digital.</span>
                </li>
              </ul>
            </div>

            {/* Threat */}
            <div className="glass p-8 rounded-3xl space-y-4">
              <div className="flex items-center space-x-3 text-red-300">
                <XCircle className="h-6 w-6 animate-pulse" />
                <h3 className="font-sans text-lg font-bold text-white">Threat (Ancaman)</h3>
              </div>
              <ul className="space-y-[15px] pl-2">
                <li className="flex items-start space-x-2.5 text-sm text-white/80">
                  <span className="text-red-300 font-bold">&#10007;</span>
                  <span>Kompetisi dari aplikasi penanganan tiket global yang sudah lama menguasai pasar korporasi besar.</span>
                </li>
                <li className="flex items-start space-x-2.5 text-sm text-white/80">
                  <span className="text-red-300 font-bold">&#10007;</span>
                  <span>Perubahan cepat ekosistem framework web dan metode autentikasi perangkat seluler.</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* Pricing / Berlangganan Section */}
      <section id="harga" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="font-sans text-xs font-bold uppercase tracking-wider text-pink-400">Paket Layanan SaaS</h2>
            <p className="font-sans text-3xl sm:text-4xl font-extrabold text-white">Mulai Dengan Murah, Skalakan Dengan Cepat</p>
            <p className="font-sans text-white/70">Pilih rentang paket harga sesuai frekuensi pelaksanaan event komunitas atau bisnis Anda.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            
            {/* Plan 1 */}
            <div className="glass bg-white/5 border-white/10 rounded-3xl p-8 flex flex-col justify-between hover:shadow-lg transition">
              <div>
                <span className="font-sans text-xs font-bold tracking-wider uppercase text-white/60 block mb-2">Pecinta Komunitas</span>
                <h3 className="font-sans text-2xl font-extrabold text-white">Free Plan</h3>
                <div className="mt-4 flex items-baseline text-white">
                  <span className="text-4xl font-blackTracking tracking-tight">Rp0</span>
                  <span className="ml-1 text-sm font-medium text-white/50">/ selamanya</span>
                </div>
                <p className="mt-4 text-xs text-white/60">Untuk uji coba mandiri dan event komunitas lingkup kecil.</p>
                
                <ul className="mt-6 space-y-4 text-sm text-white/70 border-t border-white/10 pt-6">
                  <li className="flex items-center space-x-3 text-xs font-medium">
                    <CheckCircle2 className="h-4.5 w-4.5 text-pink-400 shrink-0" />
                    <span>Maksimal 1 event per bulan</span>
                  </li>
                  <li className="flex items-center space-x-3 text-xs font-medium">
                    <CheckCircle2 className="h-4.5 w-4.5 text-pink-400 shrink-0" />
                    <span>Formulir pendaftaran digital dasar</span>
                  </li>
                  <li className="flex items-center space-x-3 text-xs font-medium">
                    <CheckCircle2 className="h-4.5 w-4.5 text-pink-400 shrink-0" />
                    <span>Daftar manajemen data peserta biasa</span>
                  </li>
                  <li className="flex items-center space-x-3 text-xs text-white/30 line-through">
                    <span>Sistem e-tiket digital & QR Code</span>
                  </li>
                  <li className="flex items-center space-x-3 text-xs text-white/30 line-through">
                    <span>Dashboard analitik realtime & prioritas</span>
                  </li>
                </ul>
              </div>
              <button
                id="btn-plan-free"
                onClick={() => onNavigateToAuth('signup', 'free')}
                className="mt-8 w-full py-3 bg-white/15 hover:bg-white/25 text-white font-sans text-sm font-bold rounded-xl transition cursor-pointer"
              >
                Gunakan Gratis
              </button>
            </div>

            {/* Plan 2 */}
            <div className="glass bg-white/10 border-pink-500/40 rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative">
              <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 px-4 py-1.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[10px] font-bold uppercase rounded-full tracking-widest shadow-lg border border-white/10">
                Terpopuler
              </div>
              <div>
                <span className="font-sans text-xs font-bold tracking-wider uppercase text-pink-300 block mb-2">Paling Sesuai</span>
                <h3 className="font-sans text-2xl font-extrabold text-white">Basic Plan</h3>
                <div className="mt-4 flex items-baseline text-white">
                  <span className="text-4xl font-blackTracking tracking-tight">Rp49.000</span>
                  <span className="ml-1 text-sm font-medium text-white/50">/ bulan</span>
                </div>
                <p className="mt-4 text-xs text-white/70">Sangat pas untuk panitia seminar rutin, pelatihan, dan akademisi.</p>
                
                <ul className="mt-6 space-y-4 text-sm text-white/70 border-t border-white/10 pt-6">
                  <li className="flex items-center space-x-3 text-xs font-medium">
                    <CheckCircle2 className="h-4.5 w-4.5 text-pink-400 shrink-0" />
                    <span className="font-bold text-white">Event tanpa batas / unlimited</span>
                  </li>
                  <li className="flex items-center space-x-3 text-xs font-medium">
                    <CheckCircle2 className="h-4.5 w-4.5 text-pink-400 shrink-0" />
                    <span>Formulir registrasi handal</span>
                  </li>
                  <li className="flex items-center space-x-3 text-xs font-medium">
                    <CheckCircle2 className="h-4.5 w-4.5 text-pink-400 shrink-0" />
                    <span>Sistem e-tiket digital & QR Code</span>
                  </li>
                  <li className="flex items-center space-x-3 text-xs font-medium">
                    <CheckCircle2 className="h-4.5 w-4.5 text-pink-400 shrink-0" />
                    <span>Attendance Scanner cepat (Mobile & Web)</span>
                  </li>
                  <li className="flex items-center space-x-3 text-xs font-medium">
                    <CheckCircle2 className="h-4.5 w-4.5 text-pink-400 shrink-0" />
                    <span>Ekspor laporan Excel / CSV data peserta</span>
                  </li>
                </ul>
              </div>
              <button
                id="btn-plan-basic"
                onClick={() => onNavigateToAuth('signup', 'basic')}
                className="mt-8 w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-sans text-sm font-bold rounded-xl transition shadow-lg shadow-pink-500/20 cursor-pointer"
              >
                Pilih Basic Plan
              </button>
            </div>

            {/* Plan 3 */}
            <div className="glass bg-white/5 border-white/10 rounded-3xl p-8 flex flex-col justify-between hover:shadow-lg transition">
              <div>
                <span className="font-sans text-xs font-bold tracking-wider uppercase text-white/60 block mb-2">Skala Korporat</span>
                <h3 className="font-sans text-2xl font-extrabold text-white">Pro Plan</h3>
                <div className="mt-4 flex items-baseline text-white">
                  <span className="text-4xl font-blackTracking tracking-tight">Rp99.000</span>
                  <span className="ml-1 text-sm font-medium text-white/50">/ bulan</span>
                </div>
                <p className="mt-4 text-xs text-white/70">Untuk perusahaan dan lembaga pendidikan dengan analitik padat.</p>
                
                <ul className="mt-6 space-y-4 text-sm text-white/70 border-t border-white/10 pt-6">
                  <li className="flex items-center space-x-3 text-xs font-medium">
                    <CheckCircle2 className="h-4.5 w-4.5 text-pink-400 shrink-0" />
                    <span className="font-bold text-white">Seluruh fitur di paket Basic</span>
                  </li>
                  <li className="flex items-center space-x-3 text-xs font-medium">
                    <CheckCircle2 className="h-4.5 w-4.5 text-pink-400 shrink-0" />
                    <span className="font-bold text-white">Dashboard Analitik Realtime (Visual)</span>
                  </li>
                  <li className="flex items-center space-x-3 text-xs font-medium">
                    <CheckCircle2 className="h-4.5 w-4.5 text-pink-400 shrink-0" />
                    <span>Layanan bantuan prioritas (WhatsApp & Email)</span>
                  </li>
                  <li className="flex items-center space-x-3 text-xs font-medium">
                    <CheckCircle2 className="h-4.5 w-4.5 text-pink-400 shrink-0" />
                    <span>Kustomisasi branding e-tiket instansi</span>
                  </li>
                </ul>
              </div>
              <button
                id="btn-plan-pro"
                onClick={() => onNavigateToAuth('signup', 'pro')}
                className="mt-8 w-full py-3 bg-white/15 hover:bg-white/25 text-white font-sans text-sm font-bold rounded-xl transition cursor-pointer"
              >
                Pilih Pro Plan
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/40 text-white/60 py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center border-b border-white/10 pb-8 gap-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-xl text-white">
                <Calendar className="h-5 w-5" />
              </div>
              <span className="font-sans font-bold text-lg text-white">EventPlannerKu</span>
            </div>
            
            <p className="font-sans text-xs text-white/50 text-center md:text-right max-w-md">
              SmartEvent Planner merupakan solusi praktis berbasis cloud yang dirancang khusus untuk membantu penyelenggara mengelola registrasi, e-tiket QR Code, and absensi secara otomatis.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center pt-8 text-xs text-white/40 gap-4">
            <p>&copy; {new Date().getFullYear()} EventPlannerKu. Dibuat dengan cinta untuk efisiensi event Indonesia.</p>
            <div className="flex space-x-6">
              <span>Keamanan Data</span>
              <span>Ketentuan Layanan</span>
              <span>Kebijakan Privasi</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
