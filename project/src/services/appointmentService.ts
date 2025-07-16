import { Appointment } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8044';

class AppointmentService {
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    };
  }

  async getAll(): Promise<Appointment[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.map((appointment: any) => this.mapFromAPI(appointment));
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  }

  async getById(id: string): Promise<Appointment> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments/${id}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.mapFromAPI(data);
    } catch (error) {
      console.error('Error fetching appointment:', error);
      throw error;
    }
  }

  async create(appointment: Omit<Appointment, 'id' | 'createdAt'>): Promise<Appointment> {
    try {
      const appointmentData = this.mapToAPI(appointment);
      
      const response = await fetch(`${API_BASE_URL}/api/appointments`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(appointmentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.mapFromAPI(data);
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  async update(id: string, appointment: Partial<Appointment>): Promise<Appointment> {
    try {
      const appointmentData = this.mapToAPI(appointment);
      
      const response = await fetch(`${API_BASE_URL}/api/appointments/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(appointmentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.mapFromAPI(data);
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  }

  async createFromQuote(data: {
    quote_id: string;
    date: string;
    time: string;
    notes?: string;
  }): Promise<Appointment> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments/from-quote`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      return this.mapFromAPI(responseData);
    } catch (error) {
      console.error('Error creating appointment from quote:', error);
      throw error;
    }
  }

  // Map API response to frontend format
  mapFromAPI(apiAppointment: any): Appointment {
    return {
      id: apiAppointment.id.toString(),
      clientId: apiAppointment.clientId || apiAppointment.client_id,
      client: apiAppointment.client ? {
        id: apiAppointment.client.id.toString(),
        name: apiAppointment.client.name,
        phone: apiAppointment.client.phone,
        motorcycleModel: apiAppointment.client.motorcycleModel || apiAppointment.client.motorcycle_model,
        licensePlate: apiAppointment.client.licensePlate || apiAppointment.client.license_plate,
        notes: apiAppointment.client.notes,
        createdAt: new Date(apiAppointment.client.createdAt || apiAppointment.client.created_at)
      } : undefined,
      quoteId: apiAppointment.quoteId || apiAppointment.quote_id,
      quote: apiAppointment.quote ? {
        id: apiAppointment.quote.id.toString(),
        total: apiAppointment.quote.total,
        status: apiAppointment.quote.status,
      } : undefined,
      service: apiAppointment.service,
      date: new Date(apiAppointment.date),
      time: apiAppointment.time,
      status: apiAppointment.status,
      notes: apiAppointment.notes,
      createdAt: new Date(apiAppointment.createdAt || apiAppointment.created_at)
    };
  }

  // Map frontend format to API format
  mapToAPI(appointment: Partial<Appointment>): any {
    const apiData: any = {};

    if (appointment.clientId) apiData.client_id = appointment.clientId;
    if (appointment.quoteId) apiData.quote_id = appointment.quoteId;
    if (appointment.service) apiData.service = appointment.service;
    if (appointment.date) apiData.date = appointment.date instanceof Date ? 
      appointment.date.toISOString().split('T')[0] : appointment.date;
    if (appointment.time) apiData.time = appointment.time;
    if (appointment.status) apiData.status = appointment.status;
    if (appointment.notes !== undefined) apiData.notes = appointment.notes;

    return apiData;
  }
}

export const appointmentService = new AppointmentService();
