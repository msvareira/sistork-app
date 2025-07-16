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

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/user', [AuthController::class, 'user']);
    Route::get('/users', [UserController::class, 'index']);
    
    // Resource routes
    Route::apiResource('clients', ClientController::class);
    Route::apiResource('parts', PartController::class);
    Route::apiResource('quotes', QuoteController::class);
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
Route::get('/products/search', [SaleController::class, 'searchProducts']);
Route::get('/clients', [ClientController::class, 'index']);
