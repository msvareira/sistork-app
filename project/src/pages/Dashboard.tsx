import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Users, ShoppingCart, AlertCircle } from 'lucide-react';
import { apiClient as api } from '../services/api';

interface DashboardStats {
  totalSales: number;
  totalRevenue: number;
  pendingReceivables: number;
  pendingPayables: number;
  lowStockItems: number;
  totalClients: number;
  monthlyGrowth: number;
  cashFlow: number;
}

interface RecentSale {
  id: number;
  sale_number: string;
  client_name?: string;
  total_amount: number;
  status: string;
  created_at: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalRevenue: 0,
    pendingReceivables: 0,
    pendingPayables: 0,
    lowStockItems: 0,
    totalClients: 0,
    monthlyGrowth: 0,
    cashFlow: 0,
  });

  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Carregar estatísticas
      const [
        salesResponse,
        clientsResponse,
        stockResponse,
        receivablesResponse,
        payablesResponse,
        recentSalesResponse
      ] = await Promise.allSettled([
        api.get('/sales/stats'),
        api.get('/clients/count'),
        api.get('/parts/low-stock'),
        api.get('/accounts-receivable/pending'),
        api.get('/accounts-payable/pending'),
        api.get('/sales/recent?limit=5')
      ]);

      // Processar respostas
      if (salesResponse.status === 'fulfilled') {
        const salesData = salesResponse.value as any;
        setStats(prev => ({
          ...prev,
          totalSales: salesData.total_sales || 0,
          totalRevenue: salesData.total_revenue || 0,
          monthlyGrowth: salesData.monthly_growth || 0,
        }));
      }

      if (clientsResponse.status === 'fulfilled') {
        setStats(prev => ({ ...prev, totalClients: (clientsResponse.value as any).count || 0 }));
      }

      if (stockResponse.status === 'fulfilled') {
        setStats(prev => ({ ...prev, lowStockItems: (stockResponse.value as any).length || 0 }));
      }

      if (receivablesResponse.status === 'fulfilled') {
        setStats(prev => ({ ...prev, pendingReceivables: (receivablesResponse.value as any).total || 0 }));
      }

      if (payablesResponse.status === 'fulfilled') {
        setStats(prev => ({ ...prev, pendingPayables: (payablesResponse.value as any).total || 0 }));
      }

      if (recentSalesResponse.status === 'fulfilled') {
        setRecentSales((recentSalesResponse.value as any).sales || []);
      }

      // Calcular fluxo de caixa
      setStats(prev => ({
        ...prev,
        cashFlow: prev.totalRevenue - prev.pendingPayables
      }));

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
    trend?: number;
  }> = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend !== undefined && (
            <p className={`text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? '+' : ''}{trend.toFixed(1)}% vs mês anterior
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
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
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Visão geral do seu negócio</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Vendas do Mês"
          value={stats.totalSales}
          icon={ShoppingCart}
          color="bg-blue-500"
          trend={stats.monthlyGrowth}
        />
        <StatCard
          title="Receita Total"
          value={`R$ ${stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          color="bg-green-500"
        />
        <StatCard
          title="A Receber"
          value={`R$ ${stats.pendingReceivables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
          color="bg-yellow-500"
        />
        <StatCard
          title="A Pagar"
          value={`R$ ${stats.pendingPayables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={TrendingDown}
          color="bg-red-500"
        />
      </div>

      {/* Segunda linha de cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Clientes Ativos"
          value={stats.totalClients}
          icon={Users}
          color="bg-purple-500"
        />
        <StatCard
          title="Produtos em Falta"
          value={stats.lowStockItems}
          icon={AlertCircle}
          color="bg-orange-500"
        />
        <StatCard
          title="Fluxo de Caixa"
          value={`R$ ${stats.cashFlow.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
          color={stats.cashFlow >= 0 ? "bg-green-500" : "bg-red-500"}
        />
      </div>

      {/* Vendas Recentes */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Vendas Recentes</h2>
        </div>
        <div className="p-6">
          {recentSales.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Nenhuma venda encontrada</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-sm font-medium text-gray-600">Número</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-600">Cliente</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-600">Valor</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-600">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((sale) => (
                    <tr key={sale.id} className="border-b border-gray-100">
                      <td className="py-3 text-sm font-medium text-gray-900">
                        {sale.sale_number}
                      </td>
                      <td className="py-3 text-sm text-gray-600">
                        {sale.client_name || 'Cliente Avulso'}
                      </td>
                      <td className="py-3 text-sm font-medium text-green-600">
                        R$ {sale.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          sale.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {sale.status === 'completed' ? 'Concluída' : 'Pendente'}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-gray-600">
                        {new Date(sale.created_at).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
