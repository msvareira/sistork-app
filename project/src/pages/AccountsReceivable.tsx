import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar, DollarSign, User, FileText, Check, X, Edit3, Eye } from 'lucide-react';
import { apiClient as api } from '../services/api';

interface AccountReceivable {
  id: number;
  sale_id?: number;
  quote_id?: number;
  client_id: number;
  client_name: string;
  description: string;
  amount: number;
  original_amount: number;
  remaining_amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  payment_date?: string;
  sale_number?: string;
  quote_number?: string;
  created_at: string;
}

interface NewReceivable {
  client_name: string;
  description: string;
  amount: string;
  due_date: string;
}

const AccountsReceivable: React.FC = () => {
  // Função para formatar data corretamente (evita problema de fuso horário)
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('T')[0].split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('pt-BR');
  };

  // Função para formatar data e hora
  const formatDateTime = (dateStr: string): { date: string; time: string } => {
    if (!dateStr) return { date: '', time: '' };
    const [year, month, day] = dateStr.split('T')[0].split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: new Date(dateStr).toLocaleTimeString('pt-BR')
    };
  };
  const [receivables, setReceivables] = useState<AccountReceivable[]>([]);
  const [filteredReceivables, setFilteredReceivables] = useState<AccountReceivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewForm, setShowNewForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingReceivable, setEditingReceivable] = useState<AccountReceivable | null>(null);
  const [viewingReceivable, setViewingReceivable] = useState<AccountReceivable | null>(null);
  const [payingReceivable, setPayingReceivable] = useState<AccountReceivable | null>(null);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [newReceivable, setNewReceivable] = useState<NewReceivable>({
    client_name: '',
    description: '',
    amount: '',
    due_date: ''
  });
  const [editReceivable, setEditReceivable] = useState<NewReceivable>({
    client_name: '',
    description: '',
    amount: '',
    due_date: ''
  });

  useEffect(() => {
    loadReceivables();
  }, []);

  useEffect(() => {
    filterReceivables();
  }, [receivables, searchTerm, statusFilter]);

  const loadReceivables = async () => {
    try {
      setLoading(true);
      const response = await api.get('/accounts-receivable');
      console.log('Response completo:', response);
      console.log('Response data:', (response as any).data);
      
      const data = (response as any).data;
      if (data && data.success && data.data) {
        setReceivables(data.data || []);
      } else if (Array.isArray(data)) {
        setReceivables(data);
      } else {
        console.error('Estrutura de resposta inesperada:', data);
        setReceivables([]);
      }
    } catch (error) {
      console.error('Erro ao carregar contas a receber:', error);
      setReceivables([]);
    } finally {
      setLoading(false);
    }
  };

  const filterReceivables = () => {
    let filtered = receivables;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.sale_number && item.sale_number.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    setFilteredReceivables(filtered);
  };

  const handleCreateReceivable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/accounts-receivable', {
        ...newReceivable,
        amount: parseFloat(newReceivable.amount)
      });
      
      setNewReceivable({
        client_name: '',
        description: '',
        amount: '',
        due_date: ''
      });
      setShowNewForm(false);
      loadReceivables();
    } catch (error) {
      console.error('Erro ao criar conta a receber:', error);
    }
  };

  const markAsPaid = (receivable: AccountReceivable) => {
    setPayingReceivable(receivable);
    setPaymentAmount(receivable.remaining_amount.toString());
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setShowPaymentModal(true);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingReceivable) return;

    try {
      await api.put(`/accounts-receivable/${payingReceivable.id}/pay`, {
        payment_amount: parseFloat(paymentAmount),
        payment_date: paymentDate
      });
      
      setShowPaymentModal(false);
      setPayingReceivable(null);
      setPaymentAmount('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      loadReceivables();
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
    }
  };

  const handleEdit = (receivable: AccountReceivable) => {
    setEditingReceivable(receivable);
    setEditReceivable({
      client_name: receivable.client_name,
      description: receivable.description,
      amount: receivable.amount.toString(),
      due_date: receivable.due_date.split('T')[0] // Remove o horário se houver
    });
    setShowEditForm(true);
  };

  const handleView = (receivable: AccountReceivable) => {
    setViewingReceivable(receivable);
    setShowViewModal(true);
  };

  const handleUpdateReceivable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReceivable) return;

    try {
      await api.put(`/accounts-receivable/${editingReceivable.id}`, {
        ...editReceivable,
        amount: parseFloat(editReceivable.amount)
      });
      
      setEditReceivable({
        client_name: '',
        description: '',
        amount: '',
        due_date: ''
      });
      setEditingReceivable(null);
      setShowEditForm(false);
      loadReceivables();
    } catch (error) {
      console.error('Erro ao atualizar conta a receber:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pago';
      case 'overdue':
        return 'Vencido';
      default:
        return 'Pendente';
    }
  };

  const getTotalByStatus = (status: string) => {
    return receivables
      .filter(item => status === 'all' || item.status === status)
      .reduce((sum, item) => sum + Number(item.amount), 0);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="bg-gray-200 h-64 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contas a Receber</h1>
            <p className="text-gray-600">Gerencie suas receitas e recebimentos</p>
          </div>
          <button
            onClick={() => setShowNewForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Conta
          </button>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total a Receber</p>
                <p className="text-xl font-bold text-gray-900">
                  R$ {getTotalByStatus('all').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendente</p>
                <p className="text-xl font-bold text-yellow-600">
                  R$ {getTotalByStatus('pending').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Vencido</p>
                <p className="text-xl font-bold text-red-600">
                  R$ {getTotalByStatus('overdue').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <X className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recebido</p>
                <p className="text-xl font-bold text-green-600">
                  R$ {getTotalByStatus('paid').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <Check className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por cliente, descrição ou número da venda..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Pendente</option>
            <option value="overdue">Vencido</option>
            <option value="paid">Pago</option>
          </select>
        </div>
      </div>

      {/* Lista de Contas */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vencimento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReceivables.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.client_name}</div>
                        {item.sale_number && (
                          <div className="text-sm text-gray-500">Venda: {item.sale_number}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{item.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(item.due_date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                      {getStatusText(item.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {item.status === 'pending' && (
                        <button
                          onClick={() => markAsPaid(item)}
                          className="text-green-600 hover:text-green-900"
                          title="Marcar como Pago"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button className="text-blue-600 hover:text-blue-900" title="Visualizar" onClick={() => handleView(item)}>
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900" title="Editar" onClick={() => handleEdit(item)}>
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReceivables.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma conta a receber encontrada</p>
          </div>
        )}
      </div>

      {/* Modal de Nova Conta */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Nova Conta a Receber</h2>
            <form onSubmit={handleCreateReceivable}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente
                </label>
                <input
                  type="text"
                  required
                  value={newReceivable.client_name}
                  onChange={(e) => setNewReceivable({ ...newReceivable, client_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <input
                  type="text"
                  required
                  value={newReceivable.description}
                  onChange={(e) => setNewReceivable({ ...newReceivable, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newReceivable.amount}
                  onChange={(e) => setNewReceivable({ ...newReceivable, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Vencimento
                </label>
                <input
                  type="date"
                  required
                  value={newReceivable.due_date}
                  onChange={(e) => setNewReceivable({ ...newReceivable, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Criar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Editar Conta */}
      {showEditForm && editingReceivable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Editar Conta a Receber</h2>
            <form onSubmit={handleUpdateReceivable}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente
                </label>
                <input
                  type="text"
                  required
                  value={editReceivable.client_name}
                  onChange={(e) => setEditReceivable({ ...editReceivable, client_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <input
                  type="text"
                  required
                  value={editReceivable.description}
                  onChange={(e) => setEditReceivable({ ...editReceivable, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editReceivable.amount}
                  onChange={(e) => setEditReceivable({ ...editReceivable, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Vencimento
                </label>
                <input
                  type="date"
                  required
                  value={editReceivable.due_date}
                  onChange={(e) => setEditReceivable({ ...editReceivable, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingReceivable(null);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Atualizar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Visualizar Conta */}
      {showViewModal && viewingReceivable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Detalhes da Conta a Receber</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Cliente:</label>
                <p className="mt-1 text-gray-900">{viewingReceivable.client_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Descrição:</label>
                <p className="mt-1 text-gray-900">{viewingReceivable.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Valor Original:</label>
                  <p className="mt-1 text-gray-900">
                    R$ {Number(viewingReceivable.original_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Valor Restante:</label>
                  <p className="mt-1 text-gray-900">
                    R$ {Number(viewingReceivable.remaining_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Data de Vencimento:</label>
                <p className="mt-1 text-gray-900">
                  {formatDate(viewingReceivable.due_date)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status:</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(viewingReceivable.status)}`}>
                  {getStatusText(viewingReceivable.status)}
                </span>
              </div>
              {viewingReceivable.payment_date && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Data de Pagamento:</label>
                  <p className="mt-1 text-gray-900">
                    {formatDate(viewingReceivable.payment_date)}
                  </p>
                </div>
              )}
              {viewingReceivable.sale_number && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Número da Venda:</label>
                  <p className="mt-1 text-gray-900">{viewingReceivable.sale_number}</p>
                </div>
              )}
              {viewingReceivable.quote_number && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Número do Orçamento:</label>
                  <p className="mt-1 text-gray-900">{viewingReceivable.quote_number}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Criado em:</label>
                <p className="mt-1 text-gray-900">
                  {(() => {
                    const { date, time } = formatDateTime(viewingReceivable.created_at);
                    return `${date} às ${time}`;
                  })()}
                </p>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewingReceivable(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Pagamento */}
      {showPaymentModal && payingReceivable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Registrar Pagamento</h3>
            
            <form onSubmit={handlePayment}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Conta:</label>
                  <p className="mt-1 text-gray-900 text-sm bg-gray-50 p-2 rounded">
                    {payingReceivable.description}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Valor a Receber:</label>
                  <p className="mt-1 text-gray-900 text-sm bg-gray-50 p-2 rounded">
                    R$ {payingReceivable.remaining_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Valor do Pagamento:</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={payingReceivable.remaining_amount}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Data do Pagamento:</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPayingReceivable(null);
                    setPaymentAmount('');
                    setPaymentDate(new Date().toISOString().split('T')[0]);
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Registrar Pagamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsReceivable;
