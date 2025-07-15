import React, { createContext, useContext, useState, useEffect } from 'react';
import { Client, Service, Part, Quote, Appointment, Sale, ServicePart } from '../types';

interface DataContextType {
  clients: Client[];
  services: Service[];
  parts: Part[];
  quotes: Quote[];
  appointments: Appointment[];
  sales: Sale[];
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addService: (service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateService: (id: string, service: Partial<Service>) => void;
  deleteService: (id: string) => void;
  addPart: (part: Omit<Part, 'id' | 'createdAt'>) => void;
  updatePart: (id: string, part: Partial<Part>) => void;
  deletePart: (id: string) => void;
  addQuote: (quote: Omit<Quote, 'id' | 'createdAt'>) => void;
  updateQuote: (id: string, quote: Partial<Quote>) => void;
  deleteQuote: (id: string) => void;
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt'>) => void;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  addSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => void;
  convertQuoteToService: (quoteId: string) => void;
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
  const [services, setServices] = useState<Service[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    // Initialize with sample data
    const sampleParts: Part[] = [
      {
        id: '1',
        name: 'Óleo Motor 20W50',
        internalCode: 'OIL001',
        quantity: 25,
        costPrice: 15.00,
        sellPrice: 25.00,
        supplier: 'Ipiranga',
        createdAt: new Date()
      },
      {
        id: '2',
        name: 'Filtro de Óleo',
        internalCode: 'FIL001',
        quantity: 15,
        costPrice: 8.00,
        sellPrice: 15.00,
        supplier: 'Tecfil',
        createdAt: new Date()
      },
      {
        id: '3',
        name: 'Pastilha de Freio Dianteira',
        internalCode: 'BRK001',
        quantity: 10,
        costPrice: 35.00,
        sellPrice: 65.00,
        supplier: 'Cobreq',
        createdAt: new Date()
      }
    ];

    const sampleClients: Client[] = [
      {
        id: '1',
        name: 'João Silva',
        phone: '(11) 99999-9999',
        motorcycleModel: 'Honda CG 160',
        licensePlate: 'ABC-1234',
        notes: 'Cliente preferencial',
        createdAt: new Date()
      },
      {
        id: '2',
        name: 'Maria Santos',
        phone: '(11) 88888-8888',
        motorcycleModel: 'Yamaha YBR 125',
        licensePlate: 'XYZ-5678',
        createdAt: new Date()
      }
    ];

    setParts(sampleParts);
    setClients(sampleClients);
  }, []);

  const addClient = (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = {
      ...clientData,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    setClients(prev => [...prev, newClient]);
  };

  const updateClient = (id: string, clientData: Partial<Client>) => {
    setClients(prev => prev.map(client => 
      client.id === id ? { ...client, ...clientData } : client
    ));
  };

  const deleteClient = (id: string) => {
    setClients(prev => prev.filter(client => client.id !== id));
  };

  const addService = (serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newService: Service = {
      ...serviceData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setServices(prev => [...prev, newService]);
  };

  const updateService = (id: string, serviceData: Partial<Service>) => {
    setServices(prev => prev.map(service => 
      service.id === id ? { ...service, ...serviceData, updatedAt: new Date() } : service
    ));
  };

  const deleteService = (id: string) => {
    setServices(prev => prev.filter(service => service.id !== id));
  };

  const addPart = (partData: Omit<Part, 'id' | 'createdAt'>) => {
    const newPart: Part = {
      ...partData,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    setParts(prev => [...prev, newPart]);
  };

  const updatePart = (id: string, partData: Partial<Part>) => {
    setParts(prev => prev.map(part => 
      part.id === id ? { ...part, ...partData } : part
    ));
  };

  const deletePart = (id: string) => {
    setParts(prev => prev.filter(part => part.id !== id));
  };

  const addQuote = (quoteData: Omit<Quote, 'id' | 'createdAt'>) => {
    const newQuote: Quote = {
      ...quoteData,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    setQuotes(prev => [...prev, newQuote]);
  };

  const updateQuote = (id: string, quoteData: Partial<Quote>) => {
    setQuotes(prev => prev.map(quote => 
      quote.id === id ? { ...quote, ...quoteData } : quote
    ));
  };

  const deleteQuote = (id: string) => {
    setQuotes(prev => prev.filter(quote => quote.id !== id));
  };

  const addAppointment = (appointmentData: Omit<Appointment, 'id' | 'createdAt'>) => {
    const newAppointment: Appointment = {
      ...appointmentData,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    setAppointments(prev => [...prev, newAppointment]);
  };

  const updateAppointment = (id: string, appointmentData: Partial<Appointment>) => {
    setAppointments(prev => prev.map(appointment => 
      appointment.id === id ? { ...appointment, ...appointmentData } : appointment
    ));
  };

  const deleteAppointment = (id: string) => {
    setAppointments(prev => prev.filter(appointment => appointment.id !== id));
  };

  const addSale = (saleData: Omit<Sale, 'id' | 'createdAt'>) => {
    const newSale: Sale = {
      ...saleData,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    setSales(prev => [...prev, newSale]);
  };

  const convertQuoteToService = (quoteId: string) => {
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote) return;

    // Create service parts from quote items (only for parts, not services)  
    const serviceParts: ServicePart[] = quote.items
      .filter(item => item.type === 'part')
      .map((item) => {
        // Use the partId from the quote item directly
        return {
          partId: item.partId || '',
          quantity: item.quantity,
          unitPrice: item.unitPrice
        };
      })
      .filter(servicePart => servicePart.partId); // Remove items without partId

    // Calculate labor cost from quote (include service items in labor cost)
    const serviceItems = quote.items.filter(item => item.type === 'service');
    const serviceItemsTotal = serviceItems.reduce((sum, item) => sum + item.total, 0);
    const totalLaborCost = quote.laborCost + serviceItemsTotal;
    
    // Create new service
    const newService: Service = {
      id: Date.now().toString(),
      clientId: quote.clientId,
      description: `Serviço convertido do orçamento`,
      parts: serviceParts,
      laborCost: totalLaborCost,
      status: 'open',
      notes: quote.notes ? `Convertido do orçamento. ${quote.notes}` : 'Convertido do orçamento.',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setServices(prev => [...prev, newService]);
    
    // Update quote status to approved
    updateQuote(quoteId, { status: 'approved' });
  };

  return (
    <DataContext.Provider value={{
      clients,
      services,
      parts,
      quotes,
      appointments,
      sales,
      addClient,
      updateClient,
      deleteClient,
      addService,
      updateService,
      deleteService,
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
      convertQuoteToService
    }}>
      {children}
    </DataContext.Provider>
  );
}