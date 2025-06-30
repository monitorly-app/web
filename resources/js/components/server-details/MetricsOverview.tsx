import { Clock, Cpu, HardDrive, MemoryStick, Network, Users, Zap } from 'lucide-react';
import { Progress } from '../ui/progress';

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

interface MetricsOverviewProps {
    metrics: ServerMetrics;
}

export default function MetricsOverview({ metrics }: MetricsOverviewProps) {
    // Valeurs par défaut si metrics est undefined ou incomplet
    const safeMetrics = {
        cpu_usage: metrics?.cpu_usage ?? 0,
        memory_usage: metrics?.memory_usage ?? 0,
        disk_usage: metrics?.disk_usage ?? 0,
        network_in: metrics?.network_in ?? 0,
        network_out: metrics?.network_out ?? 0,
        uptime: metrics?.uptime ?? 0,
        load_average: metrics?.load_average ?? [0, 0, 0],
        processes_count: metrics?.processes_count ?? 0,
        connections_count: metrics?.connections_count ?? 0,
    };

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const formatUptime = (seconds: number): string => {
        if (seconds === 0) return 'N/A';

        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        let result = '';
        if (days > 0) result += `${days}j `;
        if (hours > 0) result += `${hours}h `;
        if (minutes > 0 && days === 0) result += `${minutes}m`;

        return result.trim() || "Moins d'une minute";
    };

    const getUsageColor = (usage: number): string => {
        if (usage >= 90) return 'text-red-600 dark:text-red-400';
        if (usage >= 75) return 'text-amber-600 dark:text-amber-400';
        return 'text-emerald-600 dark:text-emerald-400';
    };

    const getBgColor = (usage: number): string => {
        if (usage >= 90) return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
        if (usage >= 75) return 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800';
        return 'bg-card border-border';
    };

    const getIconBgColor = (usage: number): string => {
        if (usage >= 90) return 'bg-red-100 dark:bg-red-900/30';
        if (usage >= 75) return 'bg-amber-100 dark:bg-amber-900/30';
        return 'bg-muted';
    };

    const metricCards = [
        {
            title: 'Processeur',
            value: `${safeMetrics.cpu_usage.toFixed(1)}%`,
            icon: Cpu,
            usage: safeMetrics.cpu_usage,
            description: 'Utilisation CPU',
        },
        {
            title: 'Mémoire',
            value: `${safeMetrics.memory_usage.toFixed(1)}%`,
            icon: MemoryStick,
            usage: safeMetrics.memory_usage,
            description: 'RAM utilisée',
        },
        {
            title: 'Disque',
            value: `${safeMetrics.disk_usage.toFixed(1)}%`,
            icon: HardDrive,
            usage: safeMetrics.disk_usage,
            description: 'Stockage utilisé',
        },
        {
            title: 'Temps de fonctionnement',
            value: formatUptime(safeMetrics.uptime),
            icon: Clock,
            usage: 0,
            description: "Durée d'activité",
            hideProgress: true,
        },
    ];

    return (
        <div className="space-y-8">
            {/* Métriques principales en grid moderne */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {metricCards.map((metric) => {
                    const Icon = metric.icon;
                    return (
                        <div key={metric.title} className={`rounded-xl border p-6 ${getBgColor(metric.usage)} transition-all hover:shadow-sm`}>
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className={`rounded-lg p-2 ${getIconBgColor(metric.usage)}`}>
                                        <Icon className={`h-5 w-5 ${getUsageColor(metric.usage)}`} />
                                    </div>
                                    <div>
                                        <h3 className="text-card-foreground text-sm font-medium">{metric.title}</h3>
                                        <p className="text-muted-foreground text-xs">{metric.description}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-3">
                                <p className={`text-2xl font-bold ${getUsageColor(metric.usage)}`}>{metric.value}</p>
                            </div>

                            {!metric.hideProgress && (
                                <div className="space-y-2">
                                    <Progress value={metric.usage} className="h-2" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Métriques détaillées avec cards modernes */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Charge système */}
                <div className="bg-card border-border rounded-xl border p-6 transition-all hover:shadow-sm">
                    <div className="mb-4 flex items-center space-x-3">
                        <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/20">
                            <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-card-foreground text-sm font-medium">Charge système</h3>
                            <p className="text-muted-foreground text-xs">Load average</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">1 min</span>
                            <span className="text-card-foreground font-medium">{safeMetrics.load_average[0]?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">5 min</span>
                            <span className="text-card-foreground font-medium">{safeMetrics.load_average[1]?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">15 min</span>
                            <span className="text-card-foreground font-medium">{safeMetrics.load_average[2]?.toFixed(2) || '0.00'}</span>
                        </div>
                    </div>
                </div>

                {/* Réseau */}
                <div className="bg-card border-border rounded-xl border p-6 transition-all hover:shadow-sm">
                    <div className="mb-4 flex items-center space-x-3">
                        <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/20">
                            <Network className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-card-foreground text-sm font-medium">Trafic réseau</h3>
                            <p className="text-muted-foreground text-xs">Entrée / Sortie</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Entrant</span>
                            <span className="text-card-foreground font-medium">{formatBytes(safeMetrics.network_in)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Sortant</span>
                            <span className="text-card-foreground font-medium">{formatBytes(safeMetrics.network_out)}</span>
                        </div>
                    </div>
                </div>

                {/* Processus */}
                <div className="bg-card border-border rounded-xl border p-6 transition-all hover:shadow-sm">
                    <div className="mb-4 flex items-center space-x-3">
                        <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/20">
                            <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-card-foreground text-sm font-medium">Processus</h3>
                            <p className="text-muted-foreground text-xs">Activité système</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">En cours</span>
                            <span className="text-card-foreground font-medium">{safeMetrics.processes_count}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Connexions</span>
                            <span className="text-card-foreground font-medium">{safeMetrics.connections_count}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
