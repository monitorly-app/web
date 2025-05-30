// resources/js/components/app-sidebar-header.tsx
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ProjectSelectorDropdown } from '@/components/project-selector-dropdown';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType, type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const { auth, projects, currentProject, admin_mode } = usePage<SharedData>().props;

    const isAdmin = auth.user.role_id === 1 && admin_mode === true;

    return (
        <header className="border-sidebar-border/50 flex h-16 shrink-0 items-center justify-between gap-2 border-b px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            {!isAdmin && (
                <div>
                    <ProjectSelectorDropdown currentProject={currentProject} projects={projects} user={auth.user} />
                </div>
            )}
        </header>
    );
}
