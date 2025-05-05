<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PlanController extends Controller
{
    /**
     * Display a listing of the plans.
     */
    public function index()
    {
        $plans = Plan::withCount('users')->get();

        return Inertia::render('Admin/Plans/Index', [
            'plans' => $plans,
        ]);
    }

    /**
     * Show the form for creating a new plan.
     */
    public function create()
    {
        return Inertia::render('Admin/Plans/Create');
    }

    /**
     * Store a newly created plan in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:plans',
            'price' => 'required|numeric|min:0',
            'frequency' => 'required|integer|min:1',
            'max_servers' => 'required|integer|min:1',
            'max_users' => 'required|integer|min:1',
            'description' => 'nullable|string',
        ]);

        Plan::create($validated);

        return redirect()->route('plans.index')->with('success', 'Plan created successfully.');
    }

    /**
     * Show the form for editing the specified plan.
     */
    public function edit(Plan $plan)
    {
        return Inertia::render('Admin/Plans/Edit', [
            'plan' => $plan,
        ]);
    }

    /**
     * Update the specified plan in storage.
     */
    public function update(Request $request, Plan $plan)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:plans,name,' . $plan->id,
            'price' => 'required|numeric|min:0',
            'frequency' => 'required|integer|min:1',
            'max_servers' => 'required|integer|min:1',
            'max_users' => 'required|integer|min:1',
            'description' => 'nullable|string',
        ]);

        $plan->update($validated);

        return redirect()->route('plans.index')->with('success', 'Plan updated successfully.');
    }

    /**
     * Remove the specified plan from storage.
     */
    public function destroy(Plan $plan)
    {
        // Prevent deletion of plans with users
        if ($plan->users()->count() > 0) {
            return redirect()->route('plans.index')->with('error', 'This plan cannot be deleted because it has users.');
        }

        $plan->delete();

        return redirect()->route('plans.index')->with('success', 'Plan deleted successfully.');
    }
}
