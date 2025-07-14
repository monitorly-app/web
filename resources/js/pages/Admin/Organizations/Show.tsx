import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AdminLayout from '@/layouts/admin-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { 
    ArrowLeft, Building, Users, Server, Activity, Key, 
    Play, Pause, RotateCcw, AlertTriangle, Calendar, Mail, User 
} from 'lucide-react';

interface Organization {
    id: string;
    name: string;
    description?: string;
    subscription_status: 'active' | 'suspended' | 'cancelled';
    api_key: string;
    api_requests_count: number;
    api_key_last_used_at?: string;
    created_at: string;
    owner: {
        id: number;
        name: string;
        email: string;
    };
    plan?: {
        id: number;
        name: string;
    };
    servers: Array<{
        id: string;
        name: string;
        hostname: string;
        status: string;
        created_at: string;
    }>;
}

interface Stats {
    servers_count: number;
    members_count: number;
    api_requests_count: number;
    api_key_last_used_at?: string;
}

interface Props {
    organization: Organization;
    stats: Stats;
}

const statusVariants = {
    active: 'bg-green-100 text-green-800',
    suspended: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
};

export default function OrganizationShow({ organization, stats }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'Organizations', href: '/admin/organizations' },
        { title: organization.name, href: `/admin/organizations/${organization.id}` },
    ];

    const handleSuspend = () => {
        if (confirm('Are you sure you want to suspend this organization? This will disable their access.')) {
            router.post(`/admin/organizations/${organization.id}/suspend`);
        }
    };

    const handleReactivate = () => {
        if (confirm('Are you sure you want to reactivate this organization?')) {
            router.post(`/admin/organizations/${organization.id}/reactivate`);
        }
    };

    const handleRegenerateApiKey = () => {
        if (confirm('Are you sure you want to regenerate the API key? This will invalidate the current key.')) {
            router.post(`/admin/organizations/${organization.id}/regenerate-api-key`);
        }
    };

    const canSuspend = organization.subscription_status === 'active';
    const canReactivate = organization.subscription_status === 'suspended';

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Organization: ${organization.name}`} />

            <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button asChild variant="outline" size="sm">
                            <Link href="/admin/organizations">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Organizations
                            </Link>
                        </Button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-semibold">{organization.name}</h1>
                                <Badge className={statusVariants[organization.subscription_status]}>
                                    {organization.subscription_status}
                                </Badge>
                            </div>
                            <p className="text-muted-foreground mt-1">{organization.description || 'No description'}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {canSuspend && (
                            <Button onClick={handleSuspend} variant="destructive" size="sm">
                                <Pause className="mr-2 h-4 w-4" />
                                Suspend
                            </Button>
                        )}
                        {canReactivate && (
                            <Button onClick={handleReactivate} variant="default" size="sm">
                                <Play className="mr-2 h-4 w-4" />
                                Reactivate
                            </Button>
                        )}
                        <Button onClick={handleRegenerateApiKey} variant="outline" size="sm">
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Regenerate API Key
                        </Button>
                    </div>
                </div>

                {organization.subscription_status === 'suspended' && (
                    <Alert className="mb-6 border-red-200 bg-red-50">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                            This organization is currently suspended and cannot access the platform.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid gap-6 lg:grid-cols-4">
                    {/* Stats Cards */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Servers</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center">
                                <Server className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span className="text-2xl font-bold">{stats.servers_count}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Members</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center">
                                <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span className="text-2xl font-bold">{stats.members_count}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">API Requests</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center">
                                <Activity className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span className="text-2xl font-bold">{stats.api_requests_count.toLocaleString()}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Last API Call</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center">
                                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                    {stats.api_key_last_used_at 
                                        ? new Date(stats.api_key_last_used_at).toLocaleDateString()
                                        : 'Never'
                                    }
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    {/* Organization Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Organization Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Owner</span>
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{organization.owner.name}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Owner Email</span>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{organization.owner.email}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Plan</span>
                                <span className="text-sm">{organization.plan?.name || 'No Plan'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Created</span>
                                <span className="text-sm">{new Date(organization.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">API Key</span>
                                <div className="flex items-center gap-2">
                                    <Key className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                        {organization.api_key.substring(0, 8)}...
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button asChild variant="outline" className="w-full justify-start">
                                <Link href={`/admin/organizations/${organization.id}/members`}>
                                    <Users className="mr-2 h-4 w-4" />
                                    View Members ({stats.members_count})
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="w-full justify-start">
                                <Link href={`/admin/organizations/${organization.id}/servers`}>
                                    <Server className="mr-2 h-4 w-4" />
                                    View Servers ({stats.servers_count})
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Servers */}
                {organization.servers.length > 0 && (
                    <Card className="mt-6">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Recent Servers</CardTitle>
                                <Button asChild variant="outline" size="sm">
                                    <Link href={`/admin/organizations/${organization.id}/servers`}>
                                        View All
                                    </Link>
                                </Button>
                            </div>
                            <CardDescription>Latest servers registered in this organization</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {organization.servers.slice(0, 5).map((server) => (
                                    <div key={server.id} className="flex items-center justify-between border rounded-lg p-3">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full">
                                                <Server className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <div className="font-medium">{server.name}</div>
                                                <div className="text-sm text-muted-foreground">{server.hostname}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant={server.status === 'online' ? 'default' : 'secondary'}>
                                                {server.status}
                                            </Badge>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {new Date(server.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AdminLayout>
    );
}