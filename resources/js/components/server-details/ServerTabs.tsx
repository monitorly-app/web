import MetricsCharts from '@/components/MetricsCharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Download, Gauge, Monitor, Settings } from 'lucide-react';
import AgentInstallation from './AgentInstallation';
import MetricsOverview from './MetricsOverview';
import ServerConfiguration from './ServerConfiguration';
import SystemInformation from './SystemInformation';

interface ServerTabsProps {
    server: any;
    organization: any;
}

export default function ServerTabs({ server, organization }: ServerTabsProps) {
    // Debug - affichons les données pour s'assurer qu'elles arrivent
    console.log('ServerTabs - server:', server);
    console.log('ServerTabs - organization:', organization);

    return (
        <div className="border-border bg-card rounded-xl border shadow-sm">
            <Tabs defaultValue="overview" className="w-full">
                <div className="border-border border-b p-2">
                    <TabsList className="bg-accent grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
                        <TabsTrigger
                            value="overview"
                            className="data-[state=active]:bg-card data-[state=active]:text-card-foreground flex items-center gap-2 data-[state=active]:shadow-sm"
                        >
                            <Gauge className="h-4 w-4" />
                            <span className="hidden sm:inline">Vue d'ensemble</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="charts"
                            className="data-[state=active]:bg-card data-[state=active]:text-card-foreground flex items-center gap-2 data-[state=active]:shadow-sm"
                        >
                            <BarChart3 className="h-4 w-4" />
                            <span className="hidden sm:inline">Graphiques</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="system"
                            className="data-[state=active]:bg-card data-[state=active]:text-card-foreground flex items-center gap-2 data-[state=active]:shadow-sm"
                        >
                            <Monitor className="h-4 w-4" />
                            <span className="hidden sm:inline">Système</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="config"
                            className="data-[state=active]:bg-card data-[state=active]:text-card-foreground flex items-center gap-2 data-[state=active]:shadow-sm"
                        >
                            <Settings className="h-4 w-4" />
                            <span className="hidden sm:inline">Configuration</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="agent"
                            className="data-[state=active]:bg-card data-[state=active]:text-card-foreground flex items-center gap-2 data-[state=active]:shadow-sm"
                        >
                            <Download className="h-4 w-4" />
                            <span className="hidden sm:inline">Agent</span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="p-6">
                    {/* Vue d'ensemble - Métriques temps réel */}
                    <TabsContent value="overview" className="mt-0">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-card-foreground mb-2 text-lg font-semibold">Métriques en temps réel</h3>
                                <p className="text-muted-foreground mb-4 text-sm">Surveillance des performances système actuelles</p>
                                {server?.metrics ? (
                                    <MetricsOverview metrics={server.metrics} />
                                ) : (
                                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                                        <p className="text-amber-800 dark:text-amber-400">
                                            Aucune métrique disponible. L'agent n'est peut-être pas installé.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Graphiques historiques */}
                    <TabsContent value="charts" className="mt-0">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-card-foreground mb-2 text-lg font-semibold">Historique des performances</h3>
                                <p className="text-muted-foreground mb-4 text-sm">Évolution des métriques dans le temps</p>
                                <MetricsCharts organization={organization} server={server} />
                            </div>
                        </div>
                    </TabsContent>

                    {/* Informations système */}
                    <TabsContent value="system" className="mt-0">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-card-foreground mb-2 text-lg font-semibold">Spécifications du serveur</h3>
                                <p className="text-muted-foreground mb-4 text-sm">Configuration matérielle et logicielle détaillée</p>
                                {server?.system_info ? (
                                    <SystemInformation systemInfo={server.system_info} createdAt={server.created_at} />
                                ) : (
                                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                                        <p className="text-amber-800 dark:text-amber-400">Informations système non disponibles.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Configuration */}
                    <TabsContent value="config" className="mt-0">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-card-foreground mb-2 text-lg font-semibold">Configuration du serveur</h3>
                                <p className="text-muted-foreground mb-4 text-sm">Paramètres de connexion et détails de configuration</p>
                                <ServerConfiguration server={server} />
                            </div>
                        </div>
                    </TabsContent>

                    {/* Installation Agent */}
                    <TabsContent value="agent" className="mt-0">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-card-foreground mb-2 text-lg font-semibold">Agent de monitoring</h3>
                                <p className="text-muted-foreground mb-4 text-sm">Installation et configuration de l'agent de surveillance</p>
                                <AgentInstallation server={server} organization={organization} />
                            </div>
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
