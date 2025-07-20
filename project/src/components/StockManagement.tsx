import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { Part } from '../types';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package,
  AlertTriangle,
  X,
  Eye
} from 'lucide-react';
import { LoadingButton, LoadingCard } from './LoadingComponents';

export default function StockManagement() {
  const { parts, addPart, updatePart, deletePart, loadingStates } = useData();
  const { success, error } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingPart, setViewingPart] = useState<Part | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    internalCode: '',
    quantity: 0,
    costPrice: 0,
    sellPrice: 0,
    supplier: ''
  });

  const filteredParts = parts.filter(part =>
    part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.internalCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPart) {
        await updatePart(editingPart.id, formData);
        success('Peça atualizada', 'Os dados da peça foram atualizados com sucesso.');
      } else {
        await addPart(formData);
        success('Peça cadastrada', 'A nova peça foi cadastrada com sucesso.');
      }
      resetForm();
    } catch (err) {
      console.error('Error saving part:', err);
      error('Erro ao salvar', 'Não foi possível salvar os dados da peça. Tente novamente.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      internalCode: '',
      quantity: 0,
      costPrice: 0,
      sellPrice: 0,
      supplier: ''
    });
    setEditingPart(null);
    setShowForm(false);
  };

  const handleEdit = (part: Part) => {
    setFormData({
      name: part.name,
      internalCode: part.internalCode,
      quantity: part.quantity,
      costPrice: part.costPrice,
      sellPrice: part.sellPrice,
      supplier: part.supplier || ''
    });
    setEditingPart(part);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta peça?')) {
      try {
        await deletePart(id);
        success('Peça excluída', 'A peça foi removida do estoque com sucesso.');
      } catch (err) {
        console.error('Error deleting part:', err);
        error('Erro ao excluir', 'Não foi possível excluir a peça. Tente novamente.');
      }
    }
  };

  const handleView = (part: Part) => {
    setViewingPart(part);
    setShowViewModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestão de Estoque</h1>
        <LoadingButton
          loading={loadingStates.operations}
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Nova Peça</span>
        </LoadingButton>
      </div>

      {/* Loading state for data fetching */}
      {loadingStates.parts ? (
        <LoadingCard message="Carregando peças..." className="min-h-64" />
      ) : (
        <>
          {/* Search */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, código ou fornecedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Low Stock Alert */}
      {parts.some(part => part.quantity < 5) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-yellow-800 font-medium">
              Produtos com estoque baixo detectados
            </span>
          </div>
        </div>
      )}

      {/* Part Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {editingPart ? 'Editar Peça' : 'Nova Peça'}
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
                  Nome da Peça
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código Interno
                </label>
                <input
                  type="text"
                  required
                  value={formData.internalCode}
                  onChange={(e) => setFormData({...formData, internalCode: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade em Estoque
                </label>
                <input
                  type="number"
                  required
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço de Custo
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.costPrice}
                  onChange={(e) => setFormData({...formData, costPrice: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço de Venda
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.sellPrice}
                  onChange={(e) => setFormData({...formData, sellPrice: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fornecedor
                </label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-3">
                <LoadingButton
                  type="submit"
                  loading={loadingStates.operations}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  {editingPart ? 'Atualizar' : 'Salvar'}
                </LoadingButton>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={loadingStates.operations}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Parts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredParts.map((part) => {
          const margin = part.sellPrice - part.costPrice;
          const marginPercent = part.costPrice > 0 ? (margin / part.costPrice) * 100 : 0;

          return (
            <div key={part.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-500">{part.internalCode}</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleView(part)}
                    disabled={loadingStates.operations}
                    className="text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Visualizar"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(part)}
                    disabled={loadingStates.operations}
                    className="text-gray-600 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(part.id)}
                    disabled={loadingStates.operations}
                    className="text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 mb-2">{part.name}</h3>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Estoque:</span>
                  <span className={`font-medium ${part.quantity < 5 ? 'text-red-600' : 'text-green-600'}`}>
                    {part.quantity} {part.quantity < 5 && '⚠️'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Código:</span>
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{part.internalCode}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Custo:</span>
                  <span>R$ {part.costPrice.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Venda:</span>
                  <span className="font-medium text-green-600">R$ {part.sellPrice.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Margem:</span>
                  <span className={`font-medium ${marginPercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {marginPercent.toFixed(1)}%
                  </span>
                </div>
              </div>

              {part.supplier && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Fornecedor:</strong> {part.supplier}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      </>
    )}

    {/* Modal de Visualização */}
    {showViewModal && viewingPart && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Detalhes da Peça</h3>
            <button
              onClick={() => {
                setShowViewModal(false);
                setViewingPart(null);
              }}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome da Peça</label>
              <p className="mt-1 text-gray-900">{viewingPart.name}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Código Interno</label>
              <p className="mt-1 text-gray-900 font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                {viewingPart.internalCode}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Quantidade em Estoque</label>
                <p className={`mt-1 font-semibold ${viewingPart.quantity < 5 ? 'text-red-600' : 'text-green-600'}`}>
                  {viewingPart.quantity} {viewingPart.quantity < 5 && '⚠️ Estoque baixo'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <p className={`mt-1 font-medium ${viewingPart.quantity === 0 ? 'text-red-600' : viewingPart.quantity < 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {viewingPart.quantity === 0 ? 'Sem estoque' : viewingPart.quantity < 5 ? 'Estoque baixo' : 'Em estoque'}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Preço de Custo</label>
                <p className="mt-1 text-gray-900">R$ {viewingPart.costPrice.toFixed(2)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Preço de Venda</label>
                <p className="mt-1 text-green-600 font-semibold">R$ {viewingPart.sellPrice.toFixed(2)}</p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Margem de Lucro</label>
              <p className="mt-1 font-semibold">
                {(() => {
                  const margin = viewingPart.sellPrice - viewingPart.costPrice;
                  const marginPercent = viewingPart.costPrice > 0 ? (margin / viewingPart.costPrice) * 100 : 0;
                  return (
                    <span className={marginPercent > 0 ? 'text-green-600' : 'text-red-600'}>
                      R$ {margin.toFixed(2)} ({marginPercent.toFixed(1)}%)
                    </span>
                  );
                })()}
              </p>
            </div>
            
            {viewingPart.supplier && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Fornecedor</label>
                <p className="mt-1 text-gray-900">{viewingPart.supplier}</p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Data de Cadastro</label>
              <p className="mt-1 text-gray-900">
                {new Date(viewingPart.createdAt || Date.now()).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              onClick={() => {
                setShowViewModal(false);
                setViewingPart(null);
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}