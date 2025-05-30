// resources/js/components/project-selector-dropdown.tsx
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Project } from '@/types';
import { Link, router } from '@inertiajs/react';
import { ChevronDown, FolderRoot, PlusCircle } from 'lucide-react';
import { Button } from './ui/button';

interface ProjectSelectorDropdownProps {
    currentProject?: Project;
    projects: Project[];
    user: {
        id: number;
    };
}

export function ProjectSelectorDropdown({ currentProject, projects, user }: ProjectSelectorDropdownProps) {
    const handleProjectSelect = (projectId: string) => {
        router.visit(`/projects/${projectId}`);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                    {currentProject ? (
                        <>
                            <FolderRoot className="h-4 w-4" />
                            <span className="max-w-[150px] truncate font-medium">{currentProject.name}</span>
                        </>
                    ) : (
                        <span>Select Project</span>
                    )}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
                {projects.length > 0 && (
                    <>
                        {projects.map((project) => (
                            <DropdownMenuItem key={project.id} onClick={() => handleProjectSelect(project.id)} className="flex items-center gap-2">
                                <FolderRoot className="h-4 w-4" />
                                <span className="flex-1 truncate">{project.name}</span>
                                {project.owner_id === user.id && <span className="text-muted-foreground ml-auto text-xs">Owner</span>}
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                    </>
                )}
                <DropdownMenuItem asChild>
                    <Link href="/projects/create" className="flex items-center gap-2">
                        <PlusCircle className="h-4 w-4" />
                        <span>Create New Project</span>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
