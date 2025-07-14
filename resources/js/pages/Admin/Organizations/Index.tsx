import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminLayout from '@/layouts/admin-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Building, Eye, FileDown, Search, Server, Users } from 'lucide-react';
import { useState } from 'react';

interface Organization {
    id: string;
    name: string;
    description?: string;
    subscription_status: 'active' | 'suspended' | 'cancelled';
    api_requests_count: number;
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
    servers_count: number;
    members_count: number;
}

interface Props {
    organizations: {
        data: Organization[];
        links: any[];
        meta: any;
    };
    filters: {
        search?: string;
        status?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin Dashboard', href: '/admin/dashboard' },
    { title: 'Organizations Supervision', href: '/admin/organizations' },
];

const statusVariants = {
    active: 'bg-green-100 text-green-800',
    suspended: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
};

export default function OrganizationsIndex({ organizations, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');

    const handleSearch = () => {
        const statusValue = status === 'all' ? '' : status;
        router.get('/admin/organizations', { search, status: statusValue }, { preserveState: true });
    };

    const handleStatusFilter = (value: string) => {
        const statusValue = value === 'all' ? '' : value;
        setStatus(value);
        router.get('/admin/organizations', { search, status: statusValue }, { preserveState: true });
    };

    const handleExport = () => {
        window.location.href = '/admin/organizations/export';
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Organizations Supervision" />

            <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Organizations Supervision</h1>
                        <p className="text-muted-foreground mt-1">Monitor and manage all organizations in your SaaS</p>
                    </div>
                    <Button onClick={handleExport} variant="outline">
                        <FileDown className="mr-2 h-4 w-4" />
                        Export Data
                    </Button>
                </div>

                {/* Filters */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-lg">Filters</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Search organizations..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                    <Button onClick={handleSearch}>
                                        <Search className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="w-48">
                                <Select value={status} onValueChange={handleStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="suspended">Suspended</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Organizations List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Organizations ({organizations.meta.total})</CardTitle>
                        <CardDescription>All organizations registered in your SaaS platform</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {organizations.data.map((org) => (
                                <div key={org.id} className="hover:bg-muted/50 rounded-lg border p-4 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full">
                                                <Building className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-medium">{org.name}</h3>
                                                    <Badge className={statusVariants[org.subscription_status]}>{org.subscription_status}</Badge>
                                                </div>
                                                <p className="text-muted-foreground text-sm">
                                                    Owner: {org.owner.name} ({org.owner.email})
                                                </p>
                                                {org.plan && <p className="text-muted-foreground text-xs">Plan: {org.plan.name}</p>}
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-6">
                                            <div className="text-center">
                                                <div className="text-muted-foreground flex items-center text-sm">
                                                    <Server className="mr-1 h-3 w-3" />
                                                    {org.servers_count}
                                                </div>
                                                <div className="text-muted-foreground text-xs">Servers</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-muted-foreground flex items-center text-sm">
                                                    <Users className="mr-1 h-3 w-3" />
                                                    {org.members_count}
                                                </div>
                                                <div className="text-muted-foreground text-xs">Members</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-sm font-medium">{org.api_requests_count.toLocaleString()}</div>
                                                <div className="text-muted-foreground text-xs">API Calls</div>
                                            </div>
                                            <Button asChild size="sm" variant="outline">
                                                <Link href={`/admin/organizations/${org.id}`}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View Details
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {organizations.data.length === 0 && (
                                <div className="py-8 text-center">
                                    <Building className="text-muted-foreground mx-auto h-12 w-12" />
                                    <h3 className="mt-2 text-sm font-medium">No organizations found</h3>
                                    <p className="text-muted-foreground mt-1 text-sm">
                                        {filters.search || filters.status
                                            ? 'Try adjusting your search or filters.'
                                            : 'No organizations have been created yet.'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {organizations.links && organizations.links.length > 3 && (
                            <div className="mt-6 flex justify-center">
                                <div className="flex gap-1">
                                    {organizations.links.map((link, index) => (
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
            </div>
        </AdminLayout>
    );
}
