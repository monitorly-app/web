// import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
// import { Organization, User } from '@/types';
// import { Link, router } from '@inertiajs/react';
// import { Building2, Plus } from 'lucide-react';

// interface OrganizationSelectorProps {
//     currentOrganization?: Organization;
//     organizations: Organization[];
//     user: User;
// }

// export function OrganizationSelector({ currentOrganization, organizations, user }: OrganizationSelectorProps) {
//     const handleOrganizationSelect = (organizationId: string) => {
//         // Navigate to the organization
//         router.visit(`/organizations/${organizationId}`);
//     };

//     return (
//         <SidebarGroup>
//             <SidebarGroupLabel className="flex items-center justify-between">
//                 Organizations
//                 <Link href="/organizations/create" className="text-muted-foreground hover:text-foreground text-xs">
//                     <Plus className="h-3 w-3" />
//                 </Link>
//             </SidebarGroupLabel>
//             <SidebarMenu>
//                 {organizations.map((organization) => (
//                     <SidebarMenuItem key={organization.id}>
//                         <SidebarMenuButton
//                             onClick={() => handleOrganizationSelect(organization.id)}
//                             isActive={currentOrganization?.id === organization.id}
//                             className="w-full justify-start"
//                         >
//                             <Building2 className="h-4 w-4" />
//                             <span className="flex-1 truncate">{organization.name}</span>
//                             {organization.owner_id === user.id && <span className="text-muted-foreground ml-auto text-xs">Owner</span>}
//                         </SidebarMenuButton>
//                     </SidebarMenuItem>
//                 ))}
//                 {organizations.length === 0 && (
//                     <SidebarMenuItem>
//                         <SidebarMenuButton asChild>
//                             <Link href="/organizations/create" className="text-muted-foreground hover:text-foreground">
//                                 <Plus className="h-4 w-4" />
//                                 Create Organization
//                             </Link>
//                         </SidebarMenuButton>
//                     </SidebarMenuItem>
//                 )}
//             </SidebarMenu>
//         </SidebarGroup>
//     );
// }
