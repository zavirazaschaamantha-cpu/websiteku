export type SaaSPlan = 'free' | 'basic' | 'pro';

export interface User {
  id: string;
  name: string;
  email: string;
  organization: string;
  plan: SaaSPlan;
  registeredAt: string;
}

export interface Event {
  id: string;
  userId: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: 'Seminar' | 'Workshop' | 'Pelatihan' | 'Komunitas' | 'Sosialisasi';
  capacity: number;
  ticketPrice: number;
  status: 'Active' | 'Draft' | 'Ended';
}

export interface Participant {
  id: string;
  eventId: string;
  name: string;
  email: string;
  phone: string;
  ticketCode: string;
  status: 'Registered' | 'Attended';
  registeredAt: string;
  attendedAt?: string;
}
