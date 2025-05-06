import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { Link, router } from '@inertiajs/react';
import { FolderRoot, PlusCircle } from 'lucide-react';

interface Project {
    id: string;
    name: string;
    owner_id: number;
    plan: {
        id: number;
        name: string;
    };
}

interface ProjectSelectorProps {
    currentProject?: Project;
    projects: Project[];
    user: {
        id: number;
    };
}

export function ProjectSelector({ currentProject, projects, user }: ProjectSelectorProps) {
    const handleProjectSelect = (projectId: string) => {
        router.visit(route('projects.dashboard', projectId));
    };

    return (
        <SidebarGroup className="mt-6">
            <SidebarGroupLabel className="flex items-center justify-between">
                Projects
                <Link href={route('projects.create')} className="text-muted-foreground hover:text-foreground text-xs">
                    <PlusCircle className="h-4 w-4" />
                </Link>
            </SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    {projects.map((project) => (
                        <SidebarMenuItem key={project.id}>
                            <SidebarMenuButton
                                onClick={() => handleProjectSelect(project.id)}
                                isActive={currentProject?.id === project.id}
                                className="group"
                            >
                                <FolderRoot className="h-4 w-4" />
                                <span className="flex-1 truncate">{project.name}</span>
                                {project.owner_id === user.id && <span className="text-muted-foreground ml-auto text-xs">Owner</span>}
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}

                    {projects.length === 0 && (
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <Link href={route('projects.create')} className="text-muted-foreground hover:text-foreground">
                                    <PlusCircle className="h-4 w-4" />
                                    <span>Create first project</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
