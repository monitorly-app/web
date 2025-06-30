<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class OrganizationSettingsController extends Controller
{
    /**
     * Vérifier si l'utilisateur peut modifier les settings (owner ou admin)
     */
    private function canManageSettings(Organization $organization, $user): bool
    {
        // Vérifier si c'est le propriétaire
        if ($organization->owner_id === $user->id) {
            return true;
        }

        // Vérifier si c'est un admin (role_id = 2)
        return $organization->members()
            ->where('user_id', $user->id)
            ->where('organization_role_id', 2)
            ->exists();
    }

    /**
     * Vérifier si l'utilisateur peut supprimer l'organisation (seulement owner)
     */
    private function canDeleteOrganization(Organization $organization, $user): bool
    {
        return $organization->owner_id === $user->id;
    }

    /**
     * Affiche les paramètres de l'organisation
     */
    public function show(Organization $organization)
    {
        // Le middleware organization.owner gère déjà les permissions
        // Pas besoin de vérification supplémentaire ici

        // Rendre les clés visibles pour les paramètres
        $organizationWithKeys = $organization->load('owner')->makeVisible(['encryption_key']);

        // Ajouter les statistiques d'usage de l'API


        // Calculer les permissions pour le frontend
        $user = request()->user();
        $permissions = [
            'canManageSettings' => $this->canManageSettings($organization, $user),
            'canDeleteOrganization' => $this->canDeleteOrganization($organization, $user),
        ];

        return Inertia::render('User/Organizations/Settings', [
            'organization' => $organizationWithKeys,
            'permissions' => $permissions,
        ]);
    }

    /**
     * Mettre à jour les informations de l'organisation
     */
    public function update(Request $request, Organization $organization)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'logo' => 'nullable|image|max:2048',
        ]);

        $updateData = [
            'name' => $request->name,
            'description' => $request->description,
        ];

        // Gérer l'upload du logo
        if ($request->hasFile('logo')) {
            // Supprimer l'ancien logo s'il existe
            if ($organization->logo) {
                Storage::disk('public')->delete($organization->logo);
            }

            // Stocker le nouveau logo
            $logoPath = $request->file('logo')->store('organizations/logos', 'public');
            $updateData['logo'] = $logoPath;
        }

        $organization->update($updateData);

        return back()->with('success', 'Organization updated successfully');
    }

    /**
     * Supprimer le logo de l'organisation
     */
    public function removeLogo(Organization $organization)
    {
        // Le middleware organization.owner gère déjà les permissions
        // Pas besoin de vérification supplémentaire ici

        // Supprimer le fichier du stockage
        if ($organization->logo) {
            Storage::disk('public')->delete($organization->logo);
            $organization->update(['logo' => null]);
        }

        return back()->with('success', 'Logo removed successfully');
    }

    /**
     * Supprimer l'organisation
     */
    public function destroy(Organization $organization)
    {
        // Vérifier que seul le propriétaire peut supprimer l'organisation
        if (!$this->canDeleteOrganization($organization, request()->user())) {
            return back()->with('error', 'Only organization owners can delete organizations.');
        }

        // Supprimer toutes les données associées
        $organization->servers()->each(function ($server) {
            $server->metrics()->delete();
            $server->delete();
        });

        // Supprimer les invitations
        $organization->invitations()->delete();

        // Détacher les membres
        $organization->members()->detach();

        // Supprimer l'organisation
        $organization->delete();

        return redirect()->route('organizations.select')->with('success', 'Organization deleted successfully');
    }

    /**
     * Régénérer la clé API de l'organisation
     */
    public function regenerateApiKey(Organization $organization)
    {
        $newApiKey = $organization->regenerateApiKey();

        return back()->with([
            'success' => 'API key regenerated successfully',
            'api_key' => $newApiKey,
        ]);
    }

    /**
     * Régénérer la clé de chiffrement de l'organisation
     */
    public function regenerateEncryptionKey(Organization $organization)
    {
        $newEncryptionKey = $organization->regenerateEncryptionKey();

        return back()->with([
            'success' => 'Encryption key regenerated successfully',
            'encryption_key' => $newEncryptionKey,
        ]);
    }

    /**
     * Régénérer toutes les clés de l'organisation
     */
    public function regenerateAllKeys(Organization $organization)
    {
        $keys = $organization->regenerateAllKeys();

        return back()->with([
            'success' => 'All keys regenerated successfully',
            'api_key' => $keys['api_key'],
            'encryption_key' => $keys['encryption_key'],
        ]);
    }
}
