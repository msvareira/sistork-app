import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { SaleItem } from '../types';
import { 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  User,
  Search,
  Receipt,
  X
} from 'lucide-react';

export default function POS() {
  const { parts, clients, addSale } = useData();
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [clientId, setClientId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);

  const filteredParts = parts.filter(part =>
    part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.internalCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (partId: string) => {
    const part = parts.find(p => p.id === partId);
    if (!part) return;

    const existingItem = cart.find(item => item.partId === partId);
    if (existingItem) {
      setCart(cart.map(item =>
        item.partId === partId
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
          : item
      ));
    } else {
      setCart([...cart, {
        partId,
        part,
        quantity: 1,
        unitPrice: part.sellPrice,
        total: part.sellPrice
      }]);
    }
  };

  const updateQuantity = (partId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(partId);
      return;
    }

    setCart(cart.map(item =>
      item.partId === partId
        ? { ...item, quantity, total: quantity * item.unitPrice }
        : item
    ));
  };

  const removeFromCart = (partId: string) => {
    setCart(cart.filter(item => item.partId !== partId));
  };

  const clearCart = () => {
    setCart([]);
    setClientId('');
    setCustomerName('');
  };

  const total = cart.reduce((sum, item) => sum + item.total, 0);

  const handleSale = () => {
    if (cart.length === 0) {
      alert('Adicione pelo menos um item ao carrinho');
      return;
    }

    const saleData = {
      clientId: clientId || undefined,
      customerName: customerName || undefined,
      items: cart,
      total
    };

    addSale(saleData);
    setLastSale(saleData);
    setShowReceipt(true);
    clearCart();
  };

  const generateReceipt = () => {
    if (!lastSale) return;

    const client = clients.find(c => c.id === lastSale.clientId);
    const customerInfo = client ? client.name : lastSale.customerName || 'Cliente Avulso';
    
    const receiptContent = `
      OFICINA PRO - COMPROVANTE DE VENDA
      ================================
      
      Cliente: ${customerInfo}
      Data: ${new Date().toLocaleString('pt-BR')}
      
      ITENS:
      ${lastSale.items.map((item: SaleItem) => 
        `${item.part?.name} - Qtd: ${item.quantity} - R$ ${item.total.toFixed(2)}`
      ).join('\n')}
      
      ================================
      TOTAL: R$ ${lastSale.total.toFixed(2)}
      
      Obrigado pela preferência!
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `comprovante_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Ponto de Venda</h1>
        <div className="flex items-center space-x-2">
          <ShoppingCart className="h-6 w-6 text-gray-500" />
          <span className="text-lg font-semibold">{cart.length} itens</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar peças..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {filteredParts.map(part => (
                <div key={part.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{part.name}</h3>
                    <span className="text-sm text-gray-500">{part.internalCode}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-green-600">
                        R$ {part.sellPrice.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Estoque: {part.quantity}
                      </p>
                    </div>
                    <button
                      onClick={() => addToCart(part.id)}
                      disabled={part.quantity === 0}
                      className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Adicionar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Carrinho</h2>
          
          {/* Customer Info */}
          <div className="mb-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente (Opcional)
              </label>
              <select
                value={clientId}
                onChange={(e) => {
                  setClientId(e.target.value);
                  if (e.target.value) setCustomerName('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione um cliente</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ou nome do cliente avulso
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  if (e.target.value) setClientId('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nome do cliente"
              />
            </div>
          </div>

          {/* Cart Items */}
          <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Carrinho vazio
              </p>
            ) : (
              cart.map(item => (
                <div key={item.partId} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{item.part?.name}</h4>
                    <button
                      onClick={() => removeFromCart(item.partId)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.partId, item.quantity - 1)}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.partId, item.quantity + 1)}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        R$ {item.unitPrice.toFixed(2)} cada
                      </p>
                      <p className="font-semibold text-green-600">
                        R$ {item.total.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Total */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-2xl font-bold text-green-600">
                R$ {total.toFixed(2)}
              </span>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleSale}
                disabled={cart.length === 0}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Receipt className="h-5 w-5" />
                <span>Finalizar Venda</span>
              </button>
              
              <button
                onClick={clearCart}
                className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
              >
                Limpar Carrinho
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Venda Realizada</h2>
              <button
                onClick={() => setShowReceipt(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="text-center mb-6">
              <div className="text-4xl text-green-600 mb-2">✓</div>
              <p className="text-lg font-medium">Venda realizada com sucesso!</p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                R$ {lastSale?.total.toFixed(2)}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={generateReceipt}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
              >
                <Receipt className="h-5 w-5" />
                <span>Baixar Comprovante</span>
              </button>
              
              <button
                onClick={() => setShowReceipt(false)}
                className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
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