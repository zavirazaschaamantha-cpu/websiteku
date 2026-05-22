import { Event, Participant, User } from './types';

export const DEFAULT_USER: User = {
  id: 'user_demo',
  name: 'Budi Santoso (Ketua BEM)',
  email: 'demo@eventku.id',
  organization: 'Badan Eksekutif Mahasiswa (BEM) Universitas',
  plan: 'pro', // Default plan is pro for demo ease
  registeredAt: '2026-01-15T08:00:00Z',
  role: 'panitia'
};

export const INITIAL_EVENTS: Event[] = [
  {
    id: 'event_1',
    userId: 'user_demo',
    title: 'Seminar Beasiswa Global & Pola Sukses Karir Mahasiswa di Era 4.0',
    description: 'Bongkar tuntas tips & trik jitu menembus beasiswa penuh luar negeri (LPDP, Fulbright, Chevening) serta strategi menyusun Curriculum Vitae (CV) ATS-friendly bagi fresh graduate mahasiswa.',
    date: '2026-06-15',
    time: '09:00',
    location: 'Gedung Balai Sidang Lt. 1, Kampus Depok, Universitas Indonesia',
    type: 'Seminar',
    capacity: 350,
    ticketPrice: 0,
    status: 'Active'
  },
  {
    id: 'event_2',
    userId: 'user_demo',
    title: 'Workshop Intensif Figma & Front-End UI/UX Khusus Mahasiswa Pemula',
    description: 'Pelatihan langsung langkah demi langkah dari nol menggunakan perangkat Figma kolaboratif hingga implementasi web responsif. Disponsori oleh Himpunan Mahasiswa Informatika (HMIF).',
    date: '2026-06-25',
    time: '13:00',
    location: 'Lab Komputer Terpadu Gedung C, Universitas Indonesia',
    type: 'Workshop',
    capacity: 60,
    ticketPrice: 15000,
    status: 'Active'
  },
  {
    id: 'event_3',
    userId: 'user_demo',
    title: 'Lomba Debat Bahasa Inggris Antar-Fakultas (University Debate League 2026)',
    description: 'Kompetisi adu gagasan kritis berlisensi internasional dengan sistem British Parliamentary. Memperebutkan Piala Bergilir Rektor & hadiah pembinaan prestasi mahasiswa.',
    date: '2026-07-02',
    time: '10:00',
    location: 'Gedung Pusat Kegiatan Mahasiswa (Pusgiwa) Lt. 2, Universitas Indonesia',
    type: 'Lomba',
    capacity: 100,
    ticketPrice: 0,
    status: 'Active'
  }
];

export const INITIAL_PARTICIPANTS: Participant[] = [
  // For Event 1: Seminar AI
  {
    id: 'part_1_1',
    eventId: 'event_1',
    name: 'Andi Wijaya',
    email: 'andi.wijaya@gmail.com',
    phone: '081234567890',
    ticketCode: 'EV1-AND89',
    status: 'Attended',
    registeredAt: '2026-05-18T09:15:00Z',
    attendedAt: '2026-06-15T08:45:00Z'
  },
  {
    id: 'part_1_2',
    eventId: 'event_1',
    name: 'Citra Kirana',
    email: 'citra.k@yahoo.com',
    phone: '082198765432',
    ticketCode: 'EV1-CIT43',
    status: 'Attended',
    registeredAt: '2026-05-18T10:30:00Z',
    attendedAt: '2026-06-15T08:52:00Z'
  },
  {
    id: 'part_1_3',
    eventId: 'event_1',
    name: 'Eko Prasetyo',
    email: 'eko.pras@outlook.com',
    phone: '085712345678',
    ticketCode: 'EV1-EKO12',
    status: 'Registered',
    registeredAt: '2026-05-19T14:20:00Z'
  },
  {
    id: 'part_1_4',
    eventId: 'event_1',
    name: 'Fany Fitriani',
    email: 'fany.fitri@gmail.com',
    phone: '081398761234',
    ticketCode: 'EV1-FAN98',
    status: 'Attended',
    registeredAt: '2026-05-20T08:05:00Z',
    attendedAt: '2026-06-15T09:01:00Z'
  },
  {
    id: 'part_1_5',
    eventId: 'event_1',
    name: 'Gilang Ramadhan',
    email: 'gilang.r@gmail.com',
    phone: '081976543210',
    ticketCode: 'EV1-GIL76',
    status: 'Registered',
    registeredAt: '2026-05-20T11:45:00Z'
  },
  {
    id: 'part_1_6',
    eventId: 'event_1',
    name: 'Hana Lestari',
    email: 'hana.les@gmail.com',
    phone: '081122334455',
    ticketCode: 'EV1-HAN22',
    status: 'Registered',
    registeredAt: '2026-05-21T13:10:00Z'
  },
  
  // For Event 2: Workshop UI/UX
  {
    id: 'part_2_1',
    eventId: 'event_2',
    name: 'Rian Kurniawan',
    email: 'rian.kur@gmail.com',
    phone: '087766554433',
    ticketCode: 'EV2-RIA66',
    status: 'Attended',
    registeredAt: '2026-05-19T09:00:00Z',
    attendedAt: '2026-06-25T12:40:00Z'
  },
  {
    id: 'part_2_2',
    eventId: 'event_2',
    name: 'Siti Aminah',
    email: 'siti.aminah@gmail.com',
    phone: '081299887766',
    ticketCode: 'EV2-SIT99',
    status: 'Registered',
    registeredAt: '2026-05-20T15:30:00Z'
  },
  {
    id: 'part_2_3',
    eventId: 'event_2',
    name: 'Vicky Prasetya',
    email: 'vicky.p@yahoo.com',
    phone: '085211223344',
    ticketCode: 'EV2-VIC11',
    status: 'Registered',
    registeredAt: '2026-05-21T07:20:00Z'
  }
];

// Helper to initialize data in localStorage
export function initializeLocalStorage() {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem('ep_users')) {
    localStorage.setItem('ep_users', JSON.stringify([DEFAULT_USER]));
  }
  
  if (!localStorage.getItem('ep_events')) {
    localStorage.setItem('ep_events', JSON.stringify(INITIAL_EVENTS));
  }
  
  if (!localStorage.getItem('ep_participants')) {
    localStorage.setItem('ep_participants', JSON.stringify(INITIAL_PARTICIPANTS));
  }
}
