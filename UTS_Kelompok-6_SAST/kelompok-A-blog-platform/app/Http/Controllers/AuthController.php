<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    // FIX: password di-hash dengan bcrypt (Hash::make), bukan MD5
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:100'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        DB::insert("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [
            $validated['name'],
            $validated['email'],
            Hash::make($validated['password']),
        ]);
        return response()->json(['message' => 'Registered']);
    }

    // FIX: query memakai parameter binding + verifikasi password dengan Hash::check
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = DB::selectOne("SELECT * FROM users WHERE email = ?", [$credentials['email']]);
        if ($user && Hash::check($credentials['password'], $user->password)) {
            $request->session()->regenerate();
            session(['user_id' => $user->id]);
            return response()->json(['message' => 'Login OK']);
        }
        return response()->json(['error' => 'Invalid credentials'], 401);
    }
}
