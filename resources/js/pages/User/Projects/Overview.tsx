// resources/js/pages/User/Projects/Overview.tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useInitials } from '@/hooks/use-initials';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Activity, Clock, Edit, UsersRound } from 'lucide-react';

interface ProjectMember {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    pivot: {
        project_role_id: number;
    };
}

interface ProjectRole {
    id: number;
    name: string;
}

interface ProjectOwner {
    id: number;
    name: string;
    email: string;
    avatar?: string;
}

interface ProjectWithRelations {
    id: string;
    name: string;
    description?: string;
    owner_id: number;
    created_at: string;
    updated_at: string;
    owner: ProjectOwner;
    members: ProjectMember[];
}

interface Props {
    project: ProjectWithRelations;
    isOwner: boolean;
    projectRoles: ProjectRole[];
    stats: {
        members_count: number;
        // Autres statistiques que vous pourriez avoir...
    };
}

export default function ProjectOverview({ project, isOwner, projectRoles, stats }: Props) {
    const getInitials = useInitials();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: project.name,
            href: `/projects/${project.id}`,
        },
        {
            title: 'Overview',
            href: `/projects/${project.id}`,
        },
    ];

    // Format date to be more readable
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${project.name} - Overview`} />

            <div className="p-6">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">{project.name}</h1>
                        {project.description && <p className="text-muted-foreground mt-1">{project.description}</p>}
                    </div>

                    {isOwner && (
                        <Button asChild className="mt-4 sm:mt-0">
                            <Link href={`/projects/${project.id}/settings`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Project
                            </Link>
                        </Button>
                    )}
                </div>

                {/* Project stats overview */}
                <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Members</CardTitle>
                            <UsersRound className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.members_count}</div>
                            <p className="text-muted-foreground text-xs">Including project owner and team members</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Created</CardTitle>
                            <Clock className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatDate(project.created_at)}</div>
                            <p className="text-muted-foreground text-xs">
                                Project running for {Math.floor((Date.now() - new Date(project.created_at).getTime()) / (1000 * 60 * 60 * 24))} days
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Activity</CardTitle>
                            <Activity className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Active</div>
                            <p className="text-muted-foreground text-xs">Last updated {formatDate(project.updated_at)}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Project owner and team members */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Project Owner</CardTitle>
                            <CardDescription>The person who created and manages this project</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={project.owner.avatar} alt={project.owner.name} />
                                    <AvatarFallback>{getInitials(project.owner.name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{project.owner.name}</p>
                                    <p className="text-muted-foreground text-sm">{project.owner.email}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Team Members</CardTitle>
                                <CardDescription>People with access to this project</CardDescription>
                            </div>
                            {isOwner && (
                                <Button asChild size="sm">
                                    <Link href={`/projects/${project.id}/members`}>Manage Members</Link>
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            {project.members.length > 0 ? (
                                <div className="space-y-4">
                                    {project.members.slice(0, 5).map((member) => (
                                        <div key={member.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={member.avatar} alt={member.name} />
                                                    <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{member.name}</p>
                                                    <p className="text-muted-foreground text-xs">{member.email}</p>
                                                </div>
                                            </div>
                                            <Badge variant="secondary">
                                                {projectRoles.find((role) => role.id === member.pivot.project_role_id)?.name || 'Member'}
                                            </Badge>
                                        </div>
                                    ))}

                                    {project.members.length > 5 && (
                                        <Button variant="ghost" asChild className="mt-2 w-full">
                                            <Link href={`/projects/${project.id}/members`}>View all {project.members.length} members</Link>
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                                    <UsersRound className="mb-2 h-10 w-10 opacity-20" />
                                    <p>No team members yet</p>
                                    {isOwner && (
                                        <Button asChild className="mt-4" variant="outline">
                                            <Link href={`/projects/${project.id}/members`}>Invite Members</Link>
                                        </Button>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
