import { apiClient } from './api';
import { Quote, QuotePart, QuoteService } from '../types';

export const quoteService = {
  async getAll(): Promise<Quote[]> {
    const response = await apiClient.get<any[]>('/quotes');
    return this.mapArrayFromAPI(response);
  },

  async getById(id: string): Promise<Quote> {
    const response = await apiClient.get<any>(`/quotes/${id}`);
    return this.mapFromAPI(response);
  },

  async create(quote: Omit<Quote, 'id' | 'createdAt'>): Promise<Quote> {
    const payload = {
      client_id: quote.clientId,
      parts: quote.parts.map(part => ({
        partId: part.partId,
        quantity: part.quantity,
        unitPrice: part.unitPrice,
        total: part.total
      })),
      services: quote.services.map(service => ({
        description: service.description,
        quantity: service.quantity,
        unitPrice: service.unitPrice,
        total: service.total
      })),
      total: quote.total,
      notes: quote.notes,
      expires_at: quote.expiresAt.toISOString(),
      status: quote.status
    };
    const response = await apiClient.post<any>('/quotes', payload);
    return this.mapFromAPI(response);
  },

  async update(id: string, quote: Partial<Quote>): Promise<Quote> {
    const payload: any = {};
    if (quote.clientId) payload.client_id = quote.clientId;
    if (quote.parts) {
      payload.parts = quote.parts.map(part => ({
        partId: part.partId,
        quantity: part.quantity,
        unitPrice: part.unitPrice,
        total: part.total
      }));
    }
    if (quote.services) {
      payload.services = quote.services.map(service => ({
        description: service.description,
        quantity: service.quantity,
        unitPrice: service.unitPrice,
        total: service.total
      }));
    }
    if (quote.total !== undefined) payload.total = quote.total;
    if (quote.notes !== undefined) payload.notes = quote.notes;
    if (quote.expiresAt) payload.expires_at = quote.expiresAt.toISOString();
    if (quote.status) payload.status = quote.status;

    const response = await apiClient.put<any>(`/quotes/${id}`, payload);
    return this.mapFromAPI(response);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/quotes/${id}`);
  },

  // Map API response to frontend format
  mapFromAPI(apiQuote: any): Quote {
    return {
      id: apiQuote.id.toString(),
      clientId: apiQuote.clientId || apiQuote.client_id,
      client: apiQuote.client ? {
        id: apiQuote.client.id.toString(),
        name: apiQuote.client.name,
        phone: apiQuote.client.phone,
        motorcycleModel: apiQuote.client.motorcycleModel || apiQuote.client.motorcycle_model,
        licensePlate: apiQuote.client.licensePlate || apiQuote.client.license_plate,
        notes: apiQuote.client.notes,
        createdAt: new Date(apiQuote.client.createdAt || apiQuote.client.created_at)
      } : undefined,
      parts: apiQuote.parts ? apiQuote.parts.map((part: any): QuotePart => ({
        partId: part.partId,
        part: part.part,
        quantity: part.quantity,
        unitPrice: part.unitPrice || parseFloat(part.unit_price || part.unitPrice),
        total: part.total || parseFloat(part.total)
      })) : [],
      services: apiQuote.services ? apiQuote.services.map((service: any): QuoteService => ({
        description: service.description,
        quantity: service.quantity,
        unitPrice: service.unitPrice || parseFloat(service.unit_price || service.unitPrice),
        total: service.total || parseFloat(service.total)
      })) : [],
      total: apiQuote.total || parseFloat(apiQuote.total),
      notes: apiQuote.notes,
      expiresAt: new Date(apiQuote.expiresAt || apiQuote.expires_at),
      status: apiQuote.status,
      createdAt: new Date(apiQuote.createdAt || apiQuote.created_at)
    };
  },

  // Map array from API
  mapArrayFromAPI(apiQuotes: any[]): Quote[] {
    return apiQuotes.map(quote => this.mapFromAPI(quote));
  }
};
