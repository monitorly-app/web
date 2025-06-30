import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';

interface UserPlan {
    id: number;
    name: string;
    price: number;
    frequency: number;
    max_servers: number;
    max_users: number;
    description: string | null;
}

interface UserData {
    id: number;
    name: string;
    email: string;
    plan: UserPlan;
}

interface Props {
    user: UserData;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/user/dashboard',
    },
];

export default function UserDashboard({ user }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div>ezzfezfz</div>
        </AppLayout>
    );
}
