import React, { useState, useEffect } from 'react';
import { Plus, Search, ShoppingCart, CreditCard, DollarSign, Receipt, X, Minus } from 'lucide-react';
import { apiClient as api } from '../services/api';

interface Product {
  id: number;
  name: string;
  internal_code: string;
  sell_price: number;
  quantity: number;
}

interface SaleItem {
  id?: number;
  part_id?: number;
  item_type: string;
  item_name: string;
  item_code?: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  total_price: number;
  part?: Product;
}

interface Client {
  id: number;
  name: string;
  phone: string;
}

interface Sale {
  id?: number;
  sale_number?: string;
  client_id?: number;
  status: string;
  payment_status: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  client?: Client;
}

interface SaleResponse {
  message: string;
  sale: Sale;
}

interface PaymentResponse {
  message: string;
  payment: any;
  change: number;
  remaining: number;
}

const PDV: React.FC = () => {
  const [currentSale, setCurrentSale] = useState<Sale>({
    status: 'pending',
    payment_status: 'pending',
    subtotal: 0,
    discount_amount: 0,
    tax_amount: 0,
    total_amount: 0
  });

  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados do modal de pagamento
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentReference, setPaymentReference] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchProducts();
    } else if (searchTerm.length === 0) {
      setProducts([]);
    }
  }, [searchTerm]);

  useEffect(() => {
    calculateTotals();
  }, [saleItems, currentSale.discount_amount, currentSale.tax_amount]);

  const loadClients = async () => {
    try {
      const response = await api.get<any>('/clients');
      // A resposta pode vir como {data: []} ou direto como []
      const clientsData = response.data ? response.data : response;
      setClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const searchProducts = async () => {
    try {
      console.log('Buscando produtos com termo:', searchTerm);
      const response = await api.get<Product[]>(`/products/search?q=${searchTerm}`);
      console.log('Resposta da busca:', response);
      
      // A resposta pode vir direto como array ou encapsulada
      const productsData = Array.isArray(response) ? response : (response as any).data || [];
      console.log('Produtos encontrados:', productsData);
      setProducts(productsData);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      setProducts([]);
    }
  };

  const addManualItem = () => {
    const newItem: SaleItem = {
      item_type: 'other',
      item_name: 'Item Manual',
      item_code: 'MANUAL-001',
      quantity: 1,
      unit_price: 10.00,
      discount_amount: 0,
      total_price: 10.00
    };
    setSaleItems([...saleItems, newItem]);
  };

  const addProductToSale = (product: Product) => {
    const existingItem = saleItems.find(item => item.part_id === product.id);
    
    if (existingItem) {
      // Se o produto já existe, aumentar a quantidade
      updateItemQuantity(existingItem, existingItem.quantity + 1);
    } else {
      // Adicionar novo item
      const newItem: SaleItem = {
        part_id: product.id,
        item_type: 'part',
        item_name: product.name,
        item_code: product.internal_code,
        quantity: 1,
        unit_price: product.sell_price,
        discount_amount: 0,
        total_price: product.sell_price,
        part: product
      };
      setSaleItems([...saleItems, newItem]);
    }
    setSearchTerm('');
    setProducts([]);
  };

  const updateItemQuantity = (item: SaleItem, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(item);
      return;
    }

    const updatedItems = saleItems.map(saleItem => {
      if (saleItem === item) {
        const totalPrice = (newQuantity * saleItem.unit_price) - saleItem.discount_amount;
        return {
          ...saleItem,
          quantity: newQuantity,
          total_price: totalPrice
        };
      }
      return saleItem;
    });
    setSaleItems(updatedItems);
  };

  const updateItemPrice = (item: SaleItem, newPrice: number) => {
    const updatedItems = saleItems.map(saleItem => {
      if (saleItem === item) {
        const totalPrice = (saleItem.quantity * newPrice) - saleItem.discount_amount;
        return {
          ...saleItem,
          unit_price: newPrice,
          total_price: totalPrice
        };
      }
      return saleItem;
    });
    setSaleItems(updatedItems);
  };

  const updateItemDiscount = (item: SaleItem, discount: number) => {
    const updatedItems = saleItems.map(saleItem => {
      if (saleItem === item) {
        const totalPrice = (saleItem.quantity * saleItem.unit_price) - discount;
        return {
          ...saleItem,
          discount_amount: discount,
          total_price: totalPrice
        };
      }
      return saleItem;
    });
    setSaleItems(updatedItems);
  };

  const removeItem = (item: SaleItem) => {
    setSaleItems(saleItems.filter(saleItem => saleItem !== item));
  };

  const calculateTotals = () => {
    const subtotal = saleItems.reduce((sum, item) => sum + item.total_price, 0);
    const total = subtotal - currentSale.discount_amount + currentSale.tax_amount;
    
    setCurrentSale(prev => ({
      ...prev,
      subtotal,
      total_amount: total
    }));
  };

  const saveSale = async () => {
    if (saleItems.length === 0) {
      alert('Adicione pelo menos um item à venda');
      return;
    }

    console.log('Iniciando salvamento da venda...');
    console.log('Itens da venda:', saleItems);
    
    setLoading(true);
    try {
      const saleData = {
        client_id: selectedClient?.id,
        items: saleItems.map(item => ({
          part_id: item.part_id,
          item_type: item.item_type,
          item_name: item.item_name,
          item_code: item.item_code,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_amount: item.discount_amount
        })),
        discount_amount: currentSale.discount_amount,
        tax_amount: currentSale.tax_amount,
        notes: currentSale.notes
      };

      console.log('Dados da venda a serem enviados:', saleData);

      const response = await api.post<SaleResponse>('/sales', saleData);
      console.log('Resposta da API:', response);
      
      const savedSale = response.sale;
      
      setCurrentSale(prev => ({
        ...prev,
        id: savedSale.id,
        sale_number: savedSale.sale_number
      }));

      alert('Venda salva com sucesso!');
      
      // Se o total for zero, finalizar automaticamente
      if (savedSale.total_amount === 0) {
        await completeSale(savedSale.id);
      }
      
    } catch (error: any) {
      console.error('Erro ao salvar venda:', error);
      alert('Erro ao salvar venda: ' + (error.response?.data?.message || error.message));
    }
    setLoading(false);
  };

  const processPayment = async () => {
    if (!currentSale.id) {
      await saveSale();
      if (!currentSale.id) return;
    }

    setLoading(true);
    try {
      const paymentData = {
        payment_method: paymentMethod,
        amount: parseFloat(paymentAmount),
        reference: paymentReference
      };

      const response = await api.post<PaymentResponse>(`/sales/${currentSale.id}/payments`, paymentData);
      
      alert(`Pagamento processado! ${response.change > 0 ? `Troco: R$ ${response.change.toFixed(2)}` : ''}`);
      
      // Se não há valor restante, finalizar a venda
      if (response.remaining <= 0) {
        await completeSale(currentSale.id);
      }
      
      setShowPaymentModal(false);
      resetPaymentForm();
      
    } catch (error: any) {
      console.error('Erro ao processar pagamento:', error);
      alert('Erro ao processar pagamento: ' + (error.response?.data?.message || error.message));
    }
    setLoading(false);
  };

  const completeSale = async (saleId?: number) => {
    const id = saleId || currentSale.id;
    if (!id) return;

    try {
      await api.post(`/sales/${id}/complete`);
      alert('Venda finalizada com sucesso!');
      newSale();
    } catch (error: any) {
      console.error('Erro ao finalizar venda:', error);
      alert('Erro ao finalizar venda: ' + (error.response?.data?.message || error.message));
    }
  };

  const newSale = () => {
    setCurrentSale({
      status: 'pending',
      payment_status: 'pending',
      subtotal: 0,
      discount_amount: 0,
      tax_amount: 0,
      total_amount: 0
    });
    setSaleItems([]);
    setSelectedClient(null);
    setSearchTerm('');
    setProducts([]);
  };

  const resetPaymentForm = () => {
    setPaymentMethod('cash');
    setPaymentAmount('');
    setPaymentReference('');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Painel Principal - Lista de Produtos */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">
              PDV - Ponto de Venda
              {currentSale.sale_number && (
                <span className="text-sm text-gray-500 ml-2">#{currentSale.sale_number}</span>
              )}
            </h1>
            <button
              onClick={newSale}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Nova Venda
            </button>
          </div>
        </div>

        {/* Busca de Produtos */}
        <div className="bg-white p-4 border-b">
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar produtos por nome ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              onClick={addManualItem}
              className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Item Manual
            </button>
          </div>

          {/* Resultados da Busca */}
          {products.length > 0 && (
            <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => addProductToSale(product)}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-800">{product.name}</div>
                      <div className="text-sm text-gray-500">
                        Código: {product.internal_code} | Estoque: {product.quantity}
                      </div>
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      R$ {product.sell_price.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lista de Itens da Venda */}
        <div className="flex-1 overflow-y-auto bg-white">
          {saleItems.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <ShoppingCart className="mx-auto w-16 h-16 mb-4 text-gray-300" />
                <p>Nenhum item na venda</p>
                <p className="text-sm">Use a busca acima para adicionar produtos</p>
              </div>
            </div>
          ) : (
            <div className="p-4">
              {saleItems.map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 mb-3 border">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">{item.item_name}</h3>
                      <p className="text-sm text-gray-500">Código: {item.item_code}</p>
                    </div>
                    <button
                      onClick={() => removeItem(item)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-4 gap-4 items-center">
                    {/* Quantidade */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Qtd</label>
                      <div className="flex items-center">
                        <button
                          onClick={() => updateItemQuantity(item, item.quantity - 1)}
                          className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded-l"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(item, parseInt(e.target.value) || 0)}
                          className="w-16 text-center border-t border-b border-gray-200 py-1"
                          min="1"
                        />
                        <button
                          onClick={() => updateItemQuantity(item, item.quantity + 1)}
                          className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded-r"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Preço Unitário */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Preço Un.</label>
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateItemPrice(item, parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-right"
                        step="0.01"
                      />
                    </div>

                    {/* Desconto */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Desconto</label>
                      <input
                        type="number"
                        value={item.discount_amount}
                        onChange={(e) => updateItemDiscount(item, parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-right"
                        step="0.01"
                      />
                    </div>

                    {/* Total */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Total</label>
                      <div className="text-lg font-bold text-green-600 text-right">
                        R$ {item.total_price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Painel Lateral - Resumo da Venda */}
      <div className="w-96 bg-white shadow-lg border-l flex flex-col">
        {/* Cliente */}
        <div className="p-4 border-b">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cliente (Opcional)
          </label>
          <select
            value={selectedClient?.id || ''}
            onChange={(e) => {
              const client = clients.find(c => c.id === parseInt(e.target.value));
              setSelectedClient(client || null);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecionar cliente...</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        {/* Resumo Financeiro */}
        <div className="p-4 border-b">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">R$ {currentSale.subtotal.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Desconto:</span>
              <input
                type="number"
                value={currentSale.discount_amount}
                onChange={(e) => setCurrentSale(prev => ({
                  ...prev,
                  discount_amount: parseFloat(e.target.value) || 0
                }))}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-right"
                step="0.01"
              />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Taxa/Frete:</span>
              <input
                type="number"
                value={currentSale.tax_amount}
                onChange={(e) => setCurrentSale(prev => ({
                  ...prev,
                  tax_amount: parseFloat(e.target.value) || 0
                }))}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-right"
                step="0.01"
              />
            </div>
            
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">Total:</span>
                <span className="text-2xl font-bold text-green-600">
                  R$ {currentSale.total_amount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Observações */}
        <div className="p-4 border-b">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observações
          </label>
          <textarea
            value={currentSale.notes || ''}
            onChange={(e) => setCurrentSale(prev => ({
              ...prev,
              notes: e.target.value
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
            rows={3}
            placeholder="Observações sobre a venda..."
          />
        </div>

        {/* Ações */}
        <div className="flex-1 flex flex-col justify-end p-4 space-y-3">
          <button
            onClick={saveSale}
            disabled={loading || saleItems.length === 0}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <Receipt className="w-5 h-5 mr-2" />
            Salvar Venda
          </button>
          
          <button
            onClick={() => setShowPaymentModal(true)}
            disabled={loading || saleItems.length === 0}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Processar Pagamento
          </button>
        </div>
      </div>

      {/* Modal de Pagamento */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Processar Pagamento</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de Pagamento
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="cash">Dinheiro</option>
                  <option value="card">Cartão</option>
                  <option value="pix">PIX</option>
                  <option value="credit">Crediário</option>
                  <option value="transfer">Transferência</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor do Pagamento
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  step="0.01"
                  placeholder={`R$ ${currentSale.total_amount.toFixed(2)}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Referência (Opcional)
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Número da transação, cheque, etc."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={processPayment}
                disabled={loading || !paymentAmount}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDV;
