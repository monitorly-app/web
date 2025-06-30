import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Head, Link, usePage } from '@inertiajs/react';
import { Activity, BarChart3, Building, Check, Clock, Crown, Database, Globe, Headphones, Server, Shield, Users, Zap } from 'lucide-react';
import { useState } from 'react';

interface Plan {
    id: number;
    name: string;
    description: string;
    price: {
        monthly: number;
        yearly: number;
    };
    frequency: number;
    max_servers: number;
    max_users: number;
    max_organizations: number;
    max_metrics: number;
    max_alerts: number;
    features?: string[];
    is_active?: boolean;
}

interface Props {
    plans: Plan[];
    currentUserPlan?: Plan;
}

export default function Pricing({ plans, currentUserPlan }: Props) {
    const { auth } = usePage().props as any;
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

    const getIconForPlan = (planName: string) => {
        switch (planName) {
            case 'Business':
                return <Crown className="h-6 w-6" />;
            case 'Pro':
                return <Zap className="h-6 w-6" />;
            default:
                return <Building className="h-6 w-6" />;
        }
    };

    const getColorForPlan = (planName: string) => {
        switch (planName) {
            case 'Business':
                return 'border-purple-200 bg-purple-50';
            case 'Pro':
                return 'border-blue-200 bg-blue-50';
            default:
                return 'border-gray-200 bg-gray-50';
        }
    };

    const getFeatureIcon = (feature: string) => {
        if (feature.includes('serveur')) return <Server className="h-4 w-4" />;
        if (feature.includes('membre') || feature.includes('utilisateur')) return <Users className="h-4 w-4" />;
        if (feature.includes('organisation')) return <Building className="h-4 w-4" />;
        if (feature.includes('API') || feature.includes('requête')) return <Activity className="h-4 w-4" />;
        if (feature.includes('support')) return <Headphones className="h-4 w-4" />;
        if (feature.includes('analytique') || feature.includes('rapport')) return <BarChart3 className="h-4 w-4" />;
        if (feature.includes('backup') || feature.includes('sauvegarde')) return <Database className="h-4 w-4" />;
        if (feature.includes('SSL') || feature.includes('sécurité')) return <Shield className="h-4 w-4" />;
        if (feature.includes('domaine')) return <Globe className="h-4 w-4" />;
        if (feature.includes('temps réel') || feature.includes('monitoring')) return <Clock className="h-4 w-4" />;
        return <Check className="h-4 w-4" />;
    };

    const isCurrentPlan = (plan: Plan) => {
        return currentUserPlan?.id === plan.id;
    };

    const canUpgrade = (plan: Plan) => {
        if (!currentUserPlan) return plan.name !== 'Free';

        const planHierarchy = { Free: 0, Pro: 1, Business: 2 };
        return planHierarchy[plan.name as keyof typeof planHierarchy] > planHierarchy[currentUserPlan.name as keyof typeof planHierarchy];
    };

    const generateFeatures = (plan: Plan): string[] => {
        const features: string[] = [];

        // Fréquence de monitoring
        if (plan.frequency) {
            if (plan.frequency === 1) {
                features.push('Monitoring en temps réel (1 minute)');
            } else if (plan.frequency <= 15) {
                features.push(`Monitoring haute fréquence (${plan.frequency} minutes)`);
            } else {
                features.push(`Monitoring standard (${plan.frequency} minutes)`);
            }
        }

        // Métriques
        if (plan.max_metrics === -1) {
            features.push('Métriques illimitées');
        } else {
            features.push(`${plan.max_metrics} métriques par serveur`);
        }

        // Alertes
        if (plan.max_alerts === -1) {
            features.push('Alertes illimitées');
        } else {
            features.push(`${plan.max_alerts} alertes`);
        }

        // Fonctionnalités spécifiques par plan
        switch (plan.name) {
            case 'Free':
                features.push('Support par email');
                features.push('Dashboard basique');
                features.push('Historique 7 jours');
                break;
            case 'Pro':
                features.push('Support prioritaire');
                features.push('Dashboard avancé');
                features.push('Historique 30 jours');
                features.push('Notifications SMS');
                features.push("API d'intégration");
                break;
            case 'Business':
                features.push('Support téléphonique');
                features.push('Dashboard personnalisé');
                features.push('Historique illimité');
                features.push('Notifications multi-canaux');
                features.push('API complète');
                features.push('SSO/SAML');
                features.push('Rapports automatisés');
                break;
        }

        return features;
    };

    return (
        <>
            <Head title="Plans et Tarifs" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="container mx-auto max-w-7xl py-12">
                    {/* Header */}
                    <div className="mb-16 text-center">
                        <h1 className="mb-4 text-4xl font-bold">Plans et Tarifs</h1>
                        <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
                            Choisissez le plan qui correspond à vos besoins de monitoring. Commencez gratuitement et évoluez selon votre croissance.
                        </p>

                        {/* Billing Cycle Selector */}
                        <div className="mt-8 flex justify-center">
                            <div className="rounded-lg bg-gray-100 p-1">
                                <button
                                    onClick={() => setBillingCycle('monthly')}
                                    className={`rounded-md px-6 py-2 text-sm font-medium transition-all ${
                                        billingCycle === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Mensuel
                                </button>
                                <button
                                    onClick={() => setBillingCycle('yearly')}
                                    className={`rounded-md px-6 py-2 text-sm font-medium transition-all ${
                                        billingCycle === 'yearly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Annuel
                                    <span className="ml-1 font-semibold text-green-600">-10%</span>
                                </button>
                            </div>
                        </div>

                        {currentUserPlan && (
                            <div className="mt-6">
                                <Badge variant="outline" className="px-4 py-2 text-lg">
                                    Plan actuel : {currentUserPlan.name}
                                </Badge>
                            </div>
                        )}
                    </div>

                    {/* Plans Comparison */}
                    <div className="mb-16 grid gap-8 md:grid-cols-3">
                        {plans.map((plan, index) => (
                            <Card
                                key={plan.id}
                                className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                                    plan.name === 'Pro' ? 'scale-105 ring-2 ring-blue-500' : ''
                                } ${getColorForPlan(plan.name)}`}
                            >
                                {plan.name === 'Pro' && (
                                    <div className="absolute top-0 right-0 left-0 bg-blue-500 py-2 text-center text-sm font-medium text-white">
                                        ⭐ Plus Populaire
                                    </div>
                                )}

                                {isCurrentPlan(plan) && (
                                    <div className="absolute top-4 right-4">
                                        <Badge variant="default">Actuel</Badge>
                                    </div>
                                )}

                                <CardHeader className={`text-center ${plan.name === 'Pro' ? 'pt-12' : 'pt-8'}`}>
                                    <div
                                        className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
                                            plan.name === 'Business'
                                                ? 'bg-purple-100 text-purple-600'
                                                : plan.name === 'Pro'
                                                  ? 'bg-blue-100 text-blue-600'
                                                  : 'bg-gray-100 text-gray-600'
                                        }`}
                                    >
                                        {getIconForPlan(plan.name)}
                                    </div>
                                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                    <CardDescription className="text-base">{plan.description}</CardDescription>

                                    <div className="mt-6">
                                        <div className="flex items-baseline justify-center">
                                            <span className="text-5xl font-bold">
                                                {plan.price[billingCycle] === 0 ? 'Gratuit' : `${plan.price[billingCycle]}€`}
                                            </span>
                                            {plan.price[billingCycle] > 0 && (
                                                <span className="text-muted-foreground ml-2">/{billingCycle === 'monthly' ? 'mois' : 'an'}</span>
                                            )}
                                        </div>
                                        {plan.price[billingCycle] > 0 && billingCycle === 'yearly' && plan.price.monthly > 0 && (
                                            <p className="text-muted-foreground mt-2 text-sm">
                                                Soit {Math.round(plan.price.yearly / 12)}€/mois •
                                                <span className="ml-1 font-medium text-green-600">
                                                    -{Math.round(((plan.price.monthly * 12 - plan.price.yearly) / (plan.price.monthly * 12)) * 100)}%
                                                    vs mensuel
                                                </span>
                                            </p>
                                        )}
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-6">
                                    {/* Limites principales */}
                                    <div className="grid gap-3">
                                        <div className="flex items-center justify-between border-b border-dashed py-2">
                                            <div className="flex items-center gap-2">
                                                <Building className="text-muted-foreground h-4 w-4" />
                                                <span className="text-sm">Organisations</span>
                                            </div>
                                            <span className="font-medium">{plan.max_organizations === -1 ? 'Illimité' : plan.max_organizations}</span>
                                        </div>

                                        <div className="flex items-center justify-between border-b border-dashed py-2">
                                            <div className="flex items-center gap-2">
                                                <Server className="text-muted-foreground h-4 w-4" />
                                                <span className="text-sm">Serveurs par organisation</span>
                                            </div>
                                            <span className="font-medium">{plan.max_servers === -1 ? 'Illimité' : plan.max_servers}</span>
                                        </div>

                                        <div className="flex items-center justify-between py-2">
                                            <div className="flex items-center gap-2">
                                                <Users className="text-muted-foreground h-4 w-4" />
                                                <span className="text-sm">Membres par organisation</span>
                                            </div>
                                            <span className="font-medium">{plan.max_users === -1 ? 'Illimité' : plan.max_users}</span>
                                        </div>
                                    </div>

                                    {/* Features */}
                                    <div className="space-y-3">
                                        <h4 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
                                            Fonctionnalités incluses
                                        </h4>
                                        <div className="space-y-2">
                                            {generateFeatures(plan).map((feature, featureIndex) => (
                                                <div key={featureIndex} className="flex items-start gap-2">
                                                    <div className="mt-0.5 text-green-500">{getFeatureIcon(feature)}</div>
                                                    <span className="text-sm">{feature}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* CTA Button */}
                                    <div className="pt-4">
                                        {isCurrentPlan(plan) ? (
                                            <Button disabled className="w-full" size="lg">
                                                Plan actuel
                                            </Button>
                                        ) : canUpgrade(plan) ? (
                                            <Button
                                                className={`w-full ${
                                                    plan.name === 'Business'
                                                        ? 'bg-purple-600 hover:bg-purple-700'
                                                        : plan.name === 'Pro'
                                                          ? 'bg-blue-600 hover:bg-blue-700'
                                                          : ''
                                                }`}
                                                size="lg"
                                            >
                                                Passer à {plan.name}
                                            </Button>
                                        ) : (
                                            <Button variant="outline" disabled className="w-full" size="lg">
                                                Non disponible
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* FAQ Section */}
                    <div className="mx-auto max-w-4xl">
                        <h2 className="mb-12 text-center text-3xl font-bold">Questions Fréquentes</h2>

                        <div className="grid gap-8 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Puis-je changer de plan à tout moment ?</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. Les changements prennent effet immédiatement
                                        et la facturation est ajustée au prorata.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Que se passe-t-il à la fin de l'essai ?</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Votre première organisation bénéficie de 14 jours d'essai gratuit. Les organisations suivantes ont 7 jours
                                        d'essai avant de nécessiter un abonnement payant.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Comment fonctionne la facturation par organisation ?</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Chaque organisation a son propre abonnement. Vous ne payez que pour les organisations qui ont dépassé leur
                                        période d'essai gratuit.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Support technique inclus ?</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Le support par email est inclus dans tous les plans. Les plans Pro et Business bénéficient d'un support
                                        prioritaire et d'une assistance téléphonique.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* CTA Section */}
                    <div className="mt-16 rounded-2xl bg-white p-8 text-center shadow-lg">
                        <h3 className="mb-4 text-2xl font-bold">Prêt à commencer ?</h3>
                        <p className="text-muted-foreground mx-auto mb-6 max-w-2xl">
                            Commencez dès maintenant avec notre plan gratuit et créez votre première organisation. Aucune carte de crédit requise pour
                            l'essai.
                        </p>
                        {auth.user ? (
                            <Link href={route('organizations.create')}>
                                <Button size="lg" className="gap-2">
                                    <Building className="h-5 w-5" />
                                    Créer une organisation
                                </Button>
                            </Link>
                        ) : (
                            <Link href={route('register')}>
                                <Button size="lg" className="gap-2">
                                    <Users className="h-5 w-5" />
                                    Créer un compte gratuit
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
