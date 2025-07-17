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

class CashFlowTestController extends Controller
{
    public function testSummary(Request $request): JsonResponse
    {
        try {
            $startDate = $request->start_date ? Carbon::parse($request->start_date) : now()->startOfMonth();
            $endDate = $request->end_date ? Carbon::parse($request->end_date) : now()->endOfMonth();

            // Só testar vendas primeiro
            $salesIncome = Sale::where('status', 'completed')->sum('total_amount') ?? 0;
            $payablesExpense = AccountsPayable::where('status', 'paid')->sum('original_amount') ?? 0;

            return response()->json([
                'success' => true,
                'salesIncome' => (float) $salesIncome,
                'payablesExpense' => (float) $payablesExpense,
                'message' => 'Teste simples funcionando'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro: ' . $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile()
            ], 500);
        }
    }
}
