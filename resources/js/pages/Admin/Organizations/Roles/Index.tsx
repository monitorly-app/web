import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AdminLayout from '@/layouts/admin-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Edit, Eye, Key, MoreHorizontal, Plus, Shield, Trash, Users } from 'lucide-react';
import { useState } from 'react';

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
    members_count: number;
    permissions_count: number;
    is_system: boolean;
    permissions: Array<{
        id: number;
        name: string;
        label: string;
        category: string;
    }>;
}

interface Props {
    roles: Role[];
    permissions: Record<string, Permission[]>;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: '/admin/dashboard',
    },
    {
        title: 'Organization Roles',
        href: '/admin/organization-roles',
    },
];

export default function Index({ roles, permissions }: Props) {
    const [deleteRoleId, setDeleteRoleId] = useState<number | null>(null);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [showPermissionsModal, setShowPermissionsModal] = useState(false);

    const { delete: destroy, processing } = useForm();

    const handleDeleteRole = (roleId: number) => {
        destroy(route('admin.organization-roles.destroy', roleId), {
            onSuccess: () => setDeleteRoleId(null),
        });
    };

    const getCategoryColor = (category: string) => {
        const colors = {
            servers: 'bg-blue-100 text-blue-800',
            metrics: 'bg-green-100 text-green-800',
            members: 'bg-purple-100 text-purple-800',
            settings: 'bg-orange-100 text-orange-800',
            billing: 'bg-yellow-100 text-yellow-800',
        };
        return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Organization Roles" />

            <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Organization Roles</h1>
                        <p className="text-muted-foreground mt-1">Manage roles and permissions for organization members</p>
                    </div>
                    <Link href={route('admin.organization-roles.create')}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Role
                        </Button>
                    </Link>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {roles.map((role) => (
                        <Card key={role.id} className="relative">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-blue-600" />
                                        <CardTitle className="text-lg">{role.name}</CardTitle>
                                        {role.is_system && (
                                            <Badge variant="secondary" className="text-xs">
                                                System
                                            </Badge>
                                        )}
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild>
                                                <Link href={route('admin.organization-roles.show', role.id)}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View Details
                                                </Link>
                                            </DropdownMenuItem>
                                            {role.is_system ? (
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setSelectedRole(role);
                                                        setShowPermissionsModal(true);
                                                    }}
                                                >
                                                    <Key className="mr-2 h-4 w-4" />
                                                    Update Permissions
                                                </DropdownMenuItem>
                                            ) : (
                                                <>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={route('admin.organization-roles.edit', role.id)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600" onClick={() => setDeleteRoleId(role.id)}>
                                                        <Trash className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <CardDescription className="text-sm">{role.description || 'No description provided'}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-1">
                                            <Users className="h-4 w-4" />
                                            Members
                                        </span>
                                        <Badge variant="outline">{role.members_count}</Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-1">
                                            <Key className="h-4 w-4" />
                                            Permissions
                                        </span>
                                        <Badge variant="outline">{role.permissions_count}</Badge>
                                    </div>

                                    {role.permissions.length > 0 && (
                                        <div className="mt-3">
                                            <div className="mb-2 text-xs font-medium text-gray-600">Sample Permissions:</div>
                                            <div className="flex flex-wrap gap-1">
                                                {role.permissions.slice(0, 3).map((permission) => (
                                                    <Badge
                                                        key={permission.id}
                                                        variant="outline"
                                                        className={`text-xs ${getCategoryColor(permission.category)}`}
                                                    >
                                                        {permission.label}
                                                    </Badge>
                                                ))}
                                                {role.permissions.length > 3 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        +{role.permissions.length - 3} more
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Delete Confirmation Modal */}
                <Dialog open={deleteRoleId !== null} onOpenChange={() => setDeleteRoleId(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Role</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete this role? This action cannot be undone and will affect all users assigned to this
                                role.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteRoleId(null)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={() => deleteRoleId && handleDeleteRole(deleteRoleId)} disabled={processing}>
                                Delete Role
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Permissions Modal */}
                <Dialog open={showPermissionsModal} onOpenChange={setShowPermissionsModal}>
                    <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Permissions for {selectedRole?.name}</DialogTitle>
                            <DialogDescription>View detailed permissions for this system role</DialogDescription>
                        </DialogHeader>
                        {selectedRole && (
                            <div className="space-y-4">
                                {Object.entries(permissions).map(([category, categoryPermissions]) => (
                                    <div key={category} className="space-y-2">
                                        <h3 className="text-sm font-medium text-gray-900 capitalize">{category} Permissions</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            {categoryPermissions.map((permission) => {
                                                const hasPermission = selectedRole.permissions.some((p) => p.id === permission.id);
                                                return (
                                                    <div
                                                        key={permission.id}
                                                        className={`rounded border p-2 ${
                                                            hasPermission ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className={`h-2 w-2 rounded-full ${hasPermission ? 'bg-green-500' : 'bg-gray-300'}`}
                                                            />
                                                            <span className="text-sm font-medium">{permission.label}</span>
                                                        </div>
                                                        <p className="mt-1 text-xs text-gray-600">{permission.description}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
