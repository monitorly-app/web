// resources/js/pages/User/Organizations/Members/Index.tsx
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

interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
}

interface Member extends User {
    pivot: {
        organization_role_id: number;
        created_at: string;
    };
    organization_role: {
        id: number;
        name: string;
        description: string;
    };
}

interface Invitation {
    id: string;
    email: string;
    status: string;
    created_at: string;
    organization_role: {
        id: number;
        name: string;
        description: string;
    };
}

interface OrganizationRole {
    id: number;
    name: string;
    description: string;
}

interface Organization {
    id: string;
    name: string;
    owner: User;
    members: Member[];
    invitations: Invitation[];
}

interface Props {
    organization: Organization;
    organizationRoles: OrganizationRole[];
    permissions: {
        canInviteMembers: boolean;
        canManageMembers: boolean;
        canRemoveMembers: boolean;
    };
}

export default function MembersIndex({ organization, organizationRoles, permissions }: Props) {
    const getInitials = useInitials();
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
    const [invitationToCancel, setInvitationToCancel] = useState<Invitation | null>(null);
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);

    // Invite form
    const inviteForm = useForm({
        email: '',
        organization_role_id: '',
    });

    // Update role form
    const roleForm = useForm({
        organization_role_id: selectedMember?.pivot.organization_role_id || '',
    });

    // Remove member form
    const removeForm = useForm({});

    // Cancel invitation form
    const cancelInvitationForm = useForm({});

    // Resend invitation form
    const resendInvitationForm = useForm({});

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: organization.name,
            href: `/organizations/${organization.id}`,
        },
        {
            title: 'Members',
            href: `/organizations/${organization.id}/members`,
        },
    ];

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();

        inviteForm.post(route('organizations.members.store', organization.id), {
            onSuccess: () => {
                setIsInviteDialogOpen(false);
                inviteForm.reset();
            },
        });
    };

    const handleRoleUpdate = () => {
        if (!selectedMember) return;
        roleForm.put(route('organizations.members.update', [organization.id, selectedMember.id]), {
            onSuccess: () => {
                setSelectedMember(null);
                roleForm.reset();
            },
        });
    };

    const handleRemoveMember = () => {
        if (!memberToRemove) return;
        removeForm.delete(route('organizations.members.destroy', [organization.id, memberToRemove.id]), {
            onSuccess: () => {
                setMemberToRemove(null);
            },
        });
    };

    const handleCancelInvitation = () => {
        if (!invitationToCancel) return;
        cancelInvitationForm.delete(route('organizations.invitations.destroy', [organization.id, invitationToCancel.id]), {
            onSuccess: () => {
                setInvitationToCancel(null);
            },
        });
    };

    const handleResendInvitation = (invitation: Invitation) => {
        resendInvitationForm.post(route('organizations.invitations.resend', [organization.id, invitation.id]));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getRoleBadgeVariant = (roleName: string) => {
        switch (roleName.toLowerCase()) {
            case 'admin':
                return 'destructive';
            case 'engineer':
                return 'default';
            case 'developer':
                return 'secondary';
            case 'viewer':
                return 'outline';
            default:
                return 'secondary';
        }
    };

    const getRoleIcon = (roleName: string) => {
        switch (roleName.toLowerCase()) {
            case 'admin':
                return <Shield className="h-3 w-3" />;
            case 'engineer':
                return <Shield className="h-3 w-3" />;
            case 'developer':
                return <Shield className="h-3 w-3" />;
            case 'viewer':
                return <Shield className="h-3 w-3" />;
            default:
                return <Shield className="h-3 w-3" />;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${organization.name} - Members`} />

            <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Organization Members</h1>
                    {permissions.canInviteMembers && (
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
                                        Send an invitation to join this organization. If the user doesn't exist, they will receive an email
                                        invitation.
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
                                            value={inviteForm.data.organization_role_id}
                                            onValueChange={(value) => inviteForm.setData('organization_role_id', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {organizationRoles.map((role) => (
                                                    <SelectItem key={role.id} value={role.id.toString()}>
                                                        <div className="flex items-center space-x-2">
                                                            <div>
                                                                <div className="font-medium">{role.name}</div>
                                                                <div className="text-muted-foreground text-xs">{role.description}</div>
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={inviteForm.errors.organization_role_id} />
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
                            <CardDescription>Active members who have access to this organization</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {/* Organization owner */}
                                <div className="rounded-lg border p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={organization.owner.avatar} alt={organization.owner.name} />
                                                <AvatarFallback>{getInitials(organization.owner.name)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium">{organization.owner.name}</p>
                                                    <Badge>Owner</Badge>
                                                </div>
                                                <p className="text-muted-foreground text-sm">{organization.owner.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Team members */}
                                {organization.members && organization.members.length > 0 ? (
                                    <div className="space-y-4">
                                        {organization.members.map((member) => (
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
                                                        <Badge
                                                            variant={getRoleBadgeVariant(member.organization_role.name)}
                                                            className="flex items-center space-x-1"
                                                        >
                                                            {getRoleIcon(member.organization_role.name)}
                                                            <span>{member.organization_role.name}</span>
                                                        </Badge>

                                                        {permissions.canManageMembers && (
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
                                                                                'organization_role_id',
                                                                                member.pivot.organization_role_id.toString(),
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
                                        {permissions.canInviteMembers && (
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
                    {organization.invitations && organization.invitations.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Pending Invitations</CardTitle>
                                <CardDescription>Invitations that have been sent but not yet accepted</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {organization.invitations.map((invitation) => (
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
                                                    <Badge
                                                        variant={getRoleBadgeVariant(invitation.organization_role.name)}
                                                        className="flex items-center space-x-1"
                                                    >
                                                        {getRoleIcon(invitation.organization_role.name)}
                                                        <span>{invitation.organization_role.name}</span>
                                                    </Badge>
                                                    <Badge variant="secondary">
                                                        <Clock className="mr-1 h-3 w-3" />
                                                        Pending
                                                    </Badge>

                                                    {permissions.canInviteMembers && (
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
                            <Select
                                value={roleForm.data.organization_role_id.toString()}
                                onValueChange={(value) => roleForm.setData('organization_role_id', parseInt(value))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {organizationRoles.map((role) => (
                                        <SelectItem key={role.id} value={role.id.toString()}>
                                            <div className="flex items-center space-x-2">
                                                {getRoleIcon(role.name)}
                                                <div>
                                                    <div className="font-medium">{role.name}</div>
                                                    <div className="text-muted-foreground text-xs">{role.description}</div>
                                                </div>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={roleForm.errors.organization_role_id} />
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
                            Are you sure you want to remove {memberToRemove?.name} from this organization? They will lose access to all organization
                            resources immediately.
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
                            organization using this invitation.
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
