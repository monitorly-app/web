import { Clock, Globe, KeyRound, Settings, Wifi } from 'lucide-react';

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
    created_at: string;
}

interface ServerConfigurationProps {
    server: ServerData;
}

export default function ServerConfiguration({ server }: ServerConfigurationProps) {
    // Valeurs par défaut si server est undefined ou incomplet
    const safeServer = {
        id: server?.id ?? 'N/A',
        name: server?.name ?? 'Serveur sans nom',
        host: server?.host ?? 'N/A',
        port: server?.port ?? 0,
        description: server?.description ?? null,
        status: server?.status ?? 'pending',
        last_seen: server?.last_seen ?? null,
        agent_version: server?.agent_version ?? null,
        token: server?.token ?? '',
        created_at: server?.created_at ?? new Date().toISOString(),
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusConfig = (status: string) => {
        const configs = {
            online: {
                label: 'En ligne',
                color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
            },
            offline: {
                label: 'Hors ligne',
                color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
            },
            warning: {
                label: 'Attention',
                color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
            },
            error: { label: 'Erreur', color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' },
            pending: { label: 'En attente', color: 'bg-muted text-muted-foreground border-border' },
        };
        return configs[status as keyof typeof configs] || configs.pending;
    };

    const configSections = [
        {
            title: 'Connexion réseau',
            icon: Wifi,
            color: 'blue',
            items: [
                { label: "Adresse d'hôte", value: safeServer.host },
                { label: 'Port', value: safeServer.port.toString() },
                {
                    label: 'Dernière connexion',
                    value: safeServer.last_seen ? formatDate(safeServer.last_seen) : 'Jamais connecté',
                },
            ],
        },
        {
            title: 'Configuration générale',
            icon: Settings,
            color: 'gray',
            items: [
                { label: 'Nom du serveur', value: safeServer.name },
                { label: 'Description', value: safeServer.description || 'Aucune description' },
                { label: 'Date de création', value: formatDate(safeServer.created_at) },
            ],
        },
    ];

    const getIconColors = (color: string) => {
        const colors = {
            blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
            gray: 'bg-muted text-muted-foreground',
            green: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
            purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
            orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
        };
        return colors[color as keyof typeof colors] || colors.gray;
    };

    const statusConfig = getStatusConfig(safeServer.status);

    return (
        <div className="space-y-6">
            {/* En-tête avec statut */}
            <div className="bg-card border-border rounded-xl border p-6">
                <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="bg-muted rounded-lg p-2">
                            <Settings className="text-muted-foreground h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-card-foreground text-lg font-semibold">Configuration du serveur</h2>
                            <p className="text-muted-foreground text-sm">Paramètres et état de connexion</p>
                        </div>
                    </div>
                    <div className={`rounded-full border px-3 py-1 text-sm font-medium ${statusConfig.color}`}>{statusConfig.label}</div>
                </div>

                {/* Informations principales */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="bg-muted rounded-lg p-4">
                        <div className="mb-2 flex items-center space-x-2">
                            <Globe className="text-muted-foreground h-4 w-4" />
                            <span className="text-card-foreground text-sm font-medium">Endpoint</span>
                        </div>
                        <p className="text-card-foreground font-mono text-sm">
                            {safeServer.host}:{safeServer.port}
                        </p>
                    </div>

                    <div className="bg-muted rounded-lg p-4">
                        <div className="mb-2 flex items-center space-x-2">
                            <KeyRound className="text-muted-foreground h-4 w-4" />
                            <span className="text-card-foreground text-sm font-medium">Identifiant</span>
                        </div>
                        <p className="text-card-foreground font-mono text-sm">{safeServer.id}</p>
                    </div>

                    <div className="bg-muted rounded-lg p-4">
                        <div className="mb-2 flex items-center space-x-2">
                            <Clock className="text-muted-foreground h-4 w-4" />
                            <span className="text-card-foreground text-sm font-medium">Créé le</span>
                        </div>
                        <p className="text-card-foreground text-sm">{formatDate(safeServer.created_at)}</p>
                    </div>
                </div>
            </div>

            {/* Sections de configuration */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {configSections.map((section) => {
                    const Icon = section.icon;
                    return (
                        <div key={section.title} className="bg-card border-border rounded-xl border p-6 transition-all hover:shadow-sm">
                            <div className="mb-4 flex items-center space-x-3">
                                <div className={`rounded-lg p-2 ${getIconColors(section.color)}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <h3 className="text-card-foreground text-base font-semibold">{section.title}</h3>
                            </div>

                            <div className="space-y-3">
                                {section.items.map((item) => (
                                    <div key={item.label} className="flex items-start justify-between">
                                        <span className="text-muted-foreground w-1/2 flex-shrink-0 text-sm">{item.label}</span>
                                        <span className="text-card-foreground text-right text-sm font-medium break-all">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
