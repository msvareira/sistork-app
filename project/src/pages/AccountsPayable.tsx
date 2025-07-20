import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar, DollarSign, Building, FileText, Check, X, Edit3, Eye } from 'lucide-react';
import { apiClient as api } from '../services/api';
import MaskedInput from '../components/MaskedInput';

interface AccountPayable {
  id: number;
  supplier_name: string;
  supplier_document?: string;
  description: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
  payment_date?: string;
  category: string;
  created_at: string;
}

interface NewPayable {
  supplier_name: string;
  supplier_document: string;
  description: string;
  amount: string;
  due_date: string;
  category: string;
}

const AccountsPayable: React.FC = () => {
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

  const [payables, setPayables] = useState<AccountPayable[]>([]);
  const [filteredPayables, setFilteredPayables] = useState<AccountPayable[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showNewForm, setShowNewForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPayable, setEditingPayable] = useState<AccountPayable | null>(null);
  const [viewingPayable, setViewingPayable] = useState<AccountPayable | null>(null);
  const [payingPayable, setPayingPayable] = useState<AccountPayable | null>(null);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<string>('0');
  const [interestAmount, setInterestAmount] = useState<string>('0');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [newPayable, setNewPayable] = useState<NewPayable>({
    supplier_name: '',
    supplier_document: '',
    description: '',
    amount: '',
    due_date: '',
    category: ''
  });
  const [editPayable, setEditPayable] = useState<NewPayable>({
    supplier_name: '',
    supplier_document: '',
    description: '',
    amount: '',
    due_date: '',
    category: ''
  });

  const categories = [
    'Fornecedores',
    'Serviços',
    'Aluguel',
    'Energia',
    'Água',
    'Internet',
    'Telefone',
    'Impostos',
    'Salários',
    'Benefícios',
    'Marketing',
    'Manutenção',
    'Outros'
  ];

  useEffect(() => {
    loadPayables();
  }, []);

  useEffect(() => {
    filterPayables();
  }, [payables, searchTerm, statusFilter, categoryFilter]);

  const loadPayables = async () => {
    try {
      setLoading(true);
      const response = await api.get('/accounts-payable');
      setPayables((response as any).data || []);
    } catch (error) {
      console.error('Erro ao carregar contas a pagar:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPayables = () => {
    let filtered = payables;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    setFilteredPayables(filtered);
  };

  const handleCreatePayable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/accounts-payable', {
        ...newPayable,
        amount: parseFloat(newPayable.amount)
      });
      
      setNewPayable({
        supplier_name: '',
        supplier_document: '',
        description: '',
        amount: '',
        due_date: '',
        category: ''
      });
      setShowNewForm(false);
      loadPayables();
    } catch (error) {
      console.error('Erro ao criar conta a pagar:', error);
    }
  };

  const markAsPaid = (payable: AccountPayable) => {
    setPayingPayable(payable);
    setPaymentAmount(payable.amount.toString());
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setDiscountAmount('0');
    setInterestAmount('0');
    setPaymentNotes('');
    setShowPaymentModal(true);
  };

  const validatePayment = () => {
    if (!payingPayable) return false;

    const originalAmount = payingPayable.amount;
    const payment = parseFloat(paymentAmount) || 0;
    const discount = parseFloat(discountAmount) || 0;
    const interest = parseFloat(interestAmount) || 0;
    
    // Validação básica
    if (payment <= 0) {
      alert('O valor do pagamento deve ser maior que zero.');
      return false;
    }

    // Validação: desconto não pode ser maior que o valor original
    if (discount > originalAmount) {
      alert('O desconto não pode ser maior que o valor original da conta.');
      return false;
    }

    // Validação: juros não pode fazer o total ultrapassar 300% do valor original
    const totalWithInterest = payment + interest - discount;
    const maxAllowedTotal = originalAmount * 3; // 300% do valor original

    if (totalWithInterest > maxAllowedTotal) {
      alert(`O valor total com juros (R$ ${totalWithInterest.toFixed(2)}) não pode ultrapassar 300% do valor original (R$ ${maxAllowedTotal.toFixed(2)}).`);
      return false;
    }

    // Validação: se há juros, o valor deve ser pelo menos o valor original menos desconto
    if (interest > 0) {
      const minimumPayment = originalAmount - discount;
      if (payment < minimumPayment) {
        alert(`Com juros aplicados, o pagamento deve ser de pelo menos R$ ${minimumPayment.toFixed(2)} (valor original menos desconto).`);
        return false;
      }
    }

    return true;
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingPayable) return;

    // Validar antes de processar
    if (!validatePayment()) return;

    try {
      const paymentData = {
        payment_amount: parseFloat(paymentAmount),
        payment_date: paymentDate,
        discount_amount: parseFloat(discountAmount) || 0,
        interest_amount: parseFloat(interestAmount) || 0,
        notes: paymentNotes || undefined
      };

      await api.put(`/accounts-payable/${payingPayable.id}/pay`, paymentData);
      
      setShowPaymentModal(false);
      setPayingPayable(null);
      setPaymentAmount('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setDiscountAmount('0');
      setInterestAmount('0');
      setPaymentNotes('');
      loadPayables();
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
    }
  };

  const handleEdit = (payable: AccountPayable) => {
    setEditingPayable(payable);
    setEditPayable({
      supplier_name: payable.supplier_name,
      supplier_document: payable.supplier_document || '',
      description: payable.description,
      amount: payable.amount.toString(),
      due_date: payable.due_date.split('T')[0], // Remove o horário se houver
      category: payable.category
    });
    setShowEditForm(true);
  };

  const handleView = (payable: AccountPayable) => {
    setViewingPayable(payable);
    setShowViewModal(true);
  };

  const handleUpdatePayable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayable) return;

    try {
      await api.put(`/accounts-payable/${editingPayable.id}`, {
        ...editPayable,
        amount: parseFloat(editPayable.amount)
      });
      
      setEditPayable({
        supplier_name: '',
        supplier_document: '',
        description: '',
        amount: '',
        due_date: '',
        category: ''
      });
      setEditingPayable(null);
      setShowEditForm(false);
      loadPayables();
    } catch (error) {
      console.error('Erro ao atualizar conta a pagar:', error);
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
    return payables
      .filter(item => status === 'all' || item.status === status)
      .reduce((sum, item) => sum + Number(item.amount), 0);
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'fornecedores':
        return Building;
      case 'serviços':
        return FileText;
      case 'impostos':
        return DollarSign;
      default:
        return FileText;
    }
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
            <h1 className="text-3xl font-bold text-gray-900">Contas a Pagar</h1>
            <p className="text-gray-600">Gerencie suas despesas e pagamentos</p>
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
                <p className="text-sm text-gray-600">Total a Pagar</p>
                <p className="text-xl font-bold text-gray-900">
                  R$ {getTotalByStatus('all').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-red-500" />
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
                <p className="text-sm text-gray-600">Pago</p>
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
                placeholder="Buscar por fornecedor, descrição ou categoria..."
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
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todas as Categorias</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
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
                  Fornecedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
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
              {filteredPayables.map((item) => {
                const CategoryIcon = getCategoryIcon(item.category);
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.supplier_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{item.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CategoryIcon className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{item.category}</span>
                      </div>
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
                        {(item.status === 'pending' || item.status === 'overdue') && (
                          <button
                            onClick={() => markAsPaid(item)}
                            className="text-green-600 hover:text-green-900"
                            title="Informar Pagamento"
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
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredPayables.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma conta a pagar encontrada</p>
          </div>
        )}
      </div>

      {/* Modal de Nova Conta */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Nova Conta a Pagar</h2>
            <form onSubmit={handleCreatePayable}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fornecedor
                </label>
                <input
                  type="text"
                  required
                  value={newPayable.supplier_name}
                  onChange={(e) => setNewPayable({ ...newPayable, supplier_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CPF/CNPJ do Fornecedor
                </label>
                <MaskedInput
                  type={newPayable.supplier_document.length > 14 ? "cnpj" : "cpf"}
                  value={newPayable.supplier_document}
                  onChange={(value) => setNewPayable({ ...newPayable, supplier_document: value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <input
                  type="text"
                  required
                  value={newPayable.description}
                  onChange={(e) => setNewPayable({ ...newPayable, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <select
                  required
                  value={newPayable.category}
                  onChange={(e) => setNewPayable({ ...newPayable, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecionar categoria</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newPayable.amount}
                  onChange={(e) => setNewPayable({ ...newPayable, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0,00"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Vencimento
                </label>
                <input
                  type="date"
                  required
                  value={newPayable.due_date}
                  onChange={(e) => setNewPayable({ ...newPayable, due_date: e.target.value })}
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
      {showEditForm && editingPayable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Editar Conta a Pagar</h2>
            <form onSubmit={handleUpdatePayable}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fornecedor
                </label>
                <input
                  type="text"
                  required
                  value={editPayable.supplier_name}
                  onChange={(e) => setEditPayable({ ...editPayable, supplier_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CPF/CNPJ do Fornecedor
                </label>
                <MaskedInput
                  type={editPayable.supplier_document.length > 14 ? "cnpj" : "cpf"}
                  value={editPayable.supplier_document}
                  onChange={(value) => setEditPayable({ ...editPayable, supplier_document: value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <input
                  type="text"
                  required
                  value={editPayable.description}
                  onChange={(e) => setEditPayable({ ...editPayable, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <select
                  required
                  value={editPayable.category}
                  onChange={(e) => setEditPayable({ ...editPayable, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editPayable.amount}
                  onChange={(e) => setEditPayable({ ...editPayable, amount: e.target.value })}
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
                  value={editPayable.due_date}
                  onChange={(e) => setEditPayable({ ...editPayable, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingPayable(null);
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
      {showViewModal && viewingPayable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Detalhes da Conta a Pagar</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Fornecedor:</label>
                <p className="mt-1 text-gray-900">{viewingPayable.supplier_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Descrição:</label>
                <p className="mt-1 text-gray-900">{viewingPayable.description}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Categoria:</label>
                <p className="mt-1 text-gray-900">{viewingPayable.category}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Valor:</label>
                <p className="mt-1 text-gray-900">
                  R$ {Number(viewingPayable.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Data de Vencimento:</label>
                <p className="mt-1 text-gray-900">
                  {formatDate(viewingPayable.due_date)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status:</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(viewingPayable.status)}`}>
                  {getStatusText(viewingPayable.status)}
                </span>
              </div>
              {viewingPayable.payment_date && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Data de Pagamento:</label>
                  <p className="mt-1 text-gray-900">
                    {formatDate(viewingPayable.payment_date)}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Criado em:</label>
                <p className="mt-1 text-gray-900">
                  {(() => {
                    const { date, time } = formatDateTime(viewingPayable.created_at);
                    return `${date} às ${time}`;
                  })()}
                </p>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewingPayable(null);
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
      {showPaymentModal && payingPayable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Registrar Pagamento</h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPayingPayable(null);
                  setPaymentAmount('');
                  setPaymentDate(new Date().toISOString().split('T')[0]);
                  setDiscountAmount('0');
                  setInterestAmount('0');
                  setPaymentNotes('');
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handlePayment}>
              <div className="space-y-4">
                {/* Informações da Conta */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Conta:</label>
                    <p className="mt-1 text-gray-900 text-sm">
                      {payingPayable.description}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fornecedor:</label>
                    <p className="mt-1 text-gray-900 text-sm">
                      {payingPayable.supplier_name}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Valor Original:</label>
                    <p className="mt-1 text-gray-900 text-sm font-semibold">
                      R$ {payingPayable.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Vencimento:</label>
                    <p className="mt-1 text-gray-900 text-sm">
                      {formatDate(payingPayable.due_date)}
                    </p>
                  </div>
                </div>

                {/* Dados do Pagamento */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor do Pagamento *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={payingPayable.amount}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                      placeholder="0,00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data do Pagamento *
                    </label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Desconto
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0,00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Juros/Multa
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={interestAmount}
                      onChange={(e) => setInterestAmount(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <textarea
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Observações sobre o pagamento (opcional)"
                  />
                </div>

                {/* Resumo do Pagamento */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Resumo do Pagamento</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Valor Original:</span>
                      <span>R$ {payingPayable.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    {parseFloat(discountAmount) > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Desconto:</span>
                        <span>- R$ {parseFloat(discountAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {parseFloat(interestAmount) > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Juros/Multa:</span>
                        <span>+ R$ {parseFloat(interestAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <hr className="my-2" />
                    <div className="flex justify-between font-semibold">
                      <span>Total a Pagar:</span>
                      <span>R$ {(
                        parseFloat(paymentAmount || '0') + 
                        parseFloat(interestAmount || '0') - 
                        parseFloat(discountAmount || '0')
                      ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPayingPayable(null);
                    setPaymentAmount('');
                    setPaymentDate(new Date().toISOString().split('T')[0]);
                    setDiscountAmount('0');
                    setInterestAmount('0');
                    setPaymentNotes('');
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
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

export default AccountsPayable;
