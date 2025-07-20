import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Download, Calendar, Package, DollarSign } from 'lucide-react';
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

interface SalesReport {
  sales: Array<{
    id: number;
    sale_number: string;
    client_name: string;
    total_amount: number;
    items_count: number;
    status: string;
    created_at: string;
    items: Array<{
      part_name: string;
      quantity: number;
      unit_price: number;
      total_price: number;
    }>;
  }>;
  summary: {
    total_sales: number;
    total_revenue: number;
    average_sale: number;
    period_start: string;
    period_end: string;
  };
}

interface FinancialReport {
  total_revenue: number;
  received_payments: number;
  total_expenses: number;
  net_profit: number;
  pending_receivables: number;
  pending_payables: number;
  cash_flow: number;
  monthly_flow: Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
}

interface InventoryReport {
  inventory: Array<{
    id: number;
    name: string;
    sku: string;
    current_stock: number;
    unit_price: number;
    total_value: number;
    sold_quantity: number;
    revenue_generated: number;
    status: string;
    supplier: string;
  }>;
  summary: {
    total_items: number;
    total_stock_value: number;
    low_stock_items: number;
    out_of_stock_items: number;
    most_sold_item: any;
    highest_revenue_item: any;
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
      profitMargin: 0
    }
  });

  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [financialReport, setFinancialReport] = useState<FinancialReport | null>(null);
  const [inventoryReport, setInventoryReport] = useState<InventoryReport | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadReports();
  }, [selectedPeriod, startDate, endDate, activeTab]);

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

      switch (activeTab) {
        case 'dashboard':
          const dashboardResponse = await api.get(`/test-reports/dashboard?${params}`);
          console.log('Dashboard response:', dashboardResponse);
          setReportData(dashboardResponse as any || reportData);
          break;
        
        case 'sales':
          const salesResponse = await api.get(`/test-reports/sales?${params}`);
          console.log('Sales response:', salesResponse);
          setSalesReport(salesResponse as any || salesReport);
          break;
        
        case 'financial':
          const financialResponse = await api.get(`/test-reports/financial?${params}`);
          console.log('Financial response:', financialResponse);
          setFinancialReport(financialResponse as any || financialReport);
          break;
        
        case 'inventory':
          const inventoryResponse = await api.get(`/test-reports/inventory?${params}`);
          console.log('Inventory response:', inventoryResponse);
          setInventoryReport(inventoryResponse as any || inventoryReport);
          break;
      }
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async (type: string) => {
    try {
      const params = new URLSearchParams();
      params.append('type', type);
      params.append('period', selectedPeriod);
      if (selectedPeriod === 'custom' && startDate && endDate) {
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }

      const response = await api.get(`/test-reports/pdf?${params}`);
      console.log('PDF gerado:', response);
      // Aqui você pode implementar o download real do PDF
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'current_month': return 'Mês Atual';
      case 'last_month': return 'Mês Anterior';
      case 'current_year': return 'Ano Atual';
      case 'last_year': return 'Ano Anterior';
      case 'custom': return 'Período Personalizado';
      default: return 'Mês Atual';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-lg shadow">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600">Análise completa do desempenho do negócio</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          {/* Filtro de Período */}
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="current_month">Mês Atual</option>
              <option value="last_month">Mês Anterior</option>
              <option value="current_year">Ano Atual</option>
              <option value="last_year">Ano Anterior</option>
              <option value="custom">Personalizado</option>
            </select>
            
            {selectedPeriod === 'custom' && (
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </div>
          
          <button
            onClick={() => downloadPdf(activeTab)}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
          >
            <Download className="h-4 w-4" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200 px-6">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'sales', label: 'Vendas', icon: TrendingUp },
              { id: 'financial', label: 'Financeiro', icon: DollarSign },
              { id: 'inventory', label: 'Estoque', icon: Package }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
        {/* Content */}
        {activeTab === 'dashboard' && (
          <div className="p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Dashboard - {getPeriodLabel()}</h2>
            
            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-blue-100 text-sm font-medium">Receita Total</p>
                    <p className="text-xl lg:text-2xl font-bold truncate">{formatCurrency(reportData.profitAnalysis.totalRevenue)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-200 flex-shrink-0 ml-4" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-green-100 text-sm font-medium">Lucro Líquido</p>
                    <p className="text-xl lg:text-2xl font-bold truncate">{formatCurrency(reportData.profitAnalysis.netProfit)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-200 flex-shrink-0 ml-4" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-purple-100 text-sm font-medium">Margem de Lucro</p>
                    <p className="text-xl lg:text-2xl font-bold">{reportData.profitAnalysis.profitMargin.toFixed(1)}%</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-200 flex-shrink-0 ml-4" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-orange-100 text-sm font-medium">Total de Despesas</p>
                    <p className="text-xl lg:text-2xl font-bold truncate">{formatCurrency(reportData.profitAnalysis.totalExpenses)}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-orange-200 flex-shrink-0 ml-4" />
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Vendas por Mês */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendas por Mês</h3>
                <div className="h-64 flex items-center justify-center">
                  {reportData.salesByMonth.length > 0 ? (
                    <div className="w-full space-y-3 max-h-48 overflow-y-auto">
                      {reportData.salesByMonth.map((item, index) => (
                        <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                          <span className="text-sm text-gray-600 font-medium">{item.month}</span>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-900">{item.sales} vendas</div>
                            <div className="text-xs text-gray-500">{formatCurrency(item.revenue)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhum dado disponível</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Top Produtos */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Produtos Mais Vendidos</h3>
                <div className="h-64 flex items-center justify-center">
                  {reportData.topProducts.length > 0 ? (
                    <div className="w-full space-y-3 max-h-48 overflow-y-auto">
                      {reportData.topProducts.slice(0, 5).map((product, index) => (
                        <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                          <span className="text-sm text-gray-600 font-medium truncate pr-4" title={product.name}>
                            {product.name}
                          </span>
                          <div className="text-right flex-shrink-0">
                            <div className="text-sm font-semibold text-gray-900">{product.quantity} un.</div>
                            <div className="text-xs text-gray-500">{formatCurrency(product.revenue)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center">
                      <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhum dado disponível</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Top Clientes */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Melhores Clientes</h3>
                <div className="h-64 flex items-center justify-center">
                  {reportData.topClients.length > 0 ? (
                    <div className="w-full space-y-3 max-h-48 overflow-y-auto">
                      {reportData.topClients.slice(0, 5).map((client, index) => (
                        <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                          <span className="text-sm text-gray-600 font-medium truncate pr-4" title={client.name}>
                            {client.name}
                          </span>
                          <div className="text-right flex-shrink-0">
                            <div className="text-sm font-semibold text-gray-900">{client.orders} pedidos</div>
                            <div className="text-xs text-gray-500">{formatCurrency(client.total)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhum dado disponível</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Despesas por Categoria */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Despesas por Categoria</h3>
                <div className="h-64 flex items-center justify-center">
                  {reportData.expensesByCategory.length > 0 ? (
                    <div className="w-full space-y-3 max-h-48 overflow-y-auto">
                      {reportData.expensesByCategory.map((expense, index) => (
                        <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                          <span className="text-sm text-gray-600 font-medium">{expense.category}</span>
                          <div className="text-right flex-shrink-0">
                            <div className="text-sm font-semibold text-gray-900">{formatCurrency(expense.amount)}</div>
                            <div className="text-xs text-gray-500">{expense.percentage}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center">
                      <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhum dado disponível</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Relatório de Vendas - {getPeriodLabel()}</h2>
            
            {salesReport && (
              <>
                {/* Resumo */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-xl lg:text-2xl font-bold text-blue-600">{salesReport.summary.total_sales}</div>
                    <div className="text-sm text-gray-600">Total de Vendas</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-xl lg:text-2xl font-bold text-green-600 truncate">{formatCurrency(salesReport.summary.total_revenue)}</div>
                    <div className="text-sm text-gray-600">Receita Total</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-xl lg:text-2xl font-bold text-purple-600 truncate">{formatCurrency(salesReport.summary.average_sale)}</div>
                    <div className="text-sm text-gray-600">Ticket Médio</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 col-span-2 lg:col-span-1">
                    <div className="text-sm lg:text-lg font-bold text-orange-600 break-words">
                      {salesReport.summary.period_start} - {salesReport.summary.period_end}
                    </div>
                    <div className="text-sm text-gray-600">Período</div>
                  </div>
                </div>

                {/* Lista de Vendas */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Venda
                          </th>
                          <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cliente
                          </th>
                          <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Valor
                          </th>
                          <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Items
                          </th>
                          <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Data
                          </th>
                          <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {salesReport.sales.map((sale) => (
                          <tr key={sale.id} className="hover:bg-gray-50">
                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {sale.sale_number}
                            </td>
                            <td className="px-4 lg:px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                              {sale.client_name}
                            </td>
                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(sale.total_amount)}
                            </td>
                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {sale.items_count} itens
                            </td>
                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(sale.created_at)}
                            </td>
                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                sale.status === 'completed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {sale.status === 'completed' ? 'Concluída' : 'Pendente'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Relatório Financeiro - {getPeriodLabel()}</h2>
            
            {financialReport && (
              <>
                {/* KPIs Financeiros */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 rounded-lg p-6">
                    <div className="text-xl lg:text-2xl font-bold text-green-600 truncate">{formatCurrency(financialReport.total_revenue)}</div>
                    <div className="text-sm text-gray-600">Receita Total</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-6">
                    <div className="text-xl lg:text-2xl font-bold text-red-600 truncate">{formatCurrency(financialReport.total_expenses)}</div>
                    <div className="text-sm text-gray-600">Despesas Totais</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-6">
                    <div className="text-xl lg:text-2xl font-bold text-blue-600 truncate">{formatCurrency(financialReport.net_profit)}</div>
                    <div className="text-sm text-gray-600">Lucro Líquido</div>
                  </div>
                </div>

                {/* Contas Pendentes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Contas a Receber</h3>
                    <div className="text-xl lg:text-2xl font-bold text-green-600 truncate">{formatCurrency(financialReport.pending_receivables)}</div>
                    <div className="text-sm text-gray-600">Pendente</div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Contas a Pagar</h3>
                    <div className="text-xl lg:text-2xl font-bold text-red-600 truncate">{formatCurrency(financialReport.pending_payables)}</div>
                    <div className="text-sm text-gray-600">Pendente</div>
                  </div>
                </div>

                {/* Fluxo de Caixa Mensal */}
                {financialReport.monthly_flow && financialReport.monthly_flow.length > 0 && (
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Fluxo de Caixa Mensal</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Mês
                            </th>
                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Receitas
                            </th>
                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Despesas
                            </th>
                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Lucro
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {financialReport.monthly_flow.map((month, index) => (
                            <tr key={index}>
                              <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {month.month}
                              </td>
                              <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-green-600">
                                {formatCurrency(month.revenue)}
                              </td>
                              <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                {formatCurrency(month.expenses)}
                              </td>
                              <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <span className={month.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {formatCurrency(month.profit)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Relatório de Estoque</h2>
            
            {inventoryReport && (
              <>
                {/* Resumo do Estoque */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-xl lg:text-2xl font-bold text-blue-600">{inventoryReport.summary.total_items}</div>
                    <div className="text-sm text-gray-600">Total de Itens</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-xl lg:text-2xl font-bold text-green-600 truncate">{formatCurrency(inventoryReport.summary.total_stock_value)}</div>
                    <div className="text-sm text-gray-600">Valor Total</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="text-xl lg:text-2xl font-bold text-yellow-600">{inventoryReport.summary.low_stock_items}</div>
                    <div className="text-sm text-gray-600">Estoque Baixo</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="text-xl lg:text-2xl font-bold text-red-600">{inventoryReport.summary.out_of_stock_items}</div>
                    <div className="text-sm text-gray-600">Sem Estoque</div>
                  </div>
                </div>

                {/* Lista de Produtos */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Produto
                          </th>
                          <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            SKU
                          </th>
                          <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estoque
                          </th>
                          <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Preço
                          </th>
                          <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Valor Total
                          </th>
                          <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Vendido
                          </th>
                          <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {inventoryReport.inventory.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 lg:px-6 py-4 text-sm font-medium text-gray-900 max-w-xs truncate">
                              {item.name}
                            </td>
                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.sku}
                            </td>
                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.current_stock}
                            </td>
                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(item.unit_price)}
                            </td>
                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(item.total_value)}
                            </td>
                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.sold_quantity}
                            </td>
                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                item.status === 'ok' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {item.status === 'ok' ? 'OK' : 'Estoque Baixo'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
