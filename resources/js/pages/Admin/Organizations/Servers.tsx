import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/layouts/admin-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Activity, ArrowLeft, Clock, Cpu, Database, HardDrive, Server } from 'lucide-react';

interface ServerData {
    id: string;
    name: string;
    hostname: string;
    status: 'online' | 'offline' | 'warning';
    token: string;
    monitoring_config: any;
    last_metrics: any;
    created_at: string;
    updated_at: string;
    metrics_count: number;
}

interface Organization {
    id: string;
    name: string;
}

interface Props {
    organization: Organization;
    servers: {
        data: ServerData[];
        links: any[];
        meta: any;
    };
}

export default function OrganizationServers({ organization, servers }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'Organizations', href: '/admin/organizations' },
        { title: organization.name, href: `/admin/organizations/${organization.id}` },
        { title: 'Servers', href: `/admin/organizations/${organization.id}/servers` },
    ];

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'online':
                return 'bg-green-100 text-green-800';
            case 'offline':
                return 'bg-red-100 text-red-800';
            case 'warning':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'online':
                return <Activity className="h-3 w-3" />;
            case 'offline':
                return <Server className="h-3 w-3" />;
            case 'warning':
                return <Activity className="h-3 w-3" />;
            default:
                return <Server className="h-3 w-3" />;
        }
    };

    const formatLastMetrics = (lastMetrics: any) => {
        if (!lastMetrics) return null;

        try {
            const metrics = typeof lastMetrics === 'string' ? JSON.parse(lastMetrics) : lastMetrics;
            return {
                cpu: metrics.cpu_usage || 0,
                memory: metrics.memory_usage || 0,
                disk: metrics.disk_usage || 0,
                timestamp: metrics.timestamp || null,
            };
        } catch {
            return null;
        }
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Servers - ${organization.name}`} />

            <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/admin/organizations/${organization.id}`}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Organization
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-semibold">Organization Servers</h1>
                            <p className="text-muted-foreground mt-1">{servers.meta.total} servers in {organization.name}</p>
                        </div>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Server className="h-5 w-5" />
                            Servers ({servers.meta.total})
                        </CardTitle>
                        <CardDescription>All servers registered in this organization</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {servers.data.length > 0 ? (
                            <div className="space-y-4">
                                {servers.data.map((server) => {
                                    const metrics = formatLastMetrics(server.last_metrics);

                                    return (
                                        <div key={server.id} className="hover:bg-muted/50 rounded-lg border p-4 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full">
                                                        <Server className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-medium">{server.name}</h3>
                                                            <Badge className={getStatusVariant(server.status)}>
                                                                {getStatusIcon(server.status)}
                                                                <span className="ml-1">{server.status}</span>
                                                            </Badge>
                                                        </div>
                                                        <div className="text-muted-foreground flex items-center gap-4 text-sm">
                                                            <span>{server.hostname}</span>
                                                            <span>•</span>
                                                            <div className="flex items-center gap-1">
                                                                <Database className="h-3 w-3" />
                                                                {server.metrics_count.toLocaleString()} metrics
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center space-x-6">
                                                    {metrics && (
                                                        <>
                                                            <div className="text-center">
                                                                <div className="flex items-center text-sm">
                                                                    <Cpu className="text-muted-foreground mr-1 h-3 w-3" />
                                                                    {metrics.cpu.toFixed(1)}%
                                                                </div>
                                                                <div className="text-muted-foreground text-xs">CPU</div>
                                                            </div>
                                                            <div className="text-center">
                                                                <div className="flex items-center text-sm">
                                                                    <Activity className="text-muted-foreground mr-1 h-3 w-3" />
                                                                    {metrics.memory.toFixed(1)}%
                                                                </div>
                                                                <div className="text-muted-foreground text-xs">Memory</div>
                                                            </div>
                                                            <div className="text-center">
                                                                <div className="flex items-center text-sm">
                                                                    <HardDrive className="text-muted-foreground mr-1 h-3 w-3" />
                                                                    {metrics.disk.toFixed(1)}%
                                                                </div>
                                                                <div className="text-muted-foreground text-xs">Disk</div>
                                                            </div>
                                                        </>
                                                    )}

                                                    <div className="text-muted-foreground text-right text-sm">
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {new Date(server.created_at).toLocaleDateString()}
                                                        </div>
                                                        <div className="text-xs">Server ID: {server.id.substring(0, 8)}...</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Additional server details */}
                                            <div className="border-muted mt-3 border-t pt-3">
                                                <div className="text-muted-foreground grid grid-cols-2 gap-4 text-xs md:grid-cols-4">
                                                    <div>
                                                        <span className="font-medium">Token:</span>
                                                        <span className="ml-1 font-mono">{server.token.substring(0, 12)}...</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Last Update:</span>
                                                        <span className="ml-1">{new Date(server.updated_at).toLocaleString()}</span>
                                                    </div>
                                                    {metrics?.timestamp && (
                                                        <div>
                                                            <span className="font-medium">Last Metrics:</span>
                                                            <span className="ml-1">{new Date(metrics.timestamp).toLocaleString()}</span>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <span className="font-medium">Status:</span>
                                                        <span
                                                            className={`ml-1 ${
                                                                server.status === 'online'
                                                                    ? 'text-green-600'
                                                                    : server.status === 'offline'
                                                                      ? 'text-red-600'
                                                                      : 'text-yellow-600'
                                                            }`}
                                                        >
                                                            {server.status.toUpperCase()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-8 text-center">
                                <Server className="text-muted-foreground mx-auto h-12 w-12" />
                                <h3 className="mt-2 text-sm font-medium">No servers found</h3>
                                <p className="text-muted-foreground mt-1 text-sm">This organization hasn't registered any servers yet.</p>
                            </div>
                        )}

                        {/* Pagination */}
                        {servers.links && servers.links.length > 3 && (
                            <div className="mt-6 flex justify-center">
                                <div className="flex gap-1">
                                    {servers.links.map((link, index) => (
                                        <Button
                                            key={index}
                                            variant={link.active ? 'default' : 'outline'}
                                            size="sm"
                                            asChild={link.url !== null}
                                            disabled={link.url === null}
                                        >
                                            {link.url ? (
                                                <Link href={link.url} preserveState>
                                                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                                </Link>
                                            ) : (
                                                <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                            )}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Server Statistics */}
                <div className="mt-6 grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Servers</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{servers.meta.total}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Online</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{servers.data.filter((s) => s.status === 'online').length}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Offline</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{servers.data.filter((s) => s.status === 'offline').length}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Metrics</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{servers.data.reduce((sum, s) => sum + s.metrics_count, 0).toLocaleString()}</div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
