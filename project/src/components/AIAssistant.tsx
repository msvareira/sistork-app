import { useState } from 'react';
import { Brain, Sparkles, AlertCircle, CheckCircle, Clock, Wrench, Package, Camera, Mic } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { aiService, DiagnosticSuggestion } from '../services/aiService';
import { LoadingButton } from './LoadingComponents';
import ImageUpload from './ImageUpload';
import VoiceInput from './VoiceInput';

interface AIAssistantProps {
  onApplySuggestions: (suggestion: DiagnosticSuggestion) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function AIAssistant({ onApplySuggestions, isOpen, onClose }: AIAssistantProps) {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [symptoms, setSymptoms] = useState('');
  const [motorcycleModel, setMotorcycleModel] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [suggestion, setSuggestion] = useState<DiagnosticSuggestion | null>(null);

  const handleAnalyze = async () => {
    if (!symptoms.trim()) {
      error('Sintomas necessários', 'Por favor, descreva os sintomas do problema.');
      return;
    }

    setLoading(true);
    try {
      console.log('🚀 Iniciando análise com IA Real (Ollama)...');
      
      // Usar novo método da IA Real
      const result = await aiService.analyzeDiagnostic({
        symptoms,
        images
      });
      
      setSuggestion(result);
      
      // Verifica se usou IA real ou simulação
      const isRealAI = result.confidence > 80 && !result.suggestedServices.some(s => s.reason.includes('simulada'));
      const aiType = isRealAI ? 'IA Real (Ollama)' : 'Simulação';
      
      success(
        `Análise concluída com ${aiType}`, 
        `${isRealAI ? '🤖' : '⚡'} Confiança: ${result.confidence}%${images.length > 0 ? ` (${images.length} imagens analisadas)` : ''}`
      );
    } catch (err) {
      console.error('AI Analysis error:', err);
      error('Erro na análise', 'Não foi possível analisar os sintomas. Verifique se o Ollama está rodando.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (suggestion) {
      onApplySuggestions(suggestion);
      success('Sugestões aplicadas', 'As recomendações da IA foram aplicadas ao orçamento.');
      handleReset();
      onClose();
    }
  };

  const handleReset = () => {
    setSymptoms('');
    setMotorcycleModel('');
    setAdditionalInfo('');
    setImages([]);
    setSuggestion(null);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return 'Indefinida';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-purple-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Assistente de Diagnóstico IA</h2>
              <p className="text-sm text-gray-600">Análise inteligente de sintomas e sugestões automáticas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">Fechar</span>
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900">Descreva o Problema</h3>
                <div className="flex items-center gap-1 ml-auto">
                  <Mic className="w-4 h-4 text-purple-600" />
                  <Camera className="w-4 h-4 text-purple-600" />
                  <span className="text-xs text-purple-600 font-medium">Com Voz + Imagem</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sintomas do Problema *
                    <span className="text-xs text-purple-600 font-normal ml-2">(use o microfone para falar)</span>
                  </label>
                  <VoiceInput
                    value={symptoms}
                    onChange={setSymptoms}
                    placeholder="Ex: A moto não liga, freio faz barulho, motor falhando... (ou clique no microfone para falar)"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modelo da Moto
                  </label>
                  <input
                    type="text"
                    value={motorcycleModel}
                    onChange={(e) => setMotorcycleModel(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ex: Honda CB 600, Yamaha Fazer 250..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Informações Adicionais
                  </label>
                  <textarea
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Histórico de manutenções, quando começou o problema, etc..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imagens do Problema
                    <span className="text-xs text-gray-500 font-normal ml-2">(opcional - melhora a precisão do diagnóstico)</span>
                  </label>
                  <ImageUpload
                    images={images}
                    onImagesChange={setImages}
                    maxImages={5}
                    maxSizeInMB={10}
                  />
                </div>

                <div className="flex gap-3">
                  <LoadingButton
                    onClick={handleAnalyze}
                    loading={loading}
                    className="flex-1 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
                    disabled={!symptoms.trim()}
                  >
                    <Brain className="w-4 h-4" />
                    Analisar com IA {images.length > 0 && `(+${images.length} imagem${images.length > 1 ? 's' : ''})`}
                  </LoadingButton>
                  
                  <button
                    onClick={handleReset}
                    className="px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    disabled={loading}
                  >
                    Limpar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            {suggestion ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">Análise Concluída</h3>
                </div>

                {/* Confidence and Urgency */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-xs text-gray-600 mb-1">Confiança</div>
                    <div className="text-lg font-semibold text-blue-600">
                      {suggestion.confidence}%
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-xs text-gray-600 mb-1">Urgência</div>
                    <div className={`text-sm font-semibold px-2 py-1 rounded ${getUrgencyColor(suggestion.urgency)}`}>
                      {getUrgencyLabel(suggestion.urgency)}
                    </div>
                  </div>
                </div>

                {/* Estimated Time and Cost */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white rounded-lg p-3">
                    <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                      <Clock className="w-3 h-3" />
                      Tempo Estimado
                    </div>
                    <div className="text-sm font-medium">{suggestion.estimatedTime}</div>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-xs text-gray-600 mb-1">Custo Estimado</div>
                    <div className="text-sm font-medium text-green-600">
                      R$ {suggestion.estimatedCost.min.toFixed(2)} - R$ {suggestion.estimatedCost.max.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Possible Causes */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Possíveis Causas
                  </h4>
                  <ul className="space-y-1">
                    {suggestion.possibleCauses.map((cause, index) => (
                      <li key={index} className="text-sm text-gray-700 bg-white rounded px-3 py-2">
                        • {cause}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Suggested Parts */}
                {suggestion.suggestedParts.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      Peças Sugeridas
                    </h4>
                    <div className="space-y-2">
                      {suggestion.suggestedParts.map((part, index) => (
                        <div key={index} className="bg-white rounded-lg p-3">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-sm">{part.name}</span>
                            <span className="text-xs text-blue-600 font-medium">{part.confidence}%</span>
                          </div>
                          <p className="text-xs text-gray-600">{part.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Services */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-1">
                    <Wrench className="w-4 h-4" />
                    Serviços Sugeridos
                  </h4>
                  <div className="space-y-2">
                    {suggestion.suggestedServices.map((service, index) => (
                      <div key={index} className="bg-white rounded-lg p-3">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-sm">{service.description}</span>
                          <div className="text-right">
                            <div className="text-xs text-blue-600 font-medium">{service.confidence}%</div>
                            <div className="text-sm font-semibold text-green-600">R$ {service.estimatedPrice.toFixed(2)}</div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600">{service.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Apply Button */}
                <button
                  onClick={handleApply}
                  className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-medium"
                >
                  <CheckCircle className="w-4 h-4" />
                  Aplicar Sugestões ao Orçamento
                </button>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900 mb-2">Aguardando Análise</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Descreva os sintomas do problema e clique em "Analisar com IA" para obter sugestões inteligentes.
                </p>
                <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Mic className="w-3 h-3" />
                    <span>Use sua voz</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Camera className="w-3 h-3" />
                    <span>Adicione fotos</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
