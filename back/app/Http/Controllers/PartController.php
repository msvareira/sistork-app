<?php

namespace App\Http\Controllers;

use App\Models\Part;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PartController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $parts = Part::orderBy('created_at', 'desc')->get();
        return response()->json($parts);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'internal_code' => 'required|string|max:255|unique:parts',
            'quantity' => 'required|integer|min:0',
            'cost_price' => 'required|numeric|min:0',
            'sell_price' => 'required|numeric|min:0',
            'supplier' => 'nullable|string|max:255'
        ]);

        $part = Part::create($request->all());
        return response()->json($part, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $part = Part::findOrFail($id);
        return response()->json($part);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $part = Part::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'internal_code' => 'sometimes|required|string|max:255|unique:parts,internal_code,' . $id,
            'quantity' => 'sometimes|required|integer|min:0',
            'cost_price' => 'sometimes|required|numeric|min:0',
            'sell_price' => 'sometimes|required|numeric|min:0',
            'supplier' => 'nullable|string|max:255'
        ]);

        $part->update($request->all());
        return response()->json($part);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $part = Part::findOrFail($id);
        $part->delete();
        return response()->json(['message' => 'Part deleted successfully']);
    }

    /**
     * Get parts with low stock for dashboard
     */
    public function lowStock(Request $request): JsonResponse
    {
        try {
            $threshold = $request->threshold ?? 10;
            
            $lowStockParts = Part::where('quantity_in_stock', '<=', $threshold)
                ->where('quantity_in_stock', '>', 0)
                ->orderBy('quantity_in_stock', 'asc')
                ->get();

            return response()->json($lowStockParts);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erro ao carregar produtos com estoque baixo: ' . $e->getMessage()
            ], 500);
        }
    }
}
