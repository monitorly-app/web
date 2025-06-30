import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Copy, Download, ExternalLink, Eye, EyeOff, Loader2, Terminal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface AgentInstallationModalProps {
    isOpen: boolean;
    onClose: () => void;
    server: {
        id: string;
        name: string;
        host: string;
        token: string;
    };
    organization: {
        id: string;
        name: string;
    };
}

export default function AgentInstallationModal({ isOpen, onClose, server, organization }: AgentInstallationModalProps) {
    const [activeTab, setActiveTab] = useState<'command' | 'script' | 'manual'>('command');
    const [showToken, setShowToken] = useState(false);
    const [copiedCommand, setCopiedCommand] = useState(false);
    const [copiedToken, setCopiedToken] = useState(false);
    const [scriptContent, setScriptContent] = useState<string>('');
    const [loadingScript, setLoadingScript] = useState(false);

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

    const fetchScriptContent = async () => {
        if (scriptContent) return; // Déjà chargé

        setLoadingScript(true);
        try {
            const response = await fetch(`${window.location.origin}/install/${server.token}`);
            if (response.ok) {
                const content = await response.text();
                setScriptContent(content);
            } else {
                setScriptContent('# Erreur lors du chargement du script\necho "Impossible de charger le script d\'installation"');
            }
        } catch (error) {
            console.error('Erreur lors du chargement du script:', error);
            setScriptContent('# Erreur lors du chargement du script\necho "Impossible de charger le script d\'installation"');
        } finally {
            setLoadingScript(false);
        }
    };

    // Charger le script quand on ouvre l'onglet script
    useEffect(() => {
        if (activeTab === 'script' && isOpen) {
            fetchScriptContent();
        }
    }, [activeTab, isOpen]);

    const installCommand = `curl -sSL ${window.location.origin}/install/${server.token} | bash`;
    const apiEndpoint = `${window.location.origin}/api/organizations/${organization.id}/metrics`;

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
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="bg-card border-border max-h-[95vh] w-[90vw] max-w-none overflow-y-auto"
                style={{ width: '90vw', maxWidth: '1400px' }}
            >
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
                                    className={`border-b-2 px-6 py-3 text-sm font-medium transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
                                            : 'text-muted-foreground hover:border-border hover:text-card-foreground border-transparent'
                                    }`}
                                >
                                    <div className="text-center">
                                        <div className="font-medium">{tab.label}</div>
                                        <div className="text-xs opacity-75">{tab.description}</div>
                                    </div>
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Installation rapide */}
                    {activeTab === 'command' && (
                        <div className="space-y-8">
                            <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 dark:border-blue-800 dark:from-blue-950/50 dark:to-indigo-950/50">
                                <h3 className="mb-4 text-lg font-semibold text-blue-900 dark:text-blue-100">Installation automatique</h3>

                                <div className="mb-6 rounded-lg bg-slate-900 p-4 dark:bg-slate-950">
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

                            {/* Étapes d'installation - Mise en page améliorée */}
                            <div>
                                <h3 className="text-card-foreground mb-6 text-lg font-semibold">Étapes d'installation</h3>
                                <div className="space-y-6">
                                    {installationSteps.map((step, index) => (
                                        <div
                                            key={step.number}
                                            className="border-border bg-card flex items-start space-x-6 rounded-xl border p-6 transition-all hover:shadow-sm"
                                        >
                                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-base font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                                {step.number}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <h4 className="text-card-foreground mb-2 text-base font-semibold">{step.title}</h4>
                                                <p className="text-muted-foreground mb-4 text-sm">{step.description}</p>
                                            </div>

                                            <div className="w-40 flex-shrink-0">
                                                {step.number === 1 && (
                                                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                                                        <Download className="mr-2 h-4 w-4" />
                                                        {step.action}
                                                    </Button>
                                                )}

                                                {step.number === 2 && (
                                                    <Button
                                                        variant="outline"
                                                        className="w-full"
                                                        onClick={() => copyToClipboard(server.token, 'token')}
                                                    >
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
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Script source avec coloration syntaxique */}
                    {activeTab === 'script' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-card-foreground text-lg font-semibold">Code source du script d'installation</h3>
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

                            {/* Terminal-style code viewer */}
                            <div className="border-border overflow-hidden rounded-lg border shadow-lg">
                                <div className="bg-slate-900 dark:bg-slate-950">
                                    {/* Terminal header */}
                                    <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
                                        <div className="flex items-center space-x-2">
                                            <div className="h-3 w-3 rounded-full bg-red-500"></div>
                                            <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                                            <div className="h-3 w-3 rounded-full bg-green-500"></div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <span className="font-mono text-sm text-slate-400">install.sh</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => copyToClipboard(scriptContent || installCommand, 'command')}
                                                className="h-6 px-2 text-slate-400 hover:text-white"
                                                disabled={!scriptContent}
                                            >
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Code content */}
                                    <div className="relative h-96 w-96">
                                        {loadingScript ? (
                                            <div className="flex h-96 items-center justify-center bg-slate-900 dark:bg-slate-950">
                                                <div className="flex flex-col items-center space-y-3">
                                                    <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                                                    <span className="text-sm text-slate-400">Chargement du script...</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="max-h-96 w-full overflow-auto">
                                                <SyntaxHighlighter
                                                    language="bash"
                                                    style={{
                                                        ...oneDark,
                                                        'code[class*="language-"]': {
                                                            ...oneDark['code[class*="language-"]'],
                                                            background: 'transparent',
                                                            textShadow: 'none',
                                                        },
                                                        'pre[class*="language-"]': {
                                                            ...oneDark['pre[class*="language-"]'],
                                                            background: 'transparent',
                                                            textShadow: 'none',
                                                        },
                                                    }}
                                                    customStyle={{
                                                        fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace',
                                                        fontSize: '13px',
                                                        lineHeight: '1.5',
                                                        margin: 0,
                                                        padding: '1rem',
                                                        background: 'transparent',
                                                        textShadow: 'none',
                                                        width: '100%',
                                                        maxWidth: '100%',
                                                        overflow: 'auto',
                                                    }}
                                                    showLineNumbers={true}
                                                    wrapLines={true}
                                                    wrapLongLines={true}
                                                >
                                                    {scriptContent}
                                                </SyntaxHighlighter>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/50">
                                <div className="flex items-start space-x-3">
                                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                                    <div className="text-sm text-blue-800 dark:text-blue-200">
                                        <strong>Sécurité :</strong> Ce script est généré dynamiquement pour votre serveur et inclut vos identifiants
                                        spécifiques. Vous pouvez examiner tout le code avant de l'exécuter.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Configuration manuelle */}
                    {activeTab === 'manual' && (
                        <div className="space-y-6">
                            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950/50">
                                <h3 className="mb-2 text-lg font-semibold text-orange-900 dark:text-orange-100">Configuration manuelle</h3>
                                <p className="text-sm text-orange-800 dark:text-orange-200">
                                    Pour les utilisateurs avancés qui préfèrent une installation personnalisée.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-3">
                                    <Label className="text-card-foreground text-sm font-medium">Point de terminaison API</Label>
                                    <div className="flex space-x-2">
                                        <Input value={apiEndpoint} readOnly className="bg-muted font-mono text-sm" />
                                        <Button variant="outline" size="sm" onClick={() => copyToClipboard(apiEndpoint, 'command')}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-card-foreground text-sm font-medium">ID de l'organisation</Label>
                                    <div className="flex space-x-2">
                                        <Input value={organization.id} readOnly className="bg-muted font-mono text-sm" />
                                        <Button variant="outline" size="sm" onClick={() => copyToClipboard(organization.id, 'command')}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-card-foreground text-sm font-medium">Token du serveur</Label>
                                    <div className="flex space-x-2">
                                        <Input value={showToken ? server.token : '•'.repeat(32)} readOnly className="bg-muted font-mono text-sm" />
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
                                <ol className="space-y-4 text-sm">
                                    <li className="flex items-start space-x-4">
                                        <span className="bg-muted-foreground/20 text-card-foreground flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold">
                                            1
                                        </span>
                                        <div className="flex-1">
                                            <strong className="text-card-foreground mb-2 block">Télécharger l'agent :</strong>
                                            <code className="bg-muted-foreground/10 text-card-foreground block rounded px-3 py-2 text-sm">
                                                curl -sSL https://github.com/monitoring-app/agent/releases/latest/download/install.sh | bash
                                            </code>
                                        </div>
                                    </li>
                                    <li className="flex items-start space-x-4">
                                        <span className="bg-muted-foreground/20 text-card-foreground flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold">
                                            2
                                        </span>
                                        <div className="flex-1">
                                            <strong className="text-card-foreground mb-2 block">Configurer l'agent :</strong>
                                            <code className="bg-muted-foreground/10 text-card-foreground block rounded px-3 py-2 text-sm">
                                                sudo nano /etc/monitoring-agent/config.yaml
                                            </code>
                                        </div>
                                    </li>
                                    <li className="flex items-start space-x-4">
                                        <span className="bg-muted-foreground/20 text-card-foreground flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold">
                                            3
                                        </span>
                                        <div className="flex-1">
                                            <strong className="text-card-foreground">Ajouter les paramètres API</strong> avec les valeurs ci-dessus
                                        </div>
                                    </li>
                                    <li className="flex items-start space-x-4">
                                        <span className="bg-muted-foreground/20 text-card-foreground flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold">
                                            4
                                        </span>
                                        <div className="flex-1">
                                            <strong className="text-card-foreground mb-2 block">Redémarrer le service :</strong>
                                            <code className="bg-muted-foreground/10 text-card-foreground block rounded px-3 py-2 text-sm">
                                                sudo systemctl restart monitoring-agent
                                            </code>
                                        </div>
                                    </li>
                                </ol>
                            </div>
                        </div>
                    )}
                </div>

                <div className="border-border flex justify-end border-t pt-6">
                    <Button variant="outline" onClick={onClose}>
                        Fermer
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
