import { apiClient } from './api';
import { Part } from '../types';

export const partService = {
  async getAll(): Promise<Part[]> {
    const response = await apiClient.get<any[]>('/parts');
    return this.mapArrayFromAPI(response);
  },

  async getById(id: string): Promise<Part> {
    const response = await apiClient.get<any>(`/parts/${id}`);
    return this.mapFromAPI(response);
  },

  async create(part: Omit<Part, 'id' | 'createdAt'>): Promise<Part> {
    const payload = {
      name: part.name,
      internal_code: part.internalCode,
      quantity: part.quantity,
      cost_price: part.costPrice,
      sell_price: part.sellPrice,
      supplier: part.supplier
    };
    const response = await apiClient.post<any>('/parts', payload);
    return this.mapFromAPI(response);
  },

  async update(id: string, part: Partial<Part>): Promise<Part> {
    const payload: any = {};
    if (part.name) payload.name = part.name;
    if (part.internalCode) payload.internal_code = part.internalCode;
    if (part.quantity !== undefined) payload.quantity = part.quantity;
    if (part.costPrice !== undefined) payload.cost_price = part.costPrice;
    if (part.sellPrice !== undefined) payload.sell_price = part.sellPrice;
    if (part.supplier !== undefined) payload.supplier = part.supplier;

    const response = await apiClient.put<any>(`/parts/${id}`, payload);
    return this.mapFromAPI(response);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/parts/${id}`);
  },

  // Map API response to frontend format
  mapFromAPI(apiPart: any): Part {
    return {
      id: apiPart.id.toString(),
      name: apiPart.name,
      internalCode: apiPart.internal_code,
      quantity: apiPart.quantity,
      costPrice: parseFloat(apiPart.cost_price),
      sellPrice: parseFloat(apiPart.sell_price),
      supplier: apiPart.supplier,
      createdAt: new Date(apiPart.created_at)
    };
  },

  // Map array from API
  mapArrayFromAPI(apiParts: any[]): Part[] {
    return apiParts.map(part => this.mapFromAPI(part));
  }
};
