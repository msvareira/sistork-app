import { useData } from '../contexts/DataContext';
import { 
  Users, 
  Package, 
  FileText, 
  Calendar, 
  ShoppingCart,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

export default function Dashboard() {
  const { clients, parts, quotes, appointments, sales } = useData();

  // Status helper functions
  const getStatusLabel = (status: string) => {
    const labels = {
      'pending': 'Pendente',
      'approved': 'Aprovado',
      'in_progress': 'Em Execução',
      'completed': 'Concluído',
      'paid': 'Pago',
      'rejected': 'Rejeitado',
      'expired': 'Expirado'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-orange-100 text-orange-800',
      'completed': 'bg-green-100 text-green-800',
      'paid': 'bg-emerald-100 text-emerald-800',
      'rejected': 'bg-red-100 text-red-800',
      'expired': 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const lowStockItems = parts.filter(p => p.quantity < 5).length;
  const pendingQuotes = quotes.filter(q => q.status === 'pending').length;
  const approvedQuotes = quotes.filter(q => q.status === 'approved').length;
  const inProgressQuotes = quotes.filter(q => q.status === 'in_progress').length;
  const completedQuotes = quotes.filter(q => q.status === 'completed').length;
  const paidQuotes = quotes.filter(q => q.status === 'paid').length;

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);

  const stats = [
    {
      title: 'Total de Clientes',
      value: clients.length,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Itens em Estoque',
      value: parts.length,
      icon: Package,
      color: 'bg-purple-500',
      change: '-3%'
    },
    {
      title: 'Orçamentos Pendentes',
      value: pendingQuotes,
      icon: FileText,
      color: 'bg-yellow-500',
      change: '+5%'
    },
    {
      title: 'Orçamentos Aprovados',
      value: approvedQuotes,
      icon: FileText,
      color: 'bg-blue-500',
      change: '+10%'
    },
    {
      title: 'Orçamentos em Execução',
      value: inProgressQuotes,
      icon: TrendingUp,
      color: 'bg-orange-500',
      change: '+8%'
    },
    {
      title: 'Orçamentos Finalizados',
      value: completedQuotes + paidQuotes,
      icon: Calendar,
      color: 'bg-green-500',
      change: '+15%'
    },
    {
      title: 'Vendas do Mês',
      value: `R$ ${totalRevenue.toFixed(2)}`,
      icon: ShoppingCart,
      color: 'bg-green-600',
      change: '+22%'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          <span className="text-sm text-green-600 font-medium">Sistema Online</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-full`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className={`text-sm font-medium ${
                  stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 ml-2">vs mês anterior</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alerts */}
      {lowStockItems > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-yellow-800 font-medium">
              {lowStockItems} {lowStockItems === 1 ? 'item' : 'itens'} com estoque baixo
            </span>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Orçamentos Recentes</h3>
          <div className="space-y-3">
            {quotes.slice(0, 5).map((quote) => {
              const client = clients.find(c => c.id === quote.clientId);
              
              return (
                <div key={quote.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Orçamento #{quote.id}</p>
                    <p className="text-sm text-gray-500">Cliente: {client?.name}</p>
                    <p className="text-sm font-medium text-green-600">Total: R$ {quote.total.toFixed(2)}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(quote.status)}`}>
                    {getStatusLabel(quote.status)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Próximos Agendamentos</h3>
          <div className="space-y-3">
            {appointments.slice(0, 5).map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{appointment.service}</p>
                  <p className="text-sm text-gray-500">
                    {appointment.client?.name} - {appointment.time}
                  </p>
                </div>
                <span className="text-sm text-gray-600">
                  {new Date(appointment.date).toLocaleDateString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}