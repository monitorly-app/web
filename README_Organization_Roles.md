# 🛡️ Système de Gestion des Rôles d'Organisation

## 📋 Vue d'ensemble

Le système de gestion des rôles d'organisation permet aux administrateurs de créer et gérer dynamiquement les rôles et permissions pour les membres des organisations.

## 🚀 Fonctionnalités

### ✨ Principales caractéristiques

- **Gestion dynamique des rôles** : Créer, modifier et supprimer des rôles personnalisés
- **Système de permissions granulaire** : 17 permissions réparties en 5 catégories
- **Rôles système protégés** : Owner et Admin sont protégés contre la suppression
- **Interface intuitive** : Interface React moderne avec drag & drop des permissions
- **Permissions par catégorie** : Serveurs, Métriques, Membres, Paramètres, Facturation

## 🗄️ Structure de la base de données

### Tables créées

1. **`organization_permissions`** - Stocke toutes les permissions disponibles
2. **`organization_role_permissions`** - Table pivot rôle ↔ permissions
3. **`organization_roles`** - Rôles d'organisation existants (mise à jour)

### Permissions par défaut

#### 🖥️ Serveurs
- `view_servers` : Voir les serveurs
- `create_servers` : Créer des serveurs
- `edit_servers` : Modifier les serveurs
- `delete_servers` : Supprimer les serveurs

#### 📊 Métriques
- `view_metrics` : Voir les métriques
- `configure_alerts` : Configurer les alertes
- `acknowledge_alerts` : Acquitter les alertes

#### 👥 Membres
- `view_members` : Voir les membres
- `invite_members` : Inviter des membres
- `manage_members` : Gérer les membres
- `remove_members` : Supprimer des membres

#### ⚙️ Paramètres
- `view_settings` : Voir les paramètres
- `manage_settings` : Gérer les paramètres
- `manage_api_keys` : Gérer les clés API
- `delete_organization` : Supprimer l'organisation

#### 💳 Facturation
- `view_billing` : Voir la facturation
- `manage_billing` : Gérer la facturation

## 🎭 Rôles par défaut

### 👑 Owner (Système)
- **Toutes les permissions** (17/17)
- Protection contre suppression
- Transfert de propriété possible

### 🛡️ Admin (Système)
- **15 permissions** (pas delete_organization, manage_billing)
- Protection contre suppression
- Gestion complète sauf propriété

### 🔧 Engineer
- **7 permissions** : Serveurs + Métriques + View Members
- Peut gérer l'infrastructure et alertes

### 👨‍💻 Developer
- **4 permissions** : View Servers + Métriques limitées + View Members
- Accès en lecture principalement

### 👀 Viewer
- **3 permissions** : Lecture seule
- Aucune modification possible

## 🎨 Interface utilisateur

### Pages créées

1. **`/admin/organization-roles`** - Liste des rôles avec aperçu des permissions
2. **`/admin/organization-roles/create`** - Création d'un nouveau rôle
3. **`/admin/organization-roles/{id}/edit`** - Modification d'un rôle
4. **`/admin/organization-roles/{id}`** - Détails d'un rôle

### Fonctionnalités UI

- **Sélection par catégorie** : Cocher/décocher une catégorie entière
- **Aperçu en temps réel** : Compteur de permissions sélectionnées
- **Codes couleurs** : Catégories visuellement distinctes
- **Protection système** : Rôles système clairement identifiés
- **Modal de confirmation** : Prévention des suppressions accidentelles

## 🔧 API & Contrôleurs

### Endpoints disponibles

```php
// CRUD standard
GET    /admin/organization-roles              // Index
GET    /admin/organization-roles/create       // Create form
POST   /admin/organization-roles              // Store
GET    /admin/organization-roles/{id}         // Show
GET    /admin/organization-roles/{id}/edit    // Edit form
PATCH  /admin/organization-roles/{id}         // Update
DELETE /admin/organization-roles/{id}         // Delete

// Permissions système
POST   /admin/organization-roles/{id}/update-permissions  // Update system role permissions
```

### Validation

- **Nom unique** : Pas de doublons de noms de rôles
- **Permissions valides** : IDs de permissions existantes uniquement
- **Protection système** : Empêche modification/suppression des rôles Owner/Admin
- **Vérification d'utilisation** : Empêche suppression si rôle assigné

## 🛠️ Utilisation

### Créer un nouveau rôle

1. Aller dans **Admin > Organizations > Organization Roles**
2. Cliquer sur **"Add Role"**
3. Remplir le nom et la description
4. Sélectionner les permissions par catégorie
5. Sauvegarder

### Modifier un rôle existant

1. Dans la liste, cliquer sur **"Edit"** (rôles non-système uniquement)
2. Modifier les informations et permissions
3. Sauvegarder les changements

### Voir les détails d'un rôle

1. Cliquer sur **"View Details"**
2. Voir toutes les permissions avec statut (accordée/refusée)
3. Statistiques par catégorie

## 🔐 Sécurité

### Protection des rôles système

- **Owner** et **Admin** marqués comme `is_system`
- Impossible de supprimer ou renommer
- Permissions modifiables via endpoint spécial

### Validation des permissions

- Vérification de l'existence des permissions
- Prévention des permissions invalides
- Synchronisation atomique avec la base

### Gestion des erreurs

- Messages d'erreur clairs
- Redirection sécurisée en cas d'erreur
- Rollback automatique des transactions

## 📈 Intégration

### Dans la sidebar admin

```tsx
// Navigation pour les organisations
const organizationNavItems: NavItem[] = [
    {
        title: 'Organization Roles',
        href: '/admin/organization-roles',
        icon: Building,
    },
];
```

### Dans le dashboard admin

- **Statistique** : Nombre total de rôles d'organisation
- **Carte dédiée** : Liste des rôles avec compteur de membres
- **Liens directs** : Accès rapide à la création et gestion

## 🎯 Cas d'utilisation

### Entreprise SaaS
- **Team Lead** : permissions serveurs + membres
- **Senior Dev** : permissions serveurs + métriques avancées
- **Junior Dev** : lecture seule + acquittement alertes

### Agence de consultation
- **Project Manager** : gestion complète projet
- **Consultant** : accès lecture + reporting
- **Client** : vue d'ensemble uniquement

### Startup
- **CTO** : permissions techniques complètes
- **DevOps** : serveurs + métriques + alertes
- **Business** : facturation + vue d'ensemble

## 🚀 Migration et déploiement

### Commandes à exécuter

```bash
# Migrations
php artisan migrate

# Seeding des permissions
php artisan db:seed --class=OrganizationPermissionSeeder

# Build des assets
npm run build
```

### Données migrées automatiquement

- ✅ Permissions créées et assignées aux rôles existants
- ✅ Relations pivot configurées
- ✅ Rôles système identifiés et protégés

## 🤝 Contribution

Pour ajouter de nouvelles permissions :

1. Modifier le `OrganizationPermissionSeeder`
2. Ajouter la permission dans la catégorie appropriée
3. Assigner aux rôles par défaut si nécessaire
4. Re-exécuter le seeder

---

*Système créé pour une gestion flexible et sécurisée des permissions d'organisation* 🛡️ 