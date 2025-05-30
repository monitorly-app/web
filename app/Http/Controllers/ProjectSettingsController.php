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
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'description' => $project->description,
                'api_key' => $project->api_key,
                'encryption_key' => $project->encryption_key,
                'api_usage_stats' => $project->getApiUsageStats(),
                'created_at' => $project->created_at->toISOString(),
            ],
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

    /**
     * Régénérer la clé API du projet
     */
    public function regenerateApiKey(Project $project)
    {
        // Vérifier que l'utilisateur est propriétaire
        if ($project->owner_id !== Auth::id()) {
            return redirect()->back()->with('error', 'Only the owner can regenerate API keys');
        }

        $newApiKey = $project->regenerateApiKey();

        return redirect()->back()->with('success', 'API key regenerated successfully. Please update your monitoring agents.');
    }

    /**
     * Régénérer la clé de chiffrement du projet
     */
    public function regenerateEncryptionKey(Project $project)
    {
        // Vérifier que l'utilisateur est propriétaire
        if ($project->owner_id !== Auth::id()) {
            return redirect()->back()->with('error', 'Only the owner can regenerate encryption keys');
        }

        $newEncryptionKey = $project->regenerateEncryptionKey();

        return redirect()->back()->with('success', 'Encryption key regenerated successfully. Please update your monitoring agents.');
    }

    /**
     * Régénérer toutes les clés du projet
     */
    public function regenerateAllKeys(Project $project)
    {
        // Vérifier que l'utilisateur est propriétaire
        if ($project->owner_id !== Auth::id()) {
            return redirect()->back()->with('error', 'Only the owner can regenerate keys');
        }

        $newKeys = $project->regenerateAllKeys();

        return redirect()->back()->with('success', 'All project keys regenerated successfully. Please update all monitoring agents with the new keys.');
    }
}
