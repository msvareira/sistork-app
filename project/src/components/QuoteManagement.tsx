import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { Quote, Client, Part } from '../types';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  FileText, 
  Share2, 
  Settings,
  X,
  Calculator,
  User,
  Phone,
  Calendar,
  DollarSign,
  Package,
  Wrench
} from 'lucide-react';

export default function QuoteManagement() {
  const { quotes, clients, parts, addQuote, updateQuote, deleteQuote, convertQuoteToService } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [showConvertModal, setShowConvertModal] = useState<Quote | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    clientId: '',
    items: [{ type: 'part' as 'part' | 'service', description: '', partId: '', quantity: 1, unitPrice: 0 }],
    observations: ''
  });

  const filteredQuotes = quotes.filter(quote => {
    const client = clients.find(c => c.id === quote.clientId);
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
      items: [{ type: 'part', description: '', partId: '', quantity: 1, unitPrice: 0 }],
      observations: ''
    });
    setEditingQuote(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const quoteData = {
      ...formData,
      items: formData.items.filter(item => 
        item.description.trim() || item.partId
      )
    };

    if (editingQuote) {
      updateQuote(editingQuote.id, quoteData);
    } else {
      addQuote(quoteData);
    }
    
    resetForm();
  };

  const handleEdit = (quote: Quote) => {
    setEditingQuote(quote);
    setFormData({
      clientId: quote.clientId,
      items: quote.items,
      observations: quote.observations
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este orçamento?')) {
      deleteQuote(id);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { type: 'part', description: '', partId: '', quantity: 1, unitPrice: 0 }]
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Auto-fill price when selecting a part
    if (field === 'partId' && value) {
      const selectedPart = parts.find(item => item.id === value);
      if (selectedPart) {
        updatedItems[index].unitPrice = selectedPart.sellPrice;
        updatedItems[index].description = selectedPart.name;
      }
    }
    
    setFormData({ ...formData, items: updatedItems });
  };

  const calculateTotal = (items: Quote['items']) => {
    return items.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);
  };

  const handleConvertToService = () => {
    if (showConvertModal) {
      convertQuoteToService(showConvertModal.id);
      setShowConvertModal(null);
    }
  };

  const generatePDF = (quote: Quote) => {
    const client = clients.find(c => c.id === quote.clientId);
    alert(`Gerando PDF do orçamento para ${client?.name}...`);
  };

  const shareWhatsApp = (quote: Quote) => {
    const client = clients.find(c => c.id === quote.clientId);
    const total = calculateTotal(quote.items);
    const message = `Olá ${client?.name}! Segue seu orçamento: Total: R$ ${total.toFixed(2)}`;
    const url = `https://wa.me/55${client?.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Orçamento
        </button>
      </div>

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
                const client = clients.find(c => c.id === quote.clientId);
                const total = calculateTotal(quote.items);
                
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
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        quote.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800'
                          : quote.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {quote.status === 'pending' ? 'Pendente' : 
                         quote.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(quote)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => generatePDF(quote)}
                          className="text-green-600 hover:text-green-900"
                          title="Gerar PDF"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => shareWhatsApp(quote)}
                          className="text-green-600 hover:text-green-900"
                          title="Enviar WhatsApp"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        {quote.status === 'pending' && (
                          <button
                            onClick={() => setShowConvertModal(quote)}
                            className="text-orange-600 hover:text-orange-900"
                            title="Converter em Serviço"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(quote.id)}
                          className="text-red-600 hover:text-red-900"
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
                    Itens do Orçamento
                  </label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Adicionar Item
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Tipo
                          </label>
                          <select
                            value={item.type}
                            onChange={(e) => updateItem(index, 'type', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="part">Peça</option>
                            <option value="service">Serviço</option>
                          </select>
                        </div>

                        {item.type === 'part' ? (
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Peça do Estoque
                            </label>
                            <select
                              value={item.partId}
                              onChange={(e) => updateItem(index, 'partId', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Selecione uma peça</option>
                              {parts.map(part => (
                                <option key={part.id} value={part.id}>
                                  {part.name} - {part.internalCode} (Estoque: {part.quantity})
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Descrição do Serviço
                            </label>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateItem(index, 'description', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Descrição do serviço"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Quantidade
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
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
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div className="flex items-end">
                          <div className="w-full">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Total
                            </label>
                            <div className="p-2 bg-gray-50 border border-gray-300 rounded text-sm font-medium">
                              R$ {(item.quantity * item.unitPrice).toFixed(2)}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="ml-2 text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-700">Total Geral:</span>
                    <span className="text-xl font-bold text-green-600">
                      R$ {calculateTotal(formData.items).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Observações adicionais..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingQuote ? 'Atualizar' : 'Criar'} Orçamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert to Service Modal */}
      {showConvertModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <Settings className="w-6 h-6 text-orange-600 mr-2" />
              <h2 className="text-xl font-bold">Converter em Serviço</h2>
            </div>
            
            <p className="text-gray-600 mb-6">
              Deseja converter este orçamento em um serviço? Esta ação irá:
            </p>
            
            <ul className="list-disc list-inside text-sm text-gray-600 mb-6 space-y-1">
              <li>Criar um novo serviço baseado neste orçamento</li>
              <li>Marcar o orçamento como aprovado</li>
              <li>Transferir todas as peças e valores</li>
            </ul>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConvertModal(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConvertToService}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
              >
                <Wrench className="w-4 h-4" />
                Converter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}