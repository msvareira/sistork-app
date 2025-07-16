import { apiClient } from './api';

// 🤖 Interface para resposta da IA Real Ollama
export interface RealAIAnalysis {
  diagnostic: string;
  probable_causes: string[];
  solutions: {
    descricao: string;
    tempo_estimado: string;
    custo_estimado: string;
  }[];
  urgency: 'baixa' | 'media' | 'alta' | 'critica';
  requires_specialist: boolean;
  prevention?: string;
  confidence: number;
  visual_details?: string[];
}

// 🖼️ Interface para análise multimodal
export interface MultimodalResponse {
  success: boolean;
  analysis: RealAIAnalysis;
  image_insights?: {
    index: number;
    filename: string;
    description: string;
  }[];
  metadata: {
    ai_model: string;
    images_processed?: number;
    is_multimodal?: boolean;
    is_real_ai: boolean;
    processing_time?: number;
  };
}

// 📊 Interface legada (mantida para compatibilidade)
export interface DiagnosticSuggestion {
  symptoms: string[];
  possibleCauses: string[];
  suggestedParts: {
    id: string;
    name: string;
    confidence: number;
    reason: string;
  }[];
  suggestedServices: {
    description: string;
    estimatedPrice: number;
    confidence: number;
    reason: string;
  }[];
  estimatedCost: {
    min: number;
    max: number;
  };
  confidence: number;
  urgency: 'low' | 'medium' | 'high';
  estimatedTime: string;
}

export interface DiagnosticRequest {
  problem: string;
  priority?: 'baixa' | 'media' | 'alta' | 'critica';
  category?: string;
  images?: File[];
}

class AIService {
  /**
   * 🚀 ANÁLISE COM IA REAL OLLAMA (Novo método principal)
   */
  async analyzeWithRealAI(request: DiagnosticRequest): Promise<MultimodalResponse> {
    try {
      // Se há imagens, usar análise multimodal
      if (request.images && request.images.length > 0) {
        const formData = new FormData();
        formData.append('problem', request.problem);
        formData.append('priority', request.priority || 'media');
        if (request.category) formData.append('category', request.category);
        
        request.images.forEach((image, index) => {
          formData.append(`images[${index}]`, image);
        });

        console.log('🖼️ Enviando para IA multimodal (Ollama)...');
        const response = await apiClient.uploadFiles<MultimodalResponse>('/ai/diagnostic-with-images', formData);
        
        console.log('✅ Resposta da IA Real recebida:', response);
        return response;
      } else {
        // Análise apenas texto
        console.log('📝 Enviando para IA textual (Ollama)...');
        const response = await apiClient.post<MultimodalResponse>('/ai/analyze-problem', request);
        
        console.log('✅ Resposta da IA Real recebida:', response);
        return response;
      }
    } catch (error) {
      console.error('❌ Erro na IA Real:', error);
      throw new Error('Falha ao analisar com IA Real - verifique se o Ollama está rodando');
    }
  }

  /**
   * 🩺 Verificar se o Ollama está online
   */
  async checkAIHealth(): Promise<{ status: string; models?: string[]; error?: string }> {
    try {
      const response = await apiClient.get('/ai/health-check');
      return response;
    } catch (error) {
      console.error('Health check failed:', error);
      return { status: 'offline', error: 'Serviço indisponível' };
    }
  }

  /**
   * 🔄 Converte resposta da IA Real para formato legado (compatibilidade)
   */
  convertToLegacyFormat(realAIResponse: MultimodalResponse): DiagnosticSuggestion {
    const analysis = realAIResponse.analysis;
    
    // Mapeia urgência
    const urgencyMap: Record<string, 'low' | 'medium' | 'high'> = {
      'baixa': 'low',
      'media': 'medium', 
      'alta': 'high',
      'critica': 'high'
    };

    // Converte soluções para formato legado
    const suggestedServices = analysis.solutions.map(solution => ({
      description: solution.descricao,
      estimatedPrice: this.extractPrice(solution.custo_estimado),
      confidence: analysis.confidence,
      reason: `Recomendado pela IA - ${solution.tempo_estimado}`
    }));

    // Calcula custo estimado
    const prices = suggestedServices.map(s => s.estimatedPrice);
    const estimatedCost = {
      min: Math.min(...prices, 100),
      max: Math.max(...prices, 300)
    };

    return {
      symptoms: [analysis.diagnostic],
      possibleCauses: analysis.probable_causes,
      suggestedParts: [], // IA focará mais em serviços do que peças específicas
      suggestedServices,
      estimatedCost,
      confidence: analysis.confidence,
      urgency: urgencyMap[analysis.urgency] || 'medium',
      estimatedTime: analysis.solutions[0]?.tempo_estimado || '1-2h'
    };
  }

  /**
   * 💰 Extrai preço do texto
   */
  private extractPrice(priceText: string): number {
    const match = priceText.match(/R?\$?\s*(\d+(?:[,.]\d{2})?)/);
    if (match) {
      return parseFloat(match[1].replace(',', '.'));
    }
    return 150; // Valor padrão
  }

