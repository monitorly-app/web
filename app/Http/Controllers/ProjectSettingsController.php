<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ProjectSettingsController extends Controller
{
    /**
     * Affiche les paramètres du projet
     */
    public function index(Project $project)
    {
        // Vérifier que l'utilisateur est propriétaire
        if ($project->owner_id !== Auth::id()) {
            return redirect()->route('projects.dashboard', $project)->with('error', 'Only project owners can access settings.');
        }

        return Inertia::render('User/Projects/Settings', [
            'project' => $project,
        ]);
    }

    /**
     * Mettre à jour les informations du projet
     */
    public function update(Request $request, Project $project)
    {
        // Vérifier que l'utilisateur est propriétaire
        if ($project->owner_id !== Auth::id()) {
            return redirect()->back()->with('error', 'Only project owners can update project details.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $project->update($validated);

        return redirect()->back()->with('success', 'Project updated successfully');
    }

    /**
     * Supprimer le projet
     */
    public function destroy(Request $request, Project $project)
    {
        // Vérifier que l'utilisateur est propriétaire
        if ($project->owner_id !== Auth::id()) {
            return redirect()->back()->with('error', 'Only the owner can delete this project');
        }

        // Valider la confirmation
        $request->validate([
            'confirmation' => 'required|string|in:' . $project->name,
        ]);

        // Supprimer les éventuelles relations
        $project->members()->detach();

        // Supprimer le projet
        $project->delete();

        return redirect()->route('projects.select')->with('success', 'Project deleted successfully');
    }
}
