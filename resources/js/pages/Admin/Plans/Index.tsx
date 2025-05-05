// resources/js/Pages/Admin/Plans/Index.tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Clock, Edit, MoreHorizontal, Plus, Server, Trash, Users } from 'lucide-react';
import { useState } from 'react';

interface Plan {
    id: number;
    name: string;
    price: number;
    frequency: number;
    max_servers: number;
    max_users: number;
    description: string | null;
    users_count: number;
}

interface Props {
    plans: Plan[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: '/admin/dashboard',
    },
    {
        title: 'Plans',
        href: '/admin/plans',
    },
];

export default function PlansIndex({ plans }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);

    const { delete: destroy, processing } = useForm();

    const filteredPlans = plans.filter(
        (plan) =>
            plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (plan.description && plan.description.toLowerCase().includes(searchTerm.toLowerCase())),
    );

    const handleDelete = () => {
        if (planToDelete) {
            destroy(route('plans.destroy', planToDelete.id), {
                onSuccess: () => setPlanToDelete(null),
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Plans" />

            <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Plans</h1>
                    <Button asChild>
                        <Link href={route('plans.create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Plan
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>All Plans</CardTitle>
                        <CardDescription>Manage subscription plans and their features</CardDescription>

                        <div className="mt-4">
                            <Input
                                placeholder="Search plans..."
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
                                        <th className="px-4 py-3 text-left font-medium">Price</th>
                                        <th className="px-4 py-3 text-left font-medium">Frequency</th>
                                        <th className="px-4 py-3 text-left font-medium">Max Servers</th>
                                        <th className="px-4 py-3 text-left font-medium">Max Users</th>
                                        <th className="px-4 py-3 text-left font-medium">Subscribers</th>
                                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPlans.map((plan) => (
                                        <tr key={plan.id} className="hover:bg-muted/50 border-b">
                                            <td className="px-4 py-3 font-medium">{plan.name}</td>
                                            <td className="px-4 py-3">{plan.price} €</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center">
                                                    <Clock className="text-muted-foreground mr-2 h-4 w-4" />
                                                    <span>{plan.frequency} min</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center">
                                                    <Server className="text-muted-foreground mr-2 h-4 w-4" />
                                                    <span>{plan.max_servers}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center">
                                                    <Users className="text-muted-foreground mr-2 h-4 w-4" />
                                                    <span>{plan.max_users}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">{plan.users_count}</td>
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
                                                            <Link href={route('plans.edit', plan.id)}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        {plan.users_count === 0 && (
                                                            <DropdownMenuItem onClick={() => setPlanToDelete(plan)}>
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
            <Dialog open={!!planToDelete} onOpenChange={(open) => !open && setPlanToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Plan</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the "{planToDelete?.name}" plan? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPlanToDelete(null)}>
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
