<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\AccountsReceivable;
use App\Models\AccountsPayable;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class CashFlowController extends Controller
{
    /**
     * Obter entradas do fluxo de caixa
     */
    public function entries(Request $request): JsonResponse
    {
        try {
            $startDate = $request->start_date ? Carbon::parse($request->start_date) : now()->startOfMonth();
            $endDate = $request->end_date ? Carbon::parse($request->end_date) : now()->endOfMonth();
            $type = $request->type; // 'income', 'expense', or null for all

            $entries = collect();

            // Receitas de vendas
            if (!$type || $type === 'income') {
                $salesEntries = Sale::whereBetween('created_at', [$startDate, $endDate])
                    ->where('status', 'completed')
                    ->get()
                    ->map(function ($sale) {
                        return [
                            'id' => 'sale_' . $sale->id,
                            'date' => $sale->created_at->format('Y-m-d'),
                            'description' => "Venda #{$sale->sale_number}",
                            'type' => 'income',
                            'amount' => (float) $sale->total_amount,
                            'category' => 'Vendas',
                            'source' => 'sale',
                            'reference_id' => $sale->id
                        ];
                    });
                $entries = $entries->concat($salesEntries);
            }

            // Receitas de contas a receber
            if (!$type || $type === 'income') {
                $receivablesEntries = AccountsReceivable::where('status', 'paid')
                    ->whereNotNull('payment_date')
                    ->whereBetween('payment_date', [$startDate, $endDate])
                    ->get()
                    ->map(function ($receivable) {
                        return [
                            'id' => 'receivable_' . $receivable->id,
                            'date' => $receivable->payment_date->format('Y-m-d'),
                            'description' => $receivable->description,
                            'type' => 'income',
                            'amount' => (float) $receivable->original_amount,
                            'category' => 'Recebimentos',
                            'source' => 'receivable',
                            'reference_id' => $receivable->id
                        ];
                    });
                $entries = $entries->concat($receivablesEntries);
            }

            // Despesas de contas a pagar
            if (!$type || $type === 'expense') {
                $payablesEntries = AccountsPayable::where('status', 'paid')
                    ->whereNotNull('payment_date')
                    ->whereBetween('payment_date', [$startDate, $endDate])
                    ->get()
                    ->map(function ($payable) {
                        return [
                            'id' => 'payable_' . $payable->id,
                            'date' => $payable->payment_date->format('Y-m-d'),
                            'description' => $payable->description . " - {$payable->supplier_name}",
                            'type' => 'expense',
                            'amount' => (float) $payable->original_amount,
                            'category' => $payable->category,
                            'source' => 'payable',
                            'reference_id' => $payable->id
                        ];
                    });
                $entries = $entries->concat($payablesEntries);
            }

            // Ordenar por data (mais recente primeiro)
            $entries = $entries->sortByDesc('date')->values();

            return response()->json([
                'success' => true,
                'data' => $entries
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao carregar entradas do fluxo de caixa: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Resumo do fluxo de caixa
     */
    public function summary(Request $request): JsonResponse
    {
        try {
            $startDate = $request->start_date ? Carbon::parse($request->start_date) : now()->startOfMonth();
            $endDate = $request->end_date ? Carbon::parse($request->end_date) : now()->endOfMonth();
            $type = $request->type; // 'income', 'expense', or null for all

            // Receitas do período
            $salesIncome = 0;
            $receivablesIncome = 0;
            if (!$type || $type === 'income') {
                $salesIncome = Sale::whereBetween('created_at', [$startDate, $endDate])
                    ->where('status', 'completed')
                    ->sum('total_amount') ?? 0;

                $receivablesIncome = AccountsReceivable::where('status', 'paid')
                    ->whereNotNull('payment_date')
                    ->whereBetween('payment_date', [$startDate, $endDate])
                    ->sum('original_amount') ?? 0;
            }

            $periodIncome = $salesIncome + $receivablesIncome;

            // Despesas do período
            $periodExpense = 0;
            if (!$type || $type === 'expense') {
                $periodExpense = AccountsPayable::where('status', 'paid')
                    ->whereNotNull('payment_date')
                    ->whereBetween('payment_date', [$startDate, $endDate])
                    ->sum('original_amount') ?? 0;
            }

            // Totais gerais
            $totalSalesIncome = 0;
            $totalReceivablesIncome = 0;
            if (!$type || $type === 'income') {
                $totalSalesIncome = Sale::where('status', 'completed')->sum('total_amount') ?? 0;
                $totalReceivablesIncome = AccountsReceivable::where('status', 'paid')->whereNotNull('payment_date')->sum('original_amount') ?? 0;
            }

            $totalExpense = 0;
            if (!$type || $type === 'expense') {
                $totalExpense = AccountsPayable::where('status', 'paid')->whereNotNull('payment_date')->sum('original_amount') ?? 0;
            }

            $totalIncome = $totalSalesIncome + $totalReceivablesIncome;

            // Saldo atual estimado
            $balance = $totalIncome - $totalExpense;

            return response()->json([
                'success' => true,
                'totalIncome' => (float) $totalIncome,
                'totalExpense' => (float) $totalExpense,
                'netFlow' => (float) ($periodIncome - $periodExpense),
                'balance' => (float) $balance,
                'periodIncome' => (float) $periodIncome,
                'periodExpense' => (float) $periodExpense
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao carregar resumo do fluxo de caixa: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Resumo diário do fluxo de caixa
     */
    public function daily(Request $request): JsonResponse
    {
        try {
            $startDate = $request->start_date ? Carbon::parse($request->start_date) : now()->startOfMonth();
            $endDate = $request->end_date ? Carbon::parse($request->end_date) : now()->endOfMonth();
            $type = $request->type; // 'income', 'expense', or null for all

            $dailyData = [];
            $runningBalance = 0;

            // Para cada dia no período
            for ($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
                $dayStart = $date->copy()->startOfDay();
                $dayEnd = $date->copy()->endOfDay();

                // Receitas do dia
                $dayIncome = 0;
                if (!$type || $type === 'income') {
                    $dayIncome = Sale::whereBetween('created_at', [$dayStart, $dayEnd])
                        ->where('status', 'completed')
                        ->sum('total_amount') ?? 0;

                    $dayIncome += AccountsReceivable::where('status', 'paid')
                        ->whereNotNull('payment_date')
                        ->whereBetween('payment_date', [$dayStart, $dayEnd])
                        ->sum('original_amount') ?? 0;
                }

                // Despesas do dia
                $dayExpense = 0;
                if (!$type || $type === 'expense') {
                    $dayExpense = AccountsPayable::where('status', 'paid')
                        ->whereNotNull('payment_date')
                        ->whereBetween('payment_date', [$dayStart, $dayEnd])
                        ->sum('original_amount') ?? 0;
                }

                $runningBalance += ($dayIncome - $dayExpense);

                $dailyData[] = [
                    'date' => $date->format('Y-m-d'),
                    'income' => (float) $dayIncome,
                    'expense' => (float) $dayExpense,
                    'balance' => (float) $runningBalance
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $dailyData
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao carregar dados diários: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Fluxo de caixa por categoria
     */
    public function byCategory(Request $request): JsonResponse
    {
        try {
            $startDate = $request->start_date ? Carbon::parse($request->start_date) : now()->startOfMonth();
            $endDate = $request->end_date ? Carbon::parse($request->end_date) : now()->endOfMonth();

            // Receitas por categoria
            $incomeByCategory = [
                'Vendas' => Sale::whereBetween('created_at', [$startDate, $endDate])
                    ->where('status', 'completed')
                    ->sum('total_amount'),
                'Recebimentos' => AccountsReceivable::where('status', 'paid')
                    ->whereNotNull('payment_date')
                    ->whereBetween('payment_date', [$startDate, $endDate])
                    ->sum('original_amount')
            ];

            // Despesas por categoria
            $expenseByCategory = AccountsPayable::selectRaw('category, SUM(original_amount) as total')
                ->where('status', 'paid')
                ->whereNotNull('payment_date')
                ->whereBetween('payment_date', [$startDate, $endDate])
                ->groupBy('category')
                ->pluck('total', 'category')
                ->toArray();

            return response()->json([
                'success' => true,
                'data' => [
                    'income' => $incomeByCategory,
                    'expense' => $expenseByCategory
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao carregar dados por categoria: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Projeção de fluxo de caixa
     */
    public function projection(Request $request): JsonResponse
    {
        try {
            $days = $request->days ?? 30;
            $startDate = now();
            $endDate = now()->addDays($days);

            $projection = [];

            // Contas a receber pendentes
            $pendingReceivables = AccountsReceivable::where('status', '!=', 'paid')
                ->whereBetween('due_date', [$startDate, $endDate])
                ->orderBy('due_date')
                ->get()
                ->map(function ($receivable) {
                    return [
                        'date' => $receivable->due_date,
                        'description' => "Recebimento: {$receivable->description}",
                        'type' => 'income',
                        'amount' => $receivable->remaining_amount,
                        'status' => 'projected'
                    ];
                });

            // Contas a pagar pendentes
            $pendingPayables = AccountsPayable::where('status', '!=', 'paid')
                ->whereBetween('due_date', [$startDate, $endDate])
                ->orderBy('due_date')
                ->get()
                ->map(function ($payable) {
                    return [
                        'date' => $payable->due_date,
                        'description' => "Pagamento: {$payable->description}",
                        'type' => 'expense',
                        'amount' => $payable->remaining_amount,
                        'status' => 'projected'
                    ];
                });

            $projection = $pendingReceivables->concat($pendingPayables)
                ->sortBy('date')
                ->values();

            return response()->json([
                'success' => true,
                'data' => $projection
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao carregar projeção: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Exportar dados do fluxo de caixa
     */
    public function export(Request $request): JsonResponse
    {
        try {
            $entriesResponse = $this->entries($request);
            $summaryResponse = $this->summary($request);

            $data = [
                'summary' => $summaryResponse->getData(),
                'entries' => $entriesResponse->getData()->data,
                'exported_at' => now()->format('Y-m-d H:i:s'),
                'period' => [
                    'start' => $request->start_date ?? now()->startOfMonth()->format('Y-m-d'),
                    'end' => $request->end_date ?? now()->endOfMonth()->format('Y-m-d')
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => $data
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao exportar dados: ' . $e->getMessage()
            ], 500);
        }
    }
}
