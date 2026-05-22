import React, { useState } from 'react';
import { 
  Award, Palette, Type, Check, Download, Printer, Save, RefreshCw, 
  Sparkles, ShieldCheck, ChevronRight, FileDown, Heart, Eye
} from 'lucide-react';

interface CertificateStyle {
  templateName: string;
  theme: 'formal' | 'tech' | 'gold' | 'creative';
  bgColor: string;
  borderColor: string;
  accentColor: string;
  textColor: string;
  fontFamily: 'serif' | 'sans' | 'mono';
  headerText: string;
  subtitleText: string;
  bodyText: string;
  organizerText: string;
  sig1Name: string;
  sig1Role: string;
  sig2Name: string;
  sig2Role: string;
  showBadge: boolean;
}

const RECOMMENDATIONS: Record<string, CertificateStyle> = {
  formal: {
    templateName: 'Formal Academic (Klasik)',
    theme: 'formal',
    bgColor: 'bg-stone-50',
    borderColor: 'border-blue-900',
    accentColor: 'text-blue-900',
    textColor: 'text-slate-800',
    fontFamily: 'serif',
    headerText: 'SERTIFIKAT PENGHARGAAN',
    subtitleText: 'DIBERIKAN KEPADA:',
    bodyText: 'Atas partisipasi aktif, dedikasi, serta kontribusi luar biasa sebagai PESERTA dalam menyukseskan rangkaian kegiatan dari awal hingga selesai.',
    organizerText: 'Biro Kemahasiswaan & Himpunan Mahasiswa Indonesia',
    sig1Name: 'Alif Prasetyo, S.Kom.',
    sig1Role: 'Ketua Panitia Pelaksana',
    sig2Name: 'Prof. Dr. Hermawan, M.T.',
    sig2Role: 'Dekan Bidang Kemahasiswaan',
    showBadge: true,
  },
  tech: {
    templateName: 'Sleek Tech Startup (Modern)',
    theme: 'tech',
    bgColor: 'bg-slate-900',
    borderColor: 'border-purple-600',
    accentColor: 'text-pink-500',
    textColor: 'text-slate-100',
    fontFamily: 'sans',
    headerText: 'CERTIFICATE OF ACHIEVEMENT',
    subtitleText: 'PROUDLY PRESENTED TO:',
    bodyText: 'For demonstrating outstanding performance, technical curiosity, and completing all required workshop sessions and interactive hackathons.',
    organizerText: 'Developer Student Club & Tech Incubator Hub',
    sig1Name: 'Jessica Wijaya',
    sig1Role: 'Lead Operations & Mentor',
    sig2Name: 'Andi Pratama, M.Cs.',
    sig2Role: 'Head of Lab Computer Science',
    showBadge: true,
  },
  gold: {
    templateName: 'Golden Achievement (Premium)',
    theme: 'gold',
    bgColor: 'bg-[#faf6eb]',
    borderColor: 'border-amber-600',
    accentColor: 'text-amber-700',
    textColor: 'text-amber-950',
    fontFamily: 'serif',
    headerText: 'CERTIFICATE of EXCELLENCE',
    subtitleText: 'THIS IS TO CERTIFY THAT:',
    bodyText: 'Has successfully fulfilled all specifications, academic criteria, and examinations to be declared passed with high honor and distinction.',
    organizerText: 'Global Leadership Institute & Executive Board',
    sig1Name: 'Rayhan Syahputra',
    sig1Role: 'National Board Chairman',
    sig2Name: 'Dra. Sri Wahyuni, M.Psi.',
    sig2Role: 'Director of Academic Affairs',
    showBadge: true,
  },
  creative: {
    templateName: 'Creative Playful (Muda/UKM)',
    theme: 'creative',
    bgColor: 'bg-rose-50/40',
    borderColor: 'border-emerald-500',
    accentColor: 'text-emerald-600',
    textColor: 'text-emerald-950',
    fontFamily: 'mono',
    headerText: 'SERTIFIKAT APRESIASI KREATIF',
    subtitleText: 'DENGAN BANGGA DIANUGERAHKAN KEPADA:',
    bodyText: 'Telah menuangkan ekspresi, ide-ide inovatif, serta karya terbaik terbaiknya selama mengikuti perlombaan dan pameran komunitas tahunan.',
    organizerText: 'UKM Kesenian & Studio Desain Komunikasi Visual',
    sig1Name: 'Chandra Kirana',
    sig1Role: 'Koordinator Juri & Publikasi',
    sig2Name: 'Bayu Samudra',
    sig2Role: 'Presiden Mahasiswa Universitas',
    showBadge: false,
  }
};

