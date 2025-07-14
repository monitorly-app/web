import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    items?: NavItem[];
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at?: string;
    created_at: string;
    updated_at: string;
    role_id: number;
    plan_id?: number;
    is_active: boolean;
    [key: string]: unknown;
}

// Interface pour les membres de l'organisation avec pivot
export interface OrganizationMember {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    pivot: {
        organization_role_id: number;
        created_at?: string;
        updated_at?: string;
    };
}

export interface Organization {
    id: string;
    name: string;
    logo?: string;
    description?: string;
    owner_id: number;
    owner?: User;
    members?: OrganizationMember[];
    servers?: Server[];
    api_key?: string;
    encryption_key?: string;
    api_usage_stats?: {
        requests_this_month: number;
        monthly_limit: number;
        limit_percentage: number;
        last_used: string | null;
        reset_date: string;
    };
    // Champs de facturation
    plan_id?: number;
    plan?: Plan;
    subscription_status?: 'trial' | 'active' | 'cancelled' | 'suspended';
    trial_ends_at?: string;
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    next_billing_date?: string;
    created_at: string;
    updated_at: string;
}

export interface Plan {
    id: number;
    name: string;
    description: string;
    price: {
        monthly: number;
        yearly: number;
    };
    billing_cycle: string;
    max_servers: number;
    max_organizations: number;
    max_members_per_organization: number;
    features: string[];
    is_active: boolean;
}

export interface Role {
    id: number;
    name: string;
    description: string;
}

export interface Server {
    id: string;
    name: string;
    hostname: string;
    ip_address?: string;
    port: number;
    status: 'online' | 'offline' | 'warning';
    last_ping_at?: string;
    organization_id: string;
    token: string;
    created_at: string;
    updated_at: string;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    admin_mode: boolean;
    organizations: Organization[];
    currentOrganization?: Organization;
    organizationLimits?: {
        canCreate: boolean;
        currentCount: number;
        maxAllowed: number;
        planName: string;
        allowed: boolean;
    };
    flash?: {
        success?: string;
        error?: string;
        info?: string;
        warning?: string;
    };
    [key: string]: unknown;
}

export type PageProps<T extends Record<string, unknown> = Record<string, unknown>> = T & {
    auth: {
        user: User;
    };
};