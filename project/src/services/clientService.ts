import { apiClient } from './api';
import { Client } from '../types';

export const clientService = {
  async getAll(): Promise<Client[]> {
    const response = await apiClient.get<any[]>('/clients');
    return this.mapArrayFromAPI(response);
  },

  async getById(id: string): Promise<Client> {
    return await apiClient.get<Client>(`/clients/${id}`);
  },

  async create(client: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
    const payload = {
      name: client.name,
      phone: client.phone,
      motorcycle_model: client.motorcycleModel,
      license_plate: client.licensePlate,
      notes: client.notes
    };
    const response = await apiClient.post<Client>('/clients', payload);
    return this.mapFromAPI(response);
  },

  async update(id: string, client: Partial<Client>): Promise<Client> {
    const payload: any = {};
    if (client.name) payload.name = client.name;
    if (client.phone) payload.phone = client.phone;
    if (client.motorcycleModel) payload.motorcycle_model = client.motorcycleModel;
    if (client.licensePlate) payload.license_plate = client.licensePlate;
    if (client.notes !== undefined) payload.notes = client.notes;

    const response = await apiClient.put<Client>(`/clients/${id}`, payload);
    return this.mapFromAPI(response);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/clients/${id}`);
  },

  // Map API response to frontend format
  mapFromAPI(apiClient: any): Client {
    return {
      id: apiClient.id.toString(),
      name: apiClient.name,
      phone: apiClient.phone,
      motorcycleModel: apiClient.motorcycle_model,
      licensePlate: apiClient.license_plate,
      notes: apiClient.notes,
      createdAt: new Date(apiClient.created_at)
    };
  },

  // Map array from API
  mapArrayFromAPI(apiClients: any[]): Client[] {
    return apiClients.map(client => this.mapFromAPI(client));
  }
};
