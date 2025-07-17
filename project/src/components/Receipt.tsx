import React from 'react';

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
  part?: any;
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
  sale_date?: string;
}

interface ReceiptProps {
  sale: Sale;
  items: SaleItem[];
  paymentMethod: string;
  paymentAmount: number;
  change?: number;
  onClose: () => void;
  onPrint: () => void;
}

const Receipt: React.FC<ReceiptProps> = ({
  sale,
  items,
  paymentMethod,
  paymentAmount,
  change = 0,
  onClose,
  onPrint
}) => {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pt-BR');
  };

  const getPaymentMethodName = (method: string) => {
    const methods: { [key: string]: string } = {
      'cash': 'Dinheiro',
      'credit_card': 'Cartão de Crédito',
      'debit_card': 'Cartão de Débito',
      'pix': 'PIX',
      'bank_transfer': 'Transferência'
    };
    return methods[method] || method;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="receipt-content" id="receipt-content">
          {/* Cabeçalho */}
          <div className="text-center border-b-2 border-dashed pb-4 mb-4">
            <h1 className="text-xl font-bold">SisTork</h1>
            <p className="text-sm text-gray-600">Sistema de Gestão Automotiva</p>
            <p className="text-xs text-gray-500 mt-2">
              {formatDate(sale.sale_date || new Date().toISOString())}
            </p>
          </div>

          {/* Informações da Venda */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">Venda:</span>
              <span>{sale.sale_number}</span>
            </div>
            {sale.client && (
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Cliente:</span>
                <span className="text-sm">{sale.client.name}</span>
              </div>
            )}
          </div>

          {/* Itens da Venda */}
          <div className="border-t border-b border-dashed py-4 mb-4">
            <h3 className="font-semibold mb-3">Itens:</h3>
            {items.map((item, index) => (
              <div key={index} className="mb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.item_name}</p>
                    {item.item_code && (
                      <p className="text-xs text-gray-500">Código: {item.item_code}</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-gray-600">
                    {item.quantity}x {formatCurrency(item.unit_price)}
                  </span>
                  <span className="font-medium">
                    {formatCurrency(item.total_price)}
                  </span>
                </div>
                {item.discount_amount > 0 && (
                  <div className="text-xs text-red-600">
                    Desconto: -{formatCurrency(item.discount_amount)}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Totais */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span>Subtotal:</span>
              <span>{formatCurrency(sale.subtotal)}</span>
            </div>
            {sale.discount_amount > 0 && (
              <div className="flex justify-between items-center mb-1 text-red-600">
                <span>Desconto:</span>
                <span>-{formatCurrency(sale.discount_amount)}</span>
              </div>
            )}
            {sale.tax_amount > 0 && (
              <div className="flex justify-between items-center mb-1">
                <span>Impostos:</span>
                <span>{formatCurrency(sale.tax_amount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>{formatCurrency(sale.total_amount)}</span>
            </div>
          </div>

          {/* Informações de Pagamento */}
          <div className="border-t border-dashed pt-4 mb-4">
            <h3 className="font-semibold mb-2">Pagamento:</h3>
            <div className="flex justify-between items-center mb-1">
              <span>Método:</span>
              <span>{getPaymentMethodName(paymentMethod)}</span>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span>Valor Pago:</span>
              <span>{formatCurrency(paymentAmount)}</span>
            </div>
            {change > 0 && (
              <div className="flex justify-between items-center text-green-600 font-semibold">
                <span>Troco:</span>
                <span>{formatCurrency(change)}</span>
              </div>
            )}
          </div>

          {/* Rodapé */}
          <div className="text-center text-xs text-gray-500 border-t border-dashed pt-4">
            <p>Obrigado pela preferência!</p>
            <p className="mt-1">SisTork - Gestão Automotiva</p>
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onPrint}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a1 1 0 001-1v-4a1 1 0 00-1-1H9a1 1 0 00-1 1v4a1 1 0 001 1zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
