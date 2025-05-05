// resources/js/Pages/Admin/Plans/Create.tsx
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: '/admin/dashboard',
    },
    {
        title: 'Plans',
        href: '/admin/plans',
    },
    {
        title: 'Add Plan',
        href: '/admin/plans/create',
    },
];

export default function CreatePlan() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        price: '',
        frequency: '',
        max_servers: '',
        max_users: '',
        description: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('plans.store'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add Plan" />

            <div className="p-6">
                <h1 className="mb-6 text-2xl font-semibold">Add Plan</h1>

                <Card>
                    <CardHeader>
                        <CardTitle>Plan Information</CardTitle>
                        <CardDescription>Create a new subscription plan for users</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Plan Name</Label>
                                <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="price">Price (€)</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.price}
                                        onChange={(e) => setData('price', e.target.value)}
                                    />
                                    <InputError message={errors.price} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="frequency">Frequency (minutes)</Label>
                                    <Input
                                        id="frequency"
                                        type="number"
                                        min="1"
                                        value={data.frequency}
                                        onChange={(e) => setData('frequency', e.target.value)}
                                    />
                                    <InputError message={errors.frequency} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="max_servers">Max Servers</Label>
                                    <Input
                                        id="max_servers"
                                        type="number"
                                        min="1"
                                        value={data.max_servers}
                                        onChange={(e) => setData('max_servers', e.target.value)}
                                    />
                                    <InputError message={errors.max_servers} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="max_users">Max Users</Label>
                                    <Input
                                        id="max_users"
                                        type="number"
                                        min="1"
                                        value={data.max_users}
                                        onChange={(e) => setData('max_users', e.target.value)}
                                    />
                                    <InputError message={errors.max_users} />
                                </div>
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
                                    Create Plan
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
