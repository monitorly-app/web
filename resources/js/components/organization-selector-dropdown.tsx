// resources/js/components/organization-selector-dropdown.tsx
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Organization } from '@/types';
import { Link, router } from '@inertiajs/react';
import { Building2, ChevronDown, PlusCircle } from 'lucide-react';
import { Button } from './ui/button';

interface OrganizationSelectorDropdownProps {
    currentOrganization?: Organization;
    organizations: Organization[];
    user: {
        id: number;
        plan?: {
            name: string;
            max_organizations?: number;
        };
    };
    canCreateOrganization?: boolean;
    organizationsCount?: number;
}

export function OrganizationSelectorDropdown({
    currentOrganization,
    organizations,
    user,
    canCreateOrganization = true,
    organizationsCount = 0,
}: OrganizationSelectorDropdownProps) {
    const handleOrganizationSelect = (organizationId: string) => {
        router.visit(`/organizations/${organizationId}`);
    };

    const getCreateButtonText = () => {
        if (!canCreateOrganization) {
            const userPlan = user.plan?.name || 'Free';
            const maxOrgs = getMaxOrganizationsForPlan(userPlan);
            return `Upgrade to create more (${organizationsCount}/${maxOrgs})`;
        }
        return 'Create New Organization';
    };

    const getMaxOrganizationsForPlan = (planName: string): number => {
        switch (planName) {
            case 'Free':
                return 1;
            case 'Pro':
                return 3;
            case 'Business':
                return -1;
            default:
                return 1;
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-between px-2">
                    {currentOrganization ? (
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                            {currentOrganization.logo ? (
                                <img
                                    src={`/storage/${currentOrganization.logo}`}
                                    alt={currentOrganization.name}
                                    className="h-8 w-8 flex-shrink-0 rounded-md border object-cover"
                                />
                            ) : (
                                <div className="bg-muted flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border">
                                    <Building2 className="h-4 w-4" />
                                </div>
                            )}
                            <span className="min-w-0 truncate text-left font-medium">{currentOrganization.name}</span>
                        </div>
                    ) : (
                        <span>Select Organization</span>
                    )}
                    <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
                {organizations.length > 0 && (
                    <>
                        {organizations.map((organization) => (
                            <DropdownMenuItem
                                key={organization.id}
                                onClick={() => handleOrganizationSelect(organization.id)}
                                className="flex items-center gap-2"
                            >
                                {organization.logo ? (
                                    <img
                                        src={`/storage/${organization.logo}`}
                                        alt={organization.name}
                                        className="h-6 w-6 rounded border object-cover"
                                    />
                                ) : (
                                    <div className="bg-muted flex h-6 w-6 items-center justify-center rounded border">
                                        <Building2 className="h-3 w-3" />
                                    </div>
                                )}
                                <span className="flex-1 truncate">{organization.name}</span>
                                {organization.owner_id === user.id && <span className="text-muted-foreground ml-auto text-xs">Owner</span>}
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                    </>
                )}
                <DropdownMenuItem asChild>
                    <Link href="/organizations/select" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>Manage All Organizations</span>
                    </Link>
                </DropdownMenuItem>

                {canCreateOrganization ? (
                    <DropdownMenuItem asChild>
                        <Link href="/organizations/create" className="flex items-center gap-2">
                            <PlusCircle className="h-4 w-4" />
                            <span>Create New Organization</span>
                        </Link>
                    </DropdownMenuItem>
                ) : (
                    <DropdownMenuItem disabled className="flex items-center gap-2 opacity-50">
                        <PlusCircle className="h-4 w-4" />
                        <div className="flex flex-col">
                            <span className="text-xs font-medium">Upgrade Plan Required</span>
                            <span className="text-muted-foreground text-xs">
                                {organizationsCount}/{getMaxOrganizationsForPlan(user.plan?.name || 'Free')} organizations used
                            </span>
                        </div>
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
