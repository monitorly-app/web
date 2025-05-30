<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => Session::get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        Session::regenerate();

        // Check if there's a pending invitation in session
        if (Session::has('invitation_token')) {
            $token = Session::get('invitation_token');
            Session::forget('invitation_token');

            // Redirect to invitation acceptance
            return redirect()->route('invitations.accept', $token);
        }

        // Check role ID
        if (Auth::user()->role_id === 1) {
            return redirect()->intended(route('admin.dashboard', absolute: false));
        } else {
            // For normal users, check if they have projects
            $user = Auth::user();
            $lastProject = $user->projects()->latest()->first();

            if ($lastProject) {
                return redirect()->intended(route('projects.dashboard', $lastProject->id, absolute: false));
            } else {
                // No projects yet, redirect to project creation
                return redirect()->intended(route('projects.create', absolute: false));
            }
        }
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        Session::invalidate();
        Session::regenerateToken();

        return redirect('/');
    }
}
