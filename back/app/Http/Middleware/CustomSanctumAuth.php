<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\PersonalAccessToken;
use Illuminate\Support\Facades\Log;

class CustomSanctumAuth
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->bearerToken();
        
        Log::info('Custom Sanctum Auth', [
            'has_token' => !empty($token),
            'token_start' => $token ? substr($token, 0, 10) . '...' : null,
            'user_agent' => $request->userAgent(),
        ]);

        if (!$token) {
            return response()->json(['error' => 'Token não fornecido'], 401);
        }

        // Parse token (formato: id|hash)
        $tokenParts = explode('|', $token, 2);
        if (count($tokenParts) !== 2) {
            return response()->json(['error' => 'Formato de token inválido'], 401);
        }

        [$id, $plainToken] = $tokenParts;
        $hashedToken = hash('sha256', $plainToken);

        // Buscar token na database
        $accessToken = PersonalAccessToken::find($id);
        
        if (!$accessToken || !hash_equals($accessToken->token, $hashedToken)) {
            Log::info('Token validation failed', [
                'token_id' => $id,
                'found_token' => $accessToken ? 'yes' : 'no',
                'hash_match' => $accessToken ? hash_equals($accessToken->token, $hashedToken) : false,
            ]);
            return response()->json(['error' => 'Token inválido'], 401);
        }

        // Token válido - fazer login do usuário
        $user = $accessToken->tokenable;
        Auth::login($user);
        
        Log::info('Custom auth success', [
            'user_id' => $user->id,
            'user_name' => $user->name,
        ]);

        return $next($request);
    }
}
