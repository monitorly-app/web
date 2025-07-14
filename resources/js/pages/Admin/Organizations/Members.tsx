import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import AdminLayout from '@/layouts/admin-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Users, Mail, Calendar, Shield } from 'lucide-react';

interface Member {
    id: number;
    name: string;
    email: string;
    created_at: string;
    pivot: {
        created_at: string;
    };
    role?: {
        id: number;
        name: string;
        description?: string;
    };
}

interface Organization {
    id: string;
    name: string;
}

interface Props {
    organization: Organization;
    members: Member[];
}

export default function OrganizationMembers({ organization, members }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'Organizations', href: '/admin/organizations' },
        { title: organization.name, href: `/admin/organizations/${organization.id}` },
        { title: 'Members', href: `/admin/organizations/${organization.id}/members` },
    ];

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getRoleVariant = (roleName: string) => {
        switch (roleName?.toLowerCase()) {
            case 'owner':
                return 'bg-purple-100 text-purple-800';
            case 'admin':
                return 'bg-red-100 text-red-800';
            case 'engineer':
                return 'bg-blue-100 text-blue-800';
            case 'developer':
                return 'bg-green-100 text-green-800';
            case 'viewer':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Members - ${organization.name}`} />

            <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/admin/organizations/${organization.id}`}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Organization
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-semibold">Organization Members</h1>
                            <p className="text-muted-foreground mt-1">
                                {members.length} members in {organization.name}
                            </p>
                        </div>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Members ({members.length})
                        </CardTitle>
                        <CardDescription>
                            All users who have access to this organization
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {members.length > 0 ? (
                            <div className="space-y-4">
                                {members.map((member) => (
                                    <div
                                        key={member.id}
                                        className="flex items-center justify-between border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center space-x-4">
                                            <Avatar className="h-10 w-10">
                                                <AvatarFallback className="bg-primary/10 text-primary">
                                                    {getInitials(member.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-medium">{member.name}</h3>
                                                    {member.role && (
                                                        <Badge className={getRoleVariant(member.role.name)}>
                                                            <Shield className="mr-1 h-3 w-3" />
                                                            {member.role.name}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <Mail className="h-3 w-3" />
                                                        {member.email}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        Joined {new Date(member.pivot.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                {member.role?.description && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {member.role.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <div className="text-right text-sm text-muted-foreground">
                                                <div>User #{member.id}</div>
                                                <div>
                                                    Account created: {new Date(member.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-2 text-sm font-medium">No members found</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    This organization doesn't have any members yet.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Role Legend */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="text-lg">Role Permissions</CardTitle>
                        <CardDescription>
                            Understanding organization roles and their permissions
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-50">
                                <Badge className="bg-purple-100 text-purple-800">
                                    <Shield className="mr-1 h-3 w-3" />
                                    Owner
                                </Badge>
                                <span className="text-sm text-purple-800">Full access, billing</span>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50">
                                <Badge className="bg-red-100 text-red-800">
                                    <Shield className="mr-1 h-3 w-3" />
                                    Admin
                                </Badge>
                                <span className="text-sm text-red-800">Manage users, servers</span>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50">
                                <Badge className="bg-blue-100 text-blue-800">
                                    <Shield className="mr-1 h-3 w-3" />
                                    Engineer
                                </Badge>
                                <span className="text-sm text-blue-800">Full server access</span>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50">
                                <Badge className="bg-green-100 text-green-800">
                                    <Shield className="mr-1 h-3 w-3" />
                                    Developer
                                </Badge>
                                <span className="text-sm text-green-800">Read/write servers</span>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                                <Badge className="bg-gray-100 text-gray-800">
                                    <Shield className="mr-1 h-3 w-3" />
                                    Viewer
                                </Badge>
                                <span className="text-sm text-gray-800">Read-only access</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}