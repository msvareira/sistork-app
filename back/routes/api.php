<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\PartController;
use App\Http\Controllers\QuoteController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\AIController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\AccountsReceivableController;
use App\Http\Controllers\AccountsPayableController;
use App\Http\Controllers\FinancialController;
use App\Http\Controllers\CashFlowController;
use App\Http\Controllers\ReportsController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);

// Protected routes with custom Sanctum authentication
Route::middleware('custom-sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/user', [AuthController::class, 'user']);
    Route::get('/users', [UserController::class, 'index']);
    
    // Resource routes
    Route::apiResource('clients', ClientController::class);
    Route::apiResource('parts', PartController::class);
    Route::apiResource('quotes', QuoteController::class);
    Route::get('quotes/{id}/pdf', [QuoteController::class, 'generatePdf'])->name('quotes.pdf');
    Route::apiResource('appointments', AppointmentController::class);
    
    // PDV Routes
    Route::apiResource('sales', SaleController::class);
    Route::apiResource('payments', PaymentController::class);
    
    // PDV Special routes
    Route::post('/sales/{sale}/complete', [SaleController::class, 'complete']);
    Route::post('/sales/{sale}/payments', [SaleController::class, 'addPayment']);
    Route::get('/sales/report/summary', [SaleController::class, 'report']);
    Route::get('/products/search', [SaleController::class, 'searchProducts']);
    
    // Special routes
    Route::post('/appointments/from-quote', [AppointmentController::class, 'createFromQuote']);
    
    // AI routes - Ollama Local Real AI
    Route::post('/ai/analyze-problem', [AIController::class, 'analyzeProblem']);
    Route::post('/ai/diagnostic-with-images', [AIController::class, 'diagnosticWithImages']);
    Route::get('/ai/health-check', [AIController::class, 'healthCheck']);
    
    // Financial System Routes
    // Accounts Receivable
    Route::apiResource('accounts-receivable', AccountsReceivableController::class);
    Route::put('/accounts-receivable/{accountsReceivable}/pay', [AccountsReceivableController::class, 'pay']);
    Route::get('/accounts-receivable-pending', [AccountsReceivableController::class, 'pending']);
    Route::get('/accounts-receivable/report/summary', [AccountsReceivableController::class, 'report']);
    
    // Accounts Payable
    Route::apiResource('accounts-payable', AccountsPayableController::class);
    Route::put('/accounts-payable/{accountsPayable}/pay', [AccountsPayableController::class, 'pay']);
    Route::get('/accounts-payable-pending', [AccountsPayableController::class, 'pending']);
    Route::get('/accounts-payable/report/category', [AccountsPayableController::class, 'reportByCategory']);
    
    // Financial Overview
    Route::get('/financial/summary', [FinancialController::class, 'summary']);
    Route::get('/financial/monthly-data', [FinancialController::class, 'monthlyData']);
    Route::get('/financial/profit-analysis', [FinancialController::class, 'profitAnalysis']);
    Route::get('/financial/dashboard', [FinancialController::class, 'dashboard']);
    
    // Cash Flow
    Route::get('/cash-flow/entries', [CashFlowController::class, 'entries']);
    Route::get('/cash-flow/summary', [CashFlowController::class, 'summary']);
    Route::get('/cash-flow/daily', [CashFlowController::class, 'daily']);
    Route::get('/cash-flow/by-category', [CashFlowController::class, 'byCategory']);
    Route::get('/cash-flow/projection', [CashFlowController::class, 'projection']);
    Route::get('/cash-flow/export', [CashFlowController::class, 'export']);
    
    // Reports
    Route::get('/reports/dashboard', [ReportsController::class, 'dashboard']);
    Route::get('/reports/sales', [ReportsController::class, 'sales']);
    Route::get('/reports/financial', [ReportsController::class, 'financial']);
    Route::get('/reports/inventory', [ReportsController::class, 'inventory']);
    Route::get('/reports/pdf', [ReportsController::class, 'pdf']);
    
    // Sales Statistics for Dashboard
    Route::get('/sales/stats', [SaleController::class, 'stats']);
    Route::get('/sales/recent', [SaleController::class, 'recent']);
    
    // Parts/Stock for Dashboard
    Route::get('/parts/low-stock', [PartController::class, 'lowStock']);
    
    // Clients count for Dashboard
    Route::get('/clients/count', [ClientController::class, 'count']);
});

// Health check route
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now(),
        'version' => '1.0.0'
    ]);
});

// Test routes (temporary - no auth required)
Route::post('/test-ai', [AIController::class, 'testAI']);
