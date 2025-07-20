<?php

namespace App\Http\Controllers;

use App\Models\AccountsPayable;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class AccountsPayableController extends Controller
{
    /**
     * Lista todas as contas a pagar
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = AccountsPayable::query();

            // Filtros
            if ($request->has('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            if ($request->has('category') && $request->category !== 'all') {
                $query->where('category', $request->category);
            }

            if ($request->has('start_date') && $request->has('end_date')) {
                $query->whereBetween('due_date', [$request->start_date, $request->end_date]);
            }

            // Busca por texto
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('supplier_name', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%")
                      ->orWhere('category', 'like', "%{$search}%")
                      ->orWhere('document_number', 'like', "%{$search}%");
                });
            }

            // Atualizar status vencidos
            $this->updateOverdueStatus();

            $payables = $query->orderBy('due_date', 'asc')->get();

            // Formatar dados para compatibilidade com frontend
            $formattedPayables = $payables->map(function ($payable) {
                return [
                    'id' => $payable->id,
                    'supplier_name' => $payable->supplier_name,
                    'description' => $payable->description,
                    'amount' => (float) $payable->original_amount,
                    'due_date' => $payable->due_date,
                    'status' => $payable->status,
                    'payment_date' => $payable->payment_date,
                    'category' => $payable->category ?? 'Outros',
                    'created_at' => $payable->created_at,
                    'updated_at' => $payable->updated_at,
                    'supplier_document' => $payable->supplier_document,
                    'document_number' => $payable->document_number,
                    'remaining_amount' => (float) $payable->remaining_amount,
                    'original_amount' => (float) $payable->original_amount,
                    'issue_date' => $payable->issue_date,
                    'type' => $payable->type,
                    'notes' => $payable->notes,
                    'interest_amount' => (float) $payable->interest_amount,
                    'discount_amount' => (float) $payable->discount_amount,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedPayables
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao carregar contas a pagar: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Criar nova conta a pagar
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'supplier_name' => 'required|string|max:255',
                'description' => 'required|string|max:500',
                'amount' => 'required|numeric|min:0.01',
                'due_date' => 'required|date',
                'category' => 'required|string|max:100',
                'supplier_document' => 'nullable|string|max:20',
                'document_number' => 'nullable|string|max:50',
                'notes' => 'nullable|string|max:1000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dados inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $payable = AccountsPayable::create([
                'supplier_name' => $request->supplier_name,
                'supplier_document' => $request->supplier_document,
                'document_number' => $request->document_number ?: 'PAG-' . now()->format('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT),
                'original_amount' => $request->amount,
                'remaining_amount' => $request->amount,
                'due_date' => $request->due_date,
                'issue_date' => now(),
                'status' => 'pending',
                'type' => $request->type ?? 'expense',
                'category' => $request->category,
                'description' => $request->description,
                'notes' => $request->notes,
                'interest_amount' => 0,
                'discount_amount' => 0
            ]);

            // Adicionar campo amount para compatibilidade com frontend
            $payable->amount = $payable->original_amount;

            return response()->json([
                'success' => true,
                'message' => 'Conta a pagar criada com sucesso',
                'data' => $payable
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao criar conta a pagar: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Exibir conta a pagar específica
     */
    public function show(AccountsPayable $accountsPayable): JsonResponse
    {
        try {
            // Adicionar campo amount para compatibilidade com frontend
            $accountsPayable->amount = $accountsPayable->original_amount;

            return response()->json([
                'success' => true,
                'data' => $accountsPayable
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao carregar conta a pagar: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Atualizar conta a pagar
     */
    public function update(Request $request, AccountsPayable $accountsPayable): JsonResponse
    {
        try {
            if ($accountsPayable->status === 'paid') {
                return response()->json([
                    'success' => false,
                    'message' => 'Não é possível editar uma conta já paga'
                ], 422);
            }

            $validator = Validator::make($request->all(), [
                'supplier_name' => 'sometimes|string|max:255',
                'description' => 'sometimes|string|max:500',
                'amount' => 'sometimes|numeric|min:0.01',
                'due_date' => 'sometimes|date',
                'category' => 'sometimes|string|max:100',
                'supplier_document' => 'nullable|string|max:20',
                'document_number' => 'nullable|string|max:50',
                'notes' => 'nullable|string|max:1000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dados inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $updateData = $request->only([
                'supplier_name', 'supplier_document', 'document_number',
                'due_date', 'category', 'description', 'notes'
            ]);

            if ($request->has('amount')) {
                $updateData['original_amount'] = $request->amount;
                $updateData['remaining_amount'] = $request->amount;
            }

            $accountsPayable->update($updateData);

            // Adicionar campo amount para compatibilidade com frontend
            $updatedPayable = $accountsPayable->fresh();
            $updatedPayable->amount = $updatedPayable->original_amount;

            return response()->json([
                'success' => true,
                'message' => 'Conta a pagar atualizada com sucesso',
                'data' => $updatedPayable
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao atualizar conta a pagar: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Marcar conta como paga
     */
    public function pay(Request $request, AccountsPayable $accountsPayable): JsonResponse
    {
        try {
            if ($accountsPayable->status === 'paid') {
                return response()->json([
                    'success' => false,
                    'message' => 'Esta conta já foi paga'
                ], 422);
            }

            $validator = Validator::make($request->all(), [
                'payment_amount' => 'required|numeric|min:0.01',
                'payment_date' => 'required|date',
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

            $paymentAmount = (float) $request->payment_amount;
            $paymentDate = $request->payment_date;
            $discountAmount = (float) ($request->discount_amount ?? 0);
            $interestAmount = (float) ($request->interest_amount ?? 0);

            // Calcular o novo valor da conta com juros e desconto
            $accountTotalWithCharges = $accountsPayable->remaining_amount + $interestAmount - $discountAmount;

            // Atualizar a conta
            // O remaining_amount diminui pelo valor do pagamento
            // Juros e descontos são registrados separadamente
            $newRemainingAmount = max(0, $accountsPayable->remaining_amount - $paymentAmount);
            $newStatus = $newRemainingAmount <= 0.01 ? 'paid' : 'partial';

            $accountsPayable->update([
                'remaining_amount' => $newRemainingAmount,
                'status' => $newStatus,
                'payment_date' => $paymentDate,
                'discount_amount' => ($accountsPayable->discount_amount ?? 0) + $discountAmount,
                'interest_amount' => ($accountsPayable->interest_amount ?? 0) + $interestAmount,
                'original_amount' => $accountsPayable->original_amount + $interestAmount - $discountAmount,
                'notes' => $request->notes ? 
                    ($accountsPayable->notes ? $accountsPayable->notes . "\n" . $request->notes : $request->notes) :
                    $accountsPayable->notes
            ]);

            // Adicionar campo amount para compatibilidade com frontend
            $updatedPayable = $accountsPayable->fresh();
            $updatedPayable->amount = $updatedPayable->original_amount;

            return response()->json([
                'success' => true,
                'message' => $newStatus === 'paid' ? 'Conta paga com sucesso!' : 'Pagamento parcial registrado com sucesso!',
                'data' => $updatedPayable,
                'payment_details' => [
                    'payment_amount' => $paymentAmount,
                    'discount_amount' => $discountAmount,
                    'interest_amount' => $interestAmount,
                    'account_total_with_charges' => $accountTotalWithCharges,
                    'remaining_amount' => $newRemainingAmount,
                    'status' => $newStatus
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro interno do servidor: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Excluir conta a pagar
     */
    public function destroy(AccountsPayable $accountsPayable): JsonResponse
    {
        try {
            if ($accountsPayable->status === 'paid') {
                return response()->json([
                    'success' => false,
                    'message' => 'Não é possível excluir uma conta já paga'
                ], 422);
            }

            $accountsPayable->delete();

            return response()->json([
                'success' => true,
                'message' => 'Conta a pagar excluída com sucesso'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao excluir conta a pagar: ' . $e->getMessage()
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
            
            $total = AccountsPayable::where('status', '!=', 'paid')
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
        AccountsPayable::where('status', 'pending')
            ->where('due_date', '<', now())
            ->update(['status' => 'overdue']);
    }

    /**
     * Relatório de contas a pagar por categoria
     */
    public function reportByCategory(Request $request): JsonResponse
    {
        try {
            $startDate = $request->start_date ?? now()->startOfMonth();
            $endDate = $request->end_date ?? now()->endOfMonth();

            $report = AccountsPayable::selectRaw('category, SUM(original_amount) as total_amount, COUNT(*) as count')
                ->whereBetween('issue_date', [$startDate, $endDate])
                ->groupBy('category')
                ->orderBy('total_amount', 'desc')
                ->get();

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
