import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import AdminLayout from '@/layouts/admin-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Edit, Eye, MoreHorizontal, Plus, RefreshCw, Trash, Download, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    role: {
        id: number;
        name: string;
    };
}

interface PaginatedUsers {
    data: User[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props {
    users: PaginatedUsers;
    filters: {
        search?: string;
        role?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: '/admin/dashboard',
    },
    {
        title: 'Users',
        href: '/admin/users',
    },
];

export default function UsersIndex({ users, filters }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

    const { delete: destroy, processing } = useForm();

    const handleSearch = () => {
        router.get(route('admin.users.index'), {
            search: searchTerm,
        }, {
            preserveState: true
        });
    };

    const handleSelectUser = (userId: number, checked: boolean) => {
        if (checked) {
            setSelectedUsers([...selectedUsers, userId]);
        } else {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedUsers(users.data.map(user => user.id));
        } else {
            setSelectedUsers([]);
        }
    };

    const handleBulkDelete = () => {
        router.delete(route('admin.users.bulk-delete'), {
            data: { user_ids: selectedUsers },
            onSuccess: () => {
                setSelectedUsers([]);
                setShowBulkDeleteDialog(false);
            }
        });
    };

    const handleResendInvitation = (userId: number) => {
        router.post(route('admin.users.resend-invitation', userId), {}, {
            onSuccess: () => {
                // Success message will be handled by flash message
            }
        });
    };

    const handleDelete = () => {
        if (userToDelete) {
            destroy(route('admin.users.destroy', userToDelete.id), {
                onSuccess: () => setUserToDelete(null),
            });
        }
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />

            <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Users</h1>
                    <Button asChild>
                        <Link href={route('admin.users.create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add User
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>All Users</CardTitle>
                        <CardDescription>Manage users, their roles and plans</CardDescription>

                        <div className="mt-4 flex gap-4">
                            <Input
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="max-w-sm"
                            />
                            <Button onClick={handleSearch} variant="outline">
                                Search
                            </Button>
                            <Button asChild variant="outline">
                                <Link href={route('admin.users.export')}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Export CSV
                                </Link>
                            </Button>
                            {selectedUsers.length > 0 && (
                                <Button 
                                    variant="destructive" 
                                    onClick={() => setShowBulkDeleteDialog(true)}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Selected ({selectedUsers.length})
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="px-4 py-3 text-left font-medium">
                                            <Checkbox
                                                checked={selectedUsers.length === users.data.length}
                                                onCheckedChange={handleSelectAll}
                                            />
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium">Name</th>
                                        <th className="px-4 py-3 text-left font-medium">Email</th>
                                        <th className="px-4 py-3 text-left font-medium">Role</th>
                                        <th className="px-4 py-3 text-left font-medium">Status</th>
                                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.data.map((user) => (
                                        <tr key={user.id} className="hover:bg-muted/50 border-b">
                                            <td className="px-4 py-3">
                                                <Checkbox
                                                    checked={selectedUsers.includes(user.id)}
                                                    onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                                                />
                                            </td>
                                            <td className="px-4 py-3">{user.name}</td>
                                            <td className="px-4 py-3">{user.email}</td>
                                            <td className="px-4 py-3">
                                                <span className="bg-primary/10 rounded-full px-2 py-1 text-xs">{user.role.name}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                        user.is_active ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                    }`}
                                                >
                                                    {user.is_active ? 'Active' : 'Pending'}
                                                </span>
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
                                                            <Link href={route('admin.users.show', user.id)}>
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={route('admin.users.edit', user.id)}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        {!user.is_active && (
                                                            <DropdownMenuItem onClick={() => handleResendInvitation(user.id)}>
                                                                <RefreshCw className="mr-2 h-4 w-4" />
                                                                Resend Invitation
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem onClick={() => setUserToDelete(user)}>
                                                            <Trash className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Pagination */}
                        {users.last_page > 1 && (
                            <div className="mt-4 flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    Showing {users.from} to {users.to} of {users.total} users
                                </div>
                                <div className="flex gap-2">
                                    {users.current_page > 1 && (
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={route('admin.users.index', { 
                                                page: users.current_page - 1,
                                                search: filters.search,
                                                role: filters.role
                                            })}>
                                                Previous
                                            </Link>
                                        </Button>
                                    )}
                                    {users.current_page < users.last_page && (
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={route('admin.users.index', { 
                                                page: users.current_page + 1,
                                                search: filters.search,
                                                role: filters.role
                                            })}>
                                                Next
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogDescription>Are you sure you want to delete this user? This action cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUserToDelete(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={processing}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Delete Confirmation Dialog */}
            <Dialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Selected Users</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {selectedUsers.length} selected users? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowBulkDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleBulkDelete} disabled={processing}>
                            Delete {selectedUsers.length} Users
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
