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
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Package, Settings, ShieldCheck, Users } from 'lucide-react';
import AppLogo from './app-logo';

export function AppSidebar() {
    const { auth, admin_mode, currentProject } = usePage<SharedData>().props;
    const isGlobalAdmin = auth.user.role_id === 1 && admin_mode === true;

    // Fonction pour vérifier les permissions dans le projet
    const getProjectPermissions = () => {
        if (!currentProject) return { canViewOverview: false, canManageMembers: false, canManageSettings: false };

        const user = auth.user;

        // Owner du projet
        const isProjectOwner = currentProject.owner_id === user.id;

        // Admin du projet (chercher dans les membres avec le bon typage)
        const userMembership = currentProject.members?.find((member) => member.id === user.id);
        const userProjectRole = userMembership?.pivot?.project_role_id;

        // Ajuste selon tes project_roles (1 = Owner/Admin, 2 = Admin, 3 = Developer, 4 = Viewer)
        const isProjectAdmin = userProjectRole === 1 || userProjectRole === 2;

        return {
            canViewOverview: true, // Tous les membres peuvent voir l'overview
            canManageMembers: isProjectOwner || isProjectAdmin,
            canManageSettings: isProjectOwner, // Seul l'owner peut gérer les settings
        };
    };

    const permissions = getProjectPermissions();

    // Navigation principale
    const mainNavItems: NavItem[] =
        !currentProject || isGlobalAdmin
            ? [
                  {
                      title: 'Dashboard',
                      href: isGlobalAdmin ? '/admin/dashboard' : '/projects/select',
                      icon: LayoutGrid,
                  },
              ]
            : [];

    // Navigation spécifique au projet (basée sur les permissions)
    const projectNavItems: NavItem[] = [];

    if (currentProject && !isGlobalAdmin) {
        // Overview - toujours visible pour les membres
        if (permissions.canViewOverview) {
            projectNavItems.push({
                title: 'Overview',
                href: `/projects/${currentProject.id}`,
                icon: LayoutGrid,
            });
        }

        // Members - seulement pour owners et admins
        if (permissions.canManageMembers) {
            projectNavItems.push({
                title: 'Members',
                href: `/projects/${currentProject.id}/members`,
                icon: Users,
            });
        }

        // Settings - seulement pour owners
        if (permissions.canManageSettings) {
            projectNavItems.push({
                title: 'Settings',
                href: `/projects/${currentProject.id}/settings`,
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
                                href={isGlobalAdmin ? '/admin/dashboard' : currentProject ? `/projects/${currentProject.id}` : '/projects/select'}
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

                {/* Navigation du projet */}
                {projectNavItems.length > 0 && (
                    <SidebarGroup className={mainNavItems.length > 0 ? 'mt-4' : ''}>
                        <SidebarGroupLabel>Project</SidebarGroupLabel>
                        <NavMain items={projectNavItems} />
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
