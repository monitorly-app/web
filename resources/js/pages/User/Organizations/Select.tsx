import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Organization } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Activity, AlertTriangle, ArrowRight, Building, Calendar, Crown, Plus, Server, TrendingUp, Users, Zap } from 'lucide-react';

interface ExtendedOrganization extends Omit<Organization, 'plan'> {
    subscription_status?: 'active' | 'cancelled' | 'suspended';
    plan?: {
        id: number;
        name: string;
        price: number;
        max_servers: number;
    };
    servers_count?: number;
    members_count?: number;
    last_activity?: string;
}

interface Props {
    organizations: ExtendedOrganization[];
    user: {
        id: number;
        name: string;
        plan?: {
            name: string;
            max_organizations: number;
        };
    };
    organizationsCount: number;
    organizationLimits: {
        canCreate: boolean;
        currentCount: number;
        maxAllowed: number;
        planName: string;
    };
}

export default function OrganizationsSelect({ organizations, user, organizationsCount, organizationLimits }: Props) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const getStatusBadge = (org: ExtendedOrganization) => {
        if (org.subscription_status === 'active') {
            return <Badge variant="default">Actif</Badge>;
        } else if (org.subscription_status === 'cancelled') {
            return <Badge variant="destructive">Annulé</Badge>;
        } else if (org.subscription_status === 'suspended') {
            return <Badge variant="destructive">Suspendu</Badge>;
        }
        return <Badge variant="default">Actif</Badge>; // Par défaut, considérer comme actif
    };

    const getPlanColor = (planName: string) => {
        switch (planName) {
            case 'Free':
                return 'text-gray-600';
            case 'Pro':
                return 'text-blue-600';
            case 'Business':
                return 'text-purple-600';
            default:
                return 'text-gray-600';
        }
    };

    const getPlanIcon = (planName: string) => {
        switch (planName) {
            case 'Business':
                return <Crown className="h-4 w-4" />;
            case 'Pro':
                return <Zap className="h-4 w-4" />;
            default:
                return <Building className="h-4 w-4" />;
        }
    };

    return (
        <>
            <Head title="Gestion des Organisations" />

            <div className="container mx-auto max-w-7xl py-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Gestion des Organisations</h1>
                        <p className="text-muted-foreground mt-2">Vue d'ensemble de toutes vos organisations et leurs abonnements</p>
                    </div>
                    {organizationLimits.canCreate ? (
                        <Link href={route('organizations.create')}>
                            <Button size="lg" className="gap-2">
                                <Plus className="h-4 w-4" />
                                Nouvelle Organisation
                            </Button>
                        </Link>
                    ) : (
                        <div className="text-right">
                            <Button disabled size="lg" className="mb-2 gap-2">
                                <Plus className="h-4 w-4" />
                                Limite atteinte
                            </Button>
                            <p className="text-muted-foreground text-sm">
                                {organizationLimits.currentCount}/{organizationLimits.maxAllowed} organisations utilisées
                            </p>
                        </div>
                    )}
                </div>

                {/* Alertes et limitations */}
                {!organizationLimits.canCreate && (
                    <Alert className="mb-6 border-yellow-200 bg-yellow-50">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Limite d'organisations atteinte</strong> - Votre plan {organizationLimits.planName} vous limite à{' '}
                            {organizationLimits.maxAllowed} organisation(s).
                            <Link href="/pricing" className="text-primary ml-1 hover:underline">
                                Upgrader votre plan
                            </Link>{' '}
                            pour créer plus d'organisations.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Vue d'ensemble */}
                <div className="mb-8 grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 rounded-lg p-2">
                                    <Building className="text-primary h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-sm">Organisations</p>
                                    <p className="text-2xl font-bold">
                                        {organizationLimits.currentCount}
                                        {organizationLimits.maxAllowed !== -1 && (
                                            <span className="text-muted-foreground text-base font-normal">/{organizationLimits.maxAllowed}</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-green-100 p-2">
                                    <Server className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-sm">Total Serveurs</p>
                                    <p className="text-2xl font-bold">{organizations.reduce((total, org) => total + (org.servers_count || 0), 0)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-blue-100 p-2">
                                    <Users className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-sm">Total Membres</p>
                                    <p className="text-2xl font-bold">{organizations.reduce((total, org) => total + (org.members_count || 0), 0)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`rounded-lg p-2 ${user.plan?.name === 'Business' ? 'bg-purple-100' : user.plan?.name === 'Pro' ? 'bg-blue-100' : 'bg-gray-100'}`}
                                >
                                    <div className={getPlanColor(user.plan?.name || 'Free')}>{getPlanIcon(user.plan?.name || 'Free')}</div>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-sm">Plan Utilisateur</p>
                                    <p className="text-2xl font-bold">{user.plan?.name || 'Free'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6">
                    {organizations.length > 0 ? (
                        <div className="space-y-4">
                            {organizations.map((organization) => (
                                <Card key={organization.id} className="group overflow-hidden transition-shadow hover:shadow-lg">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-4">
                                                {/* Logo */}
                                                <div className="flex-shrink-0">
                                                    {organization.logo ? (
                                                        <img
                                                            src={`/storage/${organization.logo}`}
                                                            alt={`Logo ${organization.name}`}
                                                            className="h-16 w-16 rounded-lg border object-cover"
                                                        />
                                                    ) : (
                                                        <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-lg">
                                                            <Building className="text-primary h-8 w-8" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Infos principales */}
                                                <div className="min-w-0 flex-1">
                                                    <div className="mb-2 flex items-center gap-3">
                                                        <CardTitle className="text-xl">{organization.name}</CardTitle>
                                                        {getStatusBadge(organization)}
                                                        {organization.plan && (
                                                            <Badge
                                                                variant="outline"
                                                                className={`${getPlanColor(organization.plan.name)} border-current`}
                                                            >
                                                                {getPlanIcon(organization.plan.name)}
                                                                <span className="ml-1">{organization.plan.name}</span>
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {organization.description && (
                                                        <CardDescription className="mb-2 line-clamp-1">{organization.description}</CardDescription>
                                                    )}

                                                    {/* Métriques rapides */}
                                                    <div className="text-muted-foreground flex items-center gap-6 text-sm">
                                                        <div className="flex items-center gap-1">
                                                            <Server className="h-4 w-4" />
                                                            <span>{organization.servers_count || 0} serveurs</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Users className="h-4 w-4" />
                                                            <span>{organization.members_count || 0} membres</span>
                                                        </div>
                                                        {organization.last_activity && (
                                                            <div className="flex items-center gap-1">
                                                                <Activity className="h-4 w-4" />
                                                                <span>Dernière activité: {formatDate(organization.last_activity)}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-col gap-2">
                                                <Link href={route('organizations.dashboard', organization.id)}>
                                                    <Button className="w-full">
                                                        <span>Accéder</span>
                                                        <ArrowRight className="ml-2 h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="pt-0">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                            {/* Usage API */}
                                            {organization.api_usage_stats && (
                                                <div>
                                                    <div className="mb-2 text-sm font-medium">Usage API ce mois</div>
                                                    <div className="mb-1 text-2xl font-bold">
                                                        {organization.api_usage_stats.requests_this_month.toLocaleString()}
                                                        {organization.api_usage_stats.monthly_limit !== -1 && (
                                                            <span className="text-muted-foreground text-sm font-normal">
                                                                /{organization.api_usage_stats.monthly_limit.toLocaleString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {organization.api_usage_stats.monthly_limit !== -1 && (
                                                        <Progress value={organization.api_usage_stats.limit_percentage} className="h-2" />
                                                    )}
                                                </div>
                                            )}

                                            {/* Plan limits */}
                                            {organization.plan && (
                                                <div>
                                                    <div className="mb-2 text-sm font-medium">Limite serveurs</div>
                                                    <div className="mb-1 text-2xl font-bold">
                                                        {organization.servers_count || 0}
                                                        {organization.plan.max_servers !== -1 && (
                                                            <span className="text-muted-foreground text-sm font-normal">
                                                                /{organization.plan.max_servers}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {organization.plan.max_servers !== -1 && (
                                                        <Progress
                                                            value={((organization.servers_count || 0) / organization.plan.max_servers) * 100}
                                                            className="h-2"
                                                        />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="py-16 text-center">
                            <div className="mx-auto max-w-md">
                                <div className="mb-6">
                                    <div className="bg-muted mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
                                        <Building className="text-muted-foreground h-10 w-10" />
                                    </div>
                                </div>
                                <h3 className="mb-3 text-2xl font-semibold">Aucune organisation</h3>
                                <p className="text-muted-foreground mb-8 text-lg">
                                    Vous n'avez pas encore créé d'organisation. Créez votre première organisation pour commencer à surveiller vos
                                    serveurs.
                                </p>
                                {organizationLimits.canCreate ? (
                                    <Link href={route('organizations.create')}>
                                        <Button size="lg" className="gap-2">
                                            <Plus className="h-5 w-5" />
                                            Créer votre première organisation
                                        </Button>
                                    </Link>
                                ) : (
                                    <div>
                                        <Button disabled size="lg" className="mb-4 gap-2">
                                            <Plus className="h-5 w-5" />
                                            Limite atteinte
                                        </Button>
                                        <p className="text-muted-foreground text-sm">
                                            <Link href="/pricing" className="text-primary hover:underline">
                                                Upgrader votre plan
                                            </Link>{' '}
                                            pour créer des organisations
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Section d'aide enrichie */}
                <div className="bg-muted/30 mt-12 rounded-lg p-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <h3 className="mb-2 flex items-center gap-2 font-semibold">
                                <TrendingUp className="h-5 w-5" />
                                Gestion des organisations
                            </h3>
                            <p className="text-muted-foreground text-sm">
                                Chaque organisation a son propre abonnement et facturation. Vous pouvez créer plusieurs organisations pour séparer vos
                                projets ou environnements.
                            </p>
                        </div>
                        <div>
                            <h3 className="mb-2 flex items-center gap-2 font-semibold">
                                <Calendar className="h-5 w-5" />
                                Plans et facturation
                            </h3>
                            <p className="text-muted-foreground text-sm">
                                Chaque organisation commence avec le plan Free. Vous pouvez upgrader vers Pro ou Business à tout moment pour débloquer
                                plus de fonctionnalités.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
