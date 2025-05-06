import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type Project } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { FolderPlus, FolderRoot } from 'lucide-react';

interface Props {
    projects: Project[];
}

export default function ProjectsSelect({ projects }: Props) {
    return (
        <AppLayout>
            <Head title="Select Project" />

            <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Your Projects</h1>
                    <Button asChild>
                        <Link href={route('projects.create')}>
                            <FolderPlus className="mr-2 h-4 w-4" />
                            Create New Project
                        </Link>
                    </Button>
                </div>

                {projects.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {projects.map((project) => (
                            <Card key={project.id} className="overflow-hidden">
                                <CardHeader className="bg-muted/50">
                                    <CardTitle className="flex items-center gap-2">
                                        <FolderRoot className="h-5 w-5" />
                                        {project.name}
                                    </CardTitle>
                                    {project.description && <CardDescription className="line-clamp-2">{project.description}</CardDescription>}
                                </CardHeader>
                                <CardContent className="p-4">
                                    <Button asChild className="w-full">
                                        <Link href={`/projects/${project.id}`}>Open Project</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <FolderPlus className="text-muted-foreground mb-4 h-12 w-12" />
                            <h3 className="mb-2 text-xl font-medium">No Projects Yet</h3>
                            <p className="text-muted-foreground mb-6 text-center">
                                You haven't created any projects yet. Create your first project to get started.
                            </p>
                            <Button asChild>
                                <Link href={route('projects.create')}>Create Your First Project</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
