import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/layouts/admin-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Building, Package, Shield, ShieldCheck, UserPlus, Users } from 'lucide-react';

interface Stats {
    users_count: number;
    active_users_count: number;
    roles_count: number;
    plans_count: number;
    organization_roles_count: number;
}

interface User {
    id: number;
    name: string;
    email: string;
    created_at: string;
    role: {
        name: string;
    };
    plan: {
        name: string;
    };
}

interface Role {
    id: number;
    name: string;
    users_count: number;
}

interface Plan {
    id: number;
    name: string;
    users_count: number;
}

interface OrganizationRole {
    id: number;
    name: string;
    description: string;
    members_count: number;
    is_system: boolean;
}

interface Props {
    stats: Stats;
    latestUsers: User[];
    usersByRole: Role[];
    usersByPlan: Plan[];
    organizationRoles: OrganizationRole[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: '/admin/dashboard',
    },
];

export default function AdminDashboard({ stats, latestUsers, usersByRole, usersByPlan, organizationRoles }: Props) {
    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />

            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Manage users, roles, plans, and system settings</p>
                </div>

                {/* Stats Cards */}
                <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <Users className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.users_count}</div>
                            <p className="text-muted-foreground text-xs">{stats.active_users_count} active</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Roles</CardTitle>
                            <ShieldCheck className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.roles_count}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Plans</CardTitle>
                            <Package className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.plans_count}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Organization Roles</CardTitle>
                            <Building className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.organization_roles_count}</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Latest Users */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Latest Users</CardTitle>
                                <Button asChild size="sm">
                                    <Link href={route('admin.users.create')}>
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Add User
                                    </Link>
                                </Button>
                            </div>
                            <CardDescription>Recently added users to the platform</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {latestUsers.map((user) => (
                                    <div key={user.id} className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="bg-primary/10 text-primary mr-3 flex h-8 w-8 items-center justify-center rounded-full">
                                                <Users className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <div className="font-medium">{user.name}</div>
                                                <div className="text-muted-foreground text-xs">{user.email}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-medium">{user.role.name}</div>
                                            <div className="text-muted-foreground text-xs">{user.plan.name}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Organization Roles */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Organization Roles</CardTitle>
                                <Button asChild size="sm">
                                    <Link href={route('admin.organization-roles.create')}>
                                        <Shield className="mr-2 h-4 w-4" />
                                        Add Role
                                    </Link>
                                </Button>
                            </div>
                            <CardDescription>Roles and permissions for organization members</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {organizationRoles.slice(0, 5).map((role) => (
                                    <div key={role.id} className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div
                                                className={`mr-3 flex h-8 w-8 items-center justify-center rounded-full ${
                                                    role.is_system ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                                                }`}
                                            >
                                                <Shield className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <div className="font-medium">{role.name}</div>
                                                <div className="text-muted-foreground text-xs">{role.description || 'No description'}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-medium">{role.members_count} members</div>
                                            {role.is_system && <div className="text-xs text-orange-600">System Role</div>}
                                        </div>
                                    </div>
                                ))}
                                {organizationRoles.length > 5 && (
                                    <div className="pt-2 text-center">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={route('admin.organization-roles.index')}>View All Roles</Link>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Bottom row - Stats */}
                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Users by Role</CardTitle>
                            <CardDescription>Distribution of users across roles</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {usersByRole.map((role) => (
                                    <div key={role.id} className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <ShieldCheck className="text-primary mr-2 h-4 w-4" />
                                            <span>{role.name}</span>
                                        </div>
                                        <span className="font-medium">{role.users_count} users</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Users by Plan</CardTitle>
                            <CardDescription>Distribution of users across plans</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {usersByPlan.map((plan) => (
                                    <div key={plan.id} className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <Package className="text-primary mr-2 h-4 w-4" />
                                            <span>{plan.name}</span>
                                        </div>
                                        <span className="font-medium">{plan.users_count} users</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
