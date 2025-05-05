<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class UserDashboardController extends Controller
{
    /**
     * Display the user dashboard.
     */
    public function index()
    {

        $user = Auth::user();
        $user->load(['plan']);

        return Inertia::render('User/Dashboard', [
            'user' => $user,
        ]);
    }
}
