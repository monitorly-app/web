// resources/js/Pages/Admin/Roles/Edit.tsx
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';

interface Role {
    id: number;
    name: string;
    description: string | null;
}

interface Props {
    role: Role;
}

export default function EditRole({ role }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Admin Dashboard',
            href: '/admin/dashboard',
        },
        {
            title: 'Roles',
            href: '/admin/roles',
        },
        {
            title: `Edit: ${role.name}`,
            href: `/admin/roles/${role.id}/edit`,
        },
    ];

    const { data, setData, patch, processing, errors } = useForm({
        name: role.name,
        description: role.description || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('admin.roles.update', role.id));
    };

    const isSystemRole = role.id <= 2;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Role: ${role.name}`} />

            <div className="p-6">
                <h1 className="mb-6 text-2xl font-semibold">Edit Role</h1>

                <Card>
                    <CardHeader>
                        <CardTitle>Role Information</CardTitle>
                        <CardDescription>Update role details and description</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Role Name</Label>
                                <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} disabled={isSystemRole} />
                                {isSystemRole && <p className="text-muted-foreground mt-1 text-xs">System roles cannot be renamed</p>}
                                <InputError message={errors.name} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e: { target: { value: string } }) => setData('description', e.target.value)}
                                    rows={3}
                                />
                                <InputError message={errors.description} />
                            </div>

                            <div className="flex justify-end">
                                <Button type="submit" disabled={processing}>
                                    Update Role
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
