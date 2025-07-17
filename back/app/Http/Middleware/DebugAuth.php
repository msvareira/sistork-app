<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class DebugAuth
{
    public function handle(Request $request, Closure $next)
    {
        Log::info('Debug Auth Middleware', [
            'has_auth_header' => $request->hasHeader('Authorization'),
            'auth_header' => $request->header('Authorization'),
            'auth_user_id' => Auth::id(),
            'auth_check' => Auth::check(),
            'request_path' => $request->path(),
            'request_method' => $request->method(),
        ]);

        return $next($request);
    }
}
