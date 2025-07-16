<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Client;
use App\Models\Part;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class SaleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Sale::with(['client', 'user', 'saleItems.part', 'payments'])
            ->orderBy('created_at', 'desc');

        // Filtros
        if ($request->has('status') && $request->status !== '') {
            $query->where('status', $request->status);
        }

        if ($request->has('payment_status') && $request->payment_status !== '') {
            $query->where('payment_status', $request->payment_status);
        }

        if ($request->has('client_id') && $request->client_id !== '') {
            $query->where('client_id', $request->client_id);
        }

        if ($request->has('date_from') && $request->date_from !== '') {
            $query->whereDate('sale_date', '>=', $request->date_from);
        }

        if ($request->has('date_to') && $request->date_to !== '') {
            $query->whereDate('sale_date', '<=', $request->date_to);
        }

        $sales = $query->paginate($request->get('per_page', 15));

        return response()->json($sales);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'client_id' => 'nullable|exists:clients,id',
            'items' => 'required|array|min:1',
            'items.*.part_id' => 'nullable|exists:parts,id',
            'items.*.item_type' => 'required|string|in:part,service,other',
            'items.*.item_name' => 'required|string|max:255',
            'items.*.item_code' => 'nullable|string|max:100',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount_amount' => 'nullable|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string'
        ]);

        try {
            DB::beginTransaction();

            // Criar a venda
            $sale = Sale::create([
                'client_id' => $request->client_id,
                'user_id' => Auth::id(),
                'status' => 'pending',
                'payment_status' => 'pending',
                'sale_date' => now(),
                'discount_amount' => $request->discount_amount ?? 0,
                'tax_amount' => $request->tax_amount ?? 0,
                'notes' => $request->notes
            ]);

            // Adicionar itens da venda
            foreach ($request->items as $itemData) {
                $saleItem = SaleItem::create([
                    'sale_id' => $sale->id,
                    'part_id' => $itemData['part_id'] ?? null,
                    'item_type' => $itemData['item_type'],
                    'item_name' => $itemData['item_name'],
                    'item_code' => $itemData['item_code'] ?? null,
                    'quantity' => $itemData['quantity'],
                    'unit_price' => $itemData['unit_price'],
                    'discount_amount' => $itemData['discount_amount'] ?? 0,
                    'notes' => $itemData['notes'] ?? null
                ]);

                // Reduzir estoque se for uma peça
                if ($saleItem->part_id && $saleItem->part) {
                    $part = $saleItem->part;
                    if ($part->quantity < $saleItem->quantity) {
                        throw new \Exception("Estoque insuficiente para {$part->name}. Disponível: {$part->quantity}");
                    }
                    $part->decrement('quantity', $saleItem->quantity);
                }
            }

            // Recalcular totais
            $sale->calculateTotal();

            DB::commit();

            return response()->json([
                'message' => 'Venda criada com sucesso!',
                'sale' => $sale->load(['client', 'saleItems.part', 'payments'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erro ao criar venda: ' . $e->getMessage()
            ], 422);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Sale $sale): JsonResponse
    {
        return response()->json(
            $sale->load(['client', 'user', 'saleItems.part', 'payments', 'accountsReceivable'])
        );
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Sale $sale): JsonResponse
    {
        if ($sale->status === 'completed') {
            return response()->json([
                'message' => 'Não é possível editar uma venda finalizada'
            ], 422);
        }

        $request->validate([
            'status' => 'nullable|string|in:pending,completed,cancelled,refunded',
            'discount_amount' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string'
        ]);

        try {
            DB::beginTransaction();

            $sale->update($request->only([
                'status', 'discount_amount', 'tax_amount', 'notes'
            ]));

            $sale->calculateTotal();

            DB::commit();

            return response()->json([
                'message' => 'Venda atualizada com sucesso!',
                'sale' => $sale->load(['client', 'saleItems.part', 'payments'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erro ao atualizar venda: ' . $e->getMessage()
            ], 422);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Sale $sale): JsonResponse
    {
        if ($sale->status === 'completed') {
            return response()->json([
                'message' => 'Não é possível excluir uma venda finalizada'
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Restaurar estoque dos itens
            foreach ($sale->saleItems as $item) {
                if ($item->part_id && $item->part) {
                    $item->part->increment('quantity', $item->quantity);
                }
            }

            $sale->delete();

            DB::commit();

            return response()->json([
                'message' => 'Venda excluída com sucesso!'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erro ao excluir venda: ' . $e->getMessage()
            ], 422);
        }
    }

    /**
     * Finalizar venda
     */
    public function complete(Sale $sale): JsonResponse
    {
        if ($sale->status === 'completed') {
            return response()->json([
                'message' => 'Venda já está finalizada'
            ], 422);
        }

        try {
            DB::beginTransaction();

            $sale->update(['status' => 'completed']);

            // Se há valor em aberto, criar conta a receber
            if ($sale->getRemainingAmount() > 0) {
                $sale->accountsReceivable()->create([
                    'client_id' => $sale->client_id,
                    'document_number' => $sale->sale_number,
                    'original_amount' => $sale->getRemainingAmount(),
                    'due_date' => now()->addDays(30), // 30 dias por padrão
                    'issue_date' => now(),
                    'status' => 'pending',
                    'type' => 'sale',
                    'description' => "Venda {$sale->sale_number}"
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Venda finalizada com sucesso!',
                'sale' => $sale->load(['client', 'saleItems.part', 'payments', 'accountsReceivable'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erro ao finalizar venda: ' . $e->getMessage()
            ], 422);
        }
    }

    /**
     * Adicionar pagamento à venda
     */
    public function addPayment(Request $request, Sale $sale): JsonResponse
    {
        $request->validate([
            'payment_method' => 'required|string|in:cash,card,pix,credit,transfer',
            'amount' => 'required|numeric|min:0.01',
            'reference' => 'nullable|string|max:255',
            'notes' => 'nullable|string'
        ]);

        try {
            DB::beginTransaction();

            $remaining = $sale->getRemainingAmount();
            
            if ($request->amount > $remaining) {
                // Calcular troco para pagamento em dinheiro
                $change = $request->payment_method === 'cash' ? $request->amount - $remaining : 0;
                $paymentAmount = $remaining;
            } else {
                $change = 0;
                $paymentAmount = $request->amount;
            }

            $payment = Payment::create([
                'sale_id' => $sale->id,
                'payment_method' => $request->payment_method,
                'amount' => $paymentAmount,
                'payment_date' => now(),
                'status' => 'confirmed',
                'reference' => $request->reference,
                'notes' => $request->notes,
                'change_amount' => $change
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Pagamento adicionado com sucesso!',
                'payment' => $payment,
                'change' => $change,
                'remaining' => $sale->fresh()->getRemainingAmount()
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erro ao adicionar pagamento: ' . $e->getMessage()
            ], 422);
        }
    }

    /**
     * Buscar produtos para PDV
     */
    public function searchProducts(Request $request): JsonResponse
    {
        $query = $request->get('q', '');
        
        $parts = Part::where(function($q) use ($query) {
            $q->where('name', 'like', "%{$query}%")
              ->orWhere('internal_code', 'like', "%{$query}%");
        })
        ->where('quantity', '>', 0)
        ->limit(20)
        ->get();

        return response()->json($parts);
    }

    /**
     * Relatório de vendas
     */
    public function report(Request $request): JsonResponse
    {
        $query = Sale::with(['client', 'saleItems', 'payments']);

        if ($request->has('date_from') && $request->date_from !== '') {
            $query->whereDate('sale_date', '>=', $request->date_from);
        }

        if ($request->has('date_to') && $request->date_to !== '') {
            $query->whereDate('sale_date', '<=', $request->date_to);
        }

        $sales = $query->get();

        $report = [
            'total_sales' => $sales->count(),
            'total_amount' => $sales->sum('total_amount'),
            'total_paid' => $sales->sum(function($sale) { return $sale->getTotalPaid(); }),
            'total_pending' => $sales->sum(function($sale) { return $sale->getRemainingAmount(); }),
            'sales_by_status' => $sales->groupBy('status')->map->count(),
            'sales_by_payment_status' => $sales->groupBy('payment_status')->map->count(),
            'sales_by_day' => $sales->groupBy(function($sale) {
                return $sale->sale_date->format('Y-m-d');
            })->map->count()
        ];

        return response()->json($report);
    }
}
