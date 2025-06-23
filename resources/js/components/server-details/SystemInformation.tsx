import { Calendar, Cpu, HardDrive, MemoryStick, Monitor, Server, Terminal } from 'lucide-react';

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

interface SystemInformationProps {
    systemInfo: SystemInfo;
    createdAt: string;
}

export default function SystemInformation({ systemInfo, createdAt }: SystemInformationProps) {
    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
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

    const systemSpecs = [
        {
            label: "Système d'exploitation",
            value: systemInfo.os || 'Non disponible',
            icon: Monitor,
            color: 'blue',
        },
        {
            label: 'Version du noyau',
            value: systemInfo.kernel || 'Non disponible',
            icon: Terminal,
            color: 'green',
        },
        {
            label: "Nom d'hôte",
            value: systemInfo.hostname || 'Non disponible',
            icon: Server,
            color: 'purple',
        },
        {
            label: 'Processeur',
            value: systemInfo.cpu_model || 'Non disponible',
            icon: Cpu,
            color: 'orange',
        },
        {
            label: 'Nombre de cœurs',
            value: systemInfo.cpu_cores ? `${systemInfo.cpu_cores} cœurs` : 'Non disponible',
            icon: Cpu,
            color: 'orange',
        },
        {
            label: 'Mémoire totale',
            value: systemInfo.total_memory_formatted || formatBytes(systemInfo.total_memory || 0),
            icon: MemoryStick,
            color: 'indigo',
        },
        {
            label: 'Stockage total',
            value: systemInfo.total_disk_formatted || formatBytes(systemInfo.total_disk || 0),
            icon: HardDrive,
            color: 'pink',
        },
        {
            label: "Date d'ajout",
            value: formatDate(createdAt),
            icon: Calendar,
            color: 'gray',
        },
    ];

    const getIconColors = (color: string) => {
        const colors = {
            blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
            green: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
            purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
            orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
            indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
            pink: 'bg-pink-100 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400',
            gray: 'bg-muted text-muted-foreground',
        };
        return colors[color as keyof typeof colors] || colors.gray;
    };

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="flex items-center space-x-3">
                <div className="bg-muted rounded-lg p-2">
                    <Monitor className="text-muted-foreground h-6 w-6" />
                </div>
                <div>
                    <h2 className="text-card-foreground text-lg font-semibold">Informations système</h2>
                    <p className="text-muted-foreground text-sm">Spécifications techniques du serveur</p>
                </div>
            </div>

            {/* Grid des spécifications */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {systemSpecs.map((spec) => {
                    const Icon = spec.icon;
                    return (
                        <div key={spec.label} className="bg-card border-border rounded-xl border p-6 transition-all hover:shadow-sm">
                            <div className="flex items-start space-x-4">
                                <div className={`rounded-lg p-3 ${getIconColors(spec.color)}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-card-foreground mb-1 text-sm font-medium">{spec.label}</p>
                                    <p className="text-muted-foreground text-sm break-all">{spec.value}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Section récapitulatif */}
            <div className="from-muted/50 to-muted border-border rounded-xl border bg-gradient-to-r p-6">
                <div className="mb-4 flex items-center space-x-3">
                    <div className="bg-card border-border rounded-lg border p-2 shadow-sm">
                        <Server className="text-card-foreground h-5 w-5" />
                    </div>
                    <h3 className="text-card-foreground text-base font-semibold">Résumé de la configuration</h3>
                </div>

                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                    <div className="bg-card border-border rounded-lg border p-4 shadow-sm">
                        <p className="text-muted-foreground mb-1">Plateforme</p>
                        <p className="text-card-foreground font-medium">{systemInfo.os || 'N/A'}</p>
                    </div>
                    <div className="bg-card border-border rounded-lg border p-4 shadow-sm">
                        <p className="text-muted-foreground mb-1">Ressources CPU</p>
                        <p className="text-card-foreground font-medium">{systemInfo.cpu_cores || 0} cœurs</p>
                    </div>
                    <div className="bg-card border-border rounded-lg border p-4 shadow-sm">
                        <p className="text-muted-foreground mb-1">Mémoire disponible</p>
                        <p className="text-card-foreground font-medium">
                            {systemInfo.total_memory_formatted || formatBytes(systemInfo.total_memory || 0)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
