import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, Organization } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, ArrowRight, Building, CheckCircle, CreditCard, Crown, DollarSign, Receipt, TrendingUp, Zap } from 'lucide-react';

interface Props {
    organization: Organization & {
        subscription_status: 'active' | 'cancelled' | 'suspended';
        plan?: {
            id: number;
            name: string;
            price: {
                monthly: number;
                yearly: number;
            };
            billing_period: 'monthly' | 'yearly';
            max_servers: number;
            max_members_per_organization: number;
        };
        servers_count: number;
        members_count: number;
    };
}

export default function OrganizationBilling({ organization }: Props) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    // Helper functions pour gérer les prix
    const getPlanPrice = (plan: any) => {
        if (!plan || !plan.price) return 0;
        // Si c'est déjà un nombre, le retourner (rétrocompatibilité)
        if (typeof plan.price === 'number') return plan.price;
        // Utiliser la période de facturation de l'organisation
        const period = plan.billing_period || 'yearly';
        return period === 'monthly' ? plan.price.monthly : plan.price.yearly;
    };

    const formatPlanPrice = (plan: any) => {
        const price = getPlanPrice(plan);
        if (price === 0) return 'Plan gratuit';
        const period = plan.billing_period || 'yearly';
        const periodText = period === 'monthly' ? 'mois' : 'an';
        return `${price}€/${periodText}`;
    };

    const getPlanPeriod = (plan: any) => {
        const period = plan.billing_period || 'yearly';
        return period === 'monthly' ? 'par mois' : 'par an';
    };

    const getStatusBadge = () => {
        const status = organization.subscription_status;
        if (status === 'active') {
            return (
                <Badge variant="default" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Abonnement actif
                </Badge>
            );
        } else if (status === 'cancelled') {
            return (
                <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Abonnement annulé
                </Badge>
            );
        } else if (status === 'suspended') {
            return (
                <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Abonnement suspendu
                </Badge>
            );
        }
        return (
            <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Abonnement actif
            </Badge>
        );
    };

    const getPlanIcon = (planName?: string) => {
        switch (planName) {
            case 'Business':
                return <Crown className="h-5 w-5 text-purple-600" />;
            case 'Pro':
                return <Zap className="h-5 w-5 text-blue-600" />;
            default:
                return <Building className="h-5 w-5 text-gray-600" />;
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: organization.name,
            href: `/organizations/${organization.id}`,
        },
        {
            title: 'Billing',
            href: `/organizations/${organization.id}/billing`,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${organization.name} - Billing`} />

            <div className="p-4 md:p-6">
                <h1 className="mb-6 text-xl md:text-2xl font-semibold">Facturation</h1>

                <div className="space-y-6">
                    {/* Abonnement actuel */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Abonnement actuel
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>{getStatusBadge()}</div>
                                <Link href={route('organizations.change-plan', organization.id)}>
                                    <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
                                        <TrendingUp className="h-4 w-4" />
                                        Changer de plan
                                    </Button>
                                </Link>
                            </div>

                            {organization.plan && (
                                <div className="bg-accent flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg p-4">
                                    <div className="flex items-center gap-3 flex-1">
                                        {getPlanIcon(organization.plan.name)}
                                        <div className="flex-1">
                                            <p className="text-lg font-medium">{organization.plan.name}</p>
                                            <p className="text-muted-foreground text-sm">{formatPlanPrice(organization.plan)}</p>
                                        </div>
                                    </div>
                                    {getPlanPrice(organization.plan) > 0 && (
                                        <div className="text-left sm:text-right">
                                            <p className="text-2xl font-bold text-green-600">{getPlanPrice(organization.plan)}€</p>
                                            <p className="text-muted-foreground text-xs">{getPlanPeriod(organization.plan)}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Informations de facturation */}
                            {/* <div className="grid gap-4 border-t pt-4 md:grid-cols-2">
                                <div>
                                    <p className="text-muted-foreground text-sm">Plan actuel</p>
                                    <p className="font-medium">{organization.plan?.name || 'Free'}</p>
                                </div>
                            </div> */}
                        </CardContent>
                    </Card>

                    {/* Historique de facturation */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Receipt className="h-5 w-5" />
                                Historique de facturation
                            </CardTitle>
                            <CardDescription>Consultez vos factures passées et futures</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Messages selon le statut */}

                            {organization.subscription_status === 'active' && (!organization.plan || getPlanPrice(organization.plan) === 0) && (
                                <div className="py-8 text-center">
                                    <DollarSign className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                                    <h3 className="mb-2 text-lg font-medium">Plan gratuit</h3>
                                    <p className="text-muted-foreground">Aucune facturation pour le plan gratuit.</p>
                                </div>
                            )}

                            {(organization.subscription_status === 'cancelled' || organization.subscription_status === 'suspended') && (
                                <div className="py-8 text-center">
                                    <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
                                    <h3 className="mb-2 text-lg font-medium">
                                        Abonnement {organization.subscription_status === 'cancelled' ? 'annulé' : 'suspendu'}
                                    </h3>
                                    <p className="text-muted-foreground">Contactez le support pour plus d'informations sur votre abonnement.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Actions rapides */}
                    <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg">Changer de plan</CardTitle>
                                <CardDescription className="text-sm">Découvrez tous nos plans et leurs fonctionnalités</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Link href={route('organizations.change-plan', organization.id)}>
                                    <Button className="w-full gap-2">
                                        <TrendingUp className="h-4 w-4" />
                                        Voir tous les plans
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg">Support</CardTitle>
                                <CardDescription className="text-sm">Besoin d'aide avec votre facturation ?</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline" className="w-full gap-2">
                                    <CreditCard className="h-4 w-4" />
                                    Contacter le support
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
