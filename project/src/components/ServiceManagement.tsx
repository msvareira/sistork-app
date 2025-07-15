import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Service, ServicePart } from '../types';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  User,
  Calendar,
  DollarSign,
  Package,
  FileText,
  X
} from 'lucide-react';

export default function ServiceManagement() {
  const { services, clients, parts, addService, updateService, deleteService } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [formData, setFormData] = useState({
    clientId: '',
    description: '',
    parts: [] as ServicePart[],
    laborCost: 0,
    status: 'open' as Service['status'],
    notes: ''
  });

  const filteredServices = services.filter(service => {
    const client = clients.find(c => c.id === service.clientId);
    const matchesSearch = service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || service.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingService) {
      updateService(editingService.id, formData);
    } else {
      addService(formData);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      description: '',
      parts: [],
      laborCost: 0,
      status: 'open',
      notes: ''
    });
    setEditingService(null);
    setShowForm(false);
  };

  const handleEdit = (service: Service) => {
    setFormData({
      clientId: service.clientId,
      description: service.description,
      parts: service.parts,
      laborCost: service.laborCost,
      status: service.status,
      notes: service.notes || ''
    });
    setEditingService(service);
    setShowForm(true);
  };

  const addPart = () => {
    setFormData({
      ...formData,
      parts: [...formData.parts, { partId: '', quantity: 1, unitPrice: 0 }]
    });
  };

  const removePart = (index: number) => {
    setFormData({
      ...formData,
      parts: formData.parts.filter((_, i) => i !== index)
    });
  };

  const updatePart = (index: number, field: keyof ServicePart, value: any) => {
    const updatedParts = [...formData.parts];
    updatedParts[index] = { ...updatedParts[index], [field]: value };
    setFormData({ ...formData, parts: updatedParts });
  };

  const getStatusColor = (status: Service['status']) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'finished': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Service['status']) => {
    switch (status) {
      case 'open': return 'Aberto';
      case 'in_progress': return 'Em Andamento';
      case 'finished': return 'Finalizado';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestão de Serviços</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Novo Serviço</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por descrição ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos os Status</option>
            <option value="open">Aberto</option>
            <option value="in_progress">Em Andamento</option>
            <option value="finished">Finalizado</option>
          </select>
        </div>
      </div>

      {/* Service Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {editingService ? 'Editar Serviço' : 'Novo Serviço'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente
                </label>
                <select
                  required
                  value={formData.clientId}
                  onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição do Serviço
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Peças Utilizadas
                  </label>
                  <button
                    type="button"
                    onClick={addPart}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    + Adicionar Peça
                  </button>
                </div>
                {formData.parts.map((part, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-2 p-3 border border-gray-200 rounded-lg">
                    <select
                      value={part.partId}
                      onChange={(e) => {
                        const selectedPart = parts.find(p => p.id === e.target.value);
                        updatePart(index, 'partId', e.target.value);
                        if (selectedPart) {
                          updatePart(index, 'unitPrice', selectedPart.sellPrice);
                        }
                      }}
                      className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Selecione uma peça</option>
                      {parts.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} - {p.internalCode} (Estoque: {p.quantity})
                        </option>
                      ))}
                    </select>
                    
                    <input
                      type="number"
                      placeholder="Qtd"
                      value={part.quantity}
                      onChange={(e) => updatePart(index, 'quantity', parseInt(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Preço"
                      value={part.unitPrice}
                      onChange={(e) => updatePart(index, 'unitPrice', parseFloat(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-600">
                        R$ {(part.quantity * part.unitPrice).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removePart(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor da Mão de Obra
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.laborCost}
                  onChange={(e) => setFormData({...formData, laborCost: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as Service['status']})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="open">Aberto</option>
                  <option value="in_progress">Em Andamento</option>
                  <option value="finished">Finalizado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  {editingService ? 'Atualizar' : 'Salvar'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => {
          const client = clients.find(c => c.id === service.clientId);
          const partsTotal = service.parts.reduce((sum, part) => sum + (part.quantity * part.unitPrice), 0);
          const total = partsTotal + service.laborCost;

          return (
            <div key={service.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(service.status)}`}>
                  {getStatusText(service.status)}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(service)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteService(service.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 mb-2">{service.description}</h3>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  <span>{client?.name}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{service.createdAt.toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center">
                  <Package className="h-4 w-4 mr-2" />
                  <span>{service.parts.length} peças</span>
                </div>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  <span>R$ {total.toFixed(2)}</span>
                </div>
                {service.notes?.includes('Convertido do orçamento') && (
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="text-blue-600 text-xs">Convertido de orçamento</span>
                  </div>
                )}
              </div>

              {service.notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">{service.notes}</p>
                </div>
              )}

              {/* Breakdown de valores */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Peças:</span>
                    <span className="text-gray-900">R$ {partsTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mão de obra:</span>
                    <span className="text-gray-900">R$ {service.laborCost.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-1 flex justify-between font-semibold">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-green-600">R$ {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}