// resources/js/pages/User/Organizations/Overview.tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useInitials } from '@/hooks/use-initials';
import AppLayout from '@/layouts/app-layout';
import { Organization } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Activity, Clock, Edit, Mail, UsersRound } from 'lucide-react';

interface OrganizationMember {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    pivot: {
        organization_role_id: number;
    };
}

interface Invitation {
    id: string;
    email: string;
    status: string;
    created_at: string;
    organization_role: {
        id: number;
        name: string;
        description: string;
    };
}

interface Props {
    organization: Organization & {
        invitations?: Invitation[];
    };
}

export default function OrganizationOverview({ organization }: Props) {
    const getInitials = useInitials();

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const breadcrumbs = [
        {
            title: 'Organizations',
            href: '/organizations/select',
        },
        {
            title: organization.name,
            href: `/organizations/${organization.id}`,
        },
        {
            title: 'Overview',
            href: `/organizations/${organization.id}`,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${organization.name} - Overview`} />

            <div className="p-6">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">{organization.name}</h1>
                        {organization.description && <p className="text-muted-foreground mt-1">{organization.description}</p>}
                    </div>

                    <div className="flex items-center space-x-2">
                        <Link href={`/organizations/${organization.id}/settings`}>
                            <Button variant="outline" size="sm">
                                <Edit className="mr-2 h-4 w-4" />
                                Settings
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Organization stats overview */}
                <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Created</CardTitle>
                            <Clock className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatDate(organization.created_at)}</div>
                            <p className="text-muted-foreground text-xs">
                                Organization running for{' '}
                                {Math.floor((Date.now() - new Date(organization.created_at).getTime()) / (1000 * 60 * 60 * 24))} days
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
                            <p className="text-muted-foreground text-xs">Last updated {formatDate(organization.updated_at)}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Organization owner and team members */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Organization Owner</CardTitle>
                            <CardDescription>The person who created and manages this organization</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={organization.owner?.avatar} alt={organization.owner?.name} />
                                    <AvatarFallback>{getInitials(organization.owner?.name || '')}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{organization.owner?.name}</p>
                                    <p className="text-muted-foreground text-sm">{organization.owner?.email}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Team Members</CardTitle>
                                <CardDescription>People with access to this organization</CardDescription>
                            </div>
                            <Link href={`/organizations/${organization.id}/members`}>Manage Members</Link>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Active Members */}
                                {organization.members && organization.members.length > 0 && (
                                    <>
                                        <div className="space-y-3">
                                            {organization.members.slice(0, 3).map((member) => (
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
                                                    <Badge variant="secondary">Active</Badge>
                                                </div>
                                            ))}
                                        </div>

                                        {organization.members.length > 3 && (
                                            <p className="text-muted-foreground text-sm">+{organization.members.length - 3} more active members</p>
                                        )}
                                    </>
                                )}

                                {/* Pending Invitations */}
                                {organization.invitations && organization.invitations.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="border-t pt-3">
                                            <h4 className="mb-2 text-sm font-medium">Pending Invitations</h4>
                                            {organization.invitations.slice(0, 2).map((invitation) => (
                                                <div key={invitation.id} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full">
                                                            <Mail className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{invitation.email}</p>
                                                            <p className="text-muted-foreground text-xs">
                                                                Invited {formatDate(invitation.created_at)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline">Pending</Badge>
                                                </div>
                                            ))}
                                            {organization.invitations.length > 2 && (
                                                <p className="text-muted-foreground mt-2 text-sm">
                                                    +{organization.invitations.length - 2} more pending invitations
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* No members and no invitations */}
                                {(!organization.members || organization.members.length === 0) &&
                                    (!organization.invitations || organization.invitations.length === 0) && (
                                        <div className="text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                                            <UsersRound className="mb-2 h-10 w-10 opacity-20" />
                                            <p>No team members yet</p>
                                            <Link href={`/organizations/${organization.id}/members`} className="text-primary mt-2 hover:underline">
                                                Invite Members
                                            </Link>
                                        </div>
                                    )}

                                {/* View all button */}
                                {((organization.members && organization.members.length > 0) ||
                                    (organization.invitations && organization.invitations.length > 0)) && (
                                    <Button variant="ghost" asChild className="w-full">
                                        <Link href={`/organizations/${organization.id}/members`}>Manage All Members</Link>
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
