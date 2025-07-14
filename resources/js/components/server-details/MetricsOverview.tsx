import { Cpu, HardDrive, MemoryStick, Shield, UserCheck, AlertTriangle, Wifi } from 'lucide-react';
import { Progress } from '../ui/progress';

interface Service {
    name: string;
    label: string;
    status: string;
    running: boolean;
}

interface ServerMetrics {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    services: Service[];
    user_activity: any[];
    login_failures: any[];
    ports: any[];
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
        services: metrics?.services ?? [],
        user_activity: metrics?.user_activity ?? [],
        login_failures: metrics?.login_failures ?? [],
        ports: metrics?.ports ?? [],
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

    const getServiceStatusSummary = () => {
        const activeServices = safeMetrics.services.filter(service => service.running).length;
        const totalServices = safeMetrics.services.length;
        return { active: activeServices, total: totalServices };
    };

    const servicesSummary = getServiceStatusSummary();

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
            title: 'Services',
            value: `${servicesSummary.active}/${servicesSummary.total}`,
            icon: Shield,
            usage: servicesSummary.total > 0 ? (servicesSummary.active / servicesSummary.total) * 100 : 100,
            description: 'Services actifs',
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

            {/* Services détaillés */}
            {safeMetrics.services.length > 0 && (
                <div className="bg-card border-border rounded-xl border p-6">
                    <div className="mb-4 flex items-center space-x-3">
                        <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/20">
                            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-card-foreground text-sm font-medium">État des services</h3>
                            <p className="text-muted-foreground text-xs">Services surveillés</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {safeMetrics.services.map((service, index) => (
                            <div key={index} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                                <div className="flex items-center space-x-2">
                                    <div className={`h-2 w-2 rounded-full ${service.running ? 'bg-green-500' : 'bg-red-500'}`} />
                                    <span className="text-sm font-medium">{service.label || service.name}</span>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${service.running ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}>
                                    {service.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Nouvelles métriques PROBE.md en grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Activité utilisateurs */}
                <div className="bg-card border-border rounded-xl border p-6 transition-all hover:shadow-sm">
                    <div className="mb-4 flex items-center space-x-3">
                        <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/20">
                            <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-card-foreground text-sm font-medium">Activité utilisateurs</h3>
                            <p className="text-muted-foreground text-xs">Sessions actives</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Utilisateurs connectés</span>
                            <span className="text-card-foreground font-medium">{safeMetrics.user_activity.length}</span>
                        </div>
                        {safeMetrics.user_activity.slice(0, 3).map((user, index) => (
                            <div key={index} className="flex justify-between text-xs">
                                <span className="text-muted-foreground">{user.username || user.user || 'Unknown'}</span>
                                <span className="text-card-foreground">{user.terminal || user.tty || '-'}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tentatives de connexion échouées */}
                <div className="bg-card border-border rounded-xl border p-6 transition-all hover:shadow-sm">
                    <div className="mb-4 flex items-center space-x-3">
                        <div className="rounded-lg bg-red-100 p-2 dark:bg-red-900/20">
                            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <h3 className="text-card-foreground text-sm font-medium">Échecs de connexion</h3>
                            <p className="text-muted-foreground text-xs">Tentatives récentes</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Échecs récents</span>
                            <span className="text-card-foreground font-medium">{safeMetrics.login_failures.length}</span>
                        </div>
                        {safeMetrics.login_failures.slice(0, 3).map((failure, index) => (
                            <div key={index} className="flex justify-between text-xs">
                                <span className="text-muted-foreground">{failure.username || failure.user || 'Unknown'}</span>
                                <span className="text-red-600 dark:text-red-400">{failure.ip || failure.source || '-'}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Ports ouverts */}
                <div className="bg-card border-border rounded-xl border p-6 transition-all hover:shadow-sm">
                    <div className="mb-4 flex items-center space-x-3">
                        <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/20">
                            <Wifi className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-card-foreground text-sm font-medium">Ports ouverts</h3>
                            <p className="text-muted-foreground text-xs">Services en écoute</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Ports actifs</span>
                            <span className="text-card-foreground font-medium">{safeMetrics.ports.length}</span>
                        </div>
                        {safeMetrics.ports.slice(0, 3).map((port, index) => (
                            <div key={index} className="flex justify-between text-xs">
                                <span className="text-muted-foreground">{port.port || port.number || 'Unknown'}</span>
                                <span className="text-card-foreground">{port.service || port.name || port.protocol || '-'}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
