<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AppointmentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $appointments = Appointment::with(['client', 'quote'])
            ->orderBy('date', 'asc')
            ->orderBy('time', 'asc')
            ->get()
            ->map(function ($appointment) {
                return [
                    'id' => $appointment->id,
                    'clientId' => $appointment->client_id,
                    'client' => $appointment->client ? [
                        'id' => $appointment->client->id,
                        'name' => $appointment->client->name,
                        'phone' => $appointment->client->phone,
                        'motorcycleModel' => $appointment->client->motorcycle_model,
                        'licensePlate' => $appointment->client->license_plate,
                        'notes' => $appointment->client->notes,
                        'createdAt' => $appointment->client->created_at->format('c'),
                    ] : null,
                    'quoteId' => $appointment->quote_id,
                    'quote' => $appointment->quote ? [
                        'id' => $appointment->quote->id,
                        'total' => (float) $appointment->quote->total,
                        'status' => $appointment->quote->status,
                    ] : null,
                    'service' => $appointment->service,
                    'date' => $appointment->date->format('Y-m-d'),
                    'time' => $appointment->time->format('H:i'),
                    'status' => $appointment->status,
                    'notes' => $appointment->notes,
                    'createdAt' => $appointment->created_at->format('c'),
                ];
            });

        return response()->json($appointments);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'client_id' => 'required|exists:clients,id',
            'quote_id' => 'nullable|exists:quotes,id',
            'service' => 'required|string|max:255',
            'date' => 'required|date|after_or_equal:today',
            'time' => 'required',
            'status' => 'required|in:scheduled,confirmed,completed,cancelled',
            'notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($request) {
            $appointment = Appointment::create([
                'client_id' => $request->client_id,
                'quote_id' => $request->quote_id,
                'service' => $request->service,
                'date' => $request->date,
                'time' => $request->time,
                'status' => $request->status,
                'notes' => $request->notes,
            ]);

            return response()->json($appointment->load(['client', 'quote']), 201);
        });
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $appointment = Appointment::with(['client', 'quote'])->findOrFail($id);

        return response()->json([
            'id' => $appointment->id,
            'clientId' => $appointment->client_id,
            'client' => $appointment->client ? [
                'id' => $appointment->client->id,
                'name' => $appointment->client->name,
                'phone' => $appointment->client->phone,
                'motorcycleModel' => $appointment->client->motorcycle_model,
                'licensePlate' => $appointment->client->license_plate,
                'notes' => $appointment->client->notes,
                'createdAt' => $appointment->client->created_at->format('c'),
            ] : null,
            'quoteId' => $appointment->quote_id,
            'quote' => $appointment->quote ? [
                'id' => $appointment->quote->id,
                'total' => (float) $appointment->quote->total,
                'status' => $appointment->quote->status,
            ] : null,
            'service' => $appointment->service,
            'date' => $appointment->date->format('Y-m-d'),
            'time' => $appointment->time->format('H:i'),
            'status' => $appointment->status,
            'notes' => $appointment->notes,
            'createdAt' => $appointment->created_at->format('c'),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $appointment = Appointment::findOrFail($id);

        $request->validate([
            'client_id' => 'sometimes|required|exists:clients,id',
            'quote_id' => 'nullable|exists:quotes,id',
            'service' => 'sometimes|required|string|max:255',
            'date' => 'sometimes|required|date',
            'time' => 'sometimes|required',
            'status' => 'sometimes|required|in:scheduled,confirmed,completed,cancelled',
            'notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($request, $appointment) {
            $appointment->update($request->only([
                'client_id',
                'quote_id',
                'service',
                'date',
                'time',
                'status',
                'notes',
            ]));

            return response()->json($appointment->load(['client', 'quote']));
        });
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $appointment = Appointment::findOrFail($id);
        $appointment->delete();

        return response()->json(['message' => 'Appointment deleted successfully']);
    }

    /**
     * Create appointment from quote
     */
    public function createFromQuote(Request $request): JsonResponse
    {
        $request->validate([
            'quote_id' => 'required|exists:quotes,id',
            'date' => 'required|date|after_or_equal:today',
            'time' => 'required',
            'notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($request) {
            $quote = \App\Models\Quote::with(['client', 'quoteServices'])->findOrFail($request->quote_id);
            
            // Create service description from quote services
            $serviceDescription = $quote->quoteServices->pluck('description')->join(', ');
            if (empty($serviceDescription)) {
                $serviceDescription = 'Serviços do orçamento #' . $quote->id;
            }

            $appointment = Appointment::create([
                'client_id' => $quote->client_id,
                'quote_id' => $quote->id,
                'service' => $serviceDescription,
                'date' => $request->date,
                'time' => $request->time,
                'status' => 'scheduled',
                'notes' => $request->notes,
            ]);

            // Update quote with schedule information
            $quote->update([
                'scheduled_date' => $request->date,
                'scheduled_time' => $request->time,
                'schedule_notes' => $request->notes,
            ]);

            return response()->json($appointment->load(['client', 'quote']), 201);
        });
    }
}
