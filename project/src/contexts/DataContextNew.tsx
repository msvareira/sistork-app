import React, { createContext, useContext, useState, useEffect } from 'react';
import { Client, Part, Quote, Appointment, Sale } from '../types';
import { clientService } from '../services/clientService';
import { partService } from '../services/partService';
import { quoteService } from '../services/quoteService';
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
  // Appointment methods (placeholder for now)
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt'>) => void;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  // Sale methods (placeholder for now)
  addSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => void;
  // Refresh methods
  refreshClients: () => Promise<void>;
  refreshParts: () => Promise<void>;
  refreshQuotes: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();

  // State
  const [clients, setClients] = useState<Client[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState({
    clients: false,
    parts: false,
    quotes: false,
    operations: false
  });
  const [error, setError] = useState<string | null>(null);

  // Initialize data
  useEffect(() => {
    if (!token) return;
    
    const initializeData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          refreshClients(),
          refreshParts(),
          refreshQuotes(),
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [token]);

  // Client methods
  const refreshClients = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, clients: true }));
      const clientsData = await clientService.getAll();
      setClients(clientsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clients');
    } finally {
      setLoadingStates(prev => ({ ...prev, clients: false }));
    }
  };

  const addClient = async (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    try {
      setLoadingStates(prev => ({ ...prev, operations: true }));
      const newClient = await clientService.create(clientData);
      setClients(prev => [newClient, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add client');
      throw err;
    } finally {
      setLoadingStates(prev => ({ ...prev, operations: false }));
    }
  };

  const updateClient = async (id: string, clientData: Partial<Client>) => {
    try {
      setLoadingStates(prev => ({ ...prev, operations: true }));
      const updatedClient = await clientService.update(id, clientData);
      setClients(prev => prev.map(client => 
        client.id === id ? updatedClient : client
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update client');
      throw err;
    } finally {
      setLoadingStates(prev => ({ ...prev, operations: false }));
    }
  };

  const deleteClient = async (id: string) => {
    try {
      setLoadingStates(prev => ({ ...prev, operations: true }));
      await clientService.delete(id);
      setClients(prev => prev.filter(client => client.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete client');
      throw err;
    } finally {
      setLoadingStates(prev => ({ ...prev, operations: false }));
    }
  };

  // Part methods
  const refreshParts = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, parts: true }));
      const partsData = await partService.getAll();
      setParts(partsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load parts');
    } finally {
      setLoadingStates(prev => ({ ...prev, parts: false }));
    }
  };

  const addPart = async (partData: Omit<Part, 'id' | 'createdAt'>) => {
    try {
      setLoadingStates(prev => ({ ...prev, operations: true }));
      const newPart = await partService.create(partData);
      setParts(prev => [newPart, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add part');
      throw err;
    } finally {
      setLoadingStates(prev => ({ ...prev, operations: false }));
    }
  };

  const updatePart = async (id: string, partData: Partial<Part>) => {
    try {
      setLoadingStates(prev => ({ ...prev, operations: true }));
      const updatedPart = await partService.update(id, partData);
      setParts(prev => prev.map(part => 
        part.id === id ? updatedPart : part
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update part');
      throw err;
    } finally {
      setLoadingStates(prev => ({ ...prev, operations: false }));
    }
  };

  const deletePart = async (id: string) => {
    try {
      setLoadingStates(prev => ({ ...prev, operations: true }));
      await partService.delete(id);
      setParts(prev => prev.filter(part => part.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete part');
      throw err;
    } finally {
      setLoadingStates(prev => ({ ...prev, operations: false }));
    }
  };

  // Quote methods
  const refreshQuotes = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, quotes: true }));
      const quotesData = await quoteService.getAll();
      setQuotes(quotesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quotes');
    } finally {
      setLoadingStates(prev => ({ ...prev, quotes: false }));
    }
  };

  const addQuote = async (quoteData: Omit<Quote, 'id' | 'createdAt'>) => {
    try {
      setLoadingStates(prev => ({ ...prev, operations: true }));
      const newQuote = await quoteService.create(quoteData);
      setQuotes(prev => [newQuote, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add quote');
      throw err;
    } finally {
      setLoadingStates(prev => ({ ...prev, operations: false }));
    }
  };

  const updateQuote = async (id: string, quoteData: Partial<Quote>) => {
    try {
      setLoadingStates(prev => ({ ...prev, operations: true }));
      const updatedQuote = await quoteService.update(id, quoteData);
      setQuotes(prev => prev.map(quote => 
        quote.id === id ? updatedQuote : quote
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update quote');
      throw err;
    } finally {
      setLoadingStates(prev => ({ ...prev, operations: false }));
    }
  };

  const deleteQuote = async (id: string) => {
    try {
      setLoadingStates(prev => ({ ...prev, operations: true }));
      await quoteService.delete(id);
      setQuotes(prev => prev.filter(quote => quote.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete quote');
      throw err;
    } finally {
      setLoadingStates(prev => ({ ...prev, operations: false }));
    }
  };

  // Appointment methods (placeholder for now)
  const addAppointment = (appointmentData: Omit<Appointment, 'id' | 'createdAt'>) => {
    const newAppointment: Appointment = {
      ...appointmentData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    setAppointments(prev => [newAppointment, ...prev]);
  };

  const updateAppointment = (id: string, appointmentData: Partial<Appointment>) => {
    setAppointments(prev => prev.map(appointment => 
      appointment.id === id ? { ...appointment, ...appointmentData } : appointment
    ));
  };

  const deleteAppointment = (id: string) => {
    setAppointments(prev => prev.filter(appointment => appointment.id !== id));
  };

  // Sale methods (placeholder for now)
  const addSale = (saleData: Omit<Sale, 'id' | 'createdAt'>) => {
    const newSale: Sale = {
      ...saleData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    setSales(prev => [newSale, ...prev]);
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
      // Sale methods
      addSale,
      // Refresh methods
      refreshClients,
      refreshParts,
      refreshQuotes,
    }}>
      {children}
    </DataContext.Provider>
  );
}
