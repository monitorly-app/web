import { type PropsWithChildren } from 'react';

interface OrganizationCreationLayoutProps {
    title?: string;
    description?: string;
    showHeader?: boolean;
}

export default function OrganizationCreationLayout({
    children,
    title,
    description,
    showHeader = false,
}: PropsWithChildren<OrganizationCreationLayoutProps>) {
    return <div className="bg-background flex min-h-screen flex-col items-center justify-center sm:justify-center sm:pt-0">{children}</div>;
}
