import React, { useState, useEffect } from 'react';
import { BarChart3, PieChart, TrendingUp, Download, Calendar, Eye, FileText } from 'lucide-react';
import { apiClient as api } from '../services/api';

interface ReportData {
  salesByMonth: Array<{ month: string; sales: number; revenue: number }>;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  topClients: Array<{ name: string; orders: number; total: number }>;
  expensesByCategory: Array<{ category: string; amount: number; percentage: number }>;
  profitAnalysis: {
    totalRevenue: number;
    totalExpenses: number;
    grossProfit: number;
    netProfit: number;
    profitMargin: number;
  };
}

const Reports: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData>({
    salesByMonth: [],
    topProducts: [],
    topClients: [],
    expensesByCategory: [],
    profitAnalysis: {
      totalRevenue: 0,
      totalExpenses: 0,
      grossProfit: 0,
      netProfit: 0,
      profitMargin: 0,
    }
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('current_year');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadReports();
  }, [selectedPeriod, startDate, endDate]);

  const loadReports = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (selectedPeriod === 'custom' && startDate && endDate) {
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      } else {
        params.append('period', selectedPeriod);
      }

      const response = await api.get(`/reports/dashboard?${params}`);
      setReportData((response as any) || reportData);

    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDFReport = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedPeriod === 'custom' && startDate && endDate) {
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      } else {
        params.append('period', selectedPeriod);
      }

      // Simular download do PDF
      const response = await api.get(`/reports/pdf?${params}`);
      console.log('PDF gerado:', response);
      
      // Aqui você implementaria o download real do PDF
      alert('Relatório PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    }
  };

  const ReportCard: React.FC<{
    title: string;
    children: React.ReactNode;
    className?: string;
  }> = ({ title, children, className = "" }) => (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-64 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
            <p className="text-gray-600">Análise completa do seu negócio</p>
          </div>
          <button
            onClick={generatePDFReport}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Gerar PDF
          </button>
        </div>

        {/* Filtros de Período */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Período:</span>
            </div>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="current_month">Mês Atual</option>
              <option value="last_month">Mês Anterior</option>
              <option value="current_year">Ano Atual</option>
              <option value="last_year">Ano Anterior</option>
              <option value="custom">Período Personalizado</option>
            </select>
            
            {selectedPeriod === 'custom' && (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>

      {/* Análise de Lucros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Receita Total</p>
              <p className="text-xl font-bold text-green-600">
                R$ {reportData.profitAnalysis.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Despesas Totais</p>
              <p className="text-xl font-bold text-red-600">
                R$ {reportData.profitAnalysis.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Lucro Líquido</p>
              <p className={`text-xl font-bold ${reportData.profitAnalysis.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                R$ {reportData.profitAnalysis.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <TrendingUp className={`w-8 h-8 ${reportData.profitAnalysis.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Margem de Lucro</p>
              <p className={`text-xl font-bold ${reportData.profitAnalysis.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {reportData.profitAnalysis.profitMargin.toFixed(1)}%
              </p>
            </div>
            <PieChart className={`w-8 h-8 ${reportData.profitAnalysis.profitMargin >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          </div>
        </div>
      </div>

      {/* Gráficos e Relatórios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Vendas por Mês */}
        <ReportCard title="Vendas por Mês">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-sm font-medium text-gray-600">Mês</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-600">Vendas</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-600">Receita</th>
                </tr>
              </thead>
              <tbody>
                {reportData.salesByMonth.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-2 text-sm text-gray-900">{item.month}</td>
                    <td className="py-2 text-sm text-gray-600">{item.sales}</td>
                    <td className="py-2 text-sm font-medium text-green-600">
                      R$ {item.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {reportData.salesByMonth.length === 0 && (
            <p className="text-gray-500 text-center py-4">Nenhum dado disponível</p>
          )}
        </ReportCard>

        {/* Produtos Mais Vendidos */}
        <ReportCard title="Produtos Mais Vendidos">
          <div className="space-y-3">
            {reportData.topProducts.map((product, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-600">{product.quantity} unidades</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    R$ {product.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {reportData.topProducts.length === 0 && (
            <p className="text-gray-500 text-center py-4">Nenhum produto encontrado</p>
          )}
        </ReportCard>

        {/* Melhores Clientes */}
        <ReportCard title="Melhores Clientes">
          <div className="space-y-3">
            {reportData.topClients.map((client, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{client.name}</p>
                  <p className="text-sm text-gray-600">{client.orders} pedidos</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">
                    R$ {client.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {reportData.topClients.length === 0 && (
            <p className="text-gray-500 text-center py-4">Nenhum cliente encontrado</p>
          )}
        </ReportCard>

        {/* Despesas por Categoria */}
        <ReportCard title="Despesas por Categoria">
          <div className="space-y-3">
            {reportData.expensesByCategory.map((expense, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-medium text-gray-900">{expense.category}</p>
                    <p className="text-sm font-bold text-red-600">
                      R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${expense.percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{expense.percentage.toFixed(1)}% do total</p>
                </div>
              </div>
            ))}
          </div>
          {reportData.expensesByCategory.length === 0 && (
            <p className="text-gray-500 text-center py-4">Nenhuma despesa encontrada</p>
          )}
        </ReportCard>
      </div>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <BarChart3 className="w-8 h-8 text-blue-500 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Relatório de Vendas</h3>
          </div>
          <p className="text-gray-600 mb-4">Análise detalhada das vendas por período, produto e cliente.</p>
          <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2">
            <Eye className="w-4 h-4" />
            Visualizar
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="w-8 h-8 text-green-500 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Relatório Financeiro</h3>
          </div>
          <p className="text-gray-600 mb-4">Demonstrativo de resultados e análise de fluxo de caixa.</p>
          <button className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2">
            <Eye className="w-4 h-4" />
            Visualizar
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <FileText className="w-8 h-8 text-purple-500 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Relatório de Estoque</h3>
          </div>
          <p className="text-gray-600 mb-4">Controle de estoque, produtos em falta e movimentações.</p>
          <button className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2">
            <Eye className="w-4 h-4" />
            Visualizar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;
