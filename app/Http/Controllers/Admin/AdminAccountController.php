<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use App\Http\Controllers\Controller;

class AdminAccountController extends Controller
{
    /**
     * Switch to personal account (user mode)
     */
    public function switchToPersonalAccount(Request $request)
    {
        // Set admin mode to false
        Session::put('admin_mode', false);

        // Always redirect to organizations select page - it will handle
        // redirection to create page if user has no organizations
        return redirect()->route('organizations.select')
            ->with('success', 'Switched to personal account mode');
    }

    /**
     * Switch back to admin mode
     */
    public function switchToAdminMode(Request $request)
    {
        // Set admin mode to true
        Session::put('admin_mode', true);

        // Redirect to admin dashboard
        return redirect()->route('admin.dashboard')
            ->with('success', 'Switched to admin mode');
    }
}
