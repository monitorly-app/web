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
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    role_id?: number;
    [key: string]: unknown;
}

// Interface pour les membres du projet avec pivot
export interface ProjectMember {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    pivot: {
        project_role_id: number;
        created_at?: string;
        updated_at?: string;
    };
}

export interface Project {
    id: string;
    name: string;
    description?: string;
    owner_id: number;
    owner?: User;
    members?: ProjectMember[]; // Utiliser ProjectMember au lieu de User
    created_at: string;
    updated_at: string;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    admin_mode?: boolean;
    currentProject?: Project;
    projects: Project[];
    flash?: {
        success?: string;
        error?: string;
        info?: string;
        warning?: string;
    };
    [key: string]: unknown;
}