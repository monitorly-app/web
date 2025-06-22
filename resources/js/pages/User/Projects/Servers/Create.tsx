import InputError from '@/components/input-error';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Info, Server } from 'lucide-react';

interface Project {
    id: string;
    name: string;
}

interface UserPlan {
    id: number;
    name: string;
    max_servers: number;
    frequency: number;
}

interface Props {
    project: Project;
    userPlan: UserPlan;
    currentServerCount: number;
}

export default function ServersCreate({ project, userPlan, currentServerCount }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        host: '',
        port: 22,
        description: '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: project.name,
            href: `/projects/${project.id}`,
        },
        {
            title: 'Servers',
            href: `/projects/${project.id}/servers`,
        },
        {
            title: 'Add Server',
            href: `/projects/${project.id}/servers/create`,
        },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('projects.servers.store', project.id));
    };

    const remainingServers = userPlan.max_servers === -1 ? 'Unlimited' : userPlan.max_servers - currentServerCount;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${project.name} - Add Server`} />

            <div className="p-6">
                <div className="mx-auto">
                    <div className="mb-6 flex items-center justify-between space-x-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/projects/${project.id}/servers`}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Servers
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-semibold">Add New Server</h1>
                            <p className="text-muted-foreground">Configure a new server for monitoring</p>
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

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Server className="mr-2 h-5 w-5" />
                                Server Configuration
                            </CardTitle>
                            <CardDescription>
                                Enter the details of the server you want to monitor. After creation, you'll receive installation instructions for the
                                monitoring agent.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">
                                            Server Name <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="Production Web Server"
                                            disabled={processing}
                                        />
                                        <InputError message={errors.name} />
                                        <p className="text-muted-foreground text-xs">A friendly name to identify this server</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="host">
                                            Hostname or IP <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="host"
                                            value={data.host}
                                            onChange={(e) => setData('host', e.target.value)}
                                            placeholder="192.168.1.100 or server.example.com"
                                            disabled={processing}
                                        />
                                        <InputError message={errors.host} />
                                        <p className="text-muted-foreground text-xs">Server's IP address or hostname</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="port">
                                        SSH Port <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="port"
                                        type="number"
                                        min="1"
                                        max="65535"
                                        value={data.port}
                                        onChange={(e) => setData('port', parseInt(e.target.value) || 22)}
                                        disabled={processing}
                                        className="max-w-32"
                                    />
                                    <InputError message={errors.port} />
                                    <p className="text-muted-foreground text-xs">SSH port for agent installation (usually 22)</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description (optional)</Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Primary web server running Nginx and Node.js applications"
                                        rows={3}
                                        disabled={processing}
                                    />
                                    <InputError message={errors.description} />
                                    <p className="text-muted-foreground text-xs">Optional description of the server's purpose or configuration</p>
                                </div>

                                <div className="border-muted rounded-lg border p-4">
                                    <h3 className="mb-2 font-medium">What happens next?</h3>
                                    <ul className="text-muted-foreground space-y-1 text-sm">
                                        <li>• A unique server token will be generated</li>
                                        <li>• You'll receive installation commands for the monitoring agent</li>
                                        <li>
                                            • The agent will start sending metrics every {userPlan.frequency} minute
                                            {userPlan.frequency > 1 ? 's' : ''}
                                        </li>
                                        <li>• Server status will appear in your dashboard</li>
                                    </ul>
                                </div>

                                <div className="flex items-center justify-end space-x-4">
                                    <Button variant="outline" type="button" asChild disabled={processing}>
                                        <Link href={`/projects/${project.id}/servers`}>Cancel</Link>
                                    </Button>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Creating Server...' : 'Create Server'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Security Note */}
                    <Alert className="mt-6">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Security Note:</strong> The monitoring agent will use secure authentication tokens and encrypted communication. No
                            sensitive server credentials are stored in our system.
                        </AlertDescription>
                    </Alert>
                </div>
            </div>
        </AppLayout>
    );
}
