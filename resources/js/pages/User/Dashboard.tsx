// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import AppLayout from '@/layouts/app-layout';
// import { BreadcrumbItem } from '@/types';
// import { Head } from '@inertiajs/react';
// import { Clock, Server, Users } from 'lucide-react';

// interface UserPlan {
//     id: number;
//     name: string;
//     price: number;
//     frequency: number;
//     max_servers: number;
//     max_users: number;
//     description: string | null;
// }

// interface UserData {
//     id: number;
//     name: string;
//     email: string;
//     plan: UserPlan;
// }

// interface Props {
//     user: UserData;
// }

// const breadcrumbs: BreadcrumbItem[] = [
//     {
//         title: 'Dashboard',
//         href: '/user/dashboard',
//     },
// ];

// export default function UserDashboard({ user }: Props) {
//     return (
//         <AppLayout breadcrumbs={breadcrumbs}>
//             <Head title="Dashboard" />

//             <div className="p-6">
//                 <h1 className="mb-6 text-2xl font-semibold">Welcome, {user.name}</h1>

//                 {/* User Plan */}
//                 <Card className="mb-6">
//                     <CardHeader>
//                         <CardTitle>Your Plan</CardTitle>
//                         <CardDescription>Your current subscription and limits</CardDescription>
//                     </CardHeader>
//                     <CardContent>
//                         <div className="flex flex-col gap-6 md:flex-row">
//                             <div className="flex-1 space-y-4">
//                                 <div className="flex items-center">
//                                     <span className="text-2xl font-bold">{user.plan.name}</span>
//                                     {user.plan.price > 0 && <span className="text-muted-foreground ml-2 text-sm">{user.plan.price} € per month</span>}
//                                 </div>

//                                 {user.plan.description && <p className="text-muted-foreground">{user.plan.description}</p>}

//                                 <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
//                                     <div className="flex items-center gap-2">
//                                         <Server className="text-primary h-5 w-5" />
//                                         <div>
//                                             <p className="text-sm font-medium">Servers</p>
//                                             <p className="text-xl">{user.plan.max_servers}</p>
//                                         </div>
//                                     </div>

//                                     <div className="flex items-center gap-2">
//                                         <Users className="text-primary h-5 w-5" />
//                                         <div>
//                                             <p className="text-sm font-medium">Team Members</p>
//                                             <p className="text-xl">{user.plan.max_users}</p>
//                                         </div>
//                                     </div>

//                                     <div className="flex items-center gap-2">
//                                         <Clock className="text-primary h-5 w-5" />
//                                         <div>
//                                             <p className="text-sm font-medium">Monitoring Interval</p>
//                                             <p className="text-xl">{user.plan.frequency} min</p>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </CardContent>
//                 </Card>

//                 {/* Dashboard Content Placeholder */}
//                 <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
//                     <Card>
//                         <CardHeader>
//                             <CardTitle>Servers Overview</CardTitle>
//                             <CardDescription>Monitor your server status</CardDescription>
//                         </CardHeader>
//                         <CardContent>
//                             <div className="flex h-40 items-center justify-center rounded-md border border-dashed">
//                                 <p className="text-muted-foreground">No servers configured yet</p>
//                             </div>
//                         </CardContent>
//                     </Card>

//                     <Card>
//                         <CardHeader>
//                             <CardTitle>Recent Alerts</CardTitle>
//                             <CardDescription>Latest notifications from your servers</CardDescription>
//                         </CardHeader>
//                         <CardContent>
//                             <div className="flex h-40 items-center justify-center rounded-md border border-dashed">
//                                 <p className="text-muted-foreground">No recent alerts</p>
//                             </div>
//                         </CardContent>
//                     </Card>
//                 </div>
//             </div>
//         </AppLayout>
//     );
// }
