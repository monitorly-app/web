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
import { BookOpen, Folder, LayoutGrid, Package, ShieldCheck, Users } from 'lucide-react';
import AppLogo from './app-logo';
import { ProjectSelector } from './project-selector';

export function AppSidebar() {
    const { auth, admin_mode, projects, currentProject } = usePage<SharedData>().props;
    const isAdmin = auth.user.role_id === 1 && admin_mode === true;

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: isAdmin ? '/admin/dashboard' : currentProject ? `/projects/${currentProject.id}` : '/projects/select',
            icon: LayoutGrid,
        },
    ];

    // Admin-only navigation items
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
                <NavMain items={mainNavItems} />

                {!isAdmin && <ProjectSelector currentProject={currentProject} projects={projects} user={auth.user} />}

                {/* Admin Navigation Section - only shown in admin mode */}
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
