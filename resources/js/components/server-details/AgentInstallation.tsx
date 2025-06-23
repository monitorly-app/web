import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, BookOpen, CheckCircle, Copy, Download, ExternalLink, Eye, EyeOff, PlayCircle, Terminal } from 'lucide-react';
import { useState } from 'react';

interface AgentInstallationProps {
    server: {
        id: string;
        name: string;
        host: string;
        token: string;
        agent_version: string | null;
        last_seen: string | null;
    };
    project: {
        id: string;
        name: string;
    };
}

export default function AgentInstallation({ server, project }: AgentInstallationProps) {
    const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'command' | 'script' | 'manual'>('command');
    const [showToken, setShowToken] = useState(false);
    const [copiedCommand, setCopiedCommand] = useState(false);
    const [copiedToken, setCopiedToken] = useState(false);

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

    const copyToClipboard = async (text: string, type: 'command' | 'token') => {
        try {
            await navigator.clipboard.writeText(text);
            if (type === 'command') {
                setCopiedCommand(true);
                setTimeout(() => setCopiedCommand(false), 2000);
            } else {
                setCopiedToken(true);
                setTimeout(() => setCopiedToken(false), 2000);
            }
        } catch (err) {
            console.error('Erreur lors de la copie:', err);
        }
    };

    const installCommand = `curl -sSL ${window.location.origin}/install/${server.token} | bash`;
    const apiEndpoint = `${window.location.origin}/api/projects/${project.id}/metrics`;

    const tabs = [
        {
            id: 'command',
            label: '🚀 Installation rapide',
            description: 'Installation en une commande',
        },
        {
            id: 'script',
            label: "📜 Script d'installation",
            description: 'Voir le code source',
        },
        {
            id: 'manual',
            label: '⚙️ Configuration manuelle',
            description: 'Installation personnalisée',
        },
    ];

    const installationSteps = [
        {
            number: 1,
            title: "Télécharger l'agent",
            description: "Téléchargez la dernière version de l'agent de monitoring",
            action: 'Télécharger',
        },
        {
            number: 2,
            title: 'Copier le token',
            description: "Copiez le token d'authentification pour configurer l'agent",
            action: 'Copier le token',
        },
        {
            number: 3,
            title: "Exécuter l'installation",
            description: "Lancez la commande d'installation sur votre serveur",
            action: 'Copier la commande',
        },
    ];

    return (
        <>
            <div className="flex flex-col gap-4">
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
                    <CardContent className="space-y-4">
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
            <Dialog open={isInstallModalOpen} onOpenChange={setIsInstallModalOpen}>
                <DialogContent className="bg-card border-border max-h-[90vh] max-w-4xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-card-foreground flex items-center space-x-2">
                            <Terminal className="h-5 w-5" />
                            <span>Installer l'agent de monitoring</span>
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Configurez l'agent sur <strong>{server.name}</strong> ({server.host})
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Navigation des onglets */}
                        <div className="border-border border-b">
                            <nav className="flex space-x-1">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                                            activeTab === tab.id
                                                ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
                                                : 'text-muted-foreground hover:border-border hover:text-card-foreground border-transparent'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Installation rapide */}
                        {activeTab === 'command' && (
                            <div className="space-y-6">
                                <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 dark:border-blue-800 dark:from-blue-950/50 dark:to-indigo-950/50">
                                    <h3 className="mb-3 font-semibold text-blue-900 dark:text-blue-100">Installation automatique</h3>

                                    <div className="mb-4 rounded-lg bg-slate-900 p-4 dark:bg-slate-950">
                                        <code className="font-mono text-sm break-all text-green-400">{installCommand}</code>
                                    </div>

                                    <div className="flex space-x-3">
                                        <Button onClick={() => copyToClipboard(installCommand, 'command')} className="flex items-center space-x-2">
                                            <Copy className="h-4 w-4" />
                                            <span>{copiedCommand ? 'Copié !' : 'Copier la commande'}</span>
                                        </Button>
                                        <Button variant="outline" onClick={() => setActiveTab('script')} className="flex items-center space-x-2">
                                            <Eye className="h-4 w-4" />
                                            <span>Voir le script</span>
                                        </Button>
                                    </div>
                                </div>

                                {/* Étapes d'installation */}
                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                                    {installationSteps.map((step, index) => (
                                        <div key={step.number} className="border-border bg-card rounded-xl border p-6 transition-all hover:shadow-sm">
                                            <div className="mb-4 flex items-center space-x-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                                    {step.number}
                                                </div>
                                                <h3 className="text-card-foreground text-base font-semibold">{step.title}</h3>
                                            </div>

                                            <p className="text-muted-foreground mb-4 text-sm">{step.description}</p>

                                            {step.number === 1 && (
                                                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                                                    <Download className="mr-2 h-4 w-4" />
                                                    {step.action}
                                                </Button>
                                            )}

                                            {step.number === 2 && (
                                                <Button variant="outline" className="w-full" onClick={() => copyToClipboard(server.token, 'token')}>
                                                    {copiedToken ? (
                                                        <>
                                                            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                                            Copié !
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="mr-2 h-4 w-4" />
                                                            {step.action}
                                                        </>
                                                    )}
                                                </Button>
                                            )}

                                            {step.number === 3 && (
                                                <Button
                                                    variant="outline"
                                                    className="w-full"
                                                    onClick={() => copyToClipboard(installCommand, 'command')}
                                                >
                                                    {copiedCommand ? (
                                                        <>
                                                            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                                            Copié !
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="mr-2 h-4 w-4" />
                                                            {step.action}
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Script source */}
                        {activeTab === 'script' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-card-foreground font-semibold">Code source du script d'installation</h3>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(`${window.location.origin}/install/${server.token}`, '_blank')}
                                        className="flex items-center space-x-2"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                        <span>Ouvrir dans un nouvel onglet</span>
                                    </Button>
                                </div>

                                <div className="border-border overflow-hidden rounded-lg border">
                                    <iframe
                                        src={`${window.location.origin}/install/${server.token}`}
                                        className="h-96 w-full bg-slate-900 dark:bg-slate-950"
                                        style={{
                                            fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace',
                                            fontSize: '12px',
                                        }}
                                    />
                                </div>

                                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/50">
                                    <div className="flex items-start space-x-2">
                                        <CheckCircle className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        <div className="text-sm text-blue-800 dark:text-blue-200">
                                            <strong>Sécurité :</strong> Ce script est généré dynamiquement pour votre serveur et inclut vos
                                            identifiants spécifiques. Vous pouvez examiner tout le code avant de l'exécuter.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Configuration manuelle */}
                        {activeTab === 'manual' && (
                            <div className="space-y-6">
                                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950/50">
                                    <h3 className="mb-2 font-semibold text-orange-900 dark:text-orange-100">Configuration manuelle</h3>
                                    <p className="text-sm text-orange-800 dark:text-orange-200">
                                        Pour les utilisateurs avancés qui préfèrent une installation personnalisée.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-card-foreground font-medium">Point de terminaison API</Label>
                                        <div className="flex space-x-2">
                                            <Input value={apiEndpoint} readOnly className="bg-muted font-mono text-xs" />
                                            <Button variant="outline" size="sm" onClick={() => copyToClipboard(apiEndpoint, 'command')}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-card-foreground font-medium">ID du projet</Label>
                                        <div className="flex space-x-2">
                                            <Input value={project.id} readOnly className="bg-muted font-mono text-xs" />
                                            <Button variant="outline" size="sm" onClick={() => copyToClipboard(project.id, 'command')}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-card-foreground font-medium">Token du serveur</Label>
                                        <div className="flex space-x-2">
                                            <Input
                                                value={showToken ? server.token : '•'.repeat(32)}
                                                readOnly
                                                className="bg-muted font-mono text-xs"
                                            />
                                            <Button variant="outline" size="sm" onClick={() => setShowToken(!showToken)}>
                                                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                            {showToken && (
                                                <Button variant="outline" size="sm" onClick={() => copyToClipboard(server.token, 'token')}>
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-muted rounded-lg p-6">
                                    <h4 className="text-card-foreground mb-4 font-semibold">Étapes d'installation manuelle</h4>
                                    <ol className="space-y-3 text-sm">
                                        <li className="flex items-start space-x-3">
                                            <span className="bg-muted-foreground/20 text-card-foreground flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold">
                                                1
                                            </span>
                                            <div>
                                                <strong className="text-card-foreground">Télécharger l'agent :</strong>
                                                <code className="bg-muted-foreground/10 text-card-foreground mt-1 block rounded px-2 py-1 text-xs">
                                                    curl -sSL https://github.com/monitoring-app/agent/releases/latest/download/install.sh | bash
                                                </code>
                                            </div>
                                        </li>
                                        <li className="flex items-start space-x-3">
                                            <span className="bg-muted-foreground/20 text-card-foreground flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold">
                                                2
                                            </span>
                                            <div>
                                                <strong className="text-card-foreground">Configurer l'agent :</strong>
                                                <code className="bg-muted-foreground/10 text-card-foreground mt-1 block rounded px-2 py-1 text-xs">
                                                    sudo nano /etc/monitoring-agent/config.yaml
                                                </code>
                                            </div>
                                        </li>
                                        <li className="flex items-start space-x-3">
                                            <span className="bg-muted-foreground/20 text-card-foreground flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold">
                                                3
                                            </span>
                                            <span className="text-card-foreground">
                                                <strong>Ajouter les paramètres API</strong> avec les valeurs ci-dessus
                                            </span>
                                        </li>
                                        <li className="flex items-start space-x-3">
                                            <span className="bg-muted-foreground/20 text-card-foreground flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold">
                                                4
                                            </span>
                                            <div>
                                                <strong className="text-card-foreground">Redémarrer le service :</strong>
                                                <code className="bg-muted-foreground/10 text-card-foreground mt-1 block rounded px-2 py-1 text-xs">
                                                    sudo systemctl restart monitoring-agent
                                                </code>
                                            </div>
                                        </li>
                                    </ol>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="border-border flex justify-end border-t pt-4">
                        <Button variant="outline" onClick={() => setIsInstallModalOpen(false)}>
                            Fermer
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
