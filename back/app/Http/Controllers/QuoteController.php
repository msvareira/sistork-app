<?php

namespace App\Http\Controllers;

use App\Models\Quote;
use App\Models\QuotePart;
use App\Models\QuoteService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class QuoteController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $quotes = Quote::with(['client', 'quoteParts.part', 'quoteServices'])
            ->orderBy('created_at', 'desc')
            ->get();
        
        return response()->json($quotes->map(function ($quote) {
            return [
                'id' => $quote->id,
                'clientId' => $quote->client_id,
                'client' => $quote->client ? [
                    'id' => $quote->client->id,
                    'name' => $quote->client->name,
                    'phone' => $quote->client->phone,
                    'motorcycleModel' => $quote->client->motorcycle_model,
                    'licensePlate' => $quote->client->license_plate,
                    'notes' => $quote->client->notes,
                    'createdAt' => $quote->client->created_at->format('c'),
                ] : null,
                'parts' => $quote->quoteParts->map(function ($quotePart) {
                    return [
                        'id' => $quotePart->id,
                        'partId' => $quotePart->part_id,
                        'part' => $quotePart->part ? [
                            'id' => $quotePart->part->id,
                            'name' => $quotePart->part->name,
                            'code' => $quotePart->part->code,
                        ] : null,
                        'quantity' => $quotePart->quantity,
                        'unitPrice' => (float) $quotePart->unit_price,
                        'total' => (float) $quotePart->total,
                    ];
                }),
                'services' => $quote->quoteServices->map(function ($quoteService) {
                    return [
                        'id' => $quoteService->id,
                        'description' => $quoteService->description,
                        'quantity' => $quoteService->quantity,
                        'unitPrice' => (float) $quoteService->unit_price,
                        'total' => (float) $quoteService->total,
                    ];
                }),
                'total' => (float) $quote->total,
                'notes' => $quote->notes,
                'expiresAt' => $quote->expires_at->format('c'),
                'status' => $quote->status,
                'scheduledDate' => $quote->scheduled_date?->format('Y-m-d'),
                'scheduledTime' => $quote->scheduled_time?->format('H:i'),
                'scheduleNotes' => $quote->schedule_notes,
                'createdAt' => $quote->created_at->format('c'),
            ];
        }));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'client_id' => 'required|exists:clients,id',
            // Nova estrutura - pelo menos um serviço é obrigatório
            'services' => 'required|array|min:1',
            'services.*.description' => 'required|string',
            'services.*.quantity' => 'required|integer|min:1',
            'services.*.unitPrice' => 'required|numeric|min:0',
            'services.*.total' => 'required|numeric|min:0',
            // Peças são opcionais
            'parts' => 'nullable|array',
            'parts.*.partId' => 'required|exists:parts,id',
            'parts.*.quantity' => 'required|integer|min:1',
            'parts.*.unitPrice' => 'required|numeric|min:0',
            'parts.*.total' => 'required|numeric|min:0',
            // Campos gerais
            'total' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
            'expires_at' => 'required|date',
            'status' => 'required|in:pending,approved,in_progress,completed,paid,rejected,expired, ',
        ]);

        return DB::transaction(function () use ($request) {
            // Criar o orçamento
            $quote = Quote::create([
                'client_id' => $request->client_id,
                'total' => $request->total,
                'notes' => $request->notes,
                'expires_at' => $request->expires_at,
                'status' => $request->status,
            ]);

            // Criar os serviços do orçamento
            foreach ($request->services as $serviceData) {
                QuoteService::create([
                    'quote_id' => $quote->id,
                    'description' => $serviceData['description'],
                    'quantity' => $serviceData['quantity'],
                    'unit_price' => $serviceData['unitPrice'],
                    'total' => $serviceData['total'],
                ]);
            }

            // Criar as peças do orçamento (se houver)
            if (!empty($request->parts)) {
                foreach ($request->parts as $partData) {
                    QuotePart::create([
                        'quote_id' => $quote->id,
                        'part_id' => $partData['partId'],
                        'quantity' => $partData['quantity'],
                        'unit_price' => $partData['unitPrice'],
                        'total' => $partData['total'],
                    ]);
                }
            }

            return response()->json($quote->load(['client', 'quoteParts.part', 'quoteServices']), 201);
        });
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $quote = Quote::with(['client', 'quoteParts.part', 'quoteServices'])->findOrFail($id);
        
        return response()->json([
            'id' => $quote->id,
            'clientId' => $quote->client_id,
            'client' => $quote->client ? [
                'id' => $quote->client->id,
                'name' => $quote->client->name,
                'phone' => $quote->client->phone,
                'motorcycleModel' => $quote->client->motorcycle_model,
                'licensePlate' => $quote->client->license_plate,
                'notes' => $quote->client->notes,
                'createdAt' => $quote->client->created_at->format('c'),
            ] : null,
            'parts' => $quote->quoteParts->map(function ($quotePart) {
                return [
                    'id' => $quotePart->id,
                    'partId' => $quotePart->part_id,
                    'part' => $quotePart->part ? [
                        'id' => $quotePart->part->id,
                        'name' => $quotePart->part->name,
                        'code' => $quotePart->part->code,
                    ] : null,
                    'quantity' => $quotePart->quantity,
                    'unitPrice' => (float) $quotePart->unit_price,
                    'total' => (float) $quotePart->total,
                ];
            }),
            'services' => $quote->quoteServices->map(function ($quoteService) {
                return [
                    'id' => $quoteService->id,
                    'description' => $quoteService->description,
                    'quantity' => $quoteService->quantity,
                    'unitPrice' => (float) $quoteService->unit_price,
                    'total' => (float) $quoteService->total,
                ];
            }),
            'total' => (float) $quote->total,
            'notes' => $quote->notes,
            'expiresAt' => $quote->expires_at->format('c'),
            'status' => $quote->status,
            'scheduledDate' => $quote->scheduled_date?->format('Y-m-d'),
            'scheduledTime' => $quote->scheduled_time?->format('H:i'),
            'scheduleNotes' => $quote->schedule_notes,
            'createdAt' => $quote->created_at->format('c'),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $quote = Quote::findOrFail($id);

        $request->validate([
            'client_id' => 'sometimes|required|exists:clients,id',
            'services' => 'sometimes|required|array|min:1',
            'services.*.description' => 'required|string',
            'services.*.quantity' => 'required|integer|min:1',
            'services.*.unitPrice' => 'required|numeric|min:0',
            'services.*.total' => 'required|numeric|min:0',
            'parts' => 'nullable|array',
            'parts.*.partId' => 'required|exists:parts,id',
            'parts.*.quantity' => 'required|integer|min:1',
            'parts.*.unitPrice' => 'required|numeric|min:0',
            'parts.*.total' => 'required|numeric|min:0',
            'total' => 'sometimes|required|numeric|min:0',
            'notes' => 'nullable|string',
            'expires_at' => 'sometimes|required|date',
            'status' => 'required|in:pending,approved,in_progress,completed,paid,rejected,expired, ',
        ]);

        return DB::transaction(function () use ($request, $quote) {
            // Atualizar dados básicos do orçamento
            $quote->update([
                'client_id' => $request->client_id ?? $quote->client_id,
                'total' => $request->total ?? $quote->total,
                'notes' => $request->notes ?? $quote->notes,
                'expires_at' => $request->expires_at ?? $quote->expires_at,
                'status' => $request->status ?? $quote->status,
            ]);

            // Atualizar serviços se fornecidos
            if ($request->has('services')) {
                // Remover serviços existentes
                $quote->quoteServices()->delete();
                
                // Criar novos serviços
                foreach ($request->services as $serviceData) {
                    QuoteService::create([
                        'quote_id' => $quote->id,
                        'description' => $serviceData['description'],
                        'quantity' => $serviceData['quantity'],
                        'unit_price' => $serviceData['unitPrice'],
                        'total' => $serviceData['total'],
                    ]);
                }
            }

            // Atualizar peças se fornecidas
            if ($request->has('parts')) {
                // Remover peças existentes
                $quote->quoteParts()->delete();
                
                // Criar novas peças (se houver)
                if (!empty($request->parts)) {
                    foreach ($request->parts as $partData) {
                        QuotePart::create([
                            'quote_id' => $quote->id,
                            'part_id' => $partData['partId'],
                            'quantity' => $partData['quantity'],
                            'unit_price' => $partData['unitPrice'],
                            'total' => $partData['total'],
                        ]);
                    }
                }
            }

            return response()->json($quote->load(['client', 'quoteParts.part', 'quoteServices']));
        });
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $quote = Quote::findOrFail($id);
        
        return DB::transaction(function () use ($quote) {
            // As peças e serviços serão removidos automaticamente devido às foreign keys
            $quote->delete();
            return response()->json(['message' => 'Quote deleted successfully']);
        });
    }
}
