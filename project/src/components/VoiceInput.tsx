import { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, AlertCircle, CheckCircle } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface VoiceInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function VoiceInput({ value, onChange, placeholder, className }: VoiceInputProps) {
  const [isActive, setIsActive] = useState(false);
  const {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    continuous: false,
    interimResults: true,
    lang: 'pt-BR'
  });

  useEffect(() => {
    if (transcript && !isListening && isActive) {
      // Quando a gravação termina, adicionar o texto ao valor existente
      const newValue = value ? `${value} ${transcript}` : transcript;
      onChange(newValue.trim());
      resetTranscript();
      setIsActive(false);
    }
  }, [transcript, isListening, isActive, value, onChange, resetTranscript]);

  const handleStartRecording = () => {
    if (!isSupported) return;
    
    setIsActive(true);
    resetTranscript();
    startListening();
  };

  const handleStopRecording = () => {
    if (isListening) {
      stopListening();
    }
    setIsActive(false);
  };

  const handleToggleRecording = () => {
    if (isListening) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  };

  if (!isSupported) {
    return (
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={className}
        />
        <div className="absolute top-2 right-2 flex items-center space-x-1">
          <AlertCircle className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-400">Voz não suportada</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${className} ${isListening ? 'border-purple-400 ring-2 ring-purple-100' : ''}`}
      />
      
      {/* Voice Control Button */}
      <div className="absolute top-2 right-2 flex items-center space-x-2">
        {/* Listening Indicator */}
        {isListening && (
          <div className="flex items-center space-x-1 bg-purple-100 px-2 py-1 rounded-full">
            <Volume2 className="w-3 h-3 text-purple-600 animate-pulse" />
            <span className="text-xs text-purple-700 font-medium">Ouvindo...</span>
          </div>
        )}
        
        {/* Recording Success */}
        {transcript && !isListening && isActive && (
          <div className="flex items-center space-x-1 bg-green-100 px-2 py-1 rounded-full">
            <CheckCircle className="w-3 h-3 text-green-600" />
            <span className="text-xs text-green-700 font-medium">Texto adicionado</span>
          </div>
        )}
        
        {/* Voice Button */}
        <button
          type="button"
          onClick={handleToggleRecording}
          disabled={!isSupported}
          className={`p-2 rounded-full transition-all ${
            isListening
              ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
              : 'bg-purple-500 text-white hover:bg-purple-600'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={isListening ? 'Parar gravação' : 'Começar gravação de voz'}
        >
          {isListening ? (
            <MicOff className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </button>
      </div>
      
      {/* Live Transcript Preview */}
      {isListening && transcript && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-800">
          <div className="flex items-center space-x-1 mb-1">
            <Mic className="w-3 h-3" />
            <span className="font-medium text-xs">Transcrevendo:</span>
          </div>
          <p className="italic">"{transcript}"</p>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <div className="flex items-center space-x-1">
            <AlertCircle className="w-3 h-3" />
            <span>{error}</span>
          </div>
        </div>
      )}
      
      {/* Instructions */}
      {!isListening && !error && (
        <div className="absolute top-full left-0 right-0 mt-1 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <Mic className="w-3 h-3" />
            <span>Clique no microfone para gravar sua voz</span>
          </div>
        </div>
      )}
    </div>
  );
}
