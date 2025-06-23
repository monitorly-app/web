import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { Activity, ArrowLeft, CheckCircle, Clock, Edit, Server, Trash, Wifi } from 'lucide-react';

interface ServerHeaderProps {
    project: { id: string; name: string };
    server: {
        id: string;
        name: string;
        host: string;
        port: number;
        status: 'online' | 'offline' | 'warning' | 'error' | 'pending';
        last_seen: string | null;
    };
    permissions: {
        canManageServers: boolean;
        canDeleteServers: boolean;
    };
    onEdit: () => void;
    onDelete: () => void;
}

export default function ServerHeader({ project, server, permissions, onEdit, onDelete }: ServerHeaderProps) {
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'online':
                return <CheckCircle className="h-6 w-6 text-emerald-600" />;
            case 'warning':
                return <Activity className="h-6 w-6 text-amber-600" />;
            case 'offline':
                return <Wifi className="h-6 w-6 text-red-600" />;
            case 'error':
                return <Activity className="h-6 w-6 text-red-600" />;
            case 'pending':
                return <Clock className="h-6 w-6 text-slate-600" />;
            default:
                return <Server className="h-6 w-6 text-slate-600" />;
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'online':
                return 'default';
            case 'warning':
                return 'secondary';
            default:
                return 'destructive';
        }
    };

    const formatLastSeen = (lastSeen: string | null): string => {
        if (!lastSeen) return 'Jamais';

        const date = new Date(lastSeen);
        const now = new Date();
        const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffMinutes < 1) return "À l'instant";
        if (diffMinutes < 60) return `Il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
        if (diffMinutes < 1440) return `Il y a ${Math.floor(diffMinutes / 60)} heure${Math.floor(diffMinutes / 60) > 1 ? 's' : ''}`;
        return `Il y a ${Math.floor(diffMinutes / 1440)} jour${Math.floor(diffMinutes / 1440) > 1 ? 's' : ''}`;
    };

    return (
        <div className="border-b border-slate-200 px-6 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                    <Button variant="ghost" size="sm" asChild className="text-slate-600 hover:text-slate-900">
                        <Link href={`/projects/${project.id}/servers`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour aux serveurs
                        </Link>
                    </Button>

                    {/* <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-3">
                            {getStatusIcon(server.status)}
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">{server.name}</h1>
                                <div className="mt-1 flex items-center space-x-3">
                                    <span className="font-medium text-slate-600">
                                        {server.host}:{server.port}
                                    </span>
                                    <Badge variant={getStatusVariant(server.status)} className="capitalize">
                                        {server.status}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div> */}
                </div>

                {permissions.canManageServers && (
                    <div className="flex items-center space-x-3">
                        <Button variant="outline" size="sm" onClick={onEdit} className="text-slate-700">
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                        </Button>

                        {permissions.canDeleteServers && (
                            <Button variant="destructive" size="sm" onClick={onDelete}>
                                <Trash className="mr-2 h-4 w-4" />
                                Supprimer
                            </Button>
                        )}
                    </div>
                )}
            </div>

            <div className="mt-3 text-sm text-slate-600">Dernière connexion : {formatLastSeen(server.last_seen)}</div>
        </div>
    );
}
