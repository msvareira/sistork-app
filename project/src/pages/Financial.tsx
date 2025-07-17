import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar, BarChart3, FileText, Plus } from 'lucide-react';
import { apiClient as api } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface FinancialSummary {
  totalReceivables: number;
  totalPayables: number;
  totalReceived: number;
  totalPaid: number;
  netCashFlow: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  pendingReceivables: number;
  pendingPayables: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

const Financial: React.FC = () => {
  const [summary, setSummary] = useState<FinancialSummary>({
    totalReceivables: 0,
    totalPayables: 0,
    totalReceived: 0,
    totalPaid: 0,
    netCashFlow: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    pendingReceivables: 0,
    pendingPayables: 0,
  });

  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      
      const [summaryResponse, monthlyResponse] = await Promise.allSettled([
        api.get('/financial/summary'),
        api.get('/financial/monthly-data')
      ]);

      if (summaryResponse.status === 'fulfilled') {
        setSummary((summaryResponse.value as any) || summary);
      }

      if (monthlyResponse.status === 'fulfilled') {
        setMonthlyData((monthlyResponse.value as any).data || []);
      }

    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
    } finally {
      setLoading(false);
    }
  };

  const FinancialCard: React.FC<{
    title: string;
    value: number;
    icon: React.ElementType;
    color: string;
    subtitle?: string;
    onClick?: () => void;
  }> = ({ title, value, icon: Icon, color, subtitle, onClick }) => (
    <div 
      className={`bg-white rounded-lg shadow p-6 ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const QuickActionCard: React.FC<{
    title: string;
    description: string;
    icon: React.ElementType;
    color: string;
    onClick: () => void;
  }> = ({ title, description, icon: Icon, color, onClick }) => (
    <div 
      className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <div className="flex items-center mb-4">
        <div className={`p-2 rounded-lg ${color} mr-3`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Controle Financeiro</h1>
        <p className="text-gray-600">Gerencie suas finanças de forma completa</p>
      </div>

      {/* Cards de Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <FinancialCard
          title="Contas a Receber"
          value={summary.pendingReceivables}
          icon={TrendingUp}
          color="bg-green-500"
          subtitle="Valores pendentes"
          onClick={() => navigate('/accounts-receivable')}
        />
        <FinancialCard
          title="Contas a Pagar"
          value={summary.pendingPayables}
          icon={TrendingDown}
          color="bg-red-500"
          subtitle="Valores pendentes"
          onClick={() => navigate('/accounts-payable')}
        />
        <FinancialCard
          title="Fluxo de Caixa"
          value={summary.netCashFlow}
          icon={DollarSign}
          color={summary.netCashFlow >= 0 ? "bg-green-500" : "bg-red-500"}
          subtitle="Saldo atual"
          onClick={() => navigate('/cash-flow')}
        />
      </div>

      {/* Segunda linha de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <FinancialCard
          title="Receitas do Mês"
          value={summary.monthlyRevenue}
          icon={TrendingUp}
          color="bg-blue-500"
          subtitle="Faturamento mensal"
        />
        <FinancialCard
          title="Despesas do Mês"
          value={summary.monthlyExpenses}
          icon={TrendingDown}
          color="bg-orange-500"
          subtitle="Gastos mensais"
        />
        <FinancialCard
          title="Lucro do Mês"
          value={summary.monthlyRevenue - summary.monthlyExpenses}
          icon={BarChart3}
          color={summary.monthlyRevenue - summary.monthlyExpenses >= 0 ? "bg-green-500" : "bg-red-500"}
          subtitle="Resultado mensal"
        />
      </div>

      {/* Ações Rápidas */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <QuickActionCard
            title="Nova Receita"
            description="Registrar uma nova entrada de dinheiro"
            icon={Plus}
            color="bg-green-500"
            onClick={() => navigate('/accounts-receivable/new')}
          />
          <QuickActionCard
            title="Nova Despesa"
            description="Registrar uma nova saída de dinheiro"
            icon={Plus}
            color="bg-red-500"
            onClick={() => navigate('/accounts-payable/new')}
          />
          <QuickActionCard
            title="Relatórios"
            description="Visualizar relatórios financeiros"
            icon={FileText}
            color="bg-purple-500"
            onClick={() => navigate('/reports')}
          />
          <QuickActionCard
            title="Fluxo de Caixa"
            description="Acompanhar entradas e saídas"
            icon={Calendar}
            color="bg-blue-500"
            onClick={() => navigate('/cash-flow')}
          />
        </div>
      </div>

      {/* Gráfico de Evolução Mensal */}
      {monthlyData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Evolução Mensal</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-sm font-medium text-gray-600">Mês</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-600">Receitas</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-600">Despesas</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-600">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((data, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 text-sm font-medium text-gray-900">{data.month}</td>
                    <td className="py-3 text-sm font-medium text-green-600">
                      R$ {data.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 text-sm font-medium text-red-600">
                      R$ {data.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 text-sm font-medium">
                      <span className={data.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                        R$ {data.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Financial;
