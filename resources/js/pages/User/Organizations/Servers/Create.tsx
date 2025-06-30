import InputError from '@/components/input-error';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, Organization } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    Activity,
    ArrowLeft,
    ArrowRight,
    CheckCircle,
    Clock,
    Copy,
    Cpu,
    Eye,
    FileText,
    HardDrive,
    Info,
    MemoryStick,
    Network,
    Server,
    Shield,
    Terminal,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface UserPlan {
    id: number;
    name: string;
    max_servers: number;
    frequency: number;
}

interface Props {
    organization: Organization;
    userPlan: UserPlan;
    currentServerCount: number;
}

interface MetricConfig {
    key: string;
    label: string;
    description: string;
    icon: React.ComponentType<any>;
    defaultEnabled: boolean;
    interval?: string;
}

const availableMetrics: MetricConfig[] = [
    {
        key: 'cpu',
        label: 'CPU Usage',
        description: 'Monitor processor utilization and load average',
        icon: Cpu,
        defaultEnabled: true,
        interval: '30s',
    },
    {
        key: 'ram',
        label: 'Memory (RAM)',
        description: 'Track memory usage and availability',
        icon: MemoryStick,
        defaultEnabled: true,
        interval: '30s',
    },
    {
        key: 'disk',
        label: 'Disk Usage',
        description: 'Monitor disk space and I/O operations',
        icon: HardDrive,
        defaultEnabled: true,
        interval: '60s',
    },
    {
        key: 'network',
        label: 'Network Traffic',
        description: 'Track network bandwidth and connections',
        icon: Network,
        defaultEnabled: false,
        interval: '60s',
    },
    {
        key: 'user_activity',
        label: 'User Activity',
        description: 'Monitor SSH sessions and user logins',
        icon: Users,
        defaultEnabled: false,
        interval: '2m',
    },
    {
        key: 'login_failures',
        label: 'Login Failures',
        description: 'Track failed authentication attempts',
        icon: Shield,
        defaultEnabled: false,
        interval: '5m',
    },
    {
        key: 'port_monitoring',
        label: 'Port Monitoring',
        description: 'Monitor open ports and services',
        icon: Eye,
        defaultEnabled: false,
        interval: '10m',
    },
];

