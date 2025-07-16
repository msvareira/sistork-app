<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Display a listing of users
     */
    public function index(Request $request)
    {
        $users = User::select('id', 'name', 'email', 'created_at')
            ->paginate(10);

        return response()->json($users);
    }

    /**
     * Display the specified user
     */
    public function show(User $user)
    {
        return response()->json($user->only(['id', 'name', 'email', 'created_at']));
    }

    /**
     * Update the specified user
     */
    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $user->id,
        ]);

        $user->update($request->only(['name', 'email']));

        return response()->json($user->only(['id', 'name', 'email', 'created_at']));
    }
}
