import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Clock, Server, Users } from 'lucide-react';

interface UserData {
    id: number;
    name: string;
    email: string;
}

interface Props {
    user: UserData;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/user/dashboard',
    },
];

export default function UserDashboard({ user }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="p-6">
                <h1 className="mb-6 text-2xl font-semibold">Welcome, {user.name}</h1>

                {/* Organizations Quick Access */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Your Organizations</CardTitle>
                        <CardDescription>Quick access to your organizations and their monitoring</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex h-40 items-center justify-center rounded-md border border-dashed">
                            <p className="text-muted-foreground">Select an organization to view its monitoring dashboard</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Dashboard Content Placeholder */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Servers Overview</CardTitle>
                            <CardDescription>Monitor your server status</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex h-40 items-center justify-center rounded-md border border-dashed">
                                <p className="text-muted-foreground">No servers configured yet</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Alerts</CardTitle>
                            <CardDescription>Latest notifications from your servers</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex h-40 items-center justify-center rounded-md border border-dashed">
                                <p className="text-muted-foreground">No recent alerts</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
