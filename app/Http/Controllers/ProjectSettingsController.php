<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProjectSettingsController extends Controller
{
    /**
     * Affiche les paramètres du projet
     */
    public function index(Project $project)
    {
        return Inertia::render('User/Projects/Settings', [
            'project' => $project->load('plan'),
            'availablePlans' => Plan::all(),
        ]);
    }

    /**
     * Mettre à jour les informations du projet
     */
    public function update(Request $request, Project $project)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $project->update($validated);

        return redirect()->back()->with('success', 'Project updated successfully');
    }

    /**
     * Mettre à jour le plan du projet
     */
    public function updatePlan(Request $request, Project $project)
    {
        $validated = $request->validate([
            'plan_id' => 'required|exists:plans,id',
        ]);

        $project->update([
            'plan_id' => $validated['plan_id'],
        ]);

        // Logique de facturation à ajouter ici

        return redirect()->back()->with('success', 'Project plan updated successfully');
    }

    /**
     * Supprimer le projet
     */
    public function destroy(Project $project)
    {
        // Vérifier que l'utilisateur est bien le propriétaire
        if ($project->owner_id !== auth()->id()) {
            return redirect()->back()->with('error', 'Only the owner can delete this project');
        }

        // Supprimer les éventuelles relations
        $project->members()->detach();
        // Ajouter ici d'autres suppressions liées

        $project->delete();

        return redirect()->route('projects.select')->with('success', 'Project deleted successfully');
    }
}
