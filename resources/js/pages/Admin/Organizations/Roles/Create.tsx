import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/admin-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Shield } from 'lucide-react';
import { useState } from 'react';

interface Permission {
    id: number;
    name: string;
    label: string;
    description: string;
    category: string;
    is_system: boolean;
}

interface Props {
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
    {
        title: 'Create Role',
        href: '/admin/organization-roles/create',
    },
];

export default function Create({ permissions }: Props) {
    const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        permissions: [] as number[],
    });

    const handlePermissionToggle = (permissionId: number) => {
        const newSelected = selectedPermissions.includes(permissionId)
            ? selectedPermissions.filter((id) => id !== permissionId)
            : [...selectedPermissions, permissionId];

        setSelectedPermissions(newSelected);
        setData('permissions', newSelected);
    };

    const handleCategoryToggle = (categoryPermissions: Permission[]) => {
        const categoryIds = categoryPermissions.map((p) => p.id);
        const allSelected = categoryIds.every((id) => selectedPermissions.includes(id));

        let newSelected;
        if (allSelected) {
            // Déselectionner toute la catégorie
            newSelected = selectedPermissions.filter((id) => !categoryIds.includes(id));
        } else {
            // Sélectionner toute la catégorie
            newSelected = [...new Set([...selectedPermissions, ...categoryIds])];
        }

        setSelectedPermissions(newSelected);
        setData('permissions', newSelected);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.organization-roles.store'));
    };

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

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Organization Role" />

            <div className="p-6">
                <div className="mb-6">
                    <h1 className="flex items-center gap-2 text-2xl font-semibold">
                        <Shield className="h-6 w-6 text-blue-600" />
                        Create Organization Role
                    </h1>
                    <p className="text-muted-foreground mt-1">Create a new role with specific permissions for organization members</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Role Information */}
                        <div className="lg:col-span-1">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Role Information</CardTitle>
                                    <CardDescription>Basic information about the role</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Role Name</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="e.g., Senior Developer"
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            placeholder="Describe what this role can do..."
                                            rows={4}
                                        />
                                        <InputError message={errors.description} />
                                    </div>

                                    <div className="pt-4">
                                        <div className="mb-2 text-sm font-medium">Selected Permissions</div>
                                        <div className="text-sm text-gray-600">{selectedPermissions.length} permission(s) selected</div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Permissions */}
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Permissions</CardTitle>
                                    <CardDescription>Select the permissions this role should have</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        {Object.entries(permissions).map(([category, categoryPermissions]) => {
                                            const categoryIds = categoryPermissions.map((p) => p.id);
                                            const selectedInCategory = selectedPermissions.filter((id) => categoryIds.includes(id)).length;
                                            const allCategorySelected =
                                                categoryIds.length > 0 && categoryIds.every((id) => selectedPermissions.includes(id));
                                            const someCategorySelected = selectedInCategory > 0 && !allCategorySelected;

                                            return (
                                                <div key={category} className={`rounded-lg border p-4 ${getCategoryColor(category)}`}>
                                                    <div className="mb-3 flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <Checkbox
                                                                checked={allCategorySelected}
                                                                onCheckedChange={() => handleCategoryToggle(categoryPermissions)}
                                                                className={someCategorySelected ? 'data-[state=checked]:bg-gray-600' : ''}
                                                            />
                                                            <h3 className="text-lg font-medium capitalize">{category} Permissions</h3>
                                                            <Badge variant="outline" className="text-xs">
                                                                {selectedInCategory}/{categoryPermissions.length}
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    <div className="grid gap-3 md:grid-cols-2">
                                                        {categoryPermissions.map((permission) => (
                                                            <div
                                                                key={permission.id}
                                                                className="flex items-start space-x-3 rounded border bg-white/60 p-3"
                                                            >
                                                                <Checkbox
                                                                    checked={selectedPermissions.includes(permission.id)}
                                                                    onCheckedChange={() => handlePermissionToggle(permission.id)}
                                                                    className="mt-0.5"
                                                                />
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="text-sm font-medium">{permission.label}</div>
                                                                    <div className="mt-1 text-xs text-gray-600">{permission.description}</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" onClick={() => window.history.back()}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            Create Role
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
