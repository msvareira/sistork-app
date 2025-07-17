import React, { createContext, useContext, useState, useEffect } from 'react';
import { Client, Part, Quote, Appointment, Sale } from '../types';
import { clientService } from '../services/clientService';
import { partService } from '../services/partService';
import { quoteService } from '../services/quoteService';
import { appointmentService } from '../services/appointmentService';
import { useAuth } from './AuthContext';

interface DataContextType {
  clients: Client[];
  parts: Part[];
  quotes: Quote[];
  appointments: Appointment[];
  sales: Sale[];
  loading: boolean;
  loadingStates: {
    clients: boolean;
    parts: boolean;
    quotes: boolean;
    appointments: boolean;
    operations: boolean;
  };
  error: string | null;
  // Client methods
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Promise<void>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  // Part methods
  addPart: (part: Omit<Part, 'id' | 'createdAt'>) => Promise<void>;
  updatePart: (id: string, part: Partial<Part>) => Promise<void>;
  deletePart: (id: string) => Promise<void>;
  // Quote methods
  addQuote: (quote: Omit<Quote, 'id' | 'createdAt'>) => Promise<void>;
  updateQuote: (id: string, quote: Partial<Quote>) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  // Appointment methods
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt'>) => Promise<void>;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  createAppointmentFromQuote: (data: { quote_id: string; date: string; time: string; notes?: string }) => Promise<void>;
  // Sale methods (placeholder for now)
  addSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => void;
  // Refresh methods
  refreshClients: () => Promise<void>;
  refreshParts: () => Promise<void>;
  refreshQuotes: () => Promise<void>;
  refreshAppointments: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    clients: false,
    parts: false,
    quotes: false,
    appointments: false,
    operations: false,
  });
  const [error, setError] = useState<string | null>(null);
  
  const { isAuthenticated } = useAuth();

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    }
  }, [isAuthenticated]);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        refreshClients(),
        refreshParts(),
        refreshQuotes(),
        refreshAppointments()
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Client methods
  const refreshClients = async () => {
    setLoadingStates(prev => ({ ...prev, clients: true }));
    try {
      const clientsData = await clientService.getAll();
      setClients(clientsData);
    } catch (err) {
      console.error('Failed to load clients:', err);
      throw err;
    } finally {
      setLoadingStates(prev => ({ ...prev, clients: false }));
    }
  };

  const addClient = async (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    setLoadingStates(prev => ({ ...prev, operations: true }));
    try {
      const newClient = await clientService.create(clientData);
      setClients(prev => [newClient, ...prev]);
    } catch (err) {
      console.error('Failed to create client:', err);
      throw err;
    } finally {
      setLoadingStates(prev => ({ ...prev, operations: false }));
    }
  };

  const updateClient = async (id: string, clientData: Partial<Client>) => {
    setLoadingStates(prev => ({ ...prev, operations: true }));
    try {
      const updatedClient = await clientService.update(id, clientData);
      setClients(prev => prev.map(client => 
        client.id === id ? updatedClient : client
      ));
    } catch (err) {
      console.error('Failed to update client:', err);
      throw err;
    } finally {
      setLoadingStates(prev => ({ ...prev, operations: false }));
    }
  };

  const deleteClient = async (id: string) => {
    setLoadingStates(prev => ({ ...prev, operations: true }));
    try {
      await clientService.delete(id);
      setClients(prev => prev.filter(client => client.id !== id));
    } catch (err) {
      console.error('Failed to delete client:', err);
      throw err;
    } finally {
      setLoadingStates(prev => ({ ...prev, operations: false }));
    }
  };

  // Part methods
  const refreshParts = async () => {
    setLoadingStates(prev => ({ ...prev, parts: true }));
    try {
      const partsData = await partService.getAll();
      setParts(partsData);
    } catch (err) {
      console.error('Failed to load parts:', err);
      throw err;
    } finally {
      setLoadingStates(prev => ({ ...prev, parts: false }));
    }
  };

  const addPart = async (partData: Omit<Part, 'id' | 'createdAt'>) => {
    setLoadingStates(prev => ({ ...prev, operations: true }));
    try {
      const newPart = await partService.create(partData);
      setParts(prev => [newPart, ...prev]);
    } catch (err) {
      console.error('Failed to create part:', err);
      throw err;
    } finally {
      setLoadingStates(prev => ({ ...prev, operations: false }));
    }
  };

  const updatePart = async (id: string, partData: Partial<Part>) => {
    setLoadingStates(prev => ({ ...prev, operations: true }));
    try {
      const updatedPart = await partService.update(id, partData);
      setParts(prev => prev.map(part => 
        part.id === id ? updatedPart : part
      ));
    } catch (err) {
      console.error('Failed to update part:', err);
      throw err;
    } finally {
      setLoadingStates(prev => ({ ...prev, operations: false }));
    }
  };

  const deletePart = async (id: string) => {
    setLoadingStates(prev => ({ ...prev, operations: true }));
    try {
      await partService.delete(id);
      setParts(prev => prev.filter(part => part.id !== id));
    } catch (err) {
      console.error('Failed to delete part:', err);
      throw err;
    } finally {
      setLoadingStates(prev => ({ ...prev, operations: false }));
    }
  };
  // Quote methods
  const refreshQuotes = async () => {
    setLoadingStates(prev => ({ ...prev, quotes: true }));
    try {
      const quotesData = await quoteService.getAll();
      setQuotes(quotesData);
    } catch (err) {
      console.error('Failed to load quotes:', err);
      throw err;
    } finally {
      setLoadingStates(prev => ({ ...prev, quotes: false }));
    }
  };

  const addQuote = async (quoteData: Omit<Quote, 'id' | 'createdAt'>) => {
    setLoadingStates(prev => ({ ...prev, operations: true }));
    try {
      await quoteService.create(quoteData);
      // Recarregar a listagem completa para garantir sincronização
      await refreshQuotes();
    } catch (err) {
      console.error('Failed to create quote:', err);
      throw err;
    } finally {
      setLoadingStates(prev => ({ ...prev, operations: false }));
    }
  };

  const updateQuote = async (id: string, quoteData: Partial<Quote>) => {
    setLoadingStates(prev => ({ ...prev, operations: true }));
    try {
      await quoteService.update(id, quoteData);
      // Recarregar a listagem completa para garantir sincronização
      await refreshQuotes();
    } catch (err) {
      console.error('Failed to update quote:', err);
      throw err;
    } finally {
      setLoadingStates(prev => ({ ...prev, operations: false }));
    }
  };

  const deleteQuote = async (id: string) => {
    setLoadingStates(prev => ({ ...prev, operations: true }));
    try {
      await quoteService.delete(id);
      // Recarregar a listagem completa para garantir sincronização
      await refreshQuotes();
    } catch (err) {
      console.error('Failed to delete quote:', err);
      throw err;
    } finally {
      setLoadingStates(prev => ({ ...prev, operations: false }));
    }
  };

  // Appointment methods
  const refreshAppointments = async () => {
    if (!isAuthenticated) return;
    
    setLoadingStates(prev => ({ ...prev, appointments: true }));
    try {
      const appointmentsData = await appointmentService.getAll();
      setAppointments(appointmentsData);
    } catch (err) {
      console.error('Error loading appointments:', err);
      setError('Failed to load appointments');
    } finally {
      setLoadingStates(prev => ({ ...prev, appointments: false }));
    }
  };

  const addAppointment = async (appointmentData: Omit<Appointment, 'id' | 'createdAt'>) => {
    setLoadingStates(prev => ({ ...prev, operations: true }));
    try {
      const newAppointment = await appointmentService.create(appointmentData);
      setAppointments(prev => [...prev, newAppointment]);
    } catch (err) {
      console.error('Error creating appointment:', err);
      setError('Failed to create appointment');
      throw err;
    } finally {
      setLoadingStates(prev => ({ ...prev, operations: false }));
    }
  };

  const updateAppointment = async (id: string, appointmentData: Partial<Appointment>) => {
    setLoadingStates(prev => ({ ...prev, operations: true }));
    try {
      const updatedAppointment = await appointmentService.update(id, appointmentData);
      setAppointments(prev => prev.map(appointment => 
        appointment.id === id ? updatedAppointment : appointment
      ));
    } catch (err) {
      console.error('Error updating appointment:', err);
      setError('Failed to update appointment');
      throw err;
    } finally {
      setLoadingStates(prev => ({ ...prev, operations: false }));
    }
  };

  const deleteAppointment = async (id: string) => {
    setLoadingStates(prev => ({ ...prev, operations: true }));
    try {
      await appointmentService.delete(id);
      setAppointments(prev => prev.filter(appointment => appointment.id !== id));
    } catch (err) {
      console.error('Error deleting appointment:', err);
      setError('Failed to delete appointment');
      throw err;
    } finally {
      setLoadingStates(prev => ({ ...prev, operations: false }));
    }
  };

  const createAppointmentFromQuote = async (data: { quote_id: string; date: string; time: string; notes?: string }) => {
    setLoadingStates(prev => ({ ...prev, operations: true }));
    try {
      const newAppointment = await appointmentService.createFromQuote(data);
      setAppointments(prev => [...prev, newAppointment]);
      // Refresh quotes to get updated schedule info
      await refreshQuotes();
    } catch (err) {
      console.error('Error creating appointment from quote:', err);
      setError('Failed to create appointment from quote');
      throw err;
    } finally {
      setLoadingStates(prev => ({ ...prev, operations: false }));
    }
  };

  const addSale = (saleData: Omit<Sale, 'id' | 'createdAt'>) => {
    const newSale: Sale = {
      ...saleData,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    setSales(prev => [...prev, newSale]);
  };

  return (
    <DataContext.Provider value={{
      clients,
      parts,
      quotes,
      appointments,
      sales,
      loading,
      loadingStates,
      error,
      // Client methods
      addClient,
      updateClient,
      deleteClient,
      // Part methods
      addPart,
      updatePart,
      deletePart,
      // Quote methods
      addQuote,
      updateQuote,
      deleteQuote,
      // Appointment methods
      addAppointment,
      updateAppointment,
      deleteAppointment,
      createAppointmentFromQuote,
      // Sale methods
      addSale,
      // Refresh methods
      refreshClients,
      refreshParts,
      refreshQuotes,
      refreshAppointments,
    }}>
      {children}
    </DataContext.Provider>
  );
}
