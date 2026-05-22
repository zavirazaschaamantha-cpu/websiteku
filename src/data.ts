import { Event, Participant, User } from './types';

export const DEFAULT_USER: User = {
  id: 'user_demo',
  name: 'Budi Santoso',
  email: 'demo@eventku.id',
  organization: 'PT Sinergi Kreatif Nusantara',
  plan: 'basic', // Default plan is basic
  registeredAt: '2026-01-15T08:00:00Z'
};

export const INITIAL_EVENTS: Event[] = [
  {
    id: 'event_1',
    userId: 'user_demo',
    title: 'Seminar Nasional: Masa Depan Artificial Intelligence di Dunia Pendidikan',
    description: 'Seminar interaktif yang mengupas tuntas penerapan model AI dan Machine Learning untuk personalisasi pembelajaran di era digital. Dilengkapi dengan sesi tanya-jawab bersama para ahli industri nasional.',
    date: '2026-06-15',
    time: '09:00',
    location: 'Auditorium Gd. Rektorat Lt. 3, Universitas Indonesia, Jakarta',
    type: 'Seminar',
    capacity: 150,
    ticketPrice: 0,
    status: 'Active'
  },
  {
    id: 'event_2',
    userId: 'user_demo',
    title: 'Workshop Intensif: Membangun UI/UX Aplikasi Modern dengan Tailwind CSS & Figma',
    description: 'Workshop praktis langkah demi langkah untuk merancang antarmuka pengguna (UI) yang memikat di Figma serta menerjemahkannya ke dalam kode responsif menggunakan Tailwind CSS v4.',
    date: '2026-06-25',
    time: '13:00',
    location: 'Sinergi CO-Working Space, Jl. Gading Serpong, Tangerang',
    type: 'Workshop',
    capacity: 50,
    ticketPrice: 49000,
    status: 'Active'
  },
  {
    id: 'event_3',
    userId: 'user_demo',
    title: 'Pelatihan Leadership Komunitas: Menggerakkan Organisasi di Era Baru',
    description: 'Program akselerasi leadership khusus bagi ketua komunitas dan koordinator bidang untuk meningkatkan retensi anggota, menyusun program visioner, dan manajemen finansial mandiri.',
    date: '2026-07-02',
    time: '10:00',
    location: 'Virtual via Zoom Meeting (Cloud Hosted)',
    type: 'Pelatihan',
    capacity: 250,
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
