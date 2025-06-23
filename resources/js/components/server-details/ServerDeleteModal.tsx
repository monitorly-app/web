import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm } from '@inertiajs/react';
import { AlertTriangle, Server, Trash, X } from 'lucide-react';

interface ServerDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    server: {
        id: string;
        name: string;
        host: string;
        port: number;
    };
    project: {
        id: string;
    };
}

export default function ServerDeleteModal({ isOpen, onClose, server, project }: ServerDeleteModalProps) {
    const { delete: destroy, processing } = useForm();

    const handleDelete = () => {
        destroy(route('projects.servers.destroy', [project.id, server.id]), {
            onSuccess: () => {
                onClose();
            },
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <span>Supprimer le serveur</span>
                    </DialogTitle>
                    <DialogDescription>Cette action est irréversible et supprimera définitivement toutes les données associées.</DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Informations du serveur */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center space-x-3">
                            <Server className="h-5 w-5 text-slate-600" />
                            <div>
                                <p className="font-semibold text-slate-900">{server.name}</p>
                                <p className="text-sm text-slate-600">
                                    {server.host}:{server.port}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Avertissement */}
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="space-y-2">
                            <p className="font-medium">Attention : Cette action supprimera définitivement :</p>
                            <ul className="list-inside list-disc space-y-1 text-sm">
                                <li>Toutes les métriques historiques du serveur</li>
                                <li>La configuration de l'agent de monitoring</li>
                                <li>Les alertes et notifications associées</li>
                                <li>Tous les paramètres personnalisés</li>
                            </ul>
                        </AlertDescription>
                    </Alert>

                    {/* Instructions post-suppression */}
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <h4 className="mb-2 text-sm font-medium text-blue-900">📝 Après la suppression</h4>
                        <ul className="space-y-1 text-sm text-blue-800">
                            <li>• L'agent continuera de fonctionner sur le serveur mais n'enverra plus de données</li>
                            <li>• Vous pouvez désinstaller l'agent manuellement si nécessaire</li>
                            <li>• Il sera possible de réajouter ce serveur plus tard</li>
                        </ul>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3 border-t pt-4">
                    <Button type="button" variant="outline" onClick={onClose} disabled={processing} className="flex items-center space-x-2">
                        <X className="h-4 w-4" />
                        <span>Annuler</span>
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={processing} className="flex items-center space-x-2">
                        <Trash className="h-4 w-4" />
                        <span>{processing ? 'Suppression...' : 'Supprimer définitivement'}</span>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
