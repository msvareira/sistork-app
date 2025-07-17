import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, DollarSign, Filter, Download, RefreshCw } from 'lucide-react';
import { apiClient as api } from '../services/api';

interface CashFlowEntry {
  id: number;
  date: string;
  description: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  source: 'sale' | 'receivable' | 'payable' | 'manual';
  reference_id?: number;
}

interface CashFlowSummary {
  totalIncome: number;
  totalExpense: number;
  netFlow: number;
  balance: number;
  periodIncome: number;
  periodExpense: number;
}

interface DailySummary {
  date: string;
  income: number;
  expense: number;
  balance: number;
}

const CashFlow: React.FC = () => {
  const [entries, setEntries] = useState<CashFlowEntry[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummary[]>([]);
  const [summary, setSummary] = useState<CashFlowSummary>({
    totalIncome: 0,
    totalExpense: 0,
    netFlow: 0,
    balance: 0,
    periodIncome: 0,
    periodExpense: 0,
  });
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    loadCashFlow();
  }, [startDate, endDate, typeFilter]);

  const loadCashFlow = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        ...(typeFilter !== 'all' && { type: typeFilter })
      });

      const [entriesResponse, summaryResponse, dailyResponse] = await Promise.allSettled([
        api.get(`/cash-flow/entries?${params}`),
        api.get(`/cash-flow/summary?${params}`),
        api.get(`/cash-flow/daily?${params}`)
      ]);

      if (entriesResponse.status === 'fulfilled') {
        const data = (entriesResponse.value as any);
        setEntries(data.data || []);
      }

      if (summaryResponse.status === 'fulfilled') {
        const data = (summaryResponse.value as any);
        setSummary(data || summary);
      }

      if (dailyResponse.status === 'fulfilled') {
        const data = (dailyResponse.value as any);
        setDailySummary(data.data || []);
      }

    } catch (error) {
      console.error('Erro ao carregar fluxo de caixa:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'income' ? 'text-green-600' : 'text-red-600';
  };

  const getTypeIcon = (type: string) => {
    return type === 'income' ? TrendingUp : TrendingDown;
  };

  const getSourceText = (source: string) => {
    switch (source) {
      case 'sale':
        return 'Venda';
      case 'receivable':
        return 'Recebimento';
      case 'payable':
        return 'Pagamento';
      case 'manual':
        return 'Manual';
      default:
        return source;
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Data', 'Descrição', 'Tipo', 'Valor', 'Categoria', 'Origem'].join(','),
      ...entries.map(entry => [
        new Date(entry.date).toLocaleDateString('pt-BR'),
        entry.description,
        entry.type === 'income' ? 'Receita' : 'Despesa',
        entry.amount.toFixed(2),
        entry.category,
        getSourceText(entry.source)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `fluxo-caixa-${startDate}-${endDate}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
            ))}
          </div>
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
            <h1 className="text-3xl font-bold text-gray-900">Fluxo de Caixa</h1>
            <p className="text-gray-600">Acompanhe as entradas e saídas de dinheiro</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadCashFlow}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </button>
            <button
              onClick={exportData}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Receitas</p>
                <p className="text-xl font-bold text-green-600">
                  R$ {summary.periodIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Despesas</p>
                <p className="text-xl font-bold text-red-600">
                  R$ {summary.periodExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Saldo do Período</p>
                <p className={`text-xl font-bold ${summary.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {summary.netFlow.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className={`w-8 h-8 ${summary.netFlow >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Saldo Atual</p>
                <p className={`text-xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {summary.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className={`w-8 h-8 ${summary.balance >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Período:</span>
          </div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <span className="text-gray-500">até</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os Tipos</option>
              <option value="income">Receitas</option>
              <option value="expense">Despesas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Resumo Diário */}
      {dailySummary.length > 0 && (
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Resumo Diário</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {dailySummary.slice(-7).map((day, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-sm font-medium text-gray-600 mb-2">
                    {new Date(day.date).toLocaleDateString('pt-BR', { 
                      day: '2-digit', 
                      month: '2-digit' 
                    })}
                  </div>
                  <div className="text-xs text-green-600 mb-1">
                    +R$ {day.income.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </div>
                  <div className="text-xs text-red-600 mb-2">
                    -R$ {day.expense.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </div>
                  <div className={`text-sm font-bold ${day.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {day.balance.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lista de Movimentações */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Movimentações</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Origem
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entries.map((entry) => {
                const TypeIcon = getTypeIcon(entry.type);
                return (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(entry.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{entry.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <TypeIcon className={`w-4 h-4 mr-2 ${getTypeColor(entry.type)}`} />
                        <span className={`text-sm font-medium ${getTypeColor(entry.type)}`}>
                          {entry.type === 'income' ? 'Receita' : 'Despesa'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-bold ${getTypeColor(entry.type)}`}>
                        {entry.type === 'income' ? '+' : '-'}R$ {entry.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getSourceText(entry.source)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {entries.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma movimentação encontrada para o período selecionado</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CashFlow;
