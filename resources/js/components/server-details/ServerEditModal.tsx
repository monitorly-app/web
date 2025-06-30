import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import { AlertCircle, Save, X } from 'lucide-react';

interface ServerEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    server: {
        id: string;
        name: string;
        host: string;
        port: number;
        description?: string;
    };
    organization: {
        id: string;
    };
}

export default function ServerEditModal({ isOpen, onClose, server, organization }: ServerEditModalProps) {
    const { data, setData, put, processing, errors, reset } = useForm({
        name: server.name,
        host: server.host,
        port: server.port,
        description: server.description || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('organizations.servers.update', [organization.id, server.id]), {
            onSuccess: () => {
                onClose();
                reset();
            },
        });
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                        <Save className="h-5 w-5" />
                        <span>Modifier le serveur</span>
                    </DialogTitle>
                    <DialogDescription>Mettez à jour les informations de configuration du serveur</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Nom du serveur */}
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium">
                            Nom du serveur *
                        </Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="ex: Serveur Web Production"
                            className={errors.name ? 'border-red-500 focus:border-red-500' : ''}
                        />
                        {errors.name && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{errors.name}</AlertDescription>
                            </Alert>
                        )}
                    </div>

                    {/* Adresse du serveur */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="host" className="text-sm font-medium">
                                Adresse IP ou nom d'hôte *
                            </Label>
                            <Input
                                id="host"
                                value={data.host}
                                onChange={(e) => setData('host', e.target.value)}
                                placeholder="192.168.1.100 ou server.example.com"
                                className={errors.host ? 'border-red-500 focus:border-red-500' : ''}
                            />
                            {errors.host && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{errors.host}</AlertDescription>
                                </Alert>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="port" className="text-sm font-medium">
                                Port *
                            </Label>
                            <Input
                                id="port"
                                type="number"
                                min="1"
                                max="65535"
                                value={data.port}
                                onChange={(e) => setData('port', parseInt(e.target.value) || 22)}
                                className={errors.port ? 'border-red-500 focus:border-red-500' : ''}
                            />
                            {errors.port && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{errors.port}</AlertDescription>
                                </Alert>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-medium">
                            Description
                        </Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="Description optionnelle du serveur (environnement, rôle, etc.)"
                            rows={3}
                            className={errors.description ? 'border-red-500 focus:border-red-500' : ''}
                        />
                        {errors.description && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{errors.description}</AlertDescription>
                            </Alert>
                        )}
                    </div>

                    {/* Informations d'aide */}
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <h4 className="mb-2 text-sm font-medium text-blue-900">💡 Conseils</h4>
                        <ul className="space-y-1 text-sm text-blue-800">
                            <li>• Utilisez un nom descriptif pour identifier facilement le serveur</li>
                            <li>• Le port par défaut pour SSH est 22</li>
                            <li>• La description aide à documenter l'utilisation du serveur</li>
                        </ul>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-3 border-t pt-4">
                        <Button type="button" variant="outline" onClick={handleClose} disabled={processing} className="flex items-center space-x-2">
                            <X className="h-4 w-4" />
                            <span>Annuler</span>
                        </Button>
                        <Button type="submit" disabled={processing} className="flex items-center space-x-2">
                            <Save className="h-4 w-4" />
                            <span>{processing ? 'Enregistrement...' : 'Enregistrer'}</span>
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
