// resources/js/pages/User/Projects/Members/Index.tsx
import InputError from '@/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInitials } from '@/hooks/use-initials';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Clock, Copy, Mail, MoreHorizontal, RefreshCw, Shield, Trash, UserPlus, UsersRound } from 'lucide-react';
import { useState } from 'react';

interface ProjectMember {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    pivot: {
        project_role_id: number;
    };
}

interface ProjectRole {
    id: number;
    name: string;
    description: string;
}

interface ProjectOwner {
    id: number;
    name: string;
    email: string;
    avatar?: string;
}

interface PendingInvitation {
    id: number;
    email: string;
    project_role_id: number;
    status: string;
    created_at: string;
    role: ProjectRole;
}

interface Project {
    id: string;
    name: string;
    owner_id: number;
    owner: ProjectOwner;
    members: ProjectMember[];
}

interface Props {
    project: Project;
    isOwner: boolean;
    projectRoles: ProjectRole[];
    pendingInvitations: PendingInvitation[];
}

export default function MembersIndex({ project, isOwner, projectRoles, pendingInvitations }: Props) {
    const getInitials = useInitials();
    const [memberToRemove, setMemberToRemove] = useState<ProjectMember | null>(null);
    const [invitationToCancel, setInvitationToCancel] = useState<PendingInvitation | null>(null);
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<ProjectMember | null>(null);

    // Invite form
    const inviteForm = useForm({
        email: '',
        project_role_id: '',
    });

    // Update role form
    const roleForm = useForm({
        project_role_id: '',
    });

    // Remove member form
    const removeForm = useForm({});

    // Cancel invitation form
    const cancelInvitationForm = useForm({});

    // Resend invitation form
    const resendInvitationForm = useForm({});

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: project.name,
            href: `/projects/${project.id}`,
        },
        {
            title: 'Members',
            href: `/projects/${project.id}/members`,
        },
    ];

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();

        inviteForm.post(route('projects.members.store', project.id), {
            onSuccess: () => {
                setIsInviteDialogOpen(false);
                inviteForm.reset();
            },
        });
    };

    const handleRoleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMember) return;

        roleForm.put(route('projects.members.update', [project.id, selectedMember.id]), {
            onSuccess: () => {
                setIsRoleDialogOpen(false);
                setSelectedMember(null);
                roleForm.reset();
            },
        });
    };

    const handleRemoveMember = () => {
        if (!memberToRemove) return;

        removeForm.delete(route('projects.members.destroy', [project.id, memberToRemove.id]), {
            onSuccess: () => {
                setMemberToRemove(null);
            },
        });
    };

    const handleCancelInvitation = () => {
        if (!invitationToCancel) return;

        cancelInvitationForm.delete(route('projects.invitations.destroy', [project.id, invitationToCancel.id]), {
            onSuccess: () => {
                setInvitationToCancel(null);
            },
        });
    };

    const handleResendInvitation = (invitation: PendingInvitation) => {
        resendInvitationForm.post(route('projects.invitations.resend', [project.id, invitation.id]));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${project.name} - Members`} />

            <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Project Members</h1>
                    {isOwner && (
                        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Invite Member
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Invite New Member</DialogTitle>
                                    <DialogDescription>
                                        Send an invitation to join this project. If the user doesn't exist, they will receive an email invitation.
                                    </DialogDescription>
                                </DialogHeader>

                                <form onSubmit={handleInvite} className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={inviteForm.data.email}
                                            onChange={(e) => inviteForm.setData('email', e.target.value)}
                                            placeholder="colleague@example.com"
                                        />
                                        <InputError message={inviteForm.errors.email} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="role">Role</Label>
                                        <Select
                                            value={inviteForm.data.project_role_id}
                                            onValueChange={(value) => inviteForm.setData('project_role_id', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {projectRoles.map((role) => (
                                                    <SelectItem key={role.id} value={role.id.toString()}>
                                                        {role.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={inviteForm.errors.project_role_id} />
                                        {inviteForm.data.project_role_id && (
                                            <p className="text-muted-foreground text-xs">
                                                {projectRoles.find((r) => r.id.toString() === inviteForm.data.project_role_id)?.description}
                                            </p>
                                        )}
                                    </div>

                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={inviteForm.processing}>
                                            Send Invitation
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                <div className="space-y-6">
                    {/* Current Members */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Team Members</CardTitle>
                            <CardDescription>Active members who have access to this project</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {/* Project owner */}
                                <div className="rounded-lg border p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={project.owner.avatar} alt={project.owner.name} />
                                                <AvatarFallback>{getInitials(project.owner.name)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium">{project.owner.name}</p>
                                                    <Badge>Owner</Badge>
                                                </div>
                                                <p className="text-muted-foreground text-sm">{project.owner.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Team members */}
                                {project.members.length > 0 ? (
                                    <div className="space-y-4">
                                        {project.members.map((member) => (
                                            <div key={member.id} className="rounded-lg border p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarImage src={member.avatar} alt={member.name} />
                                                            <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium">{member.name}</p>
                                                            <p className="text-muted-foreground text-sm">{member.email}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary">
                                                            {projectRoles.find((role) => role.id === member.pivot.project_role_id)?.name || 'Member'}
                                                        </Badge>

                                                        {isOwner && (
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                        <span className="sr-only">Open menu</span>
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setSelectedMember(member);
                                                                            roleForm.setData(
                                                                                'project_role_id',
                                                                                member.pivot.project_role_id.toString(),
                                                                            );
                                                                            setIsRoleDialogOpen(true);
                                                                        }}
                                                                    >
                                                                        <Shield className="mr-2 h-4 w-4" />
                                                                        Change Role
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            navigator.clipboard.writeText(member.email);
                                                                        }}
                                                                    >
                                                                        <Copy className="mr-2 h-4 w-4" />
                                                                        Copy Email
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => setMemberToRemove(member)}
                                                                        className="text-destructive focus:text-destructive"
                                                                    >
                                                                        <Trash className="mr-2 h-4 w-4" />
                                                                        Remove
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                                        <UsersRound className="mb-2 h-10 w-10 opacity-20" />
                                        <p>No team members yet</p>
                                        {isOwner && (
                                            <Button className="mt-4" onClick={() => setIsInviteDialogOpen(true)}>
                                                <UserPlus className="mr-2 h-4 w-4" />
                                                Invite your first team member
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pending Invitations */}
                    {pendingInvitations.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Pending Invitations</CardTitle>
                                <CardDescription>Invitations that have been sent but not yet accepted</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {pendingInvitations.map((invitation) => (
                                        <div key={invitation.id} className="rounded-lg border border-dashed p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
                                                        <Mail className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{invitation.email}</p>
                                                        <div className="text-muted-foreground flex items-center gap-2 text-sm">
                                                            <Clock className="h-3 w-3" />
                                                            <span>Invited on {formatDate(invitation.created_at)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline">{invitation.role.name}</Badge>
                                                    <Badge variant="secondary">
                                                        <Clock className="mr-1 h-3 w-3" />
                                                        Pending
                                                    </Badge>

                                                    {isOwner && (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                    <span className="sr-only">Open menu</span>
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem
                                                                    onClick={() => handleResendInvitation(invitation)}
                                                                    disabled={resendInvitationForm.processing}
                                                                >
                                                                    <RefreshCw className="mr-2 h-4 w-4" />
                                                                    Resend Invitation
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(invitation.email);
                                                                    }}
                                                                >
                                                                    <Copy className="mr-2 h-4 w-4" />
                                                                    Copy Email
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onClick={() => setInvitationToCancel(invitation)}
                                                                    className="text-destructive focus:text-destructive"
                                                                >
                                                                    <Trash className="mr-2 h-4 w-4" />
                                                                    Cancel Invitation
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Change Role Dialog */}
            <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change Member Role</DialogTitle>
                        <DialogDescription>Update the role and permissions for {selectedMember?.name}</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleRoleUpdate} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={roleForm.data.project_role_id} onValueChange={(value) => roleForm.setData('project_role_id', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {projectRoles.map((role) => (
                                        <SelectItem key={role.id} value={role.id.toString()}>
                                            {role.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={roleForm.errors.project_role_id} />
                            {roleForm.data.project_role_id && (
                                <p className="text-muted-foreground text-xs">
                                    {projectRoles.find((r) => r.id.toString() === roleForm.data.project_role_id)?.description}
                                </p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={roleForm.processing}>
                                Update Role
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Remove Member Dialog */}
            <Dialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove Team Member</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove {memberToRemove?.name} from this project? They will lose access to all project resources
                            immediately.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setMemberToRemove(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleRemoveMember} disabled={removeForm.processing}>
                            Remove Member
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancel Invitation Dialog */}
            <Dialog open={!!invitationToCancel} onOpenChange={(open) => !open && setInvitationToCancel(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Invitation</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to cancel the invitation for {invitationToCancel?.email}? They will no longer be able to join this
                            project using this invitation.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setInvitationToCancel(null)}>
                            Keep Invitation
                        </Button>
                        <Button variant="destructive" onClick={handleCancelInvitation} disabled={cancelInvitationForm.processing}>
                            Cancel Invitation
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
