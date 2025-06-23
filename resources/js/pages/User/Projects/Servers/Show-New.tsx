import MetricsCharts from '@/components/MetricsCharts';
import AgentInstallation from '@/components/server-details/AgentInstallation';
import MetricsOverview from '@/components/server-details/MetricsOverview';
import ServerConfiguration from '@/components/server-details/ServerConfiguration';
import ServerDeleteModal from '@/components/server-details/ServerDeleteModal';
import ServerEditModal from '@/components/server-details/ServerEditModal';
import ServerHeader from '@/components/server-details/ServerHeader';
import SystemInformation from '@/components/server-details/SystemInformation';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
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

export default function ServersShowNew({ project, server, permissions }: Props) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: project.name,
            href: `/projects/${project.id}`,
        },
        {
            title: 'Serveurs',
            href: `/projects/${project.id}/servers`,
        },
        {
            title: server.name,
            href: `/projects/${project.id}/servers/${server.id}`,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${project.name} - ${server.name}`} />

            <div className="min-h-screen bg-slate-50">
                {/* En-tête du serveur */}
                <ServerHeader
                    project={project}
                    server={server}
                    permissions={permissions}
                    onEdit={() => setIsEditModalOpen(true)}
                    onDelete={() => setIsDeleteModalOpen(true)}
                />

                {/* Contenu principal */}
                <div className="px-6 py-8">
                    <div className="mx-auto max-w-7xl">
                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                            {/* Colonne principale - Métriques */}
                            <div className="space-y-8 lg:col-span-2">
                                {/* Aperçu des métriques */}
                                <div>
                                    <h2 className="mb-4 text-lg font-semibold text-slate-900">Métriques en temps réel</h2>
                                    <MetricsOverview metrics={server.metrics} />
                                </div>

                                {/* Informations système */}
                                <div>
                                    <h2 className="mb-4 text-lg font-semibold text-slate-900">Spécifications techniques</h2>
                                    <SystemInformation systemInfo={server.system_info} />
                                </div>

                                {/* Graphiques des métriques */}
                                <div>
                                    <h2 className="mb-4 text-lg font-semibold text-slate-900">Historique des performances</h2>
                                    <MetricsCharts project={project} server={server} />
                                </div>
                            </div>

                            {/* Colonne latérale - Configuration */}
                            <div className="space-y-6">
                                {/* Configuration du serveur */}
                                <ServerConfiguration server={server} />

                                {/* Installation de l'agent */}
                                <AgentInstallation server={server} project={project} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modales */}
                <ServerEditModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} server={server} project={project} />

                <ServerDeleteModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} server={server} project={project} />
            </div>
        </AppLayout>
    );
}
