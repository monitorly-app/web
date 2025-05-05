// resources/js/Pages/Admin/Plans/Edit.tsx
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';

interface Plan {
    id: number;
    name: string;
    price: number;
    frequency: number;
    max_servers: number;
    max_users: number;
    description: string | null;
}

interface Props {
    plan: Plan;
}

export default function EditPlan({ plan }: Props) {
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
            title: `Edit: ${plan.name}`,
            href: `/admin/plans/${plan.id}/edit`,
        },
    ];

    const { data, setData, patch, processing, errors } = useForm({
        name: plan.name,
        price: plan.price.toString(),
        frequency: plan.frequency.toString(),
        max_servers: plan.max_servers.toString(),
        max_users: plan.max_users.toString(),
        description: plan.description || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('plans.update', plan.id));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Plan: ${plan.name}`} />

            <div className="p-6">
                <h1 className="mb-6 text-2xl font-semibold">Edit Plan</h1>

                <Card>
                    <CardHeader>
                        <CardTitle>Plan Information</CardTitle>
                        <CardDescription>Update subscription plan details and features</CardDescription>
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
                                    Update Plan
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
