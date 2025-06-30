import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { type NavItem, type OrganizationMember, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Package, Server, Settings, ShieldCheck, Users } from 'lucide-react';
import AppLogo from './app-logo';
import { OrganizationSelectorDropdown } from './organization-selector-dropdown';

export function AppSidebar() {
    const { auth, admin_mode, currentOrganization, organizations, organizationLimits } = usePage<SharedData>().props;
    const isGlobalAdmin = auth.user.role_id === 1 && admin_mode === true;

    // Fonction pour vérifier les permissions dans l'organisation
    const getOrganizationPermissions = () => {
        if (!currentOrganization)
            return { canViewOverview: false, canManageMembers: false, canManageSettings: false, canViewServers: false, canManageBilling: false };

        const user = auth.user;

        // Owner de l'organisation
        const isOrganizationOwner = currentOrganization.owner_id === user.id;

        // Admin de l'organisation (chercher dans les membres avec le bon typage)
        const userMembership = currentOrganization.members?.find((member: OrganizationMember) => member.id === user.id);
        const userOrganizationRole = userMembership?.pivot?.organization_role_id;

        // Selon OrganizationRoleSeeder : 1 = Owner, 2 = Admin, 3 = Engineer, 4 = Developer, 5 = Viewer
        const isOrganizationAdmin = userOrganizationRole === 2; // Admin role
        const isEngineer = userOrganizationRole === 3; // Engineer role
        const isDeveloper = userOrganizationRole === 4; // Developer role

        return {
            canViewOverview: true, // Tous les membres peuvent voir l'overview
            canManageMembers: isOrganizationOwner || isOrganizationAdmin, // Owner et Admin peuvent gérer les membres
            canManageSettings: isOrganizationOwner || isOrganizationAdmin, // Owner et Admin peuvent accéder aux settings
            canViewServers: isOrganizationOwner || isOrganizationAdmin || isEngineer || isDeveloper, // Tous sauf Viewer peuvent voir les serveurs
            canManageBilling: isOrganizationOwner, // Seul l'owner peut gérer la facturation
        };
    };

    const permissions = getOrganizationPermissions();

    // Navigation principale
    const mainNavItems: NavItem[] =
        !currentOrganization || isGlobalAdmin
            ? [
                  {
                      title: 'Dashboard',
                      href: isGlobalAdmin ? '/admin/dashboard' : '/organizations/select',
                      icon: LayoutGrid,
                  },
              ]
            : [];

    // Navigation spécifique à l'organisation (basée sur les permissions)
    const organizationNavItems: NavItem[] = [];

    if (currentOrganization && !isGlobalAdmin) {
        // Overview - toujours visible pour les membres
        if (permissions.canViewOverview) {
            organizationNavItems.push({
                title: 'Overview',
                href: `/organizations/${currentOrganization.id}`,
                icon: LayoutGrid,
            });
        }

        // Members - seulement pour owners et admins
        if (permissions.canManageMembers) {
            organizationNavItems.push({
                title: 'Members',
                href: `/organizations/${currentOrganization.id}/members`,
                icon: Users,
            });
        }

        if (permissions.canViewServers) {
            organizationNavItems.push({
                title: 'Servers',
                href: `/organizations/${currentOrganization.id}/servers`,
                icon: Server,
            });
        }

        // Billing - seulement pour owners
        if (permissions.canManageBilling) {
            organizationNavItems.push({
                title: 'Billing',
                href: `/organizations/${currentOrganization.id}/billing`,
                icon: Package,
            });
        }

        // Settings - seulement pour owners
        if (permissions.canManageSettings) {
            organizationNavItems.push({
                title: 'Settings',
                href: `/organizations/${currentOrganization.id}/settings`,
                icon: Settings,
            });
        }
    }

    // Navigation admin globale
    const adminNavItems: NavItem[] = isGlobalAdmin
        ? [
              {
                  title: 'Users',
                  href: '/admin/users',
                  icon: Users,
              },
              {
                  title: 'Roles',
                  href: '/admin/roles',
                  icon: ShieldCheck,
              },
              {
                  title: 'Plans',
                  href: '/admin/plans',
                  icon: Package,
              },
          ]
        : [];

    const footerNavItems: NavItem[] = [
        {
            title: 'Repository',
            href: 'https://github.com/laravel/react-starter-kit',
            icon: Folder,
        },
        {
            title: 'Documentation',
            href: 'https://laravel.com/docs/starter-kits#react',
            icon: BookOpen,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link
                                href={
                                    isGlobalAdmin
                                        ? '/admin/dashboard'
                                        : currentOrganization
                                          ? `/organizations/${currentOrganization.id}`
                                          : '/organizations/select'
                                }
                                prefetch
                            >
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {/* Navigation principale */}
                {mainNavItems.length > 0 && <NavMain items={mainNavItems} />}

                {!isGlobalAdmin && (
                    <>
                        <OrganizationSelectorDropdown
                            currentOrganization={currentOrganization}
                            organizations={organizations}
                            user={auth.user}
                            canCreateOrganization={organizationLimits?.canCreate ?? false}
                            organizationsCount={organizationLimits?.currentCount ?? 0}
                        />
                    </>
                )}
                {/* Navigation de l'organisation */}
                {organizationNavItems.length > 0 && (
                    <SidebarGroup className={mainNavItems.length > 0 ? 'mt-4' : ''}>
                        <SidebarGroupLabel>Organization</SidebarGroupLabel>
                        <NavMain items={organizationNavItems} />
                    </SidebarGroup>
                )}

                {/* Navigation admin globale */}
                {isGlobalAdmin && adminNavItems.length > 0 && (
                    <SidebarGroup className="mt-4">
                        <SidebarGroupLabel>Administration</SidebarGroupLabel>
                        <NavMain items={adminNavItems} />
                    </SidebarGroup>
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
