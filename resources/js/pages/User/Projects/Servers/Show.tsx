import MetricsCharts from '@/components/MetricsCharts';
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
    Clock,
    Copy,
    Cpu,
    Edit,
    Eye,
    EyeOff,
    HardDrive,
    MemoryStick,
    Network,
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
    const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'command' | 'script' | 'manual'>('command');

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
                        <MetricsCharts project={project} server={server} />
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
                                <CardDescription>Install the monitoring agent on your server</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium">Installation Status</p>
                                            <div className="mt-1 flex items-center gap-2">
                                                {server.agent_version ? (
                                                    <>
                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                        <span className="text-sm text-green-600">Installed (v{server.agent_version})</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Clock className="h-4 w-4 text-yellow-600" />
                                                        <span className="text-sm text-yellow-600">Agent not installed</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <Button onClick={() => setIsInstallModalOpen(true)} className="flex items-center gap-2">
                                            <Terminal className="h-4 w-4" />
                                            Install Agent
                                        </Button>
                                    </div>

                                    {server.agent_version && (
                                        <div className="rounded-md border border-green-200 bg-green-50 p-3">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                <span className="text-sm text-green-800">
                                                    Agent is installed and sending metrics. Last seen: {formatLastSeen(server.last_seen)}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Installation Modal */}
                        <Dialog open={isInstallModalOpen} onOpenChange={setIsInstallModalOpen}>
                            <DialogContent className="max-h-[90vh] w-[80vw] max-w-[800px] overflow-y-auto md:max-w-[1200px] lg:max-w-[1400px] xl:max-w-[1600px]">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <Terminal className="h-5 w-5" />
                                        Install Monitoring Agent
                                    </DialogTitle>
                                    <DialogDescription>
                                        Install and configure the Monitorly agent on your server: <strong>{server.name}</strong>
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-6">
                                    {/* Tabs */}
                                    <div className="flex space-x-1 border-b">
                                        <button
                                            onClick={() => setActiveTab('command')}
                                            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                                                activeTab === 'command'
                                                    ? 'border-blue-500 text-blue-600'
                                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                            }`}
                                        >
                                            🚀 Quick Install
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('script')}
                                            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                                                activeTab === 'script'
                                                    ? 'border-blue-500 text-blue-600'
                                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                            }`}
                                        >
                                            📜 View Script
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('manual')}
                                            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                                                activeTab === 'manual'
                                                    ? 'border-blue-500 text-blue-600'
                                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                            }`}
                                        >
                                            ⚙️ Manual Config
                                        </button>
                                    </div>

                                    {/* Quick Install Tab */}
                                    {activeTab === 'command' && (
                                        <div className="space-y-4">
                                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                                <h3 className="mb-2 font-medium text-blue-900">One-Command Installation</h3>
                                                <p className="mb-3 text-sm text-blue-800">
                                                    This command will automatically install and configure the monitoring agent on your server.
                                                </p>

                                                <div className="mb-3 rounded-md bg-gray-900 p-3">
                                                    <code className="text-sm break-all text-green-400">
                                                        curl -sSL {window.location.origin}/install/{server.token} | bash
                                                    </code>
                                                </div>

                                                <div className="flex gap-2">
                                                    <Button
                                                        onClick={() =>
                                                            copyToClipboard(`curl -sSL ${window.location.origin}/install/${server.token} | bash`)
                                                        }
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                        Copy Command
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setActiveTab('script')}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        View Script Source
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* What it does */}
                                            <div className="rounded-lg bg-gray-50 p-4">
                                                <h4 className="mb-3 font-medium">🔧 What this script does:</h4>
                                                <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-green-600">✓</span>
                                                        <span>Downloads and installs Monitorly agent</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-green-600">✓</span>
                                                        <span>Configures with your project credentials</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-green-600">✓</span>
                                                        <span>Sets up automatic startup service</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-green-600">✓</span>
                                                        <span>Starts monitoring immediately</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-green-600">✓</span>
                                                        <span>Verifies installation success</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-green-600">✓</span>
                                                        <span>Shows detailed status and logs</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Installation steps */}
                                            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                                                <h4 className="mb-2 font-medium text-yellow-900">📋 Installation Steps:</h4>
                                                <ol className="space-y-1 text-sm text-yellow-800">
                                                    <li>
                                                        <strong>1.</strong> SSH into your server:{' '}
                                                        <code className="rounded bg-yellow-100 px-1">ssh user@{server.host}</code>
                                                    </li>
                                                    <li>
                                                        <strong>2.</strong> Run the installation command (copy from above)
                                                    </li>
                                                    <li>
                                                        <strong>3.</strong> Wait 1-2 minutes for metrics to appear
                                                    </li>
                                                    <li>
                                                        <strong>4.</strong> Refresh this page to see live metrics
                                                    </li>
                                                </ol>
                                            </div>
                                        </div>
                                    )}

                                    {/* Script Tab */}
                                    {activeTab === 'script' && (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-medium">Installation Script Source</h3>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => window.open(`${window.location.origin}/install/${server.token}`, '_blank')}
                                                >
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    Open in New Tab
                                                </Button>
                                            </div>

                                            <div className="max-h-96 overflow-y-auto rounded-lg border-2 p-4">
                                                <iframe
                                                    src={`${window.location.origin}/install/${server.token}`}
                                                    className="h-96 w-full text-green-400"
                                                    style={{
                                                        border: 'none',
                                                        fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
                                                        fontSize: '12px',
                                                    }}
                                                />
                                            </div>

                                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                                                <p className="text-sm text-blue-800">
                                                    <strong>🔒 Security:</strong> This script is generated dynamically for your server and includes
                                                    your specific credentials. You can review the entire script before running it.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Manual Tab */}
                                    {activeTab === 'manual' && (
                                        <div className="space-y-4">
                                            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                                                <h3 className="mb-2 font-medium text-orange-900">⚙️ Manual Configuration</h3>
                                                <p className="text-sm text-orange-800">
                                                    For advanced users who prefer to install and configure manually.
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4">
                                                <div>
                                                    <Label className="text-sm font-medium">API Endpoint:</Label>
                                                    <div className="mt-1 flex gap-2">
                                                        <Input
                                                            value={`${window.location.origin}/api/projects/${project.id}/metrics`}
                                                            readOnly
                                                            className="font-mono text-xs"
                                                        />
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                copyToClipboard(`${window.location.origin}/api/projects/${project.id}/metrics`)
                                                            }
                                                        >
                                                            <Copy className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <Label className="text-sm font-medium">Project ID:</Label>
                                                    <div className="mt-1 flex gap-2">
                                                        <Input value={project.id} readOnly className="font-mono text-xs" />
                                                        <Button variant="outline" size="sm" onClick={() => copyToClipboard(project.id)}>
                                                            <Copy className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <Label className="text-sm font-medium">Server Token:</Label>
                                                    <div className="mt-1 flex gap-2">
                                                        <Input
                                                            value={showToken ? server.token : '•'.repeat(20)}
                                                            readOnly
                                                            className="font-mono text-xs"
                                                        />
                                                        <Button variant="outline" size="sm" onClick={() => setShowToken(!showToken)}>
                                                            {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                        </Button>
                                                        {showToken && (
                                                            <Button variant="outline" size="sm" onClick={() => copyToClipboard(server.token)}>
                                                                <Copy className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="rounded-lg bg-gray-50 p-4">
                                                <h4 className="mb-2 font-medium">Manual Installation Steps:</h4>
                                                <ol className="space-y-2 text-sm">
                                                    <li>
                                                        <strong>1.</strong> Install the agent:{' '}
                                                        <code className="rounded bg-gray-200 px-1">
                                                            curl -sSL https://raw.githubusercontent.com/monitorly-app/probe/master/install.sh | bash
                                                        </code>
                                                    </li>
                                                    <li>
                                                        <strong>2.</strong> Edit config:{' '}
                                                        <code className="rounded bg-gray-200 px-1">vim ~/.monitorly/config.yaml</code>
                                                    </li>
                                                    <li>
                                                        <strong>3.</strong> Update the API settings with the values above
                                                    </li>
                                                    <li>
                                                        <strong>4.</strong> Restart:{' '}
                                                        <code className="rounded bg-gray-200 px-1">sudo systemctl restart monitorly-probe</code>
                                                    </li>
                                                </ol>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end border-t pt-4">
                                    <Button variant="outline" onClick={() => setIsInstallModalOpen(false)}>
                                        Close
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
