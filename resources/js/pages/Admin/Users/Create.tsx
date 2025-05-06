import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';

interface Role {
    id: number;
    name: string;
}

interface Plan {
    id: number;
    name: string;
}

interface Props {
    roles: Role[];
    plans: Plan[];
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
    {
        title: 'Add User',
        href: '/admin/users/create',
    },
];

export default function CreateUser({ roles, plans }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        first_name: '',
        last_name: '',
        email: '',
        role_id: '',
        plan_id: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.users.store'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add User" />

            <div className="p-6">
                <h1 className="mb-6 text-2xl font-semibold">Add User</h1>

                <Card>
                    <CardHeader>
                        <CardTitle>User Information</CardTitle>
                        <CardDescription>Add a new user to the system. An invitation email will be sent to the user.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="first_name">First Name</Label>
                                    <Input id="first_name" value={data.first_name} onChange={(e) => setData('first_name', e.target.value)} />
                                    <InputError message={errors.first_name} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="last_name">Last Name</Label>
                                    <Input id="last_name" value={data.last_name} onChange={(e) => setData('last_name', e.target.value)} />
                                    <InputError message={errors.last_name} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="role">Role</Label>
                                    <Select value={data.role_id} onValueChange={(value) => setData('role_id', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map((role) => (
                                                <SelectItem key={role.id} value={role.id.toString()}>
                                                    {role.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.role_id} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="plan">Plan</Label>
                                    <Select value={data.plan_id} onValueChange={(value) => setData('plan_id', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a plan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {plans.map((plan) => (
                                                <SelectItem key={plan.id} value={plan.id.toString()}>
                                                    {plan.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.plan_id} />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button type="submit" disabled={processing}>
                                    Create User & Send Invitation
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