  /**
   * 📊 MÉTODO LEGADO - Análise com simulação (mantido para compatibilidade)
   */
  async analyzeDiagnostic(request: { symptoms: string; images?: File[] }): Promise<DiagnosticSuggestion> {
    try {
      // Converte para novo formato
      const newRequest: DiagnosticRequest = {
        problem: request.symptoms,
        priority: 'media',
        category: 'geral',
        images: request.images
      };

      // Tenta usar IA real primeiro
      try {
        const realResponse = await this.analyzeWithRealAI(newRequest);
        return this.convertToLegacyFormat(realResponse);
      } catch (error) {
        console.warn('IA Real falhou, usando simulação:', error);
        return this.simulateAnalysis(request);
      }
    } catch (error) {
      console.error('Erro na análise:', error);
      throw new Error('Falha ao analisar diagnóstico');
    }
  }

  /**
   * 🔬 SIMULAÇÃO PARA DESENVOLVIMENTO (fallback)
   */
  private async simulateAnalysis(request: { symptoms: string; images?: File[] }): Promise<DiagnosticSuggestion> {
    // Simula delay da API
    await new Promise(resolve => setTimeout(resolve, 1500));

    const symptoms = request.symptoms.toLowerCase();
    const hasImages = request.images && request.images.length > 0;
    let suggestion: DiagnosticSuggestion;

    // Lógica básica de simulação baseada nos sintomas
    if (symptoms.includes('freio') || symptoms.includes('para') || symptoms.includes('parar')) {
      suggestion = {
        symptoms: [request.symptoms],
        possibleCauses: [
          'Pastilhas de freio desgastadas',
          'Fluido de freio baixo ou contaminado',
          'Disco de freio empenado',
          'Sistema de freio com ar'
        ],
        suggestedParts: [
          {
            id: 'part-001',
            name: 'Pastilhas de Freio Dianteiro',
            confidence: hasImages ? 95 : 85,
            reason: hasImages ? 'Análise visual confirma desgaste das pastilhas' : 'Sintomas indicam desgaste das pastilhas'
          },
          {
            id: 'part-002', 
            name: 'Fluido de Freio DOT 4',
            confidence: hasImages ? 80 : 70,
            reason: hasImages ? 'Imagem mostra fluido escuro - troca recomendada' : 'Manutenção preventiva recomendada'
          }
        ],
        suggestedServices: [
          {
            description: 'Troca de pastilhas de freio dianteiro',
            estimatedPrice: 150.00,
            confidence: hasImages ? 95 : 90,
            reason: hasImages ? 'Desgaste confirmado visualmente na imagem' : 'Serviço mais provável baseado nos sintomas'
          },
          {
            description: 'Sangria do sistema de freio',
            estimatedPrice: 80.00,
            confidence: 75,
            reason: 'Procedimento recomendado após troca de pastilhas'
          }
        ],
        estimatedCost: { min: 180.00, max: 280.00 },
        confidence: hasImages ? 85 : 75, // Menor que IA real
        urgency: 'high',
        estimatedTime: '2-3 horas'
      };
    } else if (symptoms.includes('motor') || symptoms.includes('liga') || symptoms.includes('partida')) {
      suggestion = {
        symptoms: [request.symptoms],
        possibleCauses: [
          'Bateria descarregada ou com defeito',
          'Motor de partida com problema',
          'Sistema de ignição defeituoso',
          'Combustível contaminado'
        ],
        suggestedParts: [
          {
            id: 'part-003',
            name: 'Bateria 12V',
            confidence: hasImages ? 90 : 80,
            reason: hasImages ? 'Imagem mostra corrosão nos terminais da bateria' : 'Causa mais comum de problemas de partida'
          }
        ],
        suggestedServices: [
          {
            description: 'Diagnóstico do sistema elétrico',
            estimatedPrice: 100.00,
            confidence: 95,
            reason: 'Necessário para identificar a causa exata'
          }
        ],
        estimatedCost: { min: 150.00, max: 350.00 },
        confidence: hasImages ? 75 : 65, // Menor que IA real
        urgency: 'medium',
        estimatedTime: '1-2 horas'
      };
    } else {
      suggestion = {
        symptoms: [request.symptoms],
        possibleCauses: [
          'Diagnóstico detalhado necessário',
          'Múltiplas causas possíveis'
        ],
        suggestedParts: [],
        suggestedServices: [
          {
            description: 'Diagnóstico geral completo',
            estimatedPrice: 120.00,
            confidence: hasImages ? 85 : 80,
            reason: hasImages ? 'Imagens fornecidas auxiliarão no diagnóstico' : 'Recomendado para sintomas não específicos'
          }
        ],
        estimatedCost: { min: 120.00, max: 300.00 },
        confidence: hasImages ? 65 : 55, // Menor que IA real
        urgency: 'medium',
        estimatedTime: hasImages ? '1-2 horas' : '1-3 horas'
      };
    }

    // Adiciona nota sobre simulação
    suggestion.suggestedServices.forEach(service => {
      service.reason += ' (Análise simulada - IA local indisponível)';
    });

    return suggestion;
  }

  /**
   * 🔧 Gerar sugestões de orçamento (método legado)
   */
  async generateQuoteSuggestions(diagnosticResult: DiagnosticSuggestion) {
    try {
      // Por enquanto, usa dados do diagnóstico mesmo
      return {
        suggestedQuote: {
          services: diagnosticResult.suggestedServices,
          parts: diagnosticResult.suggestedParts,
          total: diagnosticResult.estimatedCost.max,
          confidence: diagnosticResult.confidence
        }
      };
    } catch (error) {
      console.error('AI Quote Suggestions error:', error);
      throw new Error('Falha ao gerar sugestões de orçamento');
    }
  }
}

export const aiService = new AIService();
