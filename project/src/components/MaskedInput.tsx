import React from 'react';

interface MaskedInputProps {
  type: 'phone' | 'cpf' | 'cnpj' | 'cep' | 'plate' | 'money';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export default function MaskedInput({ 
  type, 
  value, 
  onChange, 
  placeholder, 
  className, 
  required 
}: MaskedInputProps) {
  
  const applyMask = (inputValue: string, maskType: string): string => {
    // Remove todos os caracteres não numéricos (exceto para placa)
    const cleaned = maskType === 'plate' 
      ? inputValue.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
      : inputValue.replace(/\D/g, '');
    
    switch (maskType) {
      case 'phone':
        // (11) 99999-9999 ou (11) 9999-9999
        if (cleaned.length <= 10) {
          return cleaned.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
        } else {
          return cleaned.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
        }
        
      case 'cpf':
        // 999.999.999-99
        return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4').replace(/-$/, '');
        
      case 'cnpj':
        // 99.999.999/9999-99
        return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5').replace(/-$/, '');
        
      case 'cep':
        // 99999-999
        return cleaned.replace(/(\d{5})(\d{0,3})/, '$1-$2').replace(/-$/, '');
        
      case 'plate':
        // ABC-9999 ou ABC9999 (Mercosul) 
        if (cleaned.length <= 7) {
          return cleaned.replace(/([A-Z]{3})(\d{0,4})/, '$1-$2').replace(/-$/, '');
        } else {
          return cleaned.substring(0, 7).replace(/([A-Z]{3})(\d{0,4})/, '$1-$2').replace(/-$/, '');
        }
        
      case 'money':
        // Formato monetário brasileiro
        const number = parseFloat(cleaned) / 100;
        return number.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).replace('R$', '').trim();
        
      default:
        return cleaned;
    }
  };

  const getPlaceholder = (maskType: string): string => {
    if (placeholder) return placeholder;
    
    switch (maskType) {
      case 'phone': return '(11) 99999-9999';
      case 'cpf': return '999.999.999-99';
      case 'cnpj': return '99.999.999/9999-99';
      case 'cep': return '99999-999';
      case 'plate': return 'ABC-9999';
      case 'money': return '0,00';
      default: return '';
    }
  };

  const getMaxLength = (maskType: string): number | undefined => {
    switch (maskType) {
      case 'phone': return 15; // (11) 99999-9999
      case 'cpf': return 14; // 999.999.999-99
      case 'cnpj': return 18; // 99.999.999/9999-99
      case 'cep': return 9; // 99999-999
      case 'plate': return 8; // ABC-9999
      case 'money': return 20; // Para valores grandes
      default: return undefined;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = applyMask(e.target.value, type);
    onChange(newValue);
  };

  const getInputType = (maskType: string): string => {
    switch (maskType) {
      case 'phone': return 'tel';
      case 'money': return 'text';
      default: return 'text';
    }
  };

  return (
    <input
      type={getInputType(type)}
      value={value}
      onChange={handleChange}
      placeholder={getPlaceholder(type)}
      maxLength={getMaxLength(type)}
      className={className || "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"}
      required={required}
    />
  );
}
