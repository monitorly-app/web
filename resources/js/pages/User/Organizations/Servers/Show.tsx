import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

// Composants modulaires
import ServerDeleteModal from '@/components/server-details/ServerDeleteModal';
import ServerEditModal from '@/components/server-details/ServerEditModal';
import ServerHeader from '@/components/server-details/ServerHeader';
import ServerTabs from '@/components/server-details/ServerTabs';

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

interface Organization {
    id: string;
    name: string;
}

interface Permissions {
    canViewServers: boolean;
    canManageServers: boolean;
    canDeleteServers: boolean;
}

interface Props {
    organization: Organization;
    server: ServerData;
    permissions: Permissions;
}

export default function ServersShow({ organization, server, permissions }: Props) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: organization.name,
            href: `/organizations/${organization.id}`,
        },
        {
            title: 'Servers',
            href: `/organizations/${organization.id}/servers`,
        },
        {
            title: server.name,
            href: `/organizations/${organization.id}/servers/${server.id}`,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${organization.name} - ${server.name}`} />

            <div className="bg-background min-h-screen">
                {/* En-tête du serveur */}
                <ServerHeader
                    organization={organization}
                    server={server}
                    permissions={permissions}
                    onEdit={() => setIsEditModalOpen(true)}
                    onDelete={() => setIsDeleteModalOpen(true)}
                />

                {/* Contenu principal avec tabs */}
                <div className="p-2">
                    <div className="mx-auto w-full">
                        <ServerTabs server={server} organization={organization} />
                    </div>
                </div>

                {/* Modales */}
                <ServerEditModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} server={server} organization={organization} />

                <ServerDeleteModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    server={server}
                    organization={organization}
                />
            </div>
        </AppLayout>
    );
}
