<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ClientController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $clients = Client::orderBy('created_at', 'desc')->get();
        return response()->json($clients);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:255',
            'motorcycle_model' => 'required|string|max:255',
            'license_plate' => 'required|string|max:255',
            'notes' => 'nullable|string'
        ]);

        $client = Client::create($request->all());
        return response()->json($client, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $client = Client::findOrFail($id);
        return response()->json($client);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $client = Client::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'phone' => 'sometimes|required|string|max:255',
            'motorcycle_model' => 'sometimes|required|string|max:255',
            'license_plate' => 'sometimes|required|string|max:255',
            'notes' => 'nullable|string'
        ]);

        $client->update($request->all());
        return response()->json($client);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $client = Client::findOrFail($id);
        $client->delete();
        return response()->json(['message' => 'Client deleted successfully']);
    }

    /**
     * Get clients count for dashboard
     */
    public function count(): JsonResponse
    {
        try {
            $count = Client::count();
            return response()->json(['count' => $count]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erro ao contar clientes: ' . $e->getMessage()
            ], 500);
        }
    }
}
