// resources/js/pages/User/Projects/Settings.tsx
import InputError from '@/components/input-error';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { AlertTriangle, Trash } from 'lucide-react';
import { useState } from 'react';

interface Project {
    id: string;
    name: string;
    description?: string;
}

interface Props {
    project: Project;
}

export default function ProjectSettings({ project }: Props) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Project update form
    const updateForm = useForm({
        name: project.name,
        description: project.description || '',
    });

    // Project delete form
    const deleteForm = useForm({
        confirmation: '',
    });

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

        deleteForm.delete(route('projects.settings.destroy', project.id), {
            onSuccess: () => {
                // Redirect will happen automatically
            },
        });
    };

    console.log('ICI SETTINGS', project);

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
                                                <div className="bg-destructive/5 rounded-md p-4">
                                                    <div className="flex items-center gap-3">
                                                        <Alert className="text-destructive h-5 w-5" />
                                                        <p className="text-sm font-medium">
                                                            Please type <span className="font-semibold">{project.name}</span> to confirm
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="confirmation">Confirmation</Label>
                                                    <Input
                                                        id="confirmation"
                                                        value={deleteForm.data.confirmation}
                                                        onChange={(e) => deleteForm.setData('confirmation', e.target.value)}
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
                                                        Delete Project
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
