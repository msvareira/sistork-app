import React, { useState, useEffect } from 'react';
import { Plus, Search, ShoppingCart, CreditCard, X, Minus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient as api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ReceiptComponent from '../components/Receipt';

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
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Redirecionar para login se não autenticado
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Acesso Restrito</h2>
            <p className="text-gray-600 mb-4">Você precisa fazer login para acessar o PDV.</p>
            <button
              onClick={() => window.location.href = '/login'}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
            >
              Fazer Login
            </button>
          </div>
        </div>
      </div>
    );
  }

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
  const [error, setError] = useState<string | null>(null);

  // Estados do modal de pagamento
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentReference, setPaymentReference] = useState('');

  // Estados do comprovante
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastPaymentData, setLastPaymentData] = useState<{
    method: string;
    amount: number;
    change: number;
  } | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      // Debounce a busca para evitar muitas chamadas
      const timeoutId = setTimeout(() => {
        searchProducts();
      }, 500);
      return () => clearTimeout(timeoutId);
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
      setError(null); // Limpar erros anteriores
      console.log('Iniciando busca de produtos para:', searchTerm);
      console.log('Fazendo requisição para:', `/products/search?q=${encodeURIComponent(searchTerm)}`);
      
      const response = await api.get<Product[]>(`/products/search?q=${encodeURIComponent(searchTerm)}`);
      console.log('Resposta bruta da API:', response);
      
      // Verificar diferentes formatos de resposta
      let productsData: Product[] = [];
      
      if (Array.isArray(response)) {
        productsData = response;
      } else if (response && typeof response === 'object') {
        if (Array.isArray((response as any).data)) {
          productsData = (response as any).data;
        } else if (Array.isArray((response as any))) {
          productsData = response as any;
        }
      }
      
      console.log('Produtos processados:', productsData);
      setProducts(productsData);
    } catch (error) {
      console.error('Erro detalhado ao buscar produtos:', error);
      setError('Erro ao buscar produtos: ' + (error as any).message);
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
    try {
      if (!product || !product.id) {
        console.error('Produto inválido:', product);
        setError('Produto inválido selecionado');
        return;
      }

      console.log('Adicionando produto:', product.name);
      const existingItem = saleItems.find(item => item.part_id === product.id);
      
      if (existingItem) {
        // Se o produto já existe, aumentar a quantidade
        updateItemQuantity(existingItem, existingItem.quantity + 1);
      } else {
        // Adicionar novo item com verificações defensivas
        const sellPrice = Number(product.sell_price) || 0;
        const newItem: SaleItem = {
          part_id: product.id,
          item_type: 'part',
          item_name: product.name || 'Produto sem nome',
          item_code: product.internal_code || '',
          quantity: 1,
          unit_price: sellPrice,
          discount_amount: 0,
          total_price: sellPrice,
          part: product
        };
        setSaleItems([...saleItems, newItem]);
        console.log('Produto adicionado ao carrinho');
      }
      setSearchTerm('');
      setProducts([]);
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      setError('Erro ao adicionar produto à venda');
    }
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
    const subtotal = saleItems.reduce((sum, item) => sum + Number(item.total_price), 0);
    const total = subtotal - currentSale.discount_amount + currentSale.tax_amount;
    
    setCurrentSale(prev => ({
      ...prev,
      subtotal,
      total_amount: total
    }));
  };

  const saveSale = async (): Promise<SaleResponse | null> => {
    if (saleItems.length === 0) {
      alert('Adicione pelo menos um item à venda');
      return null;
    }

    console.log('Iniciando salvamento da venda...');
    console.log('Itens da venda:', saleItems);
    
    // Debug: verificar autenticação
    console.log('Usuário autenticado:', user);
    console.log('Token disponível:', api.getToken());
    
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
      console.log('Fazendo requisição POST para /sales');

      const response = await api.post<SaleResponse>('/sales', saleData);
      console.log('Resposta da API:', response);
      
      const savedSale = response.sale;
      
      setCurrentSale(prev => ({
        ...prev,
        id: savedSale.id,
        sale_number: savedSale.sale_number
      }));
      
      // Se o total for zero, finalizar automaticamente
      if (savedSale.total_amount === 0) {
        await completeSale(savedSale.id);
      }
      
      return response;
      
    } catch (error: any) {
      console.error('Erro detalhado ao salvar venda:', error);
      console.error('Detalhes do erro:', {
        message: error.message,
        response: error.response,
        stack: error.stack
      });
      alert('Erro ao salvar venda: ' + (error.response?.data?.message || error.message));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async () => {
    let saleId = currentSale.id;
    
    if (!saleId) {
      try {
        const response = await saveSale();
        if (!response || !response.sale.id) {
          alert('Erro ao salvar venda antes do pagamento');
          return;
        }
        saleId = response.sale.id;
      } catch (error) {
        alert('Erro ao salvar venda antes do pagamento');
        return;
      }
    }

    setLoading(true);
    try {
      const paymentData = {
        payment_method: paymentMethod,
        amount: parseFloat(paymentAmount),
        reference: paymentReference
      };

      const paymentResult = await api.post<PaymentResponse>(`/sales/${saleId}/payments`, paymentData);
      
      // Salvar dados do pagamento para o comprovante
      setLastPaymentData({
        method: paymentMethod,
        amount: parseFloat(paymentAmount),
        change: paymentResult.change || 0
      });
      
      // Se não há valor restante, finalizar a venda e mostrar comprovante
      if (paymentResult.remaining <= 0) {
        await completeSale(saleId);
        setShowReceipt(true); // Mostrar comprovante
      } else {
        alert(`Pagamento processado! ${paymentResult.change > 0 ? `Troco: R$ ${paymentResult.change.toFixed(2)}` : ''}`);
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
      // Não reiniciar a venda aqui, será feito após fechar o comprovante
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

  const printReceipt = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const receiptContent = document.getElementById('receipt-content');
      if (receiptContent) {
        const printContent = `
          <html>
            <head>
              <title>Comprovante de Venda</title>
              <style>
                body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 20px; }
                .receipt-content { max-width: 300px; margin: 0 auto; }
                h1 { font-size: 16px; margin: 0; }
                h3 { font-size: 14px; margin: 10px 0 5px 0; }
                p { margin: 2px 0; }
                .border-dashed { border-style: dashed; }
                .text-center { text-align: center; }
                .font-bold { font-weight: bold; }
                .font-semibold { font-weight: 600; }
                .text-sm { font-size: 11px; }
                .text-xs { font-size: 10px; }
                .mb-1 { margin-bottom: 2px; }
                .mb-2 { margin-bottom: 4px; }
                .mb-3 { margin-bottom: 6px; }
                .mb-4 { margin-bottom: 8px; }
                .mt-1 { margin-top: 2px; }
                .mt-2 { margin-top: 4px; }
                .pt-2 { padding-top: 4px; }
                .pt-4 { padding-top: 8px; }
                .pb-4 { padding-bottom: 8px; }
                .py-4 { padding-top: 8px; padding-bottom: 8px; }
                .border-t { border-top: 1px solid #000; }
                .border-b { border-bottom: 1px solid #000; }
                .border-b-2 { border-bottom: 2px solid #000; }
                .flex { display: flex; }
                .justify-between { justify-content: space-between; }
                .items-center { align-items: center; }
                .text-gray-500 { color: #666; }
                .text-gray-600 { color: #555; }
                .text-red-600 { color: #dc2626; }
                .text-green-600 { color: #16a34a; }
                @media print {
                  body { margin: 0; padding: 10px; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              ${receiptContent.innerHTML}
            </body>
          </html>
        `;
        
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  const closeReceipt = () => {
    setShowReceipt(false);
    setLastPaymentData(null);
    newSale(); // Reiniciar venda após fechar comprovante
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Exibição de erro */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {error}
          <button 
            onClick={() => setError(null)}
            className="ml-2 text-white hover:text-gray-200"
          >
            ×
          </button>
        </div>
      )}
      
      {/* Painel Principal - Lista de Produtos */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar ao Sistema</span>
              </button>
              <h1 className="text-2xl font-bold text-gray-800">
                PDV - Ponto de Venda
                {currentSale.sale_number && (
                  <span className="text-sm text-gray-500 ml-2">#{currentSale.sale_number}</span>
                )}
              </h1>
            </div>
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
          {products && products.length > 0 && (
            <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {products.map((product) => {
                // Verificações defensivas para evitar erros de renderização
                if (!product || !product.id) return null;
                
                const name = product.name || 'Nome não disponível';
                const code = product.internal_code || 'N/A';
                const quantity = Number(product.quantity) || 0;
                const price = Number(product.sell_price) || 0;
                
                return (
                  <div
                    key={product.id}
                    onClick={() => addProductToSale(product)}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-800">{name}</div>
                        <div className="text-sm text-gray-500">
                          Código: {code} | Estoque: {quantity}
                        </div>
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        R$ {price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
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
            onClick={() => {
              setPaymentAmount(currentSale.total_amount.toFixed(2));
              setShowPaymentModal(true);
            }}
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

      {/* Modal do Comprovante */}
      {showReceipt && lastPaymentData && (
        <ReceiptComponent
          sale={currentSale}
          items={saleItems}
          paymentMethod={lastPaymentData.method}
          paymentAmount={lastPaymentData.amount}
          change={lastPaymentData.change}
          onClose={closeReceipt}
          onPrint={printReceipt}
        />
      )}
    </div>
  );
};

export default PDV;