export default function CertificateDesigner() {
  const [style, setStyle] = useState<CertificateStyle>({ ...RECOMMENDATIONS.formal });
  const [selectedPreset, setSelectedPreset] = useState<string>('formal');
  const [demoRecipient, setDemoRecipient] = useState<string>('Irza Razascha Samantha');
  const [savedSettings, setSavedSettings] = useState<boolean>(false);

  const applyPreset = (key: string) => {
    setSelectedPreset(key);
    setStyle({ ...RECOMMENDATIONS[key] });
    setSavedSettings(false);
  };

  const handleUpdate = (field: keyof CertificateStyle, value: any) => {
    setStyle(prev => ({ ...prev, [field]: value }));
    setSavedSettings(false);
  };

  const handleSaveToStorage = () => {
    localStorage.setItem('ep_custom_certificate_design', JSON.stringify(style));
    setSavedSettings(true);
    setTimeout(() => setSavedSettings(false), 3000);
  };

  const triggerPrintPreview = () => {
    // Elegant system print of only the card
    window.print();
  };

  return (
    <div className="space-y-6" id="certificate-designer-section">
      {/* HEADER SECTION */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 relative overflow-hidden shadow">
        <div className="absolute right-0 top-0 w-80 h-80 bg-gradient-to-br from-amber-500/20 to-purple-500/10 blur-3xl rounded-full"></div>
        <div className="relative space-y-4 max-w-4xl">
          <div className="inline-flex items-center space-x-1 px-3 py-1 bg-gradient-to-tr from-amber-600/30 to-purple-500/30 border border-amber-500/30 text-amber-300 font-sans text-[10px] font-bold rounded-full uppercase tracking-wider">
            <Award className="h-3 w-3 text-amber-400" />
            <span>Digital Certificate Designer Lab</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black font-sans leading-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Desainer Sertifikat Mandiri & Generator Otomatis
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            Rancang template e-sertifikat resmi panitia Anda. Atur teks, warna, fon, penandatangan, serta pilih rekomendasi tata letak profesional yang siap dikirim secara otomatis ke dashboard mahasiswa pasca scan absensi.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* DESIGNS RECOMMENDATION & CONTROLS - LEFT */}
        <div className="xl:col-span-5 bg-white border border-slate-150 rounded-3xl p-5 shadow-sm space-y-6 h-fit">
          
          {/* Section A: Recommendation Templates */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <label className="text-[11px] font-extrabold text-slate-900 uppercase tracking-wider block">
                Rekomendasi Desain Sertifikat (Cepat)
              </label>
            </div>
            
            <div className="grid grid-cols-2 gap-2.5">
              {Object.keys(RECOMMENDATIONS).map((key) => {
                const isSelected = selectedPreset === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyPreset(key)}
                    className={`p-3 rounded-2xl border text-left transition select-none flex flex-col justify-between h-20 hover:border-purple-300 cursor-pointer ${
                      isSelected 
                        ? 'border-purple-600 bg-purple-50/20 ring-1 ring-purple-600' 
                        : 'border-slate-100 bg-slate-50/50'
                    }`}
                  >
                    <span className="text-[10px] font-black text-slate-800 line-clamp-1">
                      {RECOMMENDATIONS[key].templateName}
                    </span>
                    <span className="text-[9px] text-slate-400 uppercase font-mono tracking-widest block font-bold mt-1">
                      {RECOMMENDATIONS[key].fontFamily} &bull; {RECOMMENDATIONS[key].theme}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section B: Manual Editor Form */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Palette className="h-4 w-4 text-pink-500" />
              <label className="text-[11px] font-extrabold text-slate-900 uppercase tracking-wider block">
                Sesuaikan Teks & Tata Letak
              </label>
            </div>

            {/* Header Text Input */}
            <div className="space-y-1">
              <label htmlFor="cert-header" className="block text-[10px] font-bold text-slate-500 uppercase">Judul Sertifikat</label>
              <input
                id="cert-header"
                type="text"
                value={style.headerText}
                onChange={(e) => handleUpdate('headerText', e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 bg-slate-50 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Subtitle Text Input */}
            <div className="space-y-1">
              <label htmlFor="cert-subtitle" className="block text-[10px] font-bold text-slate-500 uppercase">Teks Subtitle Atas Nama</label>
              <input
                id="cert-subtitle"
                type="text"
                value={style.subtitleText}
                onChange={(e) => handleUpdate('subtitleText', e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 bg-slate-50 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Demo Recipient (Only for styling preview) */}
            <div className="space-y-1">
              <label htmlFor="cert-recipient-preview" className="block text-[10px] font-bold text-slate-500 uppercase">Simulasi Nama Penerima (Preview)</label>
              <input
                id="cert-recipient-preview"
                type="text"
                value={demoRecipient}
                onChange={(e) => setDemoRecipient(e.target.value)}
                className="w-full px-3 py-1.5 border border-purple-200 bg-purple-50/20 rounded-xl text-xs font-bold text-purple-950 focus:ring-1 focus:ring-purple-500"
                placeholder="Tulis nama demo..."
              />
            </div>

            {/* Paragraph Text Input */}
            <div className="space-y-1">
              <label htmlFor="cert-body" className="block text-[10px] font-bold text-slate-500 uppercase">Paragraf Konten Keikutsertaan</label>
              <textarea
                id="cert-body"
                rows={3}
                value={style.bodyText}
                onChange={(e) => handleUpdate('bodyText', e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 bg-slate-50 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-purple-500 resize-none leading-relaxed"
              />
            </div>

            {/* Association Sponsor / Organizer */}
            <div className="space-y-1">
              <label htmlFor="cert-organizer" className="block text-[10px] font-bold text-slate-500 uppercase">Penyelenggara / Lembaga Penerbit</label>
              <input
                id="cert-organizer"
                type="text"
                value={style.organizerText}
                onChange={(e) => handleUpdate('organizerText', e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 bg-slate-50 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Signature Grid */}
            <div className="grid grid-cols-2 gap-3 pb-1">
              <div className="space-y-3.5 border border-slate-100 p-3 rounded-2xl bg-amber-50/20">
                <span className="text-[9px] font-black text-slate-500 block uppercase border-b pb-1">Tanda Tangan 1 (Kiri)</span>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={style.sig1Name}
                    onChange={(e) => handleUpdate('sig1Name', e.target.value)}
                    placeholder="Nama Penandatangan"
                    className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-lg text-[11px] font-semibold"
                    title="Nama Pembicara/Ketua"
                  />
                  <input
                    type="text"
                    value={style.sig1Role}
                    onChange={(e) => handleUpdate('sig1Role', e.target.value)}
                    placeholder="Jabatan"
                    className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-lg text-[10px] text-slate-500"
                    title="Jabatan Penandatangan"
                  />
                </div>
              </div>

              <div className="space-y-3.5 border border-slate-100 p-3 rounded-2xl bg-amber-50/20">
                <span className="text-[9px] font-black text-slate-500 block uppercase border-b pb-1">Tanda Tangan 2 (Kanan)</span>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={style.sig2Name}
                    onChange={(e) => handleUpdate('sig2Name', e.target.value)}
                    placeholder="Nama Penandatangan"
                    className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-lg text-[11px] font-semibold"
                    title="Nama Pembimbing/Dekan"
                  />
                  <input
                    type="text"
                    value={style.sig2Role}
                    onChange={(e) => handleUpdate('sig2Role', e.target.value)}
                    placeholder="Jabatan"
                    className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-lg text-[10px] text-slate-500"
                    title="Jabatan Penandatangan"
                  />
                </div>
              </div>
            </div>

            {/* Styling Attributes customization */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Font Style Selection */}
              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-slate-500 uppercase">Gaya Huruf (Font)</span>
                <select
                  value={style.fontFamily}
                  onChange={(e) => handleUpdate('fontFamily', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  <option value="serif">Serif (Formal Elegan)</option>
                  <option value="sans">Sans-Serif (Modern Bersih)</option>
                  <option value="mono">Monospace (Creative Tech)</option>
                </select>
              </div>

              {/* Show Gold Embossed Badge */}
              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-slate-500 uppercase">Emblem Keaslian</span>
                <label className="flex items-center space-x-2 border border-slate-200 bg-slate-50 px-3 py-1.5 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={style.showBadge}
                    onChange={(e) => handleUpdate('showBadge', e.target.checked)}
                    className="rounded accent-purple-600 cursor-pointer text-xs"
                  />
                  <span className="text-xs font-semibold text-slate-700">Tampilkan Logo</span>
                </label>
              </div>
            </div>

            {/* Save settings action button */}
            <div className="flex gap-2.5 pt-2">
              <button
                id="btn-save-certificate-settings"
                type="button"
                onClick={handleSaveToStorage}
                className="flex-1 py-2.5 bg-gradient-to-tr from-purple-600 to-pink-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-purple-100 flex items-center justify-center space-x-1 hover:opacity-95 transform transition duration-100 active:scale-98 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Simpan Desain Template</span>
              </button>

              <button
                id="btn-print-certificate-layout"
                type="button"
                onClick={triggerPrintPreview}
                className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer"
                title="Cetak Sertifikat"
              >
                <Printer className="h-4 w-4" />
                <span>Print</span>
              </button>
            </div>

            {savedSettings && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-2.5 rounded-xl text-[10px] font-semibold flex items-center gap-1.5 justify-center animate-fade-in">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>Desain Sertifikat berhasil dipasang sebagai template default panitia!</span>
              </div>
            )}
          </div>
        </div>

        {/* INTERACTIVE CERTIFICATE PREVIEW PANEL - RIGHT */}
        <div className="xl:col-span-7 space-y-4">
          <div className="flex justify-between items-center bg-white border border-slate-100 px-5 py-3 rounded-2xl shadow-sm">
            <span className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-purple-600" />
              <span>Lembar Preview Sertifikat ({style.templateName})</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-md">
              A4 Landscape &bull; 297mm x 210mm Scale
            </span>
          </div>

          {/* Certificate Board Box */}
          <div className="print:p-0 print:border-0 print:shadow-none print:w-full">
            <div 
              id="printable-certificate-sheet"
              className={`w-full aspect-[1.414] border-8 rounded-3xl p-8 relative flex flex-col justify-between items-center overflow-hidden transition-all duration-300 shadow-md ${style.bgColor} ${style.borderColor} ${
                style.fontFamily === 'serif' ? 'font-serif' : style.fontFamily === 'mono' ? 'font-mono' : 'font-sans'
              }`}
            >
              
              {/* Decorative Corner Ornaments for gold / formal types */}
              {(style.theme === 'formal' || style.theme === 'gold') && (
                <>
                  <div className={`absolute top-0 left-0 w-20 h-20 border-t-4 border-l-4 ${style.theme === 'gold' ? 'border-amber-500/30' : 'border-blue-900/30'} m-4 pointer-events-none`}></div>
                  <div className={`absolute top-0 right-0 w-20 h-20 border-t-4 border-r-4 ${style.theme === 'gold' ? 'border-amber-500/30' : 'border-blue-900/30'} m-4 pointer-events-none`}></div>
                  <div className={`absolute bottom-0 left-0 w-20 h-20 border-b-4 border-l-4 ${style.theme === 'gold' ? 'border-amber-500/30' : 'border-blue-900/30'} m-4 pointer-events-none`}></div>
                  <div className={`absolute bottom-0 right-0 w-20 h-20 border-b-4 border-r-4 ${style.theme === 'gold' ? 'border-amber-500/30' : 'border-blue-900/30'} m-4 pointer-events-none`}></div>
                </>
              )}

              {/* Creative background abstract icons */}
              {style.theme === 'creative' && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border-4 border-dashed border-emerald-200/40 rounded-full flex items-center justify-center animate-spin duration-10000 pointer-events-none">
                  <div className="w-56 h-56 border-2 border-dashed border-emerald-300/30 rounded-full"></div>
                </div>
              )}

              {/* Top Row: Institution header */}
              <div className="text-center pt-2 z-10 space-y-1">
                <span className={`text-[10px] tracking-widest font-bold uppercase transition ${style.textColor} opacity-80`}>
                  {style.organizerText}
                </span>
                <div className={`h-0.5 w-16 mx-auto ${style.theme === 'tech' ? 'bg-purple-500' : style.theme === 'gold' ? 'bg-amber-600' : style.theme === 'creative' ? 'bg-emerald-500' : 'bg-blue-900'}`}></div>
              </div>

              {/* Middle Row: Title, award text & dynamic parsed recipient */}
              <div className="text-center space-y-4 z-10 my-auto flex-1 flex flex-col justify-center max-w-2xl px-4">
                <h1 className={`text-xl md:text-2xl font-black uppercase tracking-wider ${style.accentColor} leading-none scale-y-110 mb-2`}>
                  {style.headerText}
                </h1>
                
                <div className="space-y-3">
                  <p className={`text-[10px] font-sans tracking-widest uppercase font-bold text-slate-500`}>
                    {style.subtitleText}
                  </p>
                  
                  {/* Participant Name Highlight Box */}
                  <div className="py-2.5 border-b border-dashed border-slate-300/60 max-w-lg mx-auto">
                    <span className={`text-2xl md:text-3xl font-black tracking-tight leading-none block font-sans select-all ${
                      style.theme === 'tech' ? 'text-white' : 'text-slate-900'
                    }`}>
                      {demoRecipient || '[Masukkan Nama Penerima]'}
                    </span>
                  </div>
                </div>

                <p className={`text-[11px] leading-relaxed max-w-xl mx-auto font-sans font-medium ${
                  style.theme === 'tech' ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  {style.bodyText || '[Rancangan keterangan isi penghargaan]'}
                </p>
              </div>

              {/* Footer Row: Signatures & Authentic elements */}
              <div className="w-full grid grid-cols-12 gap-2 items-end pt-3 z-10 z-index-10">
                {/* Left side signature */}
                <div className="col-span-4 text-center">
                  <div className="h-10 flex items-center justify-center">
                    {/* Simulated signature writing line */}
                    <span className="font-serif italic text-base font-bold text-blue-500/80 tracking-widest">
                      {style.sig1Name.split(',')[0]}
                    </span>
                  </div>
                  <div className={`h-[1px] w-28 mx-auto bg-slate-300/60`}></div>
                  <strong className={`text-[10px] font-extrabold block mt-1 ${style.theme === 'tech' ? 'text-slate-200' : 'text-slate-800'}`}>
                    {style.sig1Name}
                  </strong>
                  <span className="text-[9px] text-slate-400 block font-sans">
                    {style.sig1Role}
                  </span>
                </div>

                {/* Center Badge / Stamp */}
                <div className="col-span-4 flex flex-col items-center justify-center">
                  {style.showBadge && (
                    <div className="relative flex items-center justify-center select-none scale-90 md:scale-100">
                      <div className={`w-14 h-14 bg-gradient-to-tr ${
                        style.theme === 'tech' ? 'from-purple-600 to-pink-500' : 'from-amber-600 to-yellow-500'
                      } rounded-full flex items-center justify-center shadow-lg border border-white/25 relative animate-pulse`}>
                        <Award className="h-6 w-6 text-white stroke-[2.5]" />
                      </div>
                      
                      {/* Decorative outer ribbon text or ribbons */}
                      <div className="absolute top-12 flex gap-1 justify-center">
                        <div className="w-2.5 h-6 bg-amber-500 rounded-b shadow rotate-12"></div>
                        <div className="w-2.5 h-6 bg-amber-600 rounded-b shadow -rotate-12"></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right side signature */}
                <div className="col-span-4 text-center">
                  <div className="h-10 flex items-center justify-center">
                    {/* Simulated signature writing line */}
                    <span className="font-mono italic text-sm font-bold text-purple-600/60 tracking-widest">
                      {style.sig2Name.split(',')[0]}
                    </span>
                  </div>
                  <div className={`h-[1px] w-28 mx-auto bg-slate-300/60`}></div>
                  <strong className={`text-[10px] font-extrabold block mt-1 ${style.theme === 'tech' ? 'text-slate-200' : 'text-slate-800'}`}>
                    {style.sig2Name}
                  </strong>
                  <span className="text-[9px] text-slate-400 block font-sans">
                    {style.sig2Role}
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
