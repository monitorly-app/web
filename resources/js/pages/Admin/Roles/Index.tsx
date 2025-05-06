// resources/js/Pages/Admin/Roles/Index.tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Edit, MoreHorizontal, Plus, Trash, Users } from 'lucide-react';
import { useState } from 'react';

interface Role {
    id: number;
    name: string;
    description: string | null;
    users_count: number;
}

interface Props {
    roles: Role[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: '/admin/dashboard',
    },
    {
        title: 'Roles',
        href: '/admin/roles',
    },
];

export default function RolesIndex({ roles }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

    const { delete: destroy, processing } = useForm();

    const filteredRoles = roles.filter(
        (role) =>
            role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase())),
    );

    const handleDelete = () => {
        if (roleToDelete) {
            destroy(route('admin.roles.destroy', roleToDelete.id), {
                onSuccess: () => setRoleToDelete(null),
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Roles" />

            <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Roles</h1>
                    <Button asChild>
                        <Link href={route('admin.roles.create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Role
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>All Roles</CardTitle>
                        <CardDescription>Manage user roles and permissions</CardDescription>

                        <div className="mt-4">
                            <Input
                                placeholder="Search roles..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="max-w-sm"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="px-4 py-3 text-left font-medium">Name</th>
                                        <th className="px-4 py-3 text-left font-medium">Description</th>
                                        <th className="px-4 py-3 text-left font-medium">Users</th>
                                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRoles.map((role) => (
                                        <tr key={role.id} className="hover:bg-muted/50 border-b">
                                            <td className="px-4 py-3 font-medium">{role.name}</td>
                                            <td className="px-4 py-3">{role.description || '-'}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center">
                                                    <Users className="text-muted-foreground mr-2 h-4 w-4" />
                                                    <span>{role.users_count}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={route('admin.roles.edit', role.id)}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        {role.id > 2 && role.users_count === 0 && (
                                                            <DropdownMenuItem onClick={() => setRoleToDelete(role)}>
                                                                <Trash className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!roleToDelete} onOpenChange={(open) => !open && setRoleToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Role</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the role "{roleToDelete?.name}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRoleToDelete(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={processing}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
