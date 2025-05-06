<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProjectDashboardController extends Controller
{
    /**
     * Affiche le tableau de bord du projet
     */
    public function index(Request $request, Project $project)
    {
        // Vérifier que l'utilisateur a accès à ce projet (déjà géré par le middleware)

        // Charger les statistiques du projet
        $stats = [
            'servers_count' => 0, // À remplacer par une vraie requête
            'members_count' => $project->members()->count() + 1, // +1 pour le propriétaire
            'alerts_count' => 0, // À remplacer par une vraie requête
        ];

        // Dernières activités (à implémenter)
        $activities = [];

        return Inertia::render('User/Projects/Dashboard', [
            'project' => $project->load('plan'),
            'stats' => $stats,
            'activities' => $activities,
        ]);
    }
}
