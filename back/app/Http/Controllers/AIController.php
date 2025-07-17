<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class AIController extends Controller
{
    private $ollamaUrl;
    private $model;

    public function __construct()
    {
        $this->ollamaUrl = env('OLLAMA_URL', 'http://sistork-ollama:11434');
        $this->model = env('OLLAMA_MODEL', 'llama3.2:3b');
    }

    /**
     * 🤖 DIAGNÓSTICO INTELIGENTE COM IA REAL OLLAMA LOCAL
     * Processa problemas técnicos usando IA local Llama 3.2
     */
    public function analyzeProblem(Request $request)
    {
        try {
            $request->validate([
                'problem' => 'required|string|max:2000',
                'priority' => 'sometimes|string|in:baixa,media,alta,critica',
                'category' => 'sometimes|string|max:100'
            ]);

            $problem = $request->input('problem');
            $priority = $request->input('priority', 'media');
            $category = $request->input('category', 'geral');

            // 🧠 Prompt otimizado para diagnósticos técnicos em português
            $prompt = $this->buildDiagnosticPrompt($problem, $priority, $category);

            // 🚀 Chama a IA real Ollama
            $aiResponse = $this->callOllamaAI($prompt);

            // 📊 Processa a resposta da IA
            $analysis = $this->parseAIResponse($aiResponse, $problem, $priority);

            return response()->json([
                'success' => true,
                'analysis' => $analysis,
                'metadata' => [
                    'ai_model' => $this->model,
                    'processing_time' => round(microtime(true) - LARAVEL_START, 2),
                    'confidence' => $analysis['confidence'],
                    'is_real_ai' => true
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('AI Analysis Error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => 'Erro na análise: ' . $e->getMessage(),
                'fallback' => $this->getFallbackResponse($request->input('problem', ''))
            ], 500);
        }
    }

    /**
     * 🖼️ ANÁLISE MULTIMODAL COM IMAGENS + TEXTO
     * Processa imagens junto com descrição textual
     */
    public function diagnosticWithImages(Request $request)
    {
        try {
            $request->validate([
                'problem' => 'required|string|max:2000',
                'images' => 'sometimes|array|max:5',
                'images.*' => 'file|image|max:10240', // 10MB max
                'priority' => 'sometimes|string|in:baixa,media,alta,critica'
            ]);

            $problem = $request->input('problem');
            $priority = $request->input('priority', 'media');
            $imageAnalysis = [];

            // 📸 Processa imagens se fornecidas
            if ($request->hasFile('images')) {
                $imageAnalysis = $this->analyzeImages($request->file('images'));
            }

            // 🧠 Prompt combinando texto + análise de imagens
            $prompt = $this->buildMultimodalPrompt($problem, $imageAnalysis, $priority);

            // 🚀 Análise via IA
            $aiResponse = $this->callOllamaAI($prompt);

            // 📊 Processa resposta multimodal
            $analysis = $this->parseAIResponse($aiResponse, $problem, $priority, $imageAnalysis);

            // 🎯 Ajusta confiança baseada em dados multimodais
            $analysis['confidence'] = $this->calculateMultimodalConfidence($analysis, $imageAnalysis);

            return response()->json([
                'success' => true,
                'analysis' => $analysis,
                'image_insights' => $imageAnalysis,
                'metadata' => [
                    'ai_model' => $this->model,
                    'images_processed' => count($imageAnalysis),
                    'is_multimodal' => true,
                    'is_real_ai' => true
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Multimodal AI Analysis Error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => 'Erro na análise multimodal: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🚀 COMUNICAÇÃO DIRETA COM OLLAMA AI
     */
    private function callOllamaAI(string $prompt): string
    {
        try {
            // Tenta chamar o Ollama local com timeout aumentado
            $response = Http::timeout(60)->post($this->ollamaUrl . '/api/generate', [
                'model' => $this->model,
                'prompt' => $prompt,
                'stream' => false,
                'options' => [
                    'temperature' => 0.7,
                    'top_p' => 0.9,
                    'num_predict' => 1000
                ]
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return $data['response'] ?? 'Resposta vazia da IA';
            }

            // Log do erro específico
            Log::error('Ollama API Error', [
                'status' => $response->status(),
                'body' => $response->body(),
                'url' => $this->ollamaUrl
            ]);
            
            throw new \Exception('Ollama não respondeu: ' . $response->status() . ' - ' . $response->body());

        } catch (\Exception $e) {
            Log::warning('Ollama unavailable: ' . $e->getMessage());
            throw new \Exception('Serviço de IA local indisponível. Verifique se o Ollama está rodando. Erro: ' . $e->getMessage());
        }
    }

    /**
     * 🧠 PROMPT ENGINEERING PARA DIAGNÓSTICOS
     */
    private function buildDiagnosticPrompt(string $problem, string $priority, string $category): string
    {
        return "Você é um especialista em diagnóstico técnico com 20 anos de experiência em manutenção industrial e automotiva.

PROBLEMA RELATADO:
{$problem}

PRIORIDADE: {$priority}
CATEGORIA: {$category}

INSTRUÇÕES:
1. Analise o problema com base em sua experiência técnica
2. Identifique possíveis causas (mais prováveis primeiro)
3. Sugira soluções práticas e eficazes
4. Estime tempo e custo aproximado
5. Indique se precisa de especialista
6. Dê dicas de prevenção

FORMATO DA RESPOSTA (JSON):
{
    \"diagnostico\": \"Análise detalhada do problema\",
    \"causas_provaveis\": [\"causa1\", \"causa2\", \"causa3\"],
    \"solucoes\": [
        {\"descricao\": \"solução1\", \"tempo_estimado\": \"30min\", \"custo_estimado\": \"R$ 50\"},
        {\"descricao\": \"solução2\", \"tempo_estimado\": \"2h\", \"custo_estimado\": \"R$ 200\"}
    ],
    \"urgencia\": \"baixa|media|alta|critica\",
    \"requer_especialista\": true/false,
    \"prevencao\": \"Dicas para evitar o problema\",
    \"confianca\": 85
}

Responda APENAS com o JSON válido, sem texto adicional:";
    }

    /**
     * 🖼️ PROMPT PARA ANÁLISE MULTIMODAL
     */
    private function buildMultimodalPrompt(string $problem, array $imageAnalysis, string $priority): string
    {
        $imageInfo = '';
        if (!empty($imageAnalysis)) {
            $imageInfo = "\n\nANÁLISE DAS IMAGENS:\n";
            foreach ($imageAnalysis as $i => $analysis) {
                $imageInfo .= "Imagem " . ($i + 1) . ": {$analysis['description']}\n";
            }
        }

        return "Você é um especialista em diagnóstico técnico com visão computacional.

PROBLEMA RELATADO:
{$problem}

{$imageInfo}

PRIORIDADE: {$priority}

INSTRUÇÕES:
1. Combine a descrição textual com as informações visuais
2. Use as imagens para confirmar ou refinar o diagnóstico
3. Identifique detalhes visuais relevantes
4. Sugira soluções baseadas no que viu nas imagens
5. Estime precisão maior devido aos dados visuais

FORMATO DA RESPOSTA (JSON):
{
    \"diagnostico\": \"Análise combinando texto e imagens\",
    \"detalhes_visuais\": [\"detalhe1\", \"detalhe2\"],
    \"causas_provaveis\": [\"causa1\", \"causa2\"],
    \"solucoes\": [
        {\"descricao\": \"solução baseada na análise visual\", \"tempo_estimado\": \"1h\", \"custo_estimado\": \"R$ 100\"}
    ],
    \"urgencia\": \"baixa|media|alta|critica\",
    \"requer_especialista\": true/false,
    \"confianca\": 92
}

Responda APENAS com o JSON válido:";
    }

    /**
     * 📸 ANÁLISE BÁSICA DE IMAGENS
     */
    private function analyzeImages(array $images): array
    {
        $analysis = [];
        
        foreach ($images as $index => $image) {
            try {
                // Salva temporariamente
                $path = $image->store('temp_analysis', 'local');
                $fullPath = storage_path('app/' . $path);
                
                // Análise básica de arquivo
                $imageInfo = getimagesize($fullPath);
                $fileSize = filesize($fullPath);
                
                $analysis[] = [
                    'index' => $index + 1,
                    'filename' => $image->getClientOriginalName(),
                    'size' => $fileSize,
                    'dimensions' => $imageInfo ? $imageInfo[0] . 'x' . $imageInfo[1] : 'desconhecido',
                    'type' => $imageInfo ? $imageInfo['mime'] : 'desconhecido',
                    'description' => $this->describeImageBasedOnName($image->getClientOriginalName(), $fileSize)
                ];
                
                // Remove arquivo temporário
                Storage::disk('local')->delete($path);
                
            } catch (\Exception $e) {
                Log::error('Image analysis error: ' . $e->getMessage());
                $analysis[] = [
                    'index' => $index + 1,
                    'error' => 'Erro ao processar imagem',
                    'description' => 'Imagem não pôde ser analisada'
                ];
            }
        }
        
        return $analysis;
    }

    /**
     * 📝 DESCRIÇÃO BASEADA NO NOME DO ARQUIVO
     */
    private function describeImageBasedOnName(string $filename, int $fileSize): string
    {
        $filename = strtolower($filename);
        $sizeDesc = $fileSize > 2000000 ? 'alta resolução' : 'resolução padrão';
        
        $keywords = [
            'erro' => 'Imagem mostrando uma tela de erro ou problema',
            'error' => 'Imagem com indicação de erro no sistema',
            'falha' => 'Imagem documentando uma falha técnica',
            'problem' => 'Imagem do problema reportado',
            'motor' => 'Imagem do motor ou componente mecânico',
            'engine' => 'Imagem de motor ou peça automotiva',
            'peça' => 'Imagem de peça ou componente',
            'part' => 'Imagem de peça de reposição',
            'tela' => 'Captura de tela do sistema',
            'screen' => 'Screenshot da interface do sistema',
            'painel' => 'Imagem do painel de controle',
            'dashboard' => 'Imagem do painel ou dashboard'
        ];
        
        foreach ($keywords as $keyword => $description) {
            if (strpos($filename, $keyword) !== false) {
                return $description . " ({$sizeDesc})";
            }
        }
        
        return "Imagem relacionada ao problema técnico ({$sizeDesc})";
    }

    /**
     * 📊 PROCESSA RESPOSTA DA IA
     */
    private function parseAIResponse(string $aiResponse, string $originalProblem, string $priority, array $imageAnalysis = []): array
    {
        try {
            // Tenta decodificar JSON da resposta da IA
            $decoded = json_decode($aiResponse, true);
            
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                // IA retornou JSON válido
                return [
                    'diagnostic' => $decoded['diagnostico'] ?? 'Diagnóstico não fornecido',
                    'probable_causes' => $decoded['causas_provaveis'] ?? ['Causa não identificada'],
                    'solutions' => $decoded['solucoes'] ?? [['descricao' => 'Verificar com especialista']],
                    'urgency' => $decoded['urgencia'] ?? $priority,
                    'requires_specialist' => $decoded['requer_especialista'] ?? false,
                    'prevention' => $decoded['prevencao'] ?? 'Manutenção preventiva regular',
                    'confidence' => $decoded['confianca'] ?? 75,
                    'visual_details' => $decoded['detalhes_visuais'] ?? []
                ];
            }
            
            // Se não for JSON, processa como texto livre
            return $this->parseTextResponse($aiResponse, $priority);
            
        } catch (\Exception $e) {
            Log::error('AI Response parsing error: ' . $e->getMessage());
            return $this->parseTextResponse($aiResponse, $priority);
        }
    }

    /**
     * 📝 PROCESSA RESPOSTA EM TEXTO LIVRE
     */
    private function parseTextResponse(string $response, string $priority): array
    {
        // Extrai informações do texto usando regex e heurísticas
        $diagnostic = $this->extractSection($response, ['diagnóstico', 'análise', 'problema']);
        $causes = $this->extractList($response, ['causas', 'origem', 'motivo']);
        $solutions = $this->extractSolutions($response);
        
        return [
            'diagnostic' => $diagnostic ?: substr($response, 0, 200) . '...',
            'probable_causes' => $causes ?: ['Análise detalhada necessária'],
            'solutions' => $solutions,
            'urgency' => $this->detectUrgency($response) ?: $priority,
            'requires_specialist' => $this->detectSpecialistNeed($response),
            'prevention' => $this->extractSection($response, ['prevenção', 'evitar', 'manutenção']),
            'confidence' => 80,
            'visual_details' => []
        ];
    }

    /**
     * 🔍 EXTRAI SEÇÃO DO TEXTO
     */
    private function extractSection(string $text, array $keywords): string
    {
        foreach ($keywords as $keyword) {
            if (preg_match("/{$keyword}[:\s]*(.*?)(?:\n\n|\.|$)/i", $text, $matches)) {
                return trim($matches[1]);
            }
        }
        return '';
    }

    /**
     * 📋 EXTRAI LISTA DO TEXTO
     */
    private function extractList(string $text, array $keywords): array
    {
        foreach ($keywords as $keyword) {
            if (preg_match_all("/{$keyword}[:\s]*\n?[-•*]\s*(.*?)(?:\n|$)/i", $text, $matches)) {
                return array_map('trim', $matches[1]);
            }
        }
        return [];
    }

    /**
     * 🔧 EXTRAI SOLUÇÕES DO TEXTO
     */
    private function extractSolutions(string $text): array
    {
        $solutions = [];
        
        if (preg_match_all("/soluç[ãa]o[:\s]*\n?[-•*]\s*(.*?)(?:\n|$)/i", $text, $matches)) {
            foreach ($matches[1] as $solution) {
                $solutions[] = [
                    'descricao' => trim($solution),
                    'tempo_estimado' => '1-2h',
                    'custo_estimado' => 'A consultar'
                ];
            }
        }
        
        if (empty($solutions)) {
            $solutions[] = [
                'descricao' => 'Consultar especialista para diagnóstico detalhado',
                'tempo_estimado' => '30min',
                'custo_estimado' => 'Consulta'
            ];
        }
        
        return $solutions;
    }

    /**
     * ⚡ DETECTA URGÊNCIA NO TEXTO
     */
    private function detectUrgency(string $text): ?string
    {
        $urgencyMap = [
            'critica' => ['crítico', 'urgente', 'emergência', 'pare', 'perigo'],
            'alta' => ['alto', 'rápido', 'logo', 'breve'],
            'media' => ['médio', 'normal', 'moderado'],
            'baixa' => ['baixo', 'tempo', 'futuro', 'preventivo']
        ];
        
        foreach ($urgencyMap as $level => $keywords) {
            foreach ($keywords as $keyword) {
                if (stripos($text, $keyword) !== false) {
                    return $level;
                }
            }
        }
        
        return null;
    }

    /**
     * 👨‍🔧 DETECTA NECESSIDADE DE ESPECIALISTA
     */
    private function detectSpecialistNeed(string $text): bool
    {
        $specialistKeywords = [
            'especialista', 'técnico', 'profissional', 'expert',
            'complexo', 'avançado', 'específico', 'qualificado'
        ];
        
        foreach ($specialistKeywords as $keyword) {
            if (stripos($text, $keyword) !== false) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * 📊 CALCULA CONFIANÇA MULTIMODAL
     */
    private function calculateMultimodalConfidence(array $analysis, array $imageAnalysis): int
    {
        $baseConfidence = $analysis['confidence'] ?? 75;
        
        // Bonus por ter imagens
        $imageBonus = count($imageAnalysis) * 5;
        
        // Bonus por detalhes visuais identificados
        $visualBonus = count($analysis['visual_details'] ?? []) * 3;
        
        return min(98, $baseConfidence + $imageBonus + $visualBonus);
    }

    /**
     * 🔄 RESPOSTA DE FALLBACK SE OLLAMA FALHAR
     */
    private function getFallbackResponse(string $problem): array
    {
        return [
            'diagnostic' => 'Análise rápida: ' . $this->getQuickAnalysis($problem),
            'probable_causes' => ['Verificação necessária', 'Múltiplas possibilidades'],
            'solutions' => [
                [
                    'descricao' => 'Diagnóstico presencial recomendado',
                    'tempo_estimado' => '30-60min',
                    'custo_estimado' => 'Consulta técnica'
                ]
            ],
            'urgency' => 'media',
            'requires_specialist' => true,
            'prevention' => 'Manutenção preventiva regular',
            'confidence' => 60,
            'note' => 'Análise limitada - IA local indisponível'
        ];
    }

    /**
     * ⚡ ANÁLISE RÁPIDA BASEADA EM PALAVRAS-CHAVE
     */
    private function getQuickAnalysis(string $problem): string
    {
        $keywords = [
            'motor' => 'Possível problema no motor - verificar fluidos e filtros',
            'freio' => 'Sistema de freios - inspeção de segurança necessária',
            'bateria' => 'Problema elétrico - testar bateria e alternador',
            'óleo' => 'Sistema de lubrificação - verificar nível e qualidade',
            'temperatura' => 'Sistema de arrefecimento - risco de superaquecimento',
            'ruído' => 'Problema mecânico - identificar origem do som',
            'vibração' => 'Desbalanceamento ou desgaste - inspeção necessária'
        ];
        
        foreach ($keywords as $keyword => $analysis) {
            if (stripos($problem, $keyword) !== false) {
                return $analysis;
            }
        }
        
        return 'Problema identificado - diagnóstico técnico detalhado recomendado';
    }

    /**
     * 🩺 ENDPOINT DE HEALTH CHECK DO OLLAMA
     */
    public function healthCheck()
    {
        try {
            $response = Http::timeout(5)->get($this->ollamaUrl . '/api/tags');
            
            if ($response->successful()) {
                $models = $response->json()['models'] ?? [];
                return response()->json([
                    'ollama_status' => 'online',
                    'available_models' => array_column($models, 'name'),
                    'current_model' => $this->model,
                    'url' => $this->ollamaUrl
                ]);
            }
            
            return response()->json([
                'ollama_status' => 'offline',
                'error' => 'Serviço não responde'
            ], 503);
            
        } catch (\Exception $e) {
            return response()->json([
                'ollama_status' => 'error',
                'error' => $e->getMessage()
            ], 503);
        }
    }

    /**
     * 🧪 Método de teste simples para AI containerizada
     */
    public function testAI(Request $request)
    {
        try {
            $message = $request->input('message', 'Teste simples');
            
            Log::info('Teste AI iniciado', ['message' => $message]);
            
            // Teste básico da IA
            $prompt = "Responda em português: {$message}";
            $response = $this->callOllamaAI($prompt);
            
            return response()->json([
                'success' => true,
                'message' => $message,
                'ai_response' => $response,
                'ollama_url' => $this->ollamaUrl,
                'model' => $this->model,
                'timestamp' => now(),
                'status' => 'AI containerizada funcionando!'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erro no teste AI', ['error' => $e->getMessage()]);
            
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'ollama_url' => $this->ollamaUrl,
                'model' => $this->model,
                'timestamp' => now()
            ], 500);
        }
    }
}
