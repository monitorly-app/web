// resources/js/pages/User/Organizations/Create.tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Building, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';

interface Plan {
    id: number;
    name: string;
    description: string;
    max_organizations: number;
}

interface Props {
    userPlan?: Plan;
    isFirstOrganization: boolean;
    currentOrganizationsCount: number;
}

export default function CreateOrganization({ userPlan, isFirstOrganization, currentOrganizationsCount }: Props) {
    const { data, setData, post, processing, errors, progress } = useForm({
        name: '',
        description: '',
        logo: null as File | null,
    });

    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('organizations.store'), {
            forceFormData: true, // Important pour l'upload de fichiers
        });
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Vérifier le type de fichier
            if (!file.type.startsWith('image/')) {
                alert('Veuillez sélectionner un fichier image.');
                return;
            }

            // Vérifier la taille (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                alert('Le fichier doit faire moins de 2MB.');
                return;
            }

            setData('logo', file);

            // Créer un aperçu
            const reader = new FileReader();
            reader.onload = (e) => {
                setLogoPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeLogo = () => {
        setData('logo', null);
        setLogoPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <>
            <Head title="Créer une Organisation" />

            <div className="container mx-auto max-w-3xl py-8">
                {/* Header avec navigation */}
                <div className="mb-6">
                    <Link
                        href={route('organizations.select')}
                        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center text-sm"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Retour à la sélection
                    </Link>

                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 rounded-lg p-2">
                            <Building className="text-primary h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">
                                {isFirstOrganization ? 'Créer votre première organisation' : 'Nouvelle organisation'}
                            </h1>
                            <p className="text-muted-foreground">
                                {isFirstOrganization
                                    ? 'Configurez votre organisation pour commencer à surveiller vos serveurs'
                                    : `Vous avez ${currentOrganizationsCount} organisation(s). ${userPlan?.max_organizations === -1 ? 'Illimité' : `Maximum: ${userPlan?.max_organizations}`}`}
                            </p>
                        </div>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Informations de l'organisation</CardTitle>
                        <CardDescription>Renseignez les détails de votre nouvelle organisation</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Logo */}
                            <div className="space-y-2">
                                <Label>Logo de l'organisation (optionnel)</Label>
                                <div className="flex items-start gap-4">
                                    {/* Aperçu du logo */}
                                    <div className="flex-shrink-0">
                                        {logoPreview ? (
                                            <div className="relative">
                                                <img
                                                    src={logoPreview}
                                                    alt="Aperçu du logo"
                                                    className="h-20 w-20 rounded-lg border-2 border-dashed border-gray-300 object-cover"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                                    onClick={removeLogo}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div
                                                className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 transition-colors hover:border-gray-400"
                                                onClick={triggerFileInput}
                                            >
                                                <Upload className="h-8 w-8 text-gray-400" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Contrôles du logo */}
                                    <div className="flex-1">
                                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                                        <Button type="button" variant="outline" onClick={triggerFileInput} className="mb-2">
                                            <Upload className="mr-2 h-4 w-4" />
                                            {logoPreview ? 'Changer le logo' : 'Télécharger un logo'}
                                        </Button>
                                        <p className="text-muted-foreground text-sm">Formats acceptés: JPG, PNG, GIF. Taille max: 2MB</p>
                                    </div>
                                </div>
                                {errors.logo && <p className="text-sm text-red-600">{errors.logo}</p>}
                            </div>

                            {/* Nom */}
                            <div className="space-y-2">
                                <Label htmlFor="name">Nom de l'organisation *</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Ex: Mon Entreprise, Équipe Dev, etc."
                                    required
                                    className={errors.name ? 'border-red-500' : ''}
                                />
                                {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description">Description (optionnel)</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Décrivez brièvement votre organisation..."
                                    rows={4}
                                    className={errors.description ? 'border-red-500' : ''}
                                />
                                {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
                                <p className="text-muted-foreground text-sm">Cette description sera visible par les membres de votre organisation</p>
                            </div>

                            {/* Plan info */}
                            {userPlan && (
                                <div className="bg-muted/50 rounded-lg p-4">
                                    <h4 className="mb-2 font-medium">Plan actuel: {userPlan.name}</h4>
                                    <p className="text-muted-foreground text-sm">
                                        {userPlan.max_organizations === -1
                                            ? 'Organisations illimitées'
                                            : `Vous pouvez créer jusqu'à ${userPlan.max_organizations} organisation(s)`}
                                    </p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-end space-x-4 border-t pt-4">
                                <Button type="button" variant="outline" onClick={() => window.history.back()} disabled={processing}>
                                    Annuler
                                </Button>
                                <Button type="submit" disabled={processing || !data.name.trim()} className="min-w-[140px]">
                                    {processing ? (
                                        <>
                                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                            Création...
                                        </>
                                    ) : (
                                        "Créer l'organisation"
                                    )}
                                </Button>
                            </div>

                            {/* Progress bar pour l'upload */}
                            {progress && (
                                <div className="mt-4">
                                    <div className="mb-1 flex justify-between text-sm">
                                        <span>Upload en cours...</span>
                                        <span>{Math.round(progress.percentage || 0)}%</span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-gray-200">
                                        <div
                                            className="bg-primary h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${progress.percentage || 0}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
