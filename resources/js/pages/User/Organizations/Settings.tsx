// resources/js/pages/User/Organizations/Settings.tsx
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
import { BreadcrumbItem, Organization } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { AlertTriangle, Building2, Copy, Eye, EyeOff, Key, RefreshCw, Trash, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Props {
    organization: Organization;
    permissions: {
        canManageSettings: boolean;
        canDeleteOrganization: boolean;
    };
}

export default function OrganizationSettings({ organization, permissions }: Props) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const [showEncryptionKey, setShowEncryptionKey] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Organization update form
    const updateForm = useForm({
        name: organization.name,
        description: organization.description || '',
        logo: null as File | null,
    });

    // Organization delete form
    const deleteForm = useForm({
        confirmation: '',
    });

    // Key regeneration forms
    const regenerateApiForm = useForm({});
    const regenerateEncryptionForm = useForm({});
    const regenerateAllForm = useForm({});

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: organization.name,
            href: `/organizations/${organization.id}`,
        },
        {
            title: 'Settings',
            href: `/organizations/${organization.id}/settings`,
        },
    ];

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        updateForm.post(route('organizations.settings.update', organization.id), {
            forceFormData: true,
        });
    };

    const handleDelete = (e: React.FormEvent) => {
        e.preventDefault();
        deleteForm.delete(route('organizations.settings.destroy', organization.id));
    };

    const copyToClipboard = async (text: string, type: string) => {
        try {
            await navigator.clipboard.writeText(text);
            // Ici tu peux ajouter un toast pour confirmer la copie
        } catch (err) {
            console.error('Failed to copy:', err);
        }
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

    // Fonctions pour le drag & drop
    const handleFileSelect = (file: File) => {
        // Reset des erreurs précédentes
        setUploadError(null);

        // Validation du type de fichier
        if (!file.type.startsWith('image/')) {
            setUploadError('Veuillez sélectionner un fichier image (PNG, JPG, JPEG)');
            return;
        }

        // Validation de la taille (2MB max)
        const maxSize = 2 * 1024 * 1024; // 2MB en bytes
        if (file.size > maxSize) {
            setUploadError('Le fichier est trop volumineux. Taille maximum : 2MB');
            return;
        }

        // Validation des extensions acceptées
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            setUploadError('Format non supporté. Utilisez PNG, JPG ou JPEG uniquement');
            return;
        }

        updateForm.setData('logo', file);

        // Créer une URL de preview
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
    };

    // Nettoyer l'URL de preview quand le composant se démonte
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    // Nettoyer la preview après une soumission réussie
    useEffect(() => {
        if (updateForm.wasSuccessful) {
            clearPreview();
        }
    }, [updateForm.wasSuccessful]);

    const clearPreview = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        setUploadError(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleZoneClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${organization.name} - Settings`} />

            <div className="p-6">
                <h1 className="mb-6 text-2xl font-semibold">Organization Settings</h1>

                <div className="space-y-6">
                    {/* General Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>General</CardTitle>
                            <CardDescription>Manage your organization details and information</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleUpdate} className="space-y-6">
                                {/* Logo Section */}
                                <div className="space-y-6">
                                    <div>
                                        <Label className="text-base font-medium">Organization Logo</Label>
                                        <p className="text-muted-foreground mt-1 text-sm">
                                            Upload a logo to personalize your organization. This will be displayed in the sidebar and throughout the
                                            app.
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-6 lg:flex-row">
                                        {/* Current Logo Display */}
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="group relative">
                                                {previewUrl ? (
                                                    // Preview de la nouvelle image
                                                    <>
                                                        <img
                                                            src={previewUrl}
                                                            alt="Preview"
                                                            className="border-primary h-24 w-24 rounded-xl border-2 object-cover shadow-sm"
                                                        />
                                                        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                                                            <span className="px-2 text-center text-xs font-medium text-white">New Logo Preview</span>
                                                        </div>
                                                        <div className="absolute -top-2 -right-2">
                                                            <Button
                                                                type="button"
                                                                variant="destructive"
                                                                size="sm"
                                                                className="h-6 w-6 rounded-full p-0"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    clearPreview();
                                                                    updateForm.setData('logo', null);
                                                                    if (fileInputRef.current) {
                                                                        fileInputRef.current.value = '';
                                                                    }
                                                                }}
                                                            >
                                                                ×
                                                            </Button>
                                                        </div>
                                                    </>
                                                ) : organization.logo ? (
                                                    // Logo actuel
                                                    <>
                                                        <img
                                                            src={`/storage/${organization.logo}`}
                                                            alt={organization.name}
                                                            className="border-border h-24 w-24 rounded-xl border-2 object-cover shadow-sm"
                                                        />
                                                        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                                                            <span className="px-2 text-center text-xs font-medium text-white">Current Logo</span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    // Pas de logo
                                                    <div className="border-border bg-muted/50 flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed">
                                                        <Building2 className="text-muted-foreground h-10 w-10" />
                                                    </div>
                                                )}
                                            </div>
                                            {/* Zone de texte avec hauteur absolument fixe - aucun décalage possible */}
                                            <div className="flex h-12 flex-col justify-center overflow-hidden text-center">
                                                {uploadError ? (
                                                    <div className="space-y-0">
                                                        <span className="text-destructive block text-xs leading-tight font-medium">Upload Error</span>
                                                        <p className="text-destructive truncate text-xs leading-tight">{uploadError}</p>
                                                    </div>
                                                ) : previewUrl ? (
                                                    <div className="space-y-0">
                                                        <span className="text-primary block text-xs leading-tight font-medium">Ready to upload</span>
                                                        <p className="text-muted-foreground text-xs leading-tight">Save to apply</p>
                                                    </div>
                                                ) : !organization.logo ? (
                                                    <span className="text-muted-foreground text-xs">No logo uploaded</span>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">Current logo</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Upload Section */}
                                        <div className="flex-1 space-y-4">
                                            <div
                                                className={`cursor-pointer rounded-lg border-2 border-dashed p-6 transition-all ${
                                                    uploadError
                                                        ? 'border-destructive bg-destructive/5'
                                                        : isDragOver
                                                          ? 'border-primary bg-primary/10'
                                                          : 'border-border bg-muted/20 hover:bg-muted/30'
                                                }`}
                                                onDragOver={handleDragOver}
                                                onDragLeave={handleDragLeave}
                                                onDrop={handleDrop}
                                                onClick={handleZoneClick}
                                            >
                                                <div className="space-y-3 text-center">
                                                    <div
                                                        className={`mx-auto flex h-12 w-12 items-center justify-center rounded-lg transition-colors ${
                                                            uploadError ? 'bg-destructive/10' : isDragOver ? 'bg-primary/20' : 'bg-primary/10'
                                                        }`}
                                                    >
                                                        <Upload
                                                            className={`h-6 w-6 transition-colors ${
                                                                uploadError ? 'text-destructive' : isDragOver ? 'text-primary' : 'text-primary'
                                                            }`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <p
                                                            className={`text-sm font-medium transition-colors ${
                                                                uploadError
                                                                    ? 'text-destructive'
                                                                    : isDragOver
                                                                      ? 'text-primary'
                                                                      : 'text-foreground hover:text-primary'
                                                            }`}
                                                        >
                                                            {uploadError
                                                                ? 'Try again with a valid image'
                                                                : isDragOver
                                                                  ? 'Drop your image here'
                                                                  : 'Click to upload or drag and drop'}
                                                        </p>
                                                        <p className="text-muted-foreground mt-1 text-xs">PNG, JPG or JPEG up to 2MB</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <Input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        handleFileSelect(file);
                                                    }
                                                }}
                                                className="sr-only"
                                            />

                                            {updateForm.errors.logo && <InputError message={updateForm.errors.logo} />}

                                            {/* Action Buttons */}
                                            <div className="flex gap-3">
                                                {organization.logo && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            updateForm.post(route('organizations.settings.remove-logo', organization.id));
                                                        }}
                                                        disabled={updateForm.processing}
                                                        className="gap-2"
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                        Remove Logo
                                                    </Button>
                                                )}
                                                <div className="text-muted-foreground flex items-center gap-1 text-xs">
                                                    <div className="bg-muted-foreground h-1 w-1 rounded-full"></div>
                                                    Recommended: 200x200px for best quality
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="name">Organization Name</Label>
                                    <Input id="name" value={updateForm.data.name} onChange={(e) => updateForm.setData('name', e.target.value)} />
                                    <InputError message={updateForm.errors.name} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description (optional)</Label>
                                    <Textarea
                                        id="description"
                                        value={updateForm.data.description}
                                        onChange={(e) => updateForm.setData('description', e.target.value)}
                                        placeholder="Describe what this organization is about"
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
                                Manage your organization's API keys for monitoring agents. Keep these keys secure and regenerate them if compromised.
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
                                            value={showApiKey ? organization.api_key || 'Non définie' : '•'.repeat(32)}
                                            readOnly
                                            className="bg-muted font-mono text-sm"
                                        />
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => setShowApiKey(!showApiKey)}>
                                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyToClipboard(organization.api_key || '', 'API key')}
                                        disabled={!organization.api_key}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => regenerateApiForm.post(route('organizations.settings.regenerate-api-key', organization.id))}
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
                                            value={showEncryptionKey ? organization.encryption_key || 'Non définie' : '•'.repeat(32)}
                                            readOnly
                                            className="bg-muted font-mono text-sm"
                                        />
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => setShowEncryptionKey(!showEncryptionKey)}>
                                        {showEncryptionKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyToClipboard(organization.encryption_key || '', 'Encryption key')}
                                        disabled={!organization.encryption_key}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            regenerateEncryptionForm.post(route('organizations.settings.regenerate-encryption-key', organization.id))
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
                                        onClick={() => regenerateAllForm.post(route('organizations.settings.regenerate-all-keys', organization.id))}
                                        disabled={regenerateAllForm.processing}
                                    >
                                        <RefreshCw className={`mr-2 h-4 w-4 ${regenerateAllForm.processing ? 'animate-spin' : ''}`} />
                                        Regenerate All
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Organization Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Organization Information</CardTitle>
                            <CardDescription>General information about your organization</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <Label className="text-base font-medium">Organization ID</Label>
                                    <p className="text-muted-foreground mt-1 font-mono text-sm">{organization.id}</p>
                                </div>
                                <div>
                                    <Label className="text-base font-medium">Created</Label>
                                    <p className="text-muted-foreground mt-1 text-sm">{formatDate(organization.created_at)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Danger Zone - seulement pour les owners */}
                    {permissions.canDeleteOrganization && (
                        <Card className="border-destructive/50">
                            <CardHeader className="text-destructive">
                                <CardTitle className="flex items-center">
                                    <AlertTriangle className="mr-2 h-5 w-5" />
                                    Danger Zone
                                </CardTitle>
                                <CardDescription>Irreversible actions that affect your organization</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="border-destructive/20 bg-destructive/5 rounded-md border p-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-base font-medium">Delete Organization</h3>
                                            <p className="text-muted-foreground text-sm">
                                                Permanently delete this organization and all of its data. This action cannot be undone.
                                            </p>
                                        </div>
                                        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button variant="destructive" size="sm">
                                                    <Trash className="mr-2 h-4 w-4" />
                                                    Delete Organization
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Delete Organization</DialogTitle>
                                                    <DialogDescription>
                                                        This action cannot be undone. This will permanently delete the
                                                        <span className="font-medium"> {organization.name} </span>
                                                        organization and all of its data.
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
                                                                <li>All organization settings and configurations</li>
                                                                <li>All historical data and metrics</li>
                                                            </ul>
                                                        </AlertDescription>
                                                    </Alert>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="confirmation">
                                                            Please type <span className="font-semibold">{organization.name}</span> to confirm
                                                        </Label>
                                                        <Input
                                                            id="confirmation"
                                                            value={deleteForm.data.confirmation}
                                                            onChange={(e) => deleteForm.setData('confirmation', e.target.value)}
                                                            placeholder="Type the organization name"
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
                                                            disabled={deleteForm.processing || deleteForm.data.confirmation !== organization.name}
                                                        >
                                                            {deleteForm.processing ? 'Deleting...' : 'Delete Organization'}
                                                        </Button>
                                                    </DialogFooter>
                                                </form>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