export default function ServersCreate({ organization, userPlan, currentServerCount }: Props) {
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedMetrics, setSelectedMetrics] = useState<string[]>(availableMetrics.filter((m) => m.defaultEnabled).map((m) => m.key));
    const [installScript, setInstallScript] = useState<string>('');
    const [fullBashScript, setFullBashScript] = useState<string>('');
    const [serverToken, setServerToken] = useState<string>('');

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        description: '',
        metrics: selectedMetrics,
    });

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: organization.name,
            href: `/organizations/${organization.id}`,
        },
        {
            title: 'Servers',
            href: `/organizations/${organization.id}/servers`,
        },
        {
            title: 'Add Server',
            href: `/organizations/${organization.id}/servers/create`,
        },
    ];

    const remainingServers = userPlan.max_servers === -1 ? 'Unlimited' : userPlan.max_servers - currentServerCount;

    const handleMetricToggle = (metricKey: string) => {
        setSelectedMetrics((prev) => {
            const newMetrics = prev.includes(metricKey) ? prev.filter((m) => m !== metricKey) : [...prev, metricKey];
            setData('metrics', newMetrics);
            return newMetrics;
        });
    };

    const handleNextStep = () => {
        if (currentStep === 1) {
            // Générer le script d'installation
            generateInstallScript();
            setCurrentStep(2);
        } else if (currentStep === 2) {
            // Créer le serveur en pending
            createServer();
        }
    };

    const generateInstallScript = async () => {
        try {
            // Utiliser Inertia pour maintenir la session
            const response = await fetch(route('servers.generate-script'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                },
                credentials: 'same-origin', // Important pour maintenir la session
                body: JSON.stringify({
                    organization_id: organization.id,
                    server_name: data.name,
                    metrics: selectedMetrics,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                setInstallScript(result.script);
                setServerToken(result.token);

                // Récupérer le script complet depuis l'URL
                try {
                    const scriptResponse = await fetch(result.script, {
                        credentials: 'same-origin',
                    });
                    if (scriptResponse.ok) {
                        const fullScript = await scriptResponse.text();
                        setFullBashScript(fullScript);
                    }
                } catch (error) {
                    console.log('Could not fetch full script, using URL instead');
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('Error generating script:', response.status, response.statusText, errorData);
            }
        } catch (error) {
            console.error('Error generating script:', error);
        }
    };

    const createServer = () => {
        // Mettre à jour les données avec le token et les métriques
        setData('metrics', selectedMetrics);

        post(route('organizations.servers.store', organization.id), {
            onSuccess: () => {
                // Rediriger directement vers le dashboard des serveurs
                window.location.href = route('organizations.servers.index', organization.id);
            },
            onError: (errors) => {
                console.error('Error creating server:', errors);
                // En cas d'erreur, rester sur la page et afficher l'erreur
            },
        });
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            // Ici vous pourriez ajouter un toast de confirmation
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const getStepIcon = (step: number) => {
        if (step < currentStep) return <CheckCircle className="h-5 w-5 text-green-600" />;
        if (step === currentStep)
            return <div className="bg-primary flex h-5 w-5 items-center justify-center rounded-full text-sm font-medium text-white">{step}</div>;
        return <div className="bg-muted text-muted-foreground flex h-5 w-5 items-center justify-center rounded-full text-sm font-medium">{step}</div>;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${organization.name} - Add Server`} />

            <div className="p-6">
                <div className="mx-auto max-w-full">
                    <div className="mb-6 flex items-center justify-between">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/organizations/${organization.id}/servers`}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Servers
                            </Link>
                        </Button>
                        <div className="text-right">
                            <h1 className="text-2xl font-semibold">Add New Server</h1>
                            <p className="text-muted-foreground">Configure monitoring for your server</p>
                        </div>
                    </div>

                    {/* Steps Progress */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                {getStepIcon(1)}
                                <span className={`font-medium ${currentStep >= 1 ? 'text-foreground' : 'text-muted-foreground'}`}>Configuration</span>
                            </div>
                            <div className="bg-border mx-4 h-px flex-1"></div>
                            <div className="flex items-center space-x-4">
                                {getStepIcon(2)}
                                <span className={`font-medium ${currentStep >= 2 ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    Installation & Complete
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Plan Information */}
                    <Alert className="mb-6">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            <div className="flex items-center justify-between">
                                <div>
                                    <strong>{userPlan.name} Plan:</strong> Monitoring every {userPlan.frequency} minute
                                    {userPlan.frequency > 1 ? 's' : ''}
                                </div>
                                <div className="text-sm">
                                    {userPlan.max_servers === -1 ? (
                                        <span className="text-green-600">Unlimited servers</span>
                                    ) : (
                                        <span>
                                            {remainingServers} server{remainingServers !== 1 ? 's' : ''} remaining
                                        </span>
                                    )}
                                </div>
                            </div>
                        </AlertDescription>
                    </Alert>

                    {/* Step 1: Configuration */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Server className="mr-2 h-5 w-5" />
                                        Server Information
                                    </CardTitle>
                                    <CardDescription>Basic information about the server you want to monitor</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">
                                            Server Name <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="Production Web Server"
                                        />
                                        <InputError message={errors.name} />
                                        <p className="text-muted-foreground text-xs">A friendly name to identify this server</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description (optional)</Label>
                                        <Textarea
                                            id="description"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            placeholder="Primary web server running Nginx and Node.js applications"
                                            rows={3}
                                        />
                                        <InputError message={errors.description} />
                                        <p className="text-muted-foreground text-xs">Optional description of the server's purpose</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Activity className="mr-2 h-5 w-5" />
                                        Monitoring Configuration
                                    </CardTitle>
                                    <CardDescription>Select which metrics you want to monitor on this server</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        {availableMetrics.map((metric) => {
                                            const IconComponent = metric.icon;
                                            const isSelected = selectedMetrics.includes(metric.key);

                                            return (
                                                <div
                                                    key={metric.key}
                                                    className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                                                        isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                                    }`}
                                                    onClick={() => handleMetricToggle(metric.key)}
                                                >
                                                    <div className="flex items-start space-x-3">
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onChange={() => handleMetricToggle(metric.key)}
                                                            className="mt-0.5"
                                                        />
                                                        <div className="flex-1">
                                                            <div className="mb-1 flex items-center space-x-2">
                                                                <IconComponent className="text-primary h-4 w-4" />
                                                                <span className="font-medium">{metric.label}</span>
                                                                {metric.defaultEnabled && (
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        Recommended
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-muted-foreground mb-2 text-sm">{metric.description}</p>
                                                            {metric.interval && (
                                                                <div className="text-muted-foreground flex items-center space-x-1 text-xs">
                                                                    <Clock className="h-3 w-3" />
                                                                    <span>Every {metric.interval}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {selectedMetrics.length === 0 && (
                                        <Alert className="mt-4">
                                            <Info className="h-4 w-4" />
                                            <AlertDescription>Please select at least one metric to monitor.</AlertDescription>
                                        </Alert>
                                    )}
                                </CardContent>
                            </Card>

                            <div className="flex justify-end">
                                <Button onClick={handleNextStep} disabled={!data.name || selectedMetrics.length === 0}>
                                    Generate Installation Script
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Installation Script */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Terminal className="mr-2 h-5 w-5" />
                                        Installation Script
                                    </CardTitle>
                                    <CardDescription>Copy and run this command on your server to install the monitoring agent</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Installation Command */}
                                    <div className="space-y-4">
                                        <div className="bg-muted rounded-lg p-4">
                                            <div className="mb-2 flex items-center justify-between">
                                                <span className="text-sm font-medium">Quick Installation Command</span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        copyToClipboard(`curl -sSL "${window.location.origin}/install/${serverToken}" | bash`)
                                                    }
                                                >
                                                    <Copy className="mr-2 h-4 w-4" />
                                                    Copy
                                                </Button>
                                            </div>
                                            <code className="block rounded bg-black p-3 font-mono text-sm text-green-400">
                                                curl -sSL "{window.location.origin}/install/{serverToken}" | bash
                                            </code>
                                        </div>

                                        <Alert>
                                            <Info className="h-4 w-4" />
                                            <AlertDescription>
                                                <div className="space-y-2">
                                                    <p>
                                                        <strong>Quick Setup Instructions:</strong>
                                                    </p>
                                                    <ol className="list-inside list-decimal space-y-1 text-sm">
                                                        <li>Connect to your server via SSH</li>
                                                        <li>Copy and paste the command above</li>
                                                        <li>Press Enter to run the installation</li>
                                                        <li>The agent will start monitoring automatically</li>
                                                    </ol>
                                                </div>
                                            </AlertDescription>
                                        </Alert>
                                    </div>

                                    {/* Full Script Preview */}
                                    <div className="space-y-4">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" className="w-full">
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    Show Installation Script
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent
                                                className="flex flex-col"
                                                style={{
                                                    maxWidth: '95vw',
                                                    width: '95vw',
                                                    maxHeight: '95vh',
                                                    height: '95vh',
                                                }}
                                            >
                                                <DialogHeader className="flex-shrink-0">
                                                    <DialogTitle>Complete Installation Script</DialogTitle>
                                                    <DialogDescription>
                                                        Review the complete bash script before running it on your server
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="flex min-h-0 flex-1 flex-col space-y-4">
                                                    <div className="flex flex-shrink-0 justify-end">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => copyToClipboard(fullBashScript)}
                                                            disabled={!fullBashScript}
                                                        >
                                                            <Copy className="mr-2 h-4 w-4" />
                                                            Copy Full Script
                                                        </Button>
                                                    </div>
                                                    <div className="min-h-0 flex-1 overflow-hidden rounded-lg border">
                                                        <div className="h-full w-full overflow-auto">
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
                                                                    margin: '0',
                                                                    padding: '16px',
                                                                    fontSize: '13px',
                                                                    lineHeight: '1.4',
                                                                    height: '100%',
                                                                    width: '100%',
                                                                    minHeight: '100%',
                                                                    overflow: 'auto',
                                                                    background: '#1e1e1e',
                                                                    border: 'none',
                                                                    borderRadius: '0',
                                                                }}
                                                                showLineNumbers={true}
                                                                wrapLines={true}
                                                                wrapLongLines={true}
                                                            >
                                                                {fullBashScript || '# Loading installation script...'}
                                                            </SyntaxHighlighter>
                                                        </div>
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>

                                        <Alert>
                                            <Shield className="h-4 w-4" />
                                            <AlertDescription>
                                                <strong>Security & Transparency:</strong> Click "Show Installation Script" to review the complete
                                                script before running it on your server.
                                            </AlertDescription>
                                        </Alert>
                                    </div>

                                    {/* Selected Metrics Summary */}
                                    <div className="rounded-lg border p-4">
                                        <h4 className="mb-3 font-medium">Selected Metrics Configuration:</h4>
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                                            {selectedMetrics.map((metricKey) => {
                                                const metric = availableMetrics.find((m) => m.key === metricKey);
                                                if (!metric) return null;
                                                const IconComponent = metric.icon;
                                                return (
                                                    <div key={metricKey} className="bg-muted flex items-center space-x-2 rounded p-2">
                                                        <IconComponent className="text-primary h-4 w-4" />
                                                        <div className="flex-1">
                                                            <span className="text-sm font-medium">{metric.label}</span>
                                                            <div className="text-muted-foreground text-xs">Every {metric.interval}</div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex justify-between">
                                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Configuration
                                </Button>
                                <Button onClick={handleNextStep} disabled={processing}>
                                    {processing ? 'Adding Server...' : 'Add Server to Dashboard'}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
