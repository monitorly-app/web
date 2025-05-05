// resources/js/Pages/Admin/Users/Show.tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Edit, Mail, Package, ShieldCheck, User } from 'lucide-react';

interface User {
    id: number;
    name: string;
    first_name: string;
    last_name: string;
    email: string;
    is_active: boolean;
    email_verified_at: string | null;
    created_at: string;
    role: {
        id: number;
        name: string;
        description: string;
    };
    plan: {
        id: number;
        name: string;
        price: number;
        frequency: number;
        max_servers: number;
        max_users: number;
        description: string;
    };
}

interface Props {
    user: User;
}

export default function ShowUser({ user }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Admin Dashboard',
            href: '/admin/dashboard',
        },
        {
            title: 'Users',
            href: '/admin/users',
        },
        {
            title: user.name,
            href: `/admin/users/${user.id}`,
        },
    ];

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Not verified';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`User: ${user.name}`} />

            <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">User Details</h1>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href={route('users.index')}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Users
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href={route('users.edit', user.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit User
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Basic Info */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-sm">Full Name</p>
                                    <div className="flex items-center">
                                        <User className="text-primary mr-2 h-4 w-4" />
                                        <p>{user.name}</p>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-sm">Email Address</p>
                                    <div className="flex items-center">
                                        <Mail className="text-primary mr-2 h-4 w-4" />
                                        <p>{user.email}</p>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-sm">Role</p>
                                    <div className="flex items-center">
                                        <ShieldCheck className="text-primary mr-2 h-4 w-4" />
                                        <p>{user.role.name}</p>
                                    </div>
                                    {user.role.description && <p className="text-muted-foreground mt-1 text-xs">{user.role.description}</p>}
                                </div>

                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-sm">Plan</p>
                                    <div className="flex items-center">
                                        <Package className="text-primary mr-2 h-4 w-4" />
                                        <p>{user.plan.name}</p>
                                    </div>
                                    {user.plan.description && <p className="text-muted-foreground mt-1 text-xs">{user.plan.description}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Status Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Account Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-sm">Status</p>
                                    <div className="flex items-center">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                user.is_active ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}
                                        >
                                            {user.is_active ? 'Active' : 'Pending'}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-sm">Email Verification</p>
                                    <p className="text-sm">
                                        {user.email_verified_at ? `Verified on ${formatDate(user.email_verified_at)}` : 'Not verified'}
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-sm">Member Since</p>
                                    <p className="text-sm">{formatDate(user.created_at)}</p>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-sm">Plan Details</p>
                                    <ul className="space-y-1 text-sm">
                                        <li className="flex justify-between">
                                            <span>Price:</span>
                                            <span className="font-medium">{user.plan.price} €</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span>Frequency:</span>
                                            <span className="font-medium">{user.plan.frequency} min</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span>Max Servers:</span>
                                            <span className="font-medium">{user.plan.max_servers}</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span>Max Users:</span>
                                            <span className="font-medium">{user.plan.max_users}</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
