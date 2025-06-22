import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    Activity,
    ArrowLeft,
    CheckCircle,
    Copy,
    Cpu,
    Edit,
    Eye,
    EyeOff,
    HardDrive,
    MemoryStick,
    Network,
    RefreshCw,
    Server,
    Terminal,
    Trash,
    Wifi,
} from 'lucide-react';
import { useState } from 'react';

interface ServerMetrics {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    network_in: number;
    network_out: number;
    uptime: number;
    load_average: number[];
    processes_count: number;
    connections_count: number;
}

interface SystemInfo {
    os: string;
    kernel: string;
    cpu_model: string;
    cpu_cores: number;
    total_memory: number;
    total_disk: number;
    total_memory_formatted?: string;
    total_disk_formatted?: string;
    hostname: string;
}

interface ServerData {
    id: string;
    name: string;
    host: string;
    port: number;
    description?: string;
    status: 'online' | 'offline' | 'warning' | 'error' | 'pending';
    last_seen: string | null;
    agent_version: string | null;
    token: string;
    install_command: string;
    metrics: ServerMetrics;
    system_info: SystemInfo;
    created_at: string;
}

interface Project {
    id: string;
    name: string;
}

interface Permissions {
    canViewServers: boolean;
    canManageServers: boolean;
    canDeleteServers: boolean;
}

interface Props {
    project: Project;
    server: ServerData;
    permissions: Permissions;
}

