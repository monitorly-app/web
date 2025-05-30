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
    const isAdmin = auth.user.role_id === 1 && admin_mode === true;

    const mainNavItems: NavItem[] =
        !currentProject || isAdmin
            ? [
                  {
                      title: 'Dashboard',
                      href: isAdmin ? '/admin/dashboard' : '/projects/select',
                      icon: LayoutGrid,
                  },
              ]
            : [];

    // Éléments de navigation spécifiques au projet
    const projectNavItems: NavItem[] =
        currentProject && !isAdmin
            ? [
                  {
                      title: 'Overview',
                      href: `/projects/${currentProject.id}`,
                      icon: LayoutGrid,
                  },
                  {
                      title: 'Members',
                      href: `/projects/${currentProject.id}/members`,
                      icon: Users,
                  },
                  {
                      title: 'Settings',
                      href: `/projects/${currentProject.id}/settings`,
                      icon: Settings,
                  },
              ]
            : [];

    // Éléments de navigation admin
    const adminNavItems: NavItem[] = isAdmin
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
                                href={isAdmin ? '/admin/dashboard' : currentProject ? `/projects/${currentProject.id}` : '/projects/select'}
                                prefetch
                            >
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {mainNavItems.length > 0 && <NavMain items={mainNavItems} />}

                {/* Section de navigation spécifique au projet */}
                {projectNavItems.length > 0 && (
                    <SidebarGroup className={mainNavItems.length > 0 ? 'mt-4' : ''}>
                        <NavMain items={projectNavItems} />
                    </SidebarGroup>
                )}

                {/* Section de navigation admin */}
                {isAdmin && adminNavItems.length > 0 && (
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
