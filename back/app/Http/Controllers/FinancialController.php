<?php

namespace App\Http\Controllers;

use App\Models\AccountsReceivable;
use App\Models\AccountsPayable;
use App\Models\Sale;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class FinancialController extends Controller
{
    /**
     * Resumo financeiro geral
     */
    public function summary(Request $request): JsonResponse
    {
        try {
            $startDate = $request->start_date ?? now()->startOfMonth();
            $endDate = $request->end_date ?? now()->endOfMonth();

            // Atualizar status vencidos
            $this->updateOverdueStatus();

            $summary = [
                'totalReceivables' => AccountsReceivable::sum('amount'),
                'totalPayables' => AccountsPayable::sum('original_amount'),
                'totalReceived' => AccountsReceivable::where('status', 'paid')->sum('amount'),
                'totalPaid' => AccountsPayable::where('status', 'paid')->sum('original_amount'),
                'pendingReceivables' => AccountsReceivable::where('status', '!=', 'paid')->sum('remaining_amount'),
                'pendingPayables' => AccountsPayable::where('status', '!=', 'paid')->sum('remaining_amount'),
                'monthlyRevenue' => $this->getMonthlyRevenue($startDate, $endDate),
                'monthlyExpenses' => $this->getMonthlyExpenses($startDate, $endDate),
            ];

            $summary['netCashFlow'] = $summary['monthlyRevenue'] - $summary['monthlyExpenses'];

            return response()->json($summary);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao carregar resumo financeiro: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Dados mensais para gráficos
     */
    public function monthlyData(Request $request): JsonResponse
    {
        try {
            $months = $request->months ?? 12;
            $data = [];

            for ($i = $months - 1; $i >= 0; $i--) {
                $date = now()->subMonths($i);
                $startDate = $date->copy()->startOfMonth();
                $endDate = $date->copy()->endOfMonth();

                $revenue = $this->getMonthlyRevenue($startDate, $endDate);
                $expenses = $this->getMonthlyExpenses($startDate, $endDate);

                $data[] = [
                    'month' => $date->format('M/Y'),
                    'revenue' => $revenue,
                    'expenses' => $expenses,
                    'profit' => $revenue - $expenses
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $data
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao carregar dados mensais: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Análise de lucratividade
     */
    public function profitAnalysis(Request $request): JsonResponse
    {
        try {
            $startDate = $request->start_date ?? now()->startOfMonth();
            $endDate = $request->end_date ?? now()->endOfMonth();

            $totalRevenue = Sale::whereBetween('created_at', [$startDate, $endDate])
                ->where('status', 'completed')
                ->sum('total_amount');

            $totalExpenses = AccountsPayable::whereBetween('issue_date', [$startDate, $endDate])
                ->sum('original_amount');

            $grossProfit = $totalRevenue;
            $netProfit = $totalRevenue - $totalExpenses;
            $profitMargin = $totalRevenue > 0 ? ($netProfit / $totalRevenue) * 100 : 0;

            return response()->json([
                'success' => true,
                'data' => [
                    'totalRevenue' => $totalRevenue,
                    'totalExpenses' => $totalExpenses,
                    'grossProfit' => $grossProfit,
                    'netProfit' => $netProfit,
                    'profitMargin' => round($profitMargin, 2)
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao analisar lucratividade: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Dashboard financeiro completo
     */
    public function dashboard(Request $request): JsonResponse
    {
        try {
            $period = $request->period ?? 'current_month';
            $dates = $this->getPeriodDates($period, $request->start_date, $request->end_date);

            $data = [
                'summary' => $this->summary($request)->getData(),
                'monthlyData' => $this->monthlyData($request)->getData()->data,
                'profitAnalysis' => $this->profitAnalysis($request)->getData()->data,
                'cashFlow' => $this->getCashFlowSummary($dates['start'], $dates['end']),
                'topCategories' => $this->getTopExpenseCategories($dates['start'], $dates['end'])
            ];

            return response()->json([
                'success' => true,
                'data' => $data
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao carregar dashboard: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Fluxo de caixa resumido
     */
    private function getCashFlowSummary(Carbon $startDate, Carbon $endDate): array
    {
        $entries = collect();

        // Receitas (vendas pagas)
        $sales = Sale::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'completed')
            ->get()
            ->map(function ($sale) {
                return [
                    'date' => $sale->created_at->format('Y-m-d'),
                    'description' => "Venda #{$sale->sale_number}",
                    'type' => 'income',
                    'amount' => $sale->total_amount,
                    'category' => 'Vendas'
                ];
            });

        // Receitas (contas a receber pagas)
        $receivablesPaid = AccountsReceivable::whereBetween('payment_date', [$startDate, $endDate])
            ->where('status', 'paid')
            ->get()
            ->map(function ($receivable) {
                return [
                    'date' => $receivable->payment_date,
                    'description' => $receivable->description,
                    'type' => 'income',
                    'amount' => $receivable->amount,
                    'category' => 'Recebimentos'
                ];
            });

        // Despesas (contas a pagar pagas)
        $payablesPaid = AccountsPayable::whereBetween('updated_at', [$startDate, $endDate])
            ->where('status', 'paid')
            ->get()
            ->map(function ($payable) {
                return [
                    'date' => $payable->updated_at->format('Y-m-d'),
                    'description' => $payable->description,
                    'type' => 'expense',
                    'amount' => $payable->original_amount,
                    'category' => $payable->category
                ];
            });

        $entries = $entries->concat($sales)->concat($receivablesPaid)->concat($payablesPaid);

        $totalIncome = $entries->where('type', 'income')->sum('amount');
        $totalExpense = $entries->where('type', 'expense')->sum('amount');

        return [
            'totalIncome' => $totalIncome,
            'totalExpense' => $totalExpense,
            'netFlow' => $totalIncome - $totalExpense,
            'entries' => $entries->sortByDesc('date')->take(10)->values()
        ];
    }

    /**
     * Top categorias de despesas
     */
    private function getTopExpenseCategories(Carbon $startDate, Carbon $endDate): array
    {
        return AccountsPayable::selectRaw('category, SUM(original_amount) as total')
            ->whereBetween('issue_date', [$startDate, $endDate])
            ->groupBy('category')
            ->orderBy('total', 'desc')
            ->take(5)
            ->get()
            ->map(function ($item) {
                return [
                    'category' => $item->category,
                    'amount' => $item->total
                ];
            })
            ->toArray();
    }

    /**
     * Receita mensal
     */
    private function getMonthlyRevenue(Carbon $startDate, Carbon $endDate): float
    {
        $salesRevenue = Sale::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'completed')
            ->sum('total_amount');

        $receivablesRevenue = AccountsReceivable::whereBetween('payment_date', [$startDate, $endDate])
            ->where('status', 'paid')
            ->sum('amount');

        return $salesRevenue + $receivablesRevenue;
    }

    /**
     * Despesas mensais
     */
    private function getMonthlyExpenses(Carbon $startDate, Carbon $endDate): float
    {
        return AccountsPayable::whereBetween('updated_at', [$startDate, $endDate])
            ->where('status', 'paid')
            ->sum('original_amount');
    }

    /**
     * Atualizar status vencidos
     */
    private function updateOverdueStatus(): void
    {
        AccountsReceivable::where('status', 'pending')
            ->where('due_date', '<', now())
            ->update(['status' => 'overdue']);

        AccountsPayable::where('status', 'pending')
            ->where('due_date', '<', now())
            ->update(['status' => 'overdue']);
    }

    /**
     * Obter datas do período
     */
    private function getPeriodDates(string $period, ?string $startDate = null, ?string $endDate = null): array
    {
        switch ($period) {
            case 'current_month':
                return [
                    'start' => now()->startOfMonth(),
                    'end' => now()->endOfMonth()
                ];
            case 'last_month':
                return [
                    'start' => now()->subMonth()->startOfMonth(),
                    'end' => now()->subMonth()->endOfMonth()
                ];
            case 'current_year':
                return [
                    'start' => now()->startOfYear(),
                    'end' => now()->endOfYear()
                ];
            case 'last_year':
                return [
                    'start' => now()->subYear()->startOfYear(),
                    'end' => now()->subYear()->endOfYear()
                ];
            case 'custom':
                return [
                    'start' => Carbon::parse($startDate ?? now()->startOfMonth()),
                    'end' => Carbon::parse($endDate ?? now()->endOfMonth())
                ];
            default:
                return [
                    'start' => now()->startOfMonth(),
                    'end' => now()->endOfMonth()
                ];
        }
    }
}