export default function ServersShow({ project, server, permissions }: Props) {
    const [showToken, setShowToken] = useState(false);
    const [showInstallCommand, setShowInstallCommand] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Update form
    const updateForm = useForm({
        name: server.name,
        host: server.host,
        port: server.port,
        description: server.description || '',
    });

    // Delete form
    const deleteForm = useForm({});

    // Regenerate token form
    const regenerateTokenForm = useForm({});

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: project.name,
            href: `/projects/${project.id}`,
        },
        {
            title: 'Servers',
            href: `/projects/${project.id}/servers`,
        },
        {
            title: server.name,
            href: `/projects/${project.id}/servers/${server.id}`,
        },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online':
                return 'text-green-600';
            case 'warning':
                return 'text-yellow-600';
            case 'offline':
            case 'error':
                return 'text-red-600';
            case 'pending':
                return 'text-gray-600';
            default:
                return 'text-gray-600';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'online':
                return <CheckCircle className="h-5 w-5 text-green-600" />;
            case 'warning':
                return <Activity className="h-5 w-5 text-yellow-600" />;
            case 'offline':
                return <Wifi className="h-5 w-5 text-red-600" />;
            case 'error':
                return <Activity className="h-5 w-5 text-red-600" />;
            case 'pending':
                return <Server className="h-5 w-5 text-gray-600" />;
            default:
                return <Server className="h-5 w-5 text-gray-600" />;
        }
    };

    const formatLastSeen = (lastSeen: string | null) => {
        if (!lastSeen) return 'Never';

        const date = new Date(lastSeen);
        const now = new Date();
        const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
        if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hour${Math.floor(diffMinutes / 60) > 1 ? 's' : ''} ago`;
        return `${Math.floor(diffMinutes / 1440)} day${Math.floor(diffMinutes / 1440) > 1 ? 's' : ''} ago`;
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const formatUptime = (seconds: number) => {
        if (seconds === 0) return 'N/A';

        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        let result = '';
        if (days > 0) result += `${days}d `;
        if (hours > 0) result += `${hours}h `;
        if (minutes > 0 && days === 0) result += `${minutes}m`;

        return result.trim() || 'Less than a minute';
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // You can add a toast notification here
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        updateForm.put(route('projects.servers.update', [project.id, server.id]));
    };

    const handleDelete = () => {
        deleteForm.delete(route('projects.servers.destroy', [project.id, server.id]));
    };

    const handleRegenerateToken = () => {
        regenerateTokenForm.post(route('projects.servers.regenerate-token', [project.id, server.id]));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${project.name} - ${server.name}`} />

            <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/projects/${project.id}/servers`}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Servers
                            </Link>
                        </Button>
                        <div>
                            <div className="flex items-center space-x-3">
                                {getStatusIcon(server.status)}
                                <h1 className="text-2xl font-semibold">{server.name}</h1>
                                <Badge variant={server.status === 'online' ? 'default' : 'destructive'}>{server.status}</Badge>
                            </div>
                            <p className="text-muted-foreground mt-1">
                                {server.host}:{server.port} • Last seen: {formatLastSeen(server.last_seen)}
                            </p>
                        </div>
                    </div>

                    {permissions.canManageServers && (
                        <div className="flex items-center space-x-2">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Edit Server</DialogTitle>
                                        <DialogDescription>Update server configuration</DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleUpdate} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Name</Label>
                                            <Input
                                                id="name"
                                                value={updateForm.data.name}
                                                onChange={(e) => updateForm.setData('name', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="host">Host</Label>
                                            <Input
                                                id="host"
                                                value={updateForm.data.host}
                                                onChange={(e) => updateForm.setData('host', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="port">Port</Label>
                                            <Input
                                                id="port"
                                                type="number"
                                                value={updateForm.data.port}
                                                onChange={(e) => updateForm.setData('port', parseInt(e.target.value))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="description">Description</Label>
                                            <Textarea
                                                id="description"
                                                value={updateForm.data.description}
                                                onChange={(e) => updateForm.setData('description', e.target.value)}
                                            />
                                        </div>
                                        <div className="flex justify-end space-x-2">
                                            <Button type="submit" disabled={updateForm.processing}>
                                                Save Changes
                                            </Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>

                            {permissions.canDeleteServers && (
                                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="destructive" size="sm">
                                            <Trash className="mr-2 h-4 w-4" />
                                            Delete
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Delete Server</DialogTitle>
                                            <DialogDescription>
                                                Are you sure you want to delete this server? This action cannot be undone.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="flex justify-end space-x-2">
                                            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                                                Cancel
                                            </Button>
                                            <Button variant="destructive" onClick={handleDelete} disabled={deleteForm.processing}>
                                                Delete Server
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left Column - Metrics */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Current Metrics */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Current Metrics</CardTitle>
                                <CardDescription>Real-time server performance indicators</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                                    <div className="text-center">
                                        <div className="mb-2 flex items-center justify-center">
                                            <Cpu className={`h-8 w-8 ${server.metrics.cpu_usage > 80 ? 'text-red-500' : 'text-blue-500'}`} />
                                        </div>
                                        <p className="text-2xl font-bold">{server.metrics.cpu_usage.toFixed(1)}%</p>
                                        <p className="text-muted-foreground text-sm">CPU Usage</p>
                                    </div>

                                    <div className="text-center">
                                        <div className="mb-2 flex items-center justify-center">
                                            <MemoryStick
                                                className={`h-8 w-8 ${server.metrics.memory_usage > 90 ? 'text-red-500' : 'text-green-500'}`}
                                            />
                                        </div>
                                        <p className="text-2xl font-bold">{server.metrics.memory_usage.toFixed(1)}%</p>
                                        <p className="text-muted-foreground text-sm">Memory</p>
                                    </div>

                                    <div className="text-center">
                                        <div className="mb-2 flex items-center justify-center">
                                            <HardDrive className={`h-8 w-8 ${server.metrics.disk_usage > 90 ? 'text-red-500' : 'text-purple-500'}`} />
                                        </div>
                                        <p className="text-2xl font-bold">{server.metrics.disk_usage.toFixed(1)}%</p>
                                        <p className="text-muted-foreground text-sm">Disk Usage</p>
                                    </div>

                                    <div className="text-center">
                                        <div className="mb-2 flex items-center justify-center">
                                            <Network className="h-8 w-8 text-orange-500" />
                                        </div>
                                        <p className="text-2xl font-bold">{formatUptime(server.metrics.uptime)}</p>
                                        <p className="text-muted-foreground text-sm">Uptime</p>
                                    </div>
                                </div>

                                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div>
                                        <p className="text-sm font-medium">Load Average</p>
                                        <p className="text-muted-foreground text-sm">
                                            {server.metrics.load_average[0]?.toFixed(2) || '0.00'},{' '}
                                            {server.metrics.load_average[1]?.toFixed(2) || '0.00'},{' '}
                                            {server.metrics.load_average[2]?.toFixed(2) || '0.00'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Network I/O</p>
                                        <p className="text-muted-foreground text-sm">
                                            ↓ {formatBytes(server.metrics.network_in)} / ↑ {formatBytes(server.metrics.network_out)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Processes</p>
                                        <p className="text-muted-foreground text-sm">{server.metrics.processes_count} running</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* System Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>System Information</CardTitle>
                                <CardDescription>Server hardware and operating system details</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <p className="text-sm font-medium">Operating System</p>
                                        <p className="text-muted-foreground text-sm">{server.system_info.os}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Kernel</p>
                                        <p className="text-muted-foreground text-sm">{server.system_info.kernel}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">CPU Model</p>
                                        <p className="text-muted-foreground text-sm">{server.system_info.cpu_model}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">CPU Cores</p>
                                        <p className="text-muted-foreground text-sm">{server.system_info.cpu_cores}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Total Memory</p>
                                        <p className="text-muted-foreground text-sm">
                                            {server.system_info.total_memory_formatted || formatBytes(server.system_info.total_memory)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Total Disk</p>
                                        <p className="text-muted-foreground text-sm">
                                            {server.system_info.total_disk_formatted || formatBytes(server.system_info.total_disk)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Configuration */}
                    <div className="space-y-6">
                        {/* Server Configuration */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Configuration</CardTitle>
                                <CardDescription>Server connection and agent details</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium">Server Token</p>
                                    <div className="flex items-center space-x-2">
                                        <Input value={showToken ? server.token : '•'.repeat(20)} readOnly className="bg-muted font-mono text-xs" />
                                        <Button variant="outline" size="sm" onClick={() => setShowToken(!showToken)}>
                                            {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => copyToClipboard(server.token)}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    {permissions.canManageServers && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-2 w-full"
                                            onClick={handleRegenerateToken}
                                            disabled={regenerateTokenForm.processing}
                                        >
                                            <RefreshCw className={`mr-2 h-4 w-4 ${regenerateTokenForm.processing ? 'animate-spin' : ''}`} />
                                            Regenerate Token
                                        </Button>
                                    )}
                                </div>

                                <div>
                                    <p className="text-sm font-medium">Agent Version</p>
                                    <p className="text-muted-foreground text-sm">{server.agent_version || 'Not connected'}</p>
                                </div>

                                <div>
                                    <p className="text-sm font-medium">Created</p>
                                    <p className="text-muted-foreground text-sm">{new Date(server.created_at).toLocaleDateString()}</p>
                                </div>

                                {server.description && (
                                    <div>
                                        <p className="text-sm font-medium">Description</p>
                                        <p className="text-muted-foreground text-sm">{server.description}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Agent Installation */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Terminal className="mr-2 h-5 w-5" />
                                    Agent Installation
                                </CardTitle>
                                <CardDescription>Command to install the monitoring agent</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                        <Button variant="outline" size="sm" onClick={() => setShowInstallCommand(!showInstallCommand)}>
                                            {showInstallCommand ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            {showInstallCommand ? 'Hide' : 'Show'} Command
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => copyToClipboard(server.install_command)}>
                                            <Copy className="mr-2 h-4 w-4" />
                                            Copy
                                        </Button>
                                    </div>

                                    {showInstallCommand && (
                                        <div className="bg-muted rounded-md p-3">
                                            <code className="text-xs break-all">{server.install_command}</code>
                                        </div>
                                    )}

                                    <p className="text-muted-foreground text-xs">
                                        Run this command on your server as root to install the monitoring agent.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
