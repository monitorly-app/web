import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Clock,
    Cpu,
    HardDrive,
    MemoryStick,
    MoreHorizontal,
    Plus,
    Search,
    Server,
    Settings,
    Wifi,
    WifiOff,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface ServerMetrics {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    network_in: number;
    network_out: number;
    uptime: number;
    load_average: number[];
}

interface ServerData {
    id: string;
    name: string;
    hostname: string;
    ip_address: string | null;
    port: number;
    status: 'online' | 'offline' | 'warning' | 'error' | 'pending';
    last_ping_at: string | null;
    cpu_usage: number;
    ram_usage: number;
    disk_usage: number;
    description: string | null;
    created_at: string;
    updated_at: string;
}

interface ServerStats {
    total_servers: number;
    online_servers: number;
    offline_servers: number;
    warning_servers: number;
}

interface OrganizationPlan {
    id: number;
    name: string;
    max_servers: number;
}

interface Organization {
    id: string;
    name: string;
    plan: OrganizationPlan;
}

interface Permissions {
    canViewServers: boolean;
    canManageServers: boolean;
    canDeleteServers: boolean;
}

interface Props {
    organization: Organization;
    servers: ServerData[];
    stats: ServerStats;
    permissions: Permissions;
}

export default function ServersIndex({ organization, servers, stats, permissions }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: organization.name,
            href: `/organizations/${organization.id}`,
        },
        {
            title: 'Servers',
            href: `/organizations/${organization.id}/servers`,
        },
    ];

    // Filtrage côté client
    const filteredServers = useMemo(() => {
        if (!Array.isArray(servers)) {
            console.error('Servers is not an array:', servers);
            return [];
        }
        return servers.filter((server) => {
            // Filtre par recherche
            const matchesSearch =
                searchQuery === '' ||
                server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                server.hostname.toLowerCase().includes(searchQuery.toLowerCase());

            // Filtre par statut
            const matchesStatus = statusFilter === 'all' || server.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [servers, searchQuery, statusFilter]);

    // Pagination côté client
    const paginatedServers = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredServers.slice(startIndex, endIndex);
    }, [filteredServers, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredServers.length / itemsPerPage);

    // Reset pagination when filters change
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        setCurrentPage(1);
    };

    const handleStatusFilterChange = (value: string) => {
        setStatusFilter(value);
        setCurrentPage(1);
    };

    const handleItemsPerPageChange = (value: string) => {
        setItemsPerPage(parseInt(value));
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setCurrentPage(1);
    };

    const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all';

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'online':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'warning':
                return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
            case 'offline':
                return <WifiOff className="h-4 w-4 text-red-600" />;
            case 'error':
                return <AlertTriangle className="h-4 w-4 text-red-600" />;
            case 'pending':
                return <Clock className="h-4 w-4 text-gray-600" />;
            default:
                return <Server className="h-4 w-4 text-gray-600" />;
        }
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'online':
                return 'default';
            case 'warning':
                return 'secondary';
            case 'offline':
            case 'error':
                return 'destructive';
            case 'pending':
                return 'outline';
            default:
                return 'outline';
        }
    };

    const formatLastSeen = (lastSeen: string | null) => {
        if (!lastSeen) return 'Never';

        const date = new Date(lastSeen);
        const now = new Date();
        const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
        return `${Math.floor(diffMinutes / 1440)}d ago`;
    };

    const formatMetric = (value: number) => {
        return `${value.toFixed(1)}%`;
    };

    const getMetricColor = (value: number) => {
        if (value >= 90) return 'text-red-600';
        if (value >= 80) return 'text-yellow-600';
        return 'text-green-600';
    };

    const canCreateServer = permissions.canManageServers && (organization.plan.max_servers === -1 || stats.total_servers < organization.plan.max_servers);

    // Génération des numéros de page pour la pagination
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);

            if (currentPage > 3) {
                pages.push('...');
            }

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) {
                    pages.push(i);
                }
            }

            if (currentPage < totalPages - 2) {
                pages.push('...');
            }

            if (!pages.includes(totalPages)) {
                pages.push(totalPages);
            }
        }

        return pages;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${organization.name} - Servers`} />

            <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Servers</h1>
                        <p className="text-muted-foreground mt-1">Monitor and manage your infrastructure servers</p>
                    </div>

                    {canCreateServer ? (
                        <Button asChild>
                            <Link href={`/organizations/${organization.id}/servers/create`}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Server
                            </Link>
                        </Button>
                    ) : permissions.canManageServers ? (
                        <div className="text-right">
                            <Button disabled>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Server
                            </Button>
                            <p className="text-muted-foreground mt-1 text-xs">
                                Server limit reached ({stats.total_servers}/{organization.plan.max_servers})
                            </p>
                        </div>
                    ) : null}
                </div>


                {/* Stats Cards */}
                <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
                    {/* Carte Plan Usage */}
                    {organization.plan.max_servers !== -1 ? (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Plan Usage</CardTitle>
                                <Settings className="text-muted-foreground h-4 w-4" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {stats.total_servers}/{organization.plan.max_servers}
                                </div>
                                <div className="bg-muted mt-2 h-2 w-full rounded-full">
                                    <div
                                        className="bg-primary h-full rounded-full transition-all"
                                        style={{
                                            width: `${Math.min((stats.total_servers / organization.plan.max_servers) * 100, 100)}%`,
                                        }}
                                    />
                                </div>
                                <p className="text-muted-foreground mt-1 text-xs">{organization.plan.name} plan</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Total Servers</CardTitle>
                                <Server className="text-muted-foreground h-4 w-4" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total_servers}</div>
                                <p className="text-muted-foreground mt-1 text-xs">Unlimited plan</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Carte Total Servers (si plan illimité) ou simplement Online */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">{organization.plan.max_servers === -1 ? 'Online Servers' : 'Total Servers'}</CardTitle>
                            {organization.plan.max_servers === -1 ? (
                                <Wifi className="h-4 w-4 text-green-600" />
                            ) : (
                                <Server className="text-muted-foreground h-4 w-4" />
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${organization.plan.max_servers === -1 ? 'text-green-600' : ''}`}>
                                {organization.plan.max_servers === -1 ? stats.online_servers : stats.total_servers}
                            </div>
                            <p className="text-muted-foreground mt-1 text-xs">{organization.plan.max_servers === -1 ? 'Currently active' : 'All servers'}</p>
                        </CardContent>
                    </Card>

                    {/* Carte Online */}
                    {organization.plan.max_servers !== -1 && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Online</CardTitle>
                                <Wifi className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{stats.online_servers}</div>
                                <p className="text-muted-foreground mt-1 text-xs">Currently active</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Carte Warning */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Warning</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{stats.warning_servers}</div>
                            <p className="text-muted-foreground mt-1 text-xs">Need attention</p>
                        </CardContent>
                    </Card>

                    {/* Carte Offline */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Offline</CardTitle>
                            <WifiOff className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.offline_servers}</div>
                            <p className="text-muted-foreground mt-1 text-xs">Disconnected</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters and Search */}
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                    <Input
                                        placeholder="Search servers by name or host..."
                                        value={searchQuery}
                                        onChange={(e) => handleSearchChange(e.target.value)}
                                        className="pl-10"
                                    />
                                    {searchQuery && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="absolute top-1/2 right-2 h-6 w-6 -translate-y-1/2 p-0"
                                            onClick={() => handleSearchChange('')}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="online">Online</SelectItem>
                                        <SelectItem value="warning">Warning</SelectItem>
                                        <SelectItem value="offline">Offline</SelectItem>
                                        <SelectItem value="error">Error</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                                    <SelectTrigger className="w-[100px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                                {hasActiveFilters && (
                                    <Button variant="outline" onClick={clearFilters}>
                                        <X className="mr-2 h-4 w-4" />
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Résultats de recherche */}
                        <div className="text-muted-foreground mt-3 flex items-center justify-between text-sm">
                            <span>
                                {filteredServers.length === servers.length
                                    ? `${servers.length} servers`
                                    : `${filteredServers.length} of ${servers.length} servers`}
                            </span>
                            {hasActiveFilters && <span className="text-xs">Filtered results</span>}
                        </div>
                    </CardContent>
                </Card>

                {/* Servers Table */}
                {filteredServers.length > 0 ? (
                    <div className="space-y-4">
                        <Card>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Server</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Host</TableHead>
                                        <TableHead className="text-center">Metrics</TableHead>
                                        <TableHead>Last Seen</TableHead>
                                        <TableHead>Uptime</TableHead>
                                        <TableHead className="w-[70px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedServers.map((server) => (
                                        <TableRow key={server.id} className="hover:bg-muted/50">
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    {getStatusIcon(server.status)}
                                                    <div>
                                                        <div className="font-medium">{server.name}</div>
                                                        {server.description && (
                                                            <div className="text-muted-foreground text-xs">{server.description}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusBadgeVariant(server.status)}>{server.status}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-mono text-sm">
                                                    {server.hostname}:{server.port}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center space-x-4">
                                                    <div className="text-center">
                                                        <div className="mb-1 flex items-center justify-center">
                                                            <Cpu className="mr-1 h-3 w-3" />
                                                        </div>
                                                        <div className={`text-xs font-medium ${getMetricColor(server.cpu_usage)}`}>
                                                            {formatMetric(server.cpu_usage)}
                                                        </div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="mb-1 flex items-center justify-center">
                                                            <MemoryStick className="mr-1 h-3 w-3" />
                                                        </div>
                                                        <div className={`text-xs font-medium ${getMetricColor(server.ram_usage)}`}>
                                                            {formatMetric(server.ram_usage)}
                                                        </div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="mb-1 flex items-center justify-center">
                                                            <HardDrive className="mr-1 h-3 w-3" />
                                                        </div>
                                                        <div className={`text-xs font-medium ${getMetricColor(server.disk_usage)}`}>
                                                            {formatMetric(server.disk_usage)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">{formatLastSeen(server.last_ping_at)}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">{server.last_ping_at ? formatLastSeen(server.last_ping_at) : 'Never'}</div>
                                            </TableCell>
                                            <TableCell>
                                                {permissions.canManageServers && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/organizations/${organization.id}/servers/${server.id}`}>
                                                                    <Activity className="mr-2 h-4 w-4" />
                                                                    View Details
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/organizations/${organization.id}/servers/${server.id}/edit`}>
                                                                    <Settings className="mr-2 h-4 w-4" />
                                                                    Settings
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-destructive">Delete Server</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between">
                                <div className="text-muted-foreground text-sm">
                                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredServers.length)}{' '}
                                    of {filteredServers.length} servers
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
                                        <ChevronLeft className="h-4 w-4" />
                                        Previous
                                    </Button>
                                    <div className="flex items-center space-x-1">
                                        {getPageNumbers().map((page, index) =>
                                            page === '...' ? (
                                                <span key={index} className="text-muted-foreground px-2">
                                                    ...
                                                </span>
                                            ) : (
                                                <Button
                                                    key={page}
                                                    variant={page === currentPage ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => setCurrentPage(page as number)}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    {page}
                                                </Button>
                                            ),
                                        )}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Server className="text-muted-foreground mb-4 h-12 w-12" />
                            <h3 className="mb-2 text-xl font-medium">{hasActiveFilters ? 'No Servers Found' : 'No Servers Yet'}</h3>
                            <p className="text-muted-foreground mb-6 text-center">
                                {hasActiveFilters
                                    ? 'Try adjusting your search criteria or filters.'
                                    : 'Start monitoring your infrastructure by adding your first server.'}
                            </p>
                            {hasActiveFilters ? (
                                <Button variant="outline" onClick={clearFilters}>
                                    Clear Filters
                                </Button>
                            ) : canCreateServer ? (
                                <Button asChild>
                                    <Link href={`/organizations/${organization.id}/servers/create`}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Your First Server
                                    </Link>
                                </Button>
                            ) : (
                                permissions.canManageServers && (
                                    <p className="text-muted-foreground text-sm">Server limit reached for your {organization.plan.name} plan</p>
                                )
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
