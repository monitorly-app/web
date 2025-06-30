import { AppAdminSidebar } from '@/components/app-admin-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { BreadcrumbItem } from '@/types';
import { ReactNode } from 'react';
import { Breadcrumbs } from '../components/breadcrumbs';

interface AdminLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default function AdminLayout({ children, breadcrumbs }: AdminLayoutProps) {
    return (
        <SidebarProvider>
            <AppAdminSidebar />
            <SidebarInset>
                <div className="flex h-screen flex-col">
                    {breadcrumbs && <Breadcrumbs breadcrumbs={breadcrumbs} />}
                    <main className="flex-1 overflow-auto">{children}</main>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
