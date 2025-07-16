export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'mechanic' | 'attendant';
  created_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  motorcycleModel: string;
  licensePlate: string;
  notes?: string;
  createdAt: Date;
}

export interface Part {
  id: string;
  name: string;
  internalCode: string;
  quantity: number;
  costPrice: number;
  sellPrice: number;
  supplier?: string;
  createdAt: Date;
}

export interface Quote {
  id: string;
  clientId: string;
  client?: Client;
  parts: QuotePart[];
  services: QuoteService[];
  total: number;
  notes?: string;
  createdAt: Date;
  expiresAt: Date;
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'paid' | 'rejected' | 'expired';
  scheduledDate?: string;
  scheduledTime?: string;
  scheduleNotes?: string;
}

export interface QuotePart {
  partId: string;
  part?: Part;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface QuoteService {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Appointment {
  id: string;
  clientId: string;
  client?: Client;
  quoteId?: string;
  quote?: {
    id: string;
    total: number;
    status: string;
  };
  service: string;
  date: Date;
  time: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Date;
}

export interface Sale {
  id: string;
  clientId?: string;
  client?: Client;
  customerName?: string;
  items: SaleItem[];
  total: number;
  createdAt: Date;
}

export interface SaleItem {
  partId: string;
  part?: Part;
  quantity: number;
  unitPrice: number;
  total: number;
}