<?php

namespace App\Http\Controllers;

use App\Models\AccountsReceivable;
use App\Models\Client;
use App\Models\Quote;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class AccountsReceivableController extends Controller
{
    /**
     * Lista todas as contas a receber
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = AccountsReceivable::with(['sale', 'quote', 'client']);

            // Filtros
            if ($request->has('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            if ($request->has('start_date') && $request->has('end_date')) {
                $query->whereBetween('due_date', [$request->start_date, $request->end_date]);
            }

            // Busca por texto
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('description', 'like', "%{$search}%")
                      ->orWhere('document_number', 'like', "%{$search}%")
                      ->orWhereHas('client', function($cq) use ($search) {
                          $cq->where('name', 'like', "%{$search}%");
                      })
                      ->orWhereHas('sale', function($sq) use ($search) {
                          $sq->where('sale_number', 'like', "%{$search}%");
                      })
                      ->orWhereHas('quote', function($qq) use ($search) {
                          $qq->where('id', 'like', "%{$search}%");
                      });
                });
            }

            // Atualizar status vencidos
            $this->updateOverdueStatus();

            $receivables = $query->orderBy('due_date', 'asc')->get();

            // Adicionar informações formatadas
            $receivables->transform(function ($receivable) {
                $receivable->client_name = $receivable->client ? $receivable->client->name : 'Cliente não encontrado';
                $receivable->sale_number = $receivable->sale ? $receivable->sale->sale_number : null;
                $receivable->quote_number = $receivable->quote ? '#' . $receivable->quote->id : null;
                // Adicionar campo amount para compatibilidade com frontend
                $receivable->amount = (float) $receivable->original_amount;
                return $receivable;
            });

            return response()->json([
                'success' => true,
                'data' => $receivables
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao carregar contas a receber: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Criar nova conta a receber
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'client_name' => 'required_without:client_id|string|max:255',
                'client_id' => 'required_without:client_name|exists:clients,id',
                'description' => 'required|string|max:500',
                'amount' => 'required|numeric|min:0.01',
                'due_date' => 'required|date',
                'sale_id' => 'nullable|exists:sales,id'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dados inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Se veio client_name, buscar ou criar o cliente
            $clientId = $request->client_id;
            if (!$clientId && $request->client_name) {
                $client = Client::where('name', $request->client_name)->first();
                if ($client) {
                    $clientId = $client->id;
                } else {
                    // Criar um cliente básico se não existir
                    $client = Client::create([
                        'name' => $request->client_name,
                        'phone' => 'Não informado',
                        'motorcycle_model' => 'Não informado',
                        'license_plate' => 'Não informado'
                    ]);
                    $clientId = $client->id;
                }
            }

            $receivable = AccountsReceivable::create([
                'sale_id' => $request->sale_id,
                'client_id' => $clientId,
                'document_number' => 'REC-' . now()->format('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT),
                'original_amount' => $request->amount,
                'remaining_amount' => $request->amount,
                'due_date' => $request->due_date,
                'issue_date' => now(),
                'status' => 'pending',
                'type' => 'manual',
                'description' => $request->description
            ]);

            // Carregar com relacionamentos e formatar
            $receivable->load(['client', 'sale', 'quote']);
            $receivable->client_name = $receivable->client ? $receivable->client->name : 'Cliente não encontrado';
            $receivable->sale_number = $receivable->sale ? $receivable->sale->sale_number : null;
            $receivable->quote_number = $receivable->quote ? '#' . $receivable->quote->id : null;
            // Adicionar campo amount para compatibilidade com frontend
            $receivable->amount = (float) $receivable->original_amount;

            return response()->json([
                'success' => true,
                'message' => 'Conta a receber criada com sucesso',
                'data' => $receivable
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao criar conta a receber: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Exibir conta a receber específica
     */
    public function show(AccountsReceivable $accountsReceivable): JsonResponse
    {
        try {
            $accountsReceivable->load(['client', 'sale', 'quote']);
            
            // Adicionar informações formatadas
            $accountsReceivable->client_name = $accountsReceivable->client ? $accountsReceivable->client->name : 'Cliente não encontrado';
            $accountsReceivable->sale_number = $accountsReceivable->sale ? $accountsReceivable->sale->sale_number : null;
            $accountsReceivable->quote_number = $accountsReceivable->quote ? '#' . $accountsReceivable->quote->id : null;
            // Adicionar campo amount para compatibilidade com frontend
            $accountsReceivable->amount = (float) $accountsReceivable->original_amount;
            
            return response()->json([
                'success' => true,
                'data' => $accountsReceivable
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao carregar conta a receber: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Atualizar conta a receber
     */
    public function update(Request $request, AccountsReceivable $accountsReceivable): JsonResponse
    {
        try {
            if ($accountsReceivable->status === 'paid') {
                return response()->json([
                    'success' => false,
                    'message' => 'Não é possível editar uma conta já paga'
                ], 422);
            }

            $validator = Validator::make($request->all(), [
                'client_name' => 'sometimes|string|max:255',
                'client_id' => 'sometimes|exists:clients,id',
                'description' => 'sometimes|string|max:500',
                'amount' => 'sometimes|numeric|min:0.01',
                'due_date' => 'sometimes|date'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dados inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $updateData = $request->only(['description', 'due_date']);

            // Se veio client_name, buscar ou criar o cliente
            if ($request->has('client_name') && !$request->has('client_id')) {
                $client = Client::where('name', $request->client_name)->first();
                if ($client) {
                    $updateData['client_id'] = $client->id;
                } else {
                    // Criar um cliente básico se não existir
                    $client = Client::create([
                        'name' => $request->client_name,
                        'phone' => 'Não informado',
                        'motorcycle_model' => 'Não informado',
                        'license_plate' => 'Não informado'
                    ]);
                    $updateData['client_id'] = $client->id;
                }
            } elseif ($request->has('client_id')) {
                $updateData['client_id'] = $request->client_id;
            }

            if ($request->has('amount')) {
                $updateData['original_amount'] = $request->amount;
                $updateData['remaining_amount'] = $request->amount;
            }

            $accountsReceivable->update($updateData);
            
            // Carregar com relacionamentos e formatar
            $accountsReceivable->load(['client', 'sale', 'quote']);
            $accountsReceivable->client_name = $accountsReceivable->client ? $accountsReceivable->client->name : 'Cliente não encontrado';
            $accountsReceivable->sale_number = $accountsReceivable->sale ? $accountsReceivable->sale->sale_number : null;
            $accountsReceivable->quote_number = $accountsReceivable->quote ? '#' . $accountsReceivable->quote->id : null;
            // Adicionar campo amount para compatibilidade com frontend
            $accountsReceivable->amount = (float) $accountsReceivable->original_amount;

            return response()->json([
                'success' => true,
                'message' => 'Conta a receber atualizada com sucesso',
                'data' => $accountsReceivable
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao atualizar conta a receber: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Marcar conta como paga
     */
    public function pay(Request $request, AccountsReceivable $accountsReceivable): JsonResponse
    {
        try {
            if ($accountsReceivable->status === 'paid') {
                return response()->json([
                    'success' => false,
                    'message' => 'Esta conta já foi paga'
                ], 422);
            }

            $validator = Validator::make($request->all(), [
                'payment_amount' => 'nullable|numeric|min:0.01',
                'payment_date' => 'nullable|date',
                'discount_amount' => 'nullable|numeric|min:0',
                'interest_amount' => 'nullable|numeric|min:0',
                'notes' => 'nullable|string|max:1000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dados inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $paymentAmount = $request->payment_amount ?? $accountsReceivable->remaining_amount;
            $discountAmount = $request->discount_amount ?? 0;
            $interestAmount = $request->interest_amount ?? 0;
            $paymentDate = $request->payment_date ?? now();
            $notes = $request->notes;

            // Validações de negócio
            if ($discountAmount > $accountsReceivable->remaining_amount) {
                return response()->json([
                    'success' => false,
                    'message' => 'O desconto não pode ser maior que o valor a receber'
                ], 422);
            }

            // Calcular o valor efetivo recebido considerando desconto e juros
            $effectiveAmount = $paymentAmount - $discountAmount + $interestAmount;
            
            // Validação: valor total não pode ser negativo
            if ($effectiveAmount < 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'O valor efetivo do recebimento não pode ser negativo'
                ], 422);
            }

            // Atualizar remaining_amount baseado no valor efetivo
            $newRemainingAmount = max(0, $accountsReceivable->remaining_amount - $effectiveAmount);
            
            // Determinar status
            $newStatus = 'partial';
            if ($newRemainingAmount <= 0) {
                $newStatus = 'paid';
                $newRemainingAmount = 0;
            }

            $accountsReceivable->update([
                'remaining_amount' => $newRemainingAmount,
                'status' => $newStatus,
                'payment_date' => $paymentDate,
                'notes' => $notes
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Recebimento registrado com sucesso',
                'data' => [
                    'accounts_receivable' => $accountsReceivable->fresh(),
                    'payment_details' => [
                        'payment_amount' => $paymentAmount,
                        'discount_amount' => $discountAmount,
                        'interest_amount' => $interestAmount,
                        'effective_amount' => $effectiveAmount
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao registrar recebimento: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Excluir conta a receber
     */
    public function destroy(AccountsReceivable $accountsReceivable): JsonResponse
    {
        try {
            if ($accountsReceivable->status === 'paid') {
                return response()->json([
                    'success' => false,
                    'message' => 'Não é possível excluir uma conta já paga'
                ], 422);
            }

            $accountsReceivable->delete();

            return response()->json([
                'success' => true,
                'message' => 'Conta a receber excluída com sucesso'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao excluir conta a receber: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obter total pendente
     */
    public function pending(): JsonResponse
    {
        try {
            $this->updateOverdueStatus();
            
            $total = AccountsReceivable::where('status', '!=', 'paid')
                ->sum('remaining_amount');

            return response()->json([
                'success' => true,
                'total' => (float) $total
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao calcular total pendente: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Atualizar status das contas vencidas
     */
    private function updateOverdueStatus(): void
    {
        AccountsReceivable::where('status', 'pending')
            ->where('due_date', '<', now())
            ->update(['status' => 'overdue']);
    }

    /**
     * Relatório de contas a receber
     */
    public function report(Request $request): JsonResponse
    {
        try {
            $startDate = $request->start_date ?? now()->startOfMonth();
            $endDate = $request->end_date ?? now()->endOfMonth();

            $report = [
                'total_receivable' => AccountsReceivable::whereBetween('created_at', [$startDate, $endDate])
                    ->sum('original_amount'),
                'total_received' => AccountsReceivable::whereBetween('updated_at', [$startDate, $endDate])
                    ->where('status', 'paid')
                    ->sum('original_amount'),
                'pending_amount' => AccountsReceivable::where('status', 'pending')
                    ->sum('remaining_amount'),
                'overdue_amount' => AccountsReceivable::where('status', 'overdue')
                    ->sum('remaining_amount'),
                'by_month' => AccountsReceivable::selectRaw('MONTH(created_at) as month, YEAR(created_at) as year, SUM(original_amount) as total')
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->groupBy('year', 'month')
                    ->orderBy('year', 'desc')
                    ->orderBy('month', 'desc')
                    ->get()
            ];

            return response()->json([
                'success' => true,
                'data' => $report
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao gerar relatório: ' . $e->getMessage()
            ], 500);
        }
    }
}
