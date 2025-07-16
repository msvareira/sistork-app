<?php
require_once 'vendor/autoload.php';

use App\Http\Controllers\AIController;
use Illuminate\Http\Request;

// Simple test for AI Controller
echo "Testing AI Controller...\n";

try {
    $controller = new AIController();
    $request = new Request();
    $result = $controller->healthCheck();
    echo "Health check result: " . $result->getContent() . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
