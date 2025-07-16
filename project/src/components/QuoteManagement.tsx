import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { Quote, QuotePart, QuoteService } from '../types';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  FileText, 
  Share2, 
  X,
  User,
  Phone,
  Calendar,
  DollarSign,
  CheckCircle,
  PlayCircle,
  XCircle,
  DollarSign as PaidIcon
} from 'lucide-react';
import { LoadingButton, LoadingCard } from './LoadingComponents';

export default function QuoteManagement() {
  const { quotes, clients, parts, addQuote, updateQuote, deleteQuote, loadingStates } = useData();
  const { success, error } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    clientId: '',
    parts: [] as QuotePart[],
    services: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }] as QuoteService[],
    notes: ''
  });

  const filteredQuotes = quotes.filter(quote => {
    const client = quote.client || clients.find(c => c.id === quote.clientId);
    return client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           client?.phone.includes(searchTerm) ||
           quote.id.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalPages = Math.ceil(filteredQuotes.length / itemsPerPage);
  const paginatedQuotes = filteredQuotes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const resetForm = () => {
    setFormData({
      clientId: '',
      parts: [],
      services: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
      notes: ''
    });
    setEditingQuote(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate client selection
      if (!formData.clientId) {
        error('Erro de validação', 'É necessário selecionar um cliente para o orçamento.');
        return;
      }

      // Process and validate services (required)
      const processedServices = formData.services
        .filter(service => service.description.trim())
        .map(service => ({
          ...service,
          total: service.quantity * service.unitPrice
        }));
      
      // Validate that we have at least one service
      if (processedServices.length === 0) {
        error('Erro de validação', 'É necessário adicionar pelo menos um serviço ao orçamento.');
        return;
      }

      // Process parts (optional)
      const processedParts = formData.parts.map(part => ({
        ...part,
        total: part.quantity * part.unitPrice
      }));
      
      const partsTotal = processedParts.reduce((sum, part) => sum + part.total, 0);
      const servicesTotal = processedServices.reduce((sum, service) => sum + service.total, 0);
      const quoteTotal = partsTotal + servicesTotal;
      
      const quoteData = {
        clientId: formData.clientId,
        parts: processedParts,
        services: processedServices,
        total: quoteTotal,
        notes: formData.notes,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'pending' as const
      };

      if (editingQuote) {
        await updateQuote(editingQuote.id, quoteData);
        success('Orçamento atualizado', 'O orçamento foi atualizado com sucesso.');
      } else {
        await addQuote(quoteData);
        success('Orçamento criado', 'O novo orçamento foi criado com sucesso.');
      }
      
      resetForm();
    } catch (err) {
      console.error('Error saving quote:', err);
      error('Erro ao salvar', 'Não foi possível salvar o orçamento. Tente novamente.');
    }
  };

  const handleEdit = (quote: Quote) => {
    setEditingQuote(quote);
    setFormData({
      clientId: quote.clientId,
      parts: quote.parts || [],
      services: quote.services || [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
      notes: quote.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este orçamento?')) {
      try {
        await deleteQuote(id);
        success('Orçamento excluído', 'O orçamento foi excluído com sucesso.');
      } catch (err) {
        console.error('Error deleting quote:', err);
        error('Erro ao excluir', 'Não foi possível excluir o orçamento. Tente novamente.');
      }
    }
  };

  const handleStatusChange = async (id: string, newStatus: Quote['status']) => {
    try {
      await updateQuote(id, { status: newStatus });
      success('Status atualizado', `Orçamento marcado como ${getStatusLabel(newStatus)}.`);
    } catch (err) {
      console.error('Error updating status:', err);
      error('Erro ao atualizar', 'Não foi possível atualizar o status. Tente novamente.');
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'pending': 'Pendente',
      'approved': 'Aprovado',
      'in_progress': 'Em Execução',
      'completed': 'Concluído',
      'paid': 'Pago',
      'rejected': 'Rejeitado',
      'expired': 'Expirado'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-orange-100 text-orange-800',
      'completed': 'bg-green-100 text-green-800',
      'paid': 'bg-emerald-100 text-emerald-800',
      'rejected': 'bg-red-100 text-red-800',
      'expired': 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const addPart = () => {
    const newPart: QuotePart = {
      partId: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    };
    setFormData({
      ...formData,
      parts: [...formData.parts, newPart]
    });
  };

  const removePart = (index: number) => {
    setFormData({
      ...formData,
      parts: formData.parts.filter((_, i) => i !== index)
    });
  };

  const addService = () => {
    const newService: QuoteService = {
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    };
    setFormData({
      ...formData,
      services: [...formData.services, newService]
    });
  };

  const removeService = (index: number) => {
    setFormData({
      ...formData,
      services: formData.services.filter((_, i) => i !== index)
    });
  };

  const updatePart = (index: number, field: keyof QuotePart, value: any) => {
    const updatedParts = [...formData.parts];
    updatedParts[index] = { ...updatedParts[index], [field]: value };
    
    // Auto-calculate total when quantity or unitPrice changes
    if (field === 'quantity' || field === 'unitPrice') {
      updatedParts[index].total = updatedParts[index].quantity * updatedParts[index].unitPrice;
    }
    
    // When partId changes, update part details
    if (field === 'partId') {
      const selectedPart = parts.find(p => p.id === value);
      if (selectedPart) {
        updatedParts[index].unitPrice = selectedPart.sellPrice;
        updatedParts[index].total = updatedParts[index].quantity * selectedPart.sellPrice;
      }
    }
    
    setFormData({ ...formData, parts: updatedParts });
  };

  const updateService = (index: number, field: keyof QuoteService, value: any) => {
    const updatedServices = [...formData.services];
    updatedServices[index] = { ...updatedServices[index], [field]: value };
    
    // Auto-calculate total when quantity or unitPrice changes
    if (field === 'quantity' || field === 'unitPrice') {
      updatedServices[index].total = updatedServices[index].quantity * updatedServices[index].unitPrice;
    }
    
    setFormData({ ...formData, services: updatedServices });
  };

  const calculatePartsTotal = () => {
    return formData.parts.reduce((total, part) => total + (part.quantity * part.unitPrice), 0);
  };

  const calculateServicesTotal = () => {
    return formData.services.reduce((total, service) => total + (service.quantity * service.unitPrice), 0);
  };

  const calculateQuoteTotal = (quote: Quote) => {
    const partsTotal = quote.parts.reduce((total, part) => total + (part.quantity * part.unitPrice), 0);
    const servicesTotal = quote.services.reduce((total, service) => total + (service.quantity * service.unitPrice), 0);
    return partsTotal + servicesTotal;
  };

  const generatePDF = (quote: Quote) => {
    const client = quote.client || clients.find(c => c.id === quote.clientId);
    alert(`Gerando PDF do orçamento para ${client?.name}...`);
  };

  const shareWhatsApp = (quote: Quote) => {
    const client = quote.client || clients.find(c => c.id === quote.clientId);
    const total = calculateQuoteTotal(quote);
    const message = `Olá ${client?.name}! Segue seu orçamento: Total: R$ ${total.toFixed(2)}`;
    const url = `https://wa.me/55${client?.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1>
        <LoadingButton
          loading={loadingStates.operations}
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Orçamento
        </LoadingButton>
      </div>

      {/* Loading state for data fetching */}
      {loadingStates.quotes ? (
        <LoadingCard message="Carregando orçamentos..." className="min-h-64" />
      ) : (
        <>
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por cliente, telefone ou ID..."
                  value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedQuotes.map((quote) => {
                const client = quote.client || clients.find(c => c.id === quote.clientId);
                const total = calculateQuoteTotal(quote);
                
                return (
                  <tr key={quote.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{client?.name}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {client?.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        {new Date(quote.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm font-medium text-green-600">
                        <DollarSign className="w-4 h-4 mr-1" />
                        R$ {total.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(quote.status)}`}>
                        {getStatusLabel(quote.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(quote)}
                          disabled={loadingStates.operations}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => generatePDF(quote)}
                          disabled={loadingStates.operations}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Gerar PDF"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => shareWhatsApp(quote)}
                          disabled={loadingStates.operations}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Enviar WhatsApp"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        
                        {/* Status Action Buttons */}
                        {quote.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(quote.id, 'approved')}
                            disabled={loadingStates.operations}
                            className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Aprovar"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        
                        {quote.status === 'approved' && (
                          <button
                            onClick={() => handleStatusChange(quote.id, 'in_progress')}
                            disabled={loadingStates.operations}
                            className="text-orange-600 hover:text-orange-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Iniciar Execução"
                          >
                            <PlayCircle className="w-4 h-4" />
                          </button>
                        )}
                        
                        {quote.status === 'in_progress' && (
                          <button
                            onClick={() => handleStatusChange(quote.id, 'completed')}
                            disabled={loadingStates.operations}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Concluir"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        
                        {quote.status === 'completed' && (
                          <button
                            onClick={() => handleStatusChange(quote.id, 'paid')}
                            disabled={loadingStates.operations}
                            className="text-emerald-600 hover:text-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Marcar como Pago"
                          >
                            <PaidIcon className="w-4 h-4" />
                          </button>
                        )}
                        
                        {(quote.status === 'pending' || quote.status === 'approved') && (
                          <button
                            onClick={() => handleStatusChange(quote.id, 'rejected')}
                            disabled={loadingStates.operations}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Rejeitar"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDelete(quote.id)}
                          disabled={loadingStates.operations}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-3 border-t flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredQuotes.length)} de {filteredQuotes.length} resultados
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingQuote ? 'Editar Orçamento' : 'Novo Orçamento'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente *
                </label>
                <select
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name} - {client.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Peças do Estoque
                    <span className="text-xs text-gray-500 font-normal ml-1">(opcional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={addPart}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Adicionar Peça
                  </button>
                </div>

                {formData.parts.length > 0 && (
                  <div className="space-y-3 mb-6">
                    {formData.parts.map((part, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Peça do Estoque
                            </label>
                            <select
                              value={part.partId}
                              onChange={(e) => updatePart(index, 'partId', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            >
                              <option value="">Selecionar peça...</option>
                              {parts.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} - R$ {p.sellPrice.toFixed(2)}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Quantidade
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={part.quantity}
                              onChange={(e) => updatePart(index, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Preço Unit.
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={part.unitPrice}
                              onChange={(e) => updatePart(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div className="flex items-end">
                            <div className="w-full">
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Total
                              </label>
                              <div className="p-2 bg-gray-50 border border-gray-300 rounded text-sm font-medium">
                                R$ {(part.quantity * part.unitPrice).toFixed(2)}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removePart(index)}
                              className="ml-2 text-red-600 hover:text-red-800"
                              title="Remover peça"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Serviços <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 font-normal ml-1">(pelo menos um serviço obrigatório)</span>
                  </label>
                  <button
                    type="button"
                    onClick={addService}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Adicionar Serviço
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.services.map((service, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Descrição do Serviço {index === 0 && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type="text"
                            value={service.description}
                            onChange={(e) => updateService(index, 'description', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Descrição do serviço"
                            required={index === 0}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Quantidade
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={service.quantity}
                            onChange={(e) => updateService(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Preço Unit.
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={service.unitPrice}
                            onChange={(e) => updateService(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div className="flex items-end">
                          <div className="w-full">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Total
                            </label>
                            <div className="p-2 bg-gray-50 border border-gray-300 rounded text-sm font-medium">
                              R$ {(service.quantity * service.unitPrice).toFixed(2)}
                            </div>
                          </div>
                          {formData.services.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeService(index)}
                              className="ml-2 text-red-600 hover:text-red-800"
                              title="Remover serviço"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          {formData.services.length === 1 && (
                            <div className="ml-2 w-6 h-6 flex items-center justify-center">
                              <span className="text-xs text-gray-400" title="Pelo menos um serviço é obrigatório">
                                *
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Subtotal Peças:</span>
                      <span className="text-sm font-medium">R$ {calculatePartsTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Subtotal Serviços:</span>
                      <span className="text-sm font-medium">R$ {calculateServicesTotal().toFixed(2)}</span>
                    </div>
                    <hr className="border-gray-300" />
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium text-gray-700">Total Geral:</span>
                      <span className="text-xl font-bold text-green-600">
                        R$ {(calculatePartsTotal() + calculateServicesTotal()).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Observações adicionais..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={loadingStates.operations}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <LoadingButton
                  type="submit"
                  loading={loadingStates.operations}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingQuote ? 'Atualizar' : 'Criar'} Orçamento
                </LoadingButton>
              </div>
            </form>
          </div>
        </div>
      )}

      </>
    )}
  </div>
);
}