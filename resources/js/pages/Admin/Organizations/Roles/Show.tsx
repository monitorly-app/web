import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/layouts/admin-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, Edit, Key, Shield, XCircle } from 'lucide-react';

interface Permission {
    id: number;
    name: string;
    label: string;
    description: string;
    category: string;
    is_system: boolean;
}

interface Role {
    id: number;
    name: string;
    description: string;
    is_system: boolean;
    permissions: Array<{
        id: number;
        name: string;
        label: string;
        description: string;
        category: string;
    }>;
}

interface Props {
    role: Role;
    permissions: Record<string, Permission[]>;
}

export default function Show({ role, permissions }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Admin Dashboard',
            href: '/admin/dashboard',
        },
        {
            title: 'Organization Roles',
            href: '/admin/organization-roles',
        },
        {
            title: role.name,
            href: `/admin/organization-roles/${role.id}`,
        },
    ];

    const getCategoryColor = (category: string) => {
        const colors = {
            servers: 'border-blue-200 bg-blue-50',
            metrics: 'border-green-200 bg-green-50',
            members: 'border-purple-200 bg-purple-50',
            settings: 'border-orange-200 bg-orange-50',
            billing: 'border-yellow-200 bg-yellow-50',
        };
        return colors[category as keyof typeof colors] || 'border-gray-200 bg-gray-50';
    };

    const rolePermissionIds = role.permissions.map((p) => p.id);

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Role: ${role.name}`} />

            <div className="p-6">
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href={route('admin.organization-roles.index')}>
                                <Button variant="ghost" size="sm">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Roles
                                </Button>
                            </Link>
                            <div>
                                <h1 className="flex items-center gap-2 text-2xl font-semibold">
                                    <Shield className="h-6 w-6 text-blue-600" />
                                    {role.name}
                                    {role.is_system && <Badge variant="secondary">System Role</Badge>}
                                </h1>
                                <p className="text-muted-foreground mt-1">{role.description || 'No description provided'}</p>
                            </div>
                        </div>
                        {!role.is_system && (
                            <Link href={route('admin.organization-roles.edit', role.id)}>
                                <Button>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Role
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="mb-6 grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center">
                                <Key className="h-8 w-8 text-blue-600" />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Total Permissions</p>
                                    <p className="text-2xl font-bold">{role.permissions.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {Object.entries(permissions).map(([category, categoryPermissions]) => {
                        const assignedCount = categoryPermissions.filter((p) => rolePermissionIds.includes(p.id)).length;

                        return (
                            <Card key={category}>
                                <CardContent className="pt-6">
                                    <div className="flex items-center">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-600 capitalize">{category}</p>
                                            <p className="text-2xl font-bold">
                                                {assignedCount}/{categoryPermissions.length}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Permissions Detail */}
                <div className="space-y-6">
                    {Object.entries(permissions).map(([category, categoryPermissions]) => (
                        <Card key={category} className={getCategoryColor(category)}>
                            <CardHeader>
                                <CardTitle className="text-lg capitalize">{category} Permissions</CardTitle>
                                <CardDescription>Permissions related to {category} management</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-3 md:grid-cols-2">
                                    {categoryPermissions.map((permission) => {
                                        const hasPermission = rolePermissionIds.includes(permission.id);

                                        return (
                                            <div
                                                key={permission.id}
                                                className={`rounded-lg border p-4 ${
                                                    hasPermission ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white/60'
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-0.5">
                                                        {hasPermission ? (
                                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                                        ) : (
                                                            <XCircle className="h-5 w-5 text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className={`text-sm font-medium ${hasPermission ? 'text-green-800' : 'text-gray-700'}`}>
                                                            {permission.label}
                                                        </div>
                                                        <div className={`mt-1 text-xs ${hasPermission ? 'text-green-600' : 'text-gray-500'}`}>
                                                            {permission.description}
                                                        </div>
                                                        {permission.is_system && (
                                                            <Badge variant="outline" className="mt-2 text-xs">
                                                                System Permission
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
}
