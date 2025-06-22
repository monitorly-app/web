// resources/js/pages/User/Projects/Settings.tsx
import InputError from '@/components/input-error';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { AlertTriangle, Copy, Eye, EyeOff, Key, RefreshCw, Trash } from 'lucide-react';
import { useState } from 'react';

interface ApiUsageStats {
    requests_this_month: number;
    monthly_limit: number;
    limit_percentage: number;
    last_used: string | null;
    reset_date: string;
}

interface Project {
    id: string;
    name: string;
    description?: string;
    api_key: string;
    encryption_key: string;
    api_usage_stats: ApiUsageStats;
    created_at: string;
}

interface Props {
    project: Project;
}

export default function ProjectSettings({ project }: Props) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const [showEncryptionKey, setShowEncryptionKey] = useState(false);

    // Project update form
    const updateForm = useForm({
        name: project.name,
        description: project.description || '',
    });

    // Project delete form
    const deleteForm = useForm({
        confirmation: '',
    });

    // Key regeneration forms
    const regenerateApiForm = useForm({});
    const regenerateEncryptionForm = useForm({});
    const regenerateAllForm = useForm({});

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: project.name,
            href: `/projects/${project.id}`,
        },
        {
            title: 'Settings',
            href: `/projects/${project.id}/settings`,
        },
    ];

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        updateForm.put(route('projects.settings.update', project.id));
    };

    const handleDelete = (e: React.FormEvent) => {
        e.preventDefault();
        deleteForm.delete(route('projects.settings.destroy', project.id));
    };

    const copyToClipboard = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        // Ici tu peux ajouter un toast pour confirmer la copie
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getUsageColor = (percentage: number) => {
        if (percentage >= 90) return 'text-red-600';
        if (percentage >= 75) return 'text-yellow-600';
        return 'text-green-600';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${project.name} - Settings`} />

            <div className="p-6">
                <h1 className="mb-6 text-2xl font-semibold">Project Settings</h1>

                <div className="space-y-6">
                    {/* General Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>General</CardTitle>
                            <CardDescription>Manage your project details and information</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleUpdate} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Project Name</Label>
                                    <Input id="name" value={updateForm.data.name} onChange={(e) => updateForm.setData('name', e.target.value)} />
                                    <InputError message={updateForm.errors.name} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description (optional)</Label>
                                    <Textarea
                                        id="description"
                                        value={updateForm.data.description}
                                        onChange={(e) => updateForm.setData('description', e.target.value)}
                                        placeholder="Describe what this project is about"
                                        rows={3}
                                    />
                                    <InputError message={updateForm.errors.description} />
                                </div>

                                <div className="flex justify-end">
                                    <Button type="submit" disabled={updateForm.processing}>
                                        Save Changes
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* API Keys Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Key className="mr-2 h-5 w-5" />
                                API Keys & Security
                            </CardTitle>
                            <CardDescription>
                                Manage your project's API keys for monitoring agents. Keep these keys secure and regenerate them if compromised.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* API Key */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-base font-medium">API Key</Label>
                                        <p className="text-muted-foreground text-sm">Used for authentication and plan verification</p>
                                    </div>
                                    <Badge variant="secondary">
                                        <Key className="mr-1 h-3 w-3" />
                                        Authentication
                                    </Badge>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <div className="flex-1">
                                        <Input
                                            value={showApiKey ? project.api_key : '•'.repeat(32)}
                                            readOnly
                                            className="bg-muted font-mono text-sm"
                                        />
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => setShowApiKey(!showApiKey)}>
                                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(project.api_key, 'API key')}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => regenerateApiForm.post(route('projects.settings.regenerate-api-key', project.id))}
                                        disabled={regenerateApiForm.processing}
                                    >
                                        <RefreshCw className={`h-4 w-4 ${regenerateApiForm.processing ? 'animate-spin' : ''}`} />
                                    </Button>
                                </div>
                            </div>

                            {/* Encryption Key */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-base font-medium">Encryption Key</Label>
                                        <p className="text-muted-foreground text-sm">Used to decrypt data sent by monitoring agents</p>
                                    </div>
                                    <Badge variant="secondary">
                                        <Key className="mr-1 h-3 w-3" />
                                        Encryption
                                    </Badge>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <div className="flex-1">
                                        <Input
                                            value={showEncryptionKey ? project.encryption_key : '•'.repeat(32)}
                                            readOnly
                                            className="bg-muted font-mono text-sm"
                                        />
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => setShowEncryptionKey(!showEncryptionKey)}>
                                        {showEncryptionKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(project.encryption_key, 'Encryption key')}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            regenerateEncryptionForm.post(route('projects.settings.regenerate-encryption-key', project.id))
                                        }
                                        disabled={regenerateEncryptionForm.processing}
                                    >
                                        <RefreshCw className={`h-4 w-4 ${regenerateEncryptionForm.processing ? 'animate-spin' : ''}`} />
                                    </Button>
                                </div>
                            </div>

                            {/* Regenerate All Keys */}
                            <div className="border-destructive/20 bg-destructive/5 rounded-md border p-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-base font-medium">Regenerate All Keys</h3>
                                        <p className="text-muted-foreground text-sm">
                                            This will regenerate both API and encryption keys. All agents will need to be updated.
                                        </p>
                                    </div>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => regenerateAllForm.post(route('projects.settings.regenerate-all-keys', project.id))}
                                        disabled={regenerateAllForm.processing}
                                    >
                                        <RefreshCw className={`mr-2 h-4 w-4 ${regenerateAllForm.processing ? 'animate-spin' : ''}`} />
                                        Regenerate All
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* API Usage Statistics */}
                    <Card>
                        <CardHeader>
                            <CardTitle>API Usage</CardTitle>
                            <CardDescription>Monitor your project's API usage and limits</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div>
                                    <Label className="text-base font-medium">Requests This Month</Label>
                                    <div className="mt-2 flex items-center space-x-2">
                                        <span className="text-2xl font-bold">{project.api_usage_stats.requests_this_month.toLocaleString()}</span>
                                        {project.api_usage_stats.monthly_limit !== -1 && (
                                            <span className="text-muted-foreground">/ {project.api_usage_stats.monthly_limit.toLocaleString()}</span>
                                        )}
                                    </div>
                                    {project.api_usage_stats.monthly_limit !== -1 && (
                                        <div className="mt-2">
                                            <div className="bg-muted h-2 w-full rounded-full">
                                                <div
                                                    className={`h-full rounded-full ${getUsageColor(project.api_usage_stats.limit_percentage)} bg-current`}
                                                    style={{ width: `${Math.min(project.api_usage_stats.limit_percentage, 100)}%` }}
                                                />
                                            </div>
                                            <p className={`mt-1 text-xs ${getUsageColor(project.api_usage_stats.limit_percentage)}`}>
                                                {project.api_usage_stats.limit_percentage.toFixed(1)}% used
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <Label className="text-base font-medium">Last API Request</Label>
                                    <p className="text-muted-foreground mt-2 text-sm">
                                        {project.api_usage_stats.last_used ? formatDate(project.api_usage_stats.last_used) : 'No requests yet'}
                                    </p>

                                    <Label className="mt-4 block text-base font-medium">Usage Resets</Label>
                                    <p className="text-muted-foreground mt-1 text-sm">{formatDate(project.api_usage_stats.reset_date)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Project Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Project Information</CardTitle>
                            <CardDescription>General information about your project</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <Label className="text-base font-medium">Project ID</Label>
                                    <p className="text-muted-foreground mt-1 font-mono text-sm">{project.id}</p>
                                </div>
                                <div>
                                    <Label className="text-base font-medium">Created</Label>
                                    <p className="text-muted-foreground mt-1 text-sm">{formatDate(project.created_at)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Danger Zone */}
                    <Card className="border-destructive/50">
                        <CardHeader className="text-destructive">
                            <CardTitle className="flex items-center">
                                <AlertTriangle className="mr-2 h-5 w-5" />
                                Danger Zone
                            </CardTitle>
                            <CardDescription>Irreversible actions that affect your project</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="border-destructive/20 bg-destructive/5 rounded-md border p-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-base font-medium">Delete Project</h3>
                                        <p className="text-muted-foreground text-sm">
                                            Permanently delete this project and all of its data. This action cannot be undone.
                                        </p>
                                    </div>
                                    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="destructive" size="sm">
                                                <Trash className="mr-2 h-4 w-4" />
                                                Delete Project
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Delete Project</DialogTitle>
                                                <DialogDescription>
                                                    This action cannot be undone. This will permanently delete the
                                                    <span className="font-medium"> {project.name} </span>
                                                    project and all of its data.
                                                </DialogDescription>
                                            </DialogHeader>

                                            <form onSubmit={handleDelete} className="space-y-4 pt-4">
                                                <Alert className="border-destructive/50">
                                                    <AlertTriangle className="h-4 w-4" />
                                                    <AlertDescription>
                                                        <strong>Warning:</strong> This will permanently delete:
                                                        <ul className="mt-2 list-inside list-disc text-sm">
                                                            <li>All servers and their monitoring data</li>
                                                            <li>All team members and their access</li>
                                                            <li>All project settings and configurations</li>
                                                            <li>All historical data and metrics</li>
                                                        </ul>
                                                    </AlertDescription>
                                                </Alert>

                                                <div className="space-y-2">
                                                    <Label htmlFor="confirmation">
                                                        Please type <span className="font-semibold">{project.name}</span> to confirm
                                                    </Label>
                                                    <Input
                                                        id="confirmation"
                                                        value={deleteForm.data.confirmation}
                                                        onChange={(e) => deleteForm.setData('confirmation', e.target.value)}
                                                        placeholder="Type the project name"
                                                    />
                                                    <InputError message={deleteForm.errors.confirmation} />
                                                </div>

                                                <DialogFooter>
                                                    <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        type="submit"
                                                        variant="destructive"
                                                        disabled={deleteForm.processing || deleteForm.data.confirmation !== project.name}
                                                    >
                                                        {deleteForm.processing ? 'Deleting...' : 'Delete Project'}
                                                    </Button>
                                                </DialogFooter>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
