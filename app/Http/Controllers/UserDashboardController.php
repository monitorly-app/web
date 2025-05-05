<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class UserDashboardController extends Controller
{
    /**
     * Display the user dashboard.
     */
    public function index()
    {
        $user = auth()->user();
        $user->load(['plan']);

        return Inertia::render('User/Dashboard', [
            'user' => $user,
        ]);
    }
}
