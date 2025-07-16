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
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt'>) => Promise<void>;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  // Sale methods (placeholder for now)
  addSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => Promise<void>;
  updateSale: (id: string, sale: Partial<Sale>) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
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
    operations: false,
  });
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const updateLoadingState = (key: keyof typeof loadingStates, value: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const loadData = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);

    try {
      // Load clients
      updateLoadingState('clients', true);
      const clientsData = await clientService.getAll();
      setClients(clientsData);
      updateLoadingState('clients', false);

      // Load parts
      updateLoadingState('parts', true);
      const partsData = await partService.getAll();
      setParts(partsData);
      updateLoadingState('parts', false);

      // Load quotes
      updateLoadingState('quotes', true);
      const quotesData = await quoteService.getAll();
      setQuotes(quotesData);
      updateLoadingState('quotes', false);

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  // Client operations
  const addClient = async (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    updateLoadingState('operations', true);
    try {
      const newClient = await clientService.create(clientData);
      setClients(prev => [newClient, ...prev]);
    } catch (err) {
      console.error('Error adding client:', err);
      throw err;
    } finally {
      updateLoadingState('operations', false);
    }
  };

  const updateClient = async (id: string, clientData: Partial<Client>) => {
    updateLoadingState('operations', true);
    try {
      const updatedClient = await clientService.update(id, clientData);
      setClients(prev => prev.map(client => 
        client.id === id ? updatedClient : client
      ));
    } catch (err) {
      console.error('Error updating client:', err);
      throw err;
    } finally {
      updateLoadingState('operations', false);
    }
  };

  const deleteClient = async (id: string) => {
    updateLoadingState('operations', true);
    try {
      await clientService.delete(id);
      setClients(prev => prev.filter(client => client.id !== id));
    } catch (err) {
      console.error('Error deleting client:', err);
      throw err;
    } finally {
      updateLoadingState('operations', false);
    }
  };

  // Part operations
  const addPart = async (partData: Omit<Part, 'id' | 'createdAt'>) => {
    updateLoadingState('operations', true);
    try {
      const newPart = await partService.create(partData);
      setParts(prev => [newPart, ...prev]);
    } catch (err) {
      console.error('Error adding part:', err);
      throw err;
    } finally {
      updateLoadingState('operations', false);
    }
  };

  const updatePart = async (id: string, partData: Partial<Part>) => {
    updateLoadingState('operations', true);
    try {
      const updatedPart = await partService.update(id, partData);
      setParts(prev => prev.map(part => 
        part.id === id ? updatedPart : part
      ));
    } catch (err) {
      console.error('Error updating part:', err);
      throw err;
    } finally {
      updateLoadingState('operations', false);
    }
  };

  const deletePart = async (id: string) => {
    updateLoadingState('operations', true);
    try {
      await partService.delete(id);
      setParts(prev => prev.filter(part => part.id !== id));
    } catch (err) {
      console.error('Error deleting part:', err);
      throw err;
    } finally {
      updateLoadingState('operations', false);
    }
  };

  // Quote operations
  const addQuote = async (quoteData: Omit<Quote, 'id' | 'createdAt'>) => {
    updateLoadingState('operations', true);
    try {
      const newQuote = await quoteService.create(quoteData);
      setQuotes(prev => [newQuote, ...prev]);
    } catch (err) {
      console.error('Error adding quote:', err);
      throw err;
    } finally {
      updateLoadingState('operations', false);
    }
  };

  const updateQuote = async (id: string, quoteData: Partial<Quote>) => {
    updateLoadingState('operations', true);
    try {
      const updatedQuote = await quoteService.update(id, quoteData);
      setQuotes(prev => prev.map(quote => 
        quote.id === id ? updatedQuote : quote
      ));
    } catch (err) {
      console.error('Error updating quote:', err);
      throw err;
    } finally {
      updateLoadingState('operations', false);
    }
  };

  const deleteQuote = async (id: string) => {
    updateLoadingState('operations', true);
    try {
      await quoteService.delete(id);
      setQuotes(prev => prev.filter(quote => quote.id !== id));
    } catch (err) {
      console.error('Error deleting quote:', err);
      throw err;
    } finally {
      updateLoadingState('operations', false);
    }
  };

  // Placeholder methods for appointments
  const addAppointment = async (appointmentData: Omit<Appointment, 'id' | 'createdAt'>) => {
    // TODO: Implement appointment creation
    console.log('Add appointment:', appointmentData);
  };

  const updateAppointment = async (id: string, appointmentData: Partial<Appointment>) => {
    // TODO: Implement appointment update
    console.log('Update appointment:', id, appointmentData);
  };

  const deleteAppointment = async (id: string) => {
    // TODO: Implement appointment deletion
    console.log('Delete appointment:', id);
  };

  // Placeholder methods for sales
  const addSale = async (saleData: Omit<Sale, 'id' | 'createdAt'>) => {
    // TODO: Implement sale creation
    console.log('Add sale:', saleData);
  };

  const updateSale = async (id: string, saleData: Partial<Sale>) => {
    // TODO: Implement sale update
    console.log('Update sale:', id, saleData);
  };

  const deleteSale = async (id: string) => {
    // TODO: Implement sale deletion
    console.log('Delete sale:', id);
  };

  const value: DataContextType = {
    clients,
    parts,
    quotes,
    appointments,
    sales,
    loading,
    loadingStates,
    error,
    addClient,
    updateClient,
    deleteClient,
    addPart,
    updatePart,
    deletePart,
    addQuote,
    updateQuote,
    deleteQuote,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    addSale,
    updateSale,
    deleteSale,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}
