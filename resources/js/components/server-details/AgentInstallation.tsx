import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, BookOpen, CheckCircle, Download, PlayCircle, Terminal } from 'lucide-react';
import { useState } from 'react';
import AgentInstallationModal from './AgentInstallationModal';

interface AgentInstallationProps {
    server: {
        id: string;
        name: string;
        host: string;
        token: string;
        agent_version: string | null;
        last_seen: string | null;
    };
    organization: {
        id: string;
        name: string;
    };
}

export default function AgentInstallation({ server, organization }: AgentInstallationProps) {
    const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

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
        <>
            <div className="flex flex-col gap-6">
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-card-foreground flex items-center space-x-2">
                            <Terminal className="h-5 w-5" />
                            <span>Agent de monitoring</span>
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Installez l'agent pour commencer la collecte des métriques
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Statut de l'installation */}
                        <div className="bg-muted flex items-center justify-between rounded-lg p-4">
                            <div className="flex items-center space-x-3">
                                {server.agent_version ? (
                                    <>
                                        <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                        <div>
                                            <p className="font-medium text-emerald-900 dark:text-emerald-100">Agent installé</p>
                                            <p className="text-sm text-emerald-700 dark:text-emerald-300">
                                                Version {server.agent_version} • {formatLastSeen(server.last_seen)}
                                            </p>
                                        </div>
                                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">Actif</Badge>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                        <div>
                                            <p className="font-medium text-amber-900 dark:text-amber-100">Agent non installé</p>
                                            <p className="text-sm text-amber-700 dark:text-amber-300">Aucune donnée reçue depuis ce serveur</p>
                                        </div>
                                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">En attente</Badge>
                                    </>
                                )}
                            </div>

                            <Button
                                onClick={() => setIsInstallModalOpen(true)}
                                variant={server.agent_version ? 'outline' : 'default'}
                                className="flex items-center space-x-2"
                            >
                                <Download className="h-4 w-4" />
                                <span>{server.agent_version ? 'Réinstaller' : "Installer l'agent"}</span>
                            </Button>
                        </div>

                        {/* Informations rapides */}
                        {server.agent_version && (
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-card-foreground font-medium">Version de l'agent</p>
                                    <p className="text-muted-foreground">v{server.agent_version}</p>
                                </div>
                                <div>
                                    <p className="text-card-foreground font-medium">Dernière activité</p>
                                    <p className="text-muted-foreground">{formatLastSeen(server.last_seen)}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Documentation et aide */}
                <div className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 dark:border-indigo-800 dark:from-indigo-950/50 dark:to-purple-950/50">
                    <div className="mb-4 flex items-center space-x-3">
                        <div className="rounded-lg bg-indigo-100 p-2 dark:bg-indigo-900/30">
                            <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-card-foreground text-base font-semibold">Besoin d'aide ?</h3>
                            <p className="text-muted-foreground text-sm">Ressources et documentation pour l'installation</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="bg-card rounded-lg border border-indigo-200 p-4 dark:border-indigo-800">
                            <div className="mb-2 flex items-center space-x-2">
                                <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                <span className="text-card-foreground text-sm font-medium">Documentation</span>
                            </div>
                            <p className="text-muted-foreground mb-3 text-xs">Guide détaillé d'installation et de configuration</p>
                            <Button
                                size="sm"
                                variant="outline"
                                className="w-full border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-950/50"
                            >
                                Consulter la documentation
                            </Button>
                        </div>

                        <div className="bg-card rounded-lg border border-indigo-200 p-4 dark:border-indigo-800">
                            <div className="mb-2 flex items-center space-x-2">
                                <PlayCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                <span className="text-card-foreground text-sm font-medium">Tutoriel vidéo</span>
                            </div>
                            <p className="text-muted-foreground mb-3 text-xs">Installation pas à pas en vidéo</p>
                            <Button
                                size="sm"
                                variant="outline"
                                className="w-full border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-950/50"
                            >
                                Voir le tutoriel
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal d'installation */}
            <AgentInstallationModal
                isOpen={isInstallModalOpen}
                onClose={() => setIsInstallModalOpen(false)}
                server={server}
                organization={organization}
            />
        </>
    );
}
