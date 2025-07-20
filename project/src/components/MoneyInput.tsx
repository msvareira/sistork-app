import React from 'react';

interface MoneyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export default function MoneyInput({ 
  value, 
  onChange, 
  placeholder = "0,00", 
  className,
  required
}: MoneyInputProps) {
  
  const formatMoney = (inputValue: string): string => {
    // Remove tudo que não é número
    const numbers = inputValue.replace(/\D/g, '');
    
    if (!numbers) return '';
    
    // Converte para centavos
    const cents = parseInt(numbers, 10);
    
    // Converte para reais
    const reais = cents / 100;
    
    // Formata para padrão brasileiro
    return reais.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatMoney(e.target.value);
    onChange(formatted);
  };

  const handleBlur = () => {
    // Garantir que sempre tenha pelo menos "0,00"
    if (!value || value === '0' || value === '0,0') {
      onChange('0,00');
    }
  };

  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className || "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"}
      required={required}
      inputMode="numeric"
      pattern="[0-9.,]*"
    />
  );
}
