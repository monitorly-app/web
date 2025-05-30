<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ProjectController extends Controller
{
    /**
     * Affiche la liste des projets de l'utilisateur
     */
    public function select()
    {
        $user = Auth::user();
        $projects = $user->projects()->with('owner')->get();
        $userPlan = $user->plan;

        return Inertia::render('User/Projects/Select', [
            'projects' => $projects,
            'userPlan' => $userPlan,
            'projectsCount' => $projects->count(),
        ]);
    }

    /**
     * Affiche le formulaire de création de projet
     */
    public function create()
    {
        $user = Auth::user();
        $userPlan = $user->plan;
        $currentProjectsCount = $user->ownedProjects()->count();

        // Vérifier si l'utilisateur peut créer un nouveau projet
        if ($userPlan->max_projects !== -1 && $currentProjectsCount >= $userPlan->max_projects) {
            return redirect()->route('projects.select')
                ->with('error', "You have reached the maximum number of projects ({$userPlan->max_projects}) for your {$userPlan->name} plan. Please upgrade to create more projects.");
        }

        $isFirstProject = $currentProjectsCount === 0;

        return Inertia::render('User/Projects/Create', [
            'isFirstProject' => $isFirstProject,
            'userPlan' => $userPlan,
            'currentProjectsCount' => $currentProjectsCount,
        ]);
    }

    /**
     * Sauvegarde un nouveau projet
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        $userPlan = $user->plan;
        $currentProjectsCount = $user->ownedProjects()->count();

        // Double vérification côté serveur
        if ($userPlan->max_projects !== -1 && $currentProjectsCount >= $userPlan->max_projects) {
            return redirect()->back()
                ->with('error', "You have reached the maximum number of projects ({$userPlan->max_projects}) for your {$userPlan->name} plan.");
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        $project = Project::create([
            'id' => (string) Str::uuid(),
            'name' => $validated['name'],
            'description' => $validated['description'],
            'owner_id' => $user->id,
        ]);

        // Après la création, rediriger directement vers le dashboard du projet
        return redirect()->route('projects.dashboard', $project->id)
            ->with('success', 'Project created successfully!');
    }
}
