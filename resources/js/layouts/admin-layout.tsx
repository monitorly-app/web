import { useToast } from '@/hooks/use-toast';
import AppAdminSidebarLayout from '@/layouts/app/app-admin-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';

interface AdminLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default function AdminLayout({ children, breadcrumbs, ...props }: AdminLayoutProps) {
    const { ToastContainer } = useToast();
    return (
        <AppAdminSidebarLayout breadcrumbs={breadcrumbs} {...props}>
            {children}
            <ToastContainer />
        </AppAdminSidebarLayout>
    );
}
