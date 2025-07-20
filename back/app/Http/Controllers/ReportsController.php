<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Client;
use App\Models\Part;
use App\Models\AccountsReceivable;
use App\Models\AccountsPayable;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ReportsController extends Controller
{
    /**
     * Dashboard de relatórios
     */
    public function dashboard(Request $request): JsonResponse
    {
        try {
            $period = $request->period ?? 'current_month';
            $dates = $this->getPeriodDates($period, $request->start_date, $request->end_date);

            $data = [
                'salesByMonth' => $this->getSalesByMonth($dates['start'], $dates['end']),
                'topProducts' => $this->getTopProducts($dates['start'], $dates['end']),
                'topClients' => $this->getTopClients($dates['start'], $dates['end']),
                'expensesByCategory' => $this->getExpensesByCategory($dates['start'], $dates['end']),
                'profitAnalysis' => $this->getProfitAnalysis($dates['start'], $dates['end'])
            ];

            return response()->json($data);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao carregar relatórios: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Relatório de vendas
     */
    public function sales(Request $request): JsonResponse
    {
        try {
            $period = $request->period ?? 'current_month';
            $dates = $this->getPeriodDates($period, $request->start_date, $request->end_date);

            $sales = Sale::with(['client', 'items.part'])
                ->whereBetween('created_at', [$dates['start'], $dates['end']])
                ->orderBy('created_at', 'desc')
                ->get();

            $salesData = $sales->map(function ($sale) {
                return [
                    'id' => $sale->id,
                    'sale_number' => $sale->sale_number,
                    'client_name' => $sale->client->name ?? 'Cliente não informado',
                    'total_amount' => (float) $sale->total_amount,
                    'items_count' => $sale->items->count(),
                    'status' => $sale->status,
                    'created_at' => $sale->created_at->format('Y-m-d H:i:s'),
                    'items' => $sale->items->map(function ($item) {
                        return [
                            'part_name' => $item->part->name ?? 'Item não encontrado',
                            'quantity' => (int) $item->quantity,
                            'unit_price' => (float) $item->unit_price,
                            'total_price' => (float) $item->total_price
                        ];
                    })
                ];
            });

            $summary = [
                'total_sales' => $sales->count(),
                'total_revenue' => (float) $sales->sum('total_amount'),
                'average_sale' => $sales->count() > 0 ? (float) $sales->avg('total_amount') : 0,
                'period_start' => $dates['start']->format('d/m/Y'),
                'period_end' => $dates['end']->format('d/m/Y')
            ];

            return response()->json([
                'sales' => $salesData,
                'summary' => $summary
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao gerar relatório de vendas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Relatório financeiro
     */
    public function financial(Request $request): JsonResponse
    {
        try {
            $period = $request->period ?? 'current_month';
            $dates = $this->getPeriodDates($period, $request->start_date, $request->end_date);

        // Receitas (vendas + contas recebidas)
        $salesRevenue = Sale::whereBetween('created_at', [$dates['start'], $dates['end']])
            ->sum('total_amount');

        $receivedPayments = AccountsReceivable::where('status', 'paid')
            ->whereBetween('payment_date', [$dates['start'], $dates['end']])
            ->sum('remaining_amount');

        // Despesas (contas pagas)
        $expenses = AccountsPayable::where('status', 'paid')
            ->whereBetween('payment_date', [$dates['start'], $dates['end']])
            ->sum('remaining_amount');

        // Contas pendentes
        $pendingReceivables = AccountsReceivable::where('status', 'pending')
            ->sum('remaining_amount');

        $pendingPayables = AccountsPayable::where('status', 'pending')
            ->sum('remaining_amount');

            // Fluxo de caixa mensal
            $monthlyFlow = [];
            $currentDate = $dates['start']->copy();
            while ($currentDate <= $dates['end']) {
                $monthStart = $currentDate->copy()->startOfMonth();
                $monthEnd = $currentDate->copy()->endOfMonth();

                $monthRevenue = Sale::whereBetween('created_at', [$monthStart, $monthEnd])
                    ->sum('total_amount');

                $monthExpenses = AccountsPayable::where('status', 'paid')
                    ->whereBetween('payment_date', [$monthStart, $monthEnd])
                    ->sum('remaining_amount');

                $monthlyFlow[] = [
                    'month' => $currentDate->format('M/Y'),
                    'revenue' => (float) $monthRevenue,
                    'expenses' => (float) $monthExpenses,
                    'profit' => (float) ($monthRevenue - $monthExpenses)
                ];

                $currentDate->addMonth();
            }

            $summary = [
                'total_revenue' => (float) $salesRevenue,
                'received_payments' => (float) $receivedPayments,
                'total_expenses' => (float) $expenses,
                'net_profit' => (float) ($salesRevenue - $expenses),
                'pending_receivables' => (float) $pendingReceivables,
                'pending_payables' => (float) $pendingPayables,
                'cash_flow' => (float) ($pendingReceivables - $pendingPayables),
                'monthly_flow' => $monthlyFlow
            ];

            return response()->json($summary);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao gerar relatório financeiro: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Relatório de estoque
     */
    public function inventory(Request $request): JsonResponse
    {
        try {
            $lowStockLimit = $request->low_stock_limit ?? 10;

            $parts = Part::with(['saleItems' => function ($query) use ($request) {
                if ($request->period) {
                    $dates = $this->getPeriodDates($request->period, $request->start_date, $request->end_date);
                    $query->whereBetween('created_at', [$dates['start'], $dates['end']]);
                }
            }])->get();

            $inventoryData = $parts->map(function ($part) use ($lowStockLimit) {
                $totalSold = $part->saleItems->sum('quantity');
                $revenue = $part->saleItems->sum('total_price');

                return [
                    'id' => $part->id,
                    'name' => $part->name,
                    'sku' => $part->sku ?? $part->internal_code ?? 'N/A',
                    'current_stock' => (int) $part->quantity,
                    'unit_price' => (float) ($part->unit_price ?? $part->sell_price ?? 0),
                    'total_value' => (float) ($part->quantity * ($part->unit_price ?? $part->sell_price ?? 0)),
                    'sold_quantity' => (int) $totalSold,
                    'revenue_generated' => (float) $revenue,
                    'status' => $part->quantity <= $lowStockLimit ? 'low_stock' : 'ok',
                    'supplier' => $part->supplier ?? 'Não informado'
                ];
            });

            $summary = [
                'total_items' => $parts->count(),
                'total_stock_value' => (float) $inventoryData->sum('total_value'),
                'low_stock_items' => $inventoryData->where('status', 'low_stock')->count(),
                'out_of_stock_items' => $inventoryData->where('current_stock', 0)->count(),
                'most_sold_item' => $inventoryData->sortByDesc('sold_quantity')->first(),
                'highest_revenue_item' => $inventoryData->sortByDesc('revenue_generated')->first()
            ];

            return response()->json([
                'inventory' => $inventoryData->values(),
                'summary' => $summary
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao gerar relatório de estoque: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Gerar relatório em PDF
     */
    public function pdf(Request $request): JsonResponse
    {
        try {
            $type = $request->type ?? 'dashboard';
            $period = $request->period ?? 'current_month';
            
            // Por enquanto, retorna um mock do PDF
            // Aqui você pode implementar a geração real com DomPDF ou similar
            
            return response()->json([
                'success' => true,
                'message' => "Relatório {$type} em PDF gerado com sucesso!",
                'download_url' => "/reports/download/{$type}/" . time() . ".pdf",
                'type' => $type,
                'period' => $period
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao gerar PDF: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Métodos privados de apoio
     */
    private function getSalesByMonth(Carbon $startDate, Carbon $endDate): array
    {
        $sales = Sale::whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('YEAR(created_at) as year, MONTH(created_at) as month, COUNT(*) as sales, SUM(total_amount) as revenue')
            ->groupBy('year', 'month')
            ->orderBy('year')
            ->orderBy('month')
            ->get();

        return $sales->map(function ($sale) {
            return [
                'month' => sprintf('%02d/%d', $sale->month, $sale->year),
                'sales' => (int) $sale->sales,
                'revenue' => (float) $sale->revenue
            ];
        })->toArray();
    }

    private function getTopProducts(Carbon $startDate, Carbon $endDate): array
    {
        $topProducts = SaleItem::with('part')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('part_id, SUM(quantity) as quantity, SUM(total_price) as revenue')
            ->groupBy('part_id')
            ->orderBy('revenue', 'desc')
            ->limit(10)
            ->get();

        return $topProducts->map(function ($item) {
            return [
                'name' => $item->part->name ?? 'Produto não encontrado',
                'quantity' => (int) $item->quantity,
                'revenue' => (float) $item->revenue
            ];
        })->toArray();
    }

    private function getTopClients(Carbon $startDate, Carbon $endDate): array
    {
        $topClients = Sale::with('client')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('client_id, COUNT(*) as orders, SUM(total_amount) as total')
            ->groupBy('client_id')
            ->orderBy('total', 'desc')
            ->limit(10)
            ->get();

        return $topClients->map(function ($sale) {
            return [
                'name' => $sale->client->name ?? 'Cliente não informado',
                'orders' => (int) $sale->orders,
                'total' => (float) $sale->total
            ];
        })->toArray();
    }

    private function getExpensesByCategory(Carbon $startDate, Carbon $endDate): array
    {
        $expenses = AccountsPayable::where('status', 'paid')
            ->whereBetween('payment_date', [$startDate, $endDate])
            ->selectRaw('category, SUM(remaining_amount) as amount')
            ->groupBy('category')
            ->get();

        $total = $expenses->sum('amount');

        return $expenses->map(function ($expense) use ($total) {
            return [
                'category' => $expense->category ?? 'Outros',
                'amount' => (float) $expense->amount,
                'percentage' => $total > 0 ? round(($expense->amount / $total) * 100, 2) : 0
            ];
        })->toArray();
    }

    private function getProfitAnalysis(Carbon $startDate, Carbon $endDate): array
    {
        $totalRevenue = Sale::whereBetween('created_at', [$startDate, $endDate])
            ->sum('total_amount');

        $totalExpenses = AccountsPayable::where('status', 'paid')
            ->whereBetween('payment_date', [$startDate, $endDate])
            ->sum('remaining_amount');

        $grossProfit = $totalRevenue - $totalExpenses;
        $profitMargin = $totalRevenue > 0 ? ($grossProfit / $totalRevenue) * 100 : 0;

        return [
            'totalRevenue' => (float) $totalRevenue,
            'totalExpenses' => (float) $totalExpenses,
            'grossProfit' => (float) $grossProfit,
            'netProfit' => (float) $grossProfit, // Assumindo que não há outros custos por enquanto
            'profitMargin' => round($profitMargin, 2)
        ];
    }

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
                if ($startDate && $endDate) {
                    return [
                        'start' => Carbon::parse($startDate)->startOfDay(),
                        'end' => Carbon::parse($endDate)->endOfDay()
                    ];
                }
                // Fallback para mês atual se datas customizadas não foram fornecidas
                return [
                    'start' => now()->startOfMonth(),
                    'end' => now()->endOfMonth()
                ];
            default:
                return [
                    'start' => now()->startOfMonth(),
                    'end' => now()->endOfMonth()
                ];
        }
    }
}
