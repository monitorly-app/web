<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ProjectController extends Controller
{
    /**
     * Affiche la liste des projets de l'utilisateur
     */
    public function select()
    {
        $projects = auth()->user()->projects()->with('plan')->get();

        return Inertia::render('User/Projects/Select', [
            'projects' => $projects,
        ]);
    }

    /**
     * Affiche le formulaire de création de projet
     */
    public function create()
    {
        // Pas besoin de plans ici, puisque le plan est sur l'utilisateur
        $isFirstProject = auth()->user()->ownedProjects()->count() === 0;

        return Inertia::render('User/Projects/Create', [
            'isFirstProject' => $isFirstProject,
        ]);
    }

    /**
     * Sauvegarde un nouveau projet
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $project = Project::create([
            'id' => (string) Str::uuid(),
            'name' => $validated['name'],
            'description' => $validated['description'],
            'owner_id' => auth()->id(),
        ]);

        // Après la création, rediriger directement vers le dashboard du projet
        return redirect()->route('projects.dashboard', $project->id);
    }
}
