export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'mechanic' | 'attendant';
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

export interface Service {
  id: string;
  clientId: string;
  client?: Client;
  description: string;
  parts: ServicePart[];
  laborCost: number;
  status: 'open' | 'in_progress' | 'finished';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServicePart {
  partId: string;
  part?: Part;
  quantity: number;
  unitPrice: number;
}

export interface Quote {
  id: string;
  clientId: string;
  client?: Client;
  items: QuoteItem[];
  laborCost: number;
  total: number;
  notes?: string;
  createdAt: Date;
  expiresAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
}

export interface QuoteItem {
  type: 'part' | 'service';
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Appointment {
  id: string;
  clientId: string;
  client?: Client;
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