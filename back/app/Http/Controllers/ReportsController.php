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
            $startDate = $request->start_date ? Carbon::parse($request->start_date) : now()->startOfMonth();
            $endDate = $request->end_date ? Carbon::parse($request->end_date) : now()->endOfMonth();

            // Vendas por período
            $sales = Sale::with(['client', 'items.part'])
                ->whereBetween('created_at', [$startDate, $endDate])
                ->orderBy('created_at', 'desc')
                ->get();

            // Estatísticas
            $stats = [
                'totalSales' => $sales->count(),
                'totalRevenue' => $sales->sum('total_amount'),
                'averageTicket' => $sales->count() > 0 ? $sales->sum('total_amount') / $sales->count() : 0,
                'completedSales' => $sales->where('status', 'completed')->count(),
                'pendingSales' => $sales->where('status', 'pending')->count(),
                'cancelledSales' => $sales->where('status', 'cancelled')->count()
            ];

            // Vendas por dia
            $dailySales = $sales->groupBy(function ($sale) {
                return $sale->created_at->format('Y-m-d');
            })->map(function ($daySales) {
                return [
                    'count' => $daySales->count(),
                    'total' => $daySales->sum('total_amount')
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'sales' => $sales,
                    'stats' => $stats,
                    'dailySales' => $dailySales
                ]
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
            $startDate = $request->start_date ? Carbon::parse($request->start_date) : now()->startOfMonth();
            $endDate = $request->end_date ? Carbon::parse($request->end_date) : now()->endOfMonth();

            // Receitas
            $salesRevenue = Sale::whereBetween('created_at', [$startDate, $endDate])
                ->where('status', 'completed')
                ->sum('total_amount');

            $receivablesRevenue = AccountsReceivable::whereBetween('payment_date', [$startDate, $endDate])
                ->where('status', 'paid')
                ->whereNotNull('payment_date')
                ->sum('amount');

            $totalRevenue = $salesRevenue + $receivablesRevenue;

            // Despesas
            $totalExpenses = AccountsPayable::whereBetween('issue_date', [$startDate, $endDate])
                ->sum('original_amount');

            $paidExpenses = AccountsPayable::where('status', 'paid')
                ->whereBetween('updated_at', [$startDate, $endDate])
                ->sum('original_amount');

            // Contas a receber
            $pendingReceivables = AccountsReceivable::where('status', '!=', 'paid')
                ->sum('remaining_amount');

            $overdueReceivables = AccountsReceivable::where('status', 'overdue')
                ->sum('remaining_amount');

            // Contas a pagar
            $pendingPayables = AccountsPayable::where('status', '!=', 'paid')
                ->sum('remaining_amount');

            $overduePayables = AccountsPayable::where('status', 'overdue')
                ->sum('remaining_amount');

            return response()->json([
                'success' => true,
                'data' => [
                    'revenue' => [
                        'sales' => $salesRevenue,
                        'receivables' => $receivablesRevenue,
                        'total' => $totalRevenue
                    ],
                    'expenses' => [
                        'total' => $totalExpenses,
                        'paid' => $paidExpenses,
                        'pending' => $totalExpenses - $paidExpenses
                    ],
                    'receivables' => [
                        'pending' => $pendingReceivables,
                        'overdue' => $overdueReceivables
                    ],
                    'payables' => [
                        'pending' => $pendingPayables,
                        'overdue' => $overduePayables
                    ],
                    'netProfit' => $totalRevenue - $paidExpenses,
                    'profitMargin' => $totalRevenue > 0 ? (($totalRevenue - $paidExpenses) / $totalRevenue) * 100 : 0
                ]
            ]);

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
            // Produtos com estoque baixo
            $lowStockThreshold = $request->threshold ?? 10;
            $lowStock = Part::where('quantity_in_stock', '<=', $lowStockThreshold)
                ->where('quantity_in_stock', '>', 0)
                ->orderBy('quantity_in_stock', 'asc')
                ->get();

            // Produtos sem estoque
            $outOfStock = Part::where('quantity_in_stock', '<=', 0)->get();

            // Produtos mais vendidos
            $topSelling = SaleItem::select('part_id', DB::raw('SUM(quantity) as total_sold'))
                ->with('part')
                ->groupBy('part_id')
                ->orderBy('total_sold', 'desc')
                ->take(10)
                ->get();

            // Valor total do estoque
            $totalInventoryValue = Part::selectRaw('SUM(quantity_in_stock * cost_price) as total')
                ->value('total') ?? 0;

            // Estatísticas gerais
            $stats = [
                'totalProducts' => Part::count(),
                'lowStockItems' => $lowStock->count(),
                'outOfStockItems' => $outOfStock->count(),
                'totalInventoryValue' => $totalInventoryValue,
                'averageStockValue' => Part::count() > 0 ? $totalInventoryValue / Part::count() : 0
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'stats' => $stats,
                    'lowStock' => $lowStock,
                    'outOfStock' => $outOfStock,
                    'topSelling' => $topSelling
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao gerar relatório de estoque: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Vendas por mês
     */
    private function getSalesByMonth(Carbon $startDate, Carbon $endDate): array
    {
        return Sale::selectRaw('
                YEAR(created_at) as year, 
                MONTH(created_at) as month, 
                COUNT(*) as sales, 
                SUM(total_amount) as revenue
            ')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'completed')
            ->groupBy('year', 'month')
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'month' => Carbon::create($item->year, $item->month)->format('M/Y'),
                    'sales' => $item->sales,
                    'revenue' => $item->revenue
                ];
            })
            ->toArray();
    }

    /**
     * Produtos mais vendidos
     */
    private function getTopProducts(Carbon $startDate, Carbon $endDate): array
    {
        return SaleItem::select('part_id', DB::raw('SUM(quantity) as quantity'), DB::raw('SUM(subtotal) as revenue'))
            ->with('part')
            ->whereHas('sale', function ($query) use ($startDate, $endDate) {
                $query->whereBetween('created_at', [$startDate, $endDate])
                      ->where('status', 'completed');
            })
            ->groupBy('part_id')
            ->orderBy('revenue', 'desc')
            ->take(5)
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->part ? $item->part->name : 'Produto não encontrado',
                    'quantity' => $item->quantity,
                    'revenue' => $item->revenue
                ];
            })
            ->toArray();
    }

    /**
     * Melhores clientes
     */
    private function getTopClients(Carbon $startDate, Carbon $endDate): array
    {
        return Sale::select('client_id', DB::raw('COUNT(*) as orders'), DB::raw('SUM(total_amount) as total'))
            ->with('client')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'completed')
            ->whereNotNull('client_id')
            ->groupBy('client_id')
            ->orderBy('total', 'desc')
            ->take(5)
            ->get()
            ->map(function ($sale) {
                return [
                    'name' => $sale->client ? $sale->client->name : 'Cliente não encontrado',
                    'orders' => $sale->orders,
                    'total' => $sale->total
                ];
            })
            ->toArray();
    }

    /**
     * Despesas por categoria
     */
    private function getExpensesByCategory(Carbon $startDate, Carbon $endDate): array
    {
        $expenses = AccountsPayable::selectRaw('category, SUM(original_amount) as amount')
            ->whereBetween('issue_date', [$startDate, $endDate])
            ->groupBy('category')
            ->orderBy('amount', 'desc')
            ->get();

        $total = $expenses->sum('amount');

        return $expenses->map(function ($expense) use ($total) {
            return [
                'category' => $expense->category,
                'amount' => $expense->amount,
                'percentage' => $total > 0 ? ($expense->amount / $total) * 100 : 0
            ];
        })->toArray();
    }

    /**
     * Análise de lucro
     */
    private function getProfitAnalysis(Carbon $startDate, Carbon $endDate): array
    {
        $totalRevenue = Sale::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'completed')
            ->sum('total_amount');

        $totalExpenses = AccountsPayable::whereBetween('issue_date', [$startDate, $endDate])
            ->sum('original_amount');

        $grossProfit = $totalRevenue;
        $netProfit = $totalRevenue - $totalExpenses;
        $profitMargin = $totalRevenue > 0 ? ($netProfit / $totalRevenue) * 100 : 0;

        return [
            'totalRevenue' => $totalRevenue,
            'totalExpenses' => $totalExpenses,
            'grossProfit' => $grossProfit,
            'netProfit' => $netProfit,
            'profitMargin' => round($profitMargin, 2)
        ];
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

    /**
     * Gerar PDF (placeholder - implementar biblioteca de PDF)
     */
    public function pdf(Request $request): JsonResponse
    {
        try {
            // Aqui você implementaria a geração do PDF
            // usando bibliotecas como DomPDF ou wkHTMLtoPDF
            
            return response()->json([
                'success' => true,
                'message' => 'PDF seria gerado aqui',
                'url' => '#'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao gerar PDF: ' . $e->getMessage()
            ], 500);
        }
    }
}
