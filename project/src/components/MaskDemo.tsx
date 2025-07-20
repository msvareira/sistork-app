import { useState } from 'react';
import MaskedInput from './MaskedInput';
import MoneyInput from './MoneyInput';

export default function MaskDemo() {
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [cep, setCep] = useState('');
  const [plate, setPlate] = useState('');
  const [money, setMoney] = useState('0,00');

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Demonstração de Máscaras</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Telefone
          </label>
          <MaskedInput
            type="phone"
            value={phone}
            onChange={setPhone}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <p className="text-xs text-gray-500 mt-1">Formato: (11) 99999-9999</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CPF
          </label>
          <MaskedInput
            type="cpf"
            value={cpf}
            onChange={setCpf}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <p className="text-xs text-gray-500 mt-1">Formato: 999.999.999-99</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CNPJ
          </label>
          <MaskedInput
            type="cnpj"
            value={cnpj}
            onChange={setCnpj}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <p className="text-xs text-gray-500 mt-1">Formato: 99.999.999/9999-99</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CEP
          </label>
          <MaskedInput
            type="cep"
            value={cep}
            onChange={setCep}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <p className="text-xs text-gray-500 mt-1">Formato: 99999-999</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Placa de Veículo
          </label>
          <MaskedInput
            type="plate"
            value={plate}
            onChange={setPlate}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <p className="text-xs text-gray-500 mt-1">Formato: ABC-9999</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valor Monetário
          </label>
          <MoneyInput
            value={money}
            onChange={setMoney}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <p className="text-xs text-gray-500 mt-1">Formato: 1.234,56</p>
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Valores atuais:</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Telefone:</strong> {phone}</p>
          <p><strong>CPF:</strong> {cpf}</p>
          <p><strong>CNPJ:</strong> {cnpj}</p>
          <p><strong>CEP:</strong> {cep}</p>
          <p><strong>Placa:</strong> {plate}</p>
          <p><strong>Valor:</strong> R$ {money}</p>
        </div>
      </div>
    </div>
  );
}
