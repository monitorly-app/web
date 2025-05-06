import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Package, ShieldCheck, UserPlus, Users } from 'lucide-react';

interface Stats {
    users_count: number;
    active_users_count: number;
    roles_count: number;
    plans_count: number;
}

interface User {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    role: {
        id: number;
        name: string;
    };
    plan: {
        id: number;
        name: string;
    };
}

interface RoleWithCount {
    id: number;
    name: string;
    users_count: number;
}

interface PlanWithCount {
    id: number;
    name: string;
    users_count: number;
}

interface Props {
    stats: Stats;
    latestUsers: User[];
    usersByRole: RoleWithCount[];
    usersByPlan: PlanWithCount[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: '/admin/dashboard',
    },
];

export default function AdminDashboard({ stats, latestUsers, usersByRole, usersByPlan }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />

            <div className="p-6">
                <h1 className="mb-6 text-2xl font-semibold">Admin Dashboard</h1>

                {/* Stats Overview */}
                <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <Users className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.users_count}</div>
                            <p className="text-muted-foreground text-xs">{stats.active_users_count} active users</p>
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
                </div>

                {/* Latest Users */}
                <Card className="mb-6">
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
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="px-4 py-3 text-left font-medium">Name</th>
                                        <th className="px-4 py-3 text-left font-medium">Email</th>
                                        <th className="px-4 py-3 text-left font-medium">Role</th>
                                        <th className="px-4 py-3 text-left font-medium">Plan</th>
                                        <th className="px-4 py-3 text-left font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {latestUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-muted/50 border-b">
                                            <td className="px-4 py-3">{user.name}</td>
                                            <td className="px-4 py-3">{user.email}</td>
                                            <td className="px-4 py-3">{user.role.name}</td>
                                            <td className="px-4 py-3">{user.plan.name}</td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                        user.is_active ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                    }`}
                                                >
                                                    {user.is_active ? 'Active' : 'Pending'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Distribution Charts */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Users by Role */}
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

                    {/* Users by Plan */}
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
        </AppLayout>
    );
}
