<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): InertiaResponse
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

        // Debug log
        Log::info('User authenticated: ' . Auth::user()->email);

        // Check if there's a pending invitation in session
        if (Session::has('invitation_token')) {
            $token = Session::get('invitation_token');
            Session::forget('invitation_token');

            // Redirect to invitation acceptance
            return redirect()->route('invitations.accept', $token);
        }

        // Check role ID
        if (Auth::user()->role_id === 1) {
            Log::info('Admin user, redirecting to admin dashboard');
            return redirect()->route('admin.dashboard');
        } else {
            // For normal users, check if they have organizations
            $user = Auth::user();
            $organizationsCount = $user->ownedOrganizations()->count();
            Log::info('User organizations count: ' . $organizationsCount);

            $lastOrganization = $user->ownedOrganizations()->latest()->first();

            if ($lastOrganization) {
                Log::info('User has organizations, redirecting to: organizations.dashboard');
                return redirect()->route('organizations.dashboard', $lastOrganization->id);
            } else {
                // No organizations yet, redirect to organization creation
                Log::info('User has no organizations, redirecting to: organizations.create');
                return redirect()->route('organizations.create');
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
