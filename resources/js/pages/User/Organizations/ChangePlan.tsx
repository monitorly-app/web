import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, Organization } from '@/types';
import { Head, router } from '@inertiajs/react';
import { AlertTriangle, BarChart3, Building, Crown, Server, TrendingDown, TrendingUp, Users, Zap } from 'lucide-react';
import { useState } from 'react';

interface Plan {
    id: number;
    name: string;
    description: string;
    price: {
        monthly: number;
        yearly: number;
    };
    max_servers: number;
    max_organizations: number;
    max_metrics: number;
    frequency: number;
    is_active: boolean;
}

interface Props {
    organization: Organization & {
        plan: Plan & {
            billing_period: 'monthly' | 'yearly';
        };
        servers_count: number;
        members_count: number;
    };
    plans: Plan[];
    currentUsage: {
        servers: number;
        members: number;
        metrics: number;
    };
}

export default function OrganizationChangePlan({ organization, plans, currentUsage }: Props) {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(organization.plan.billing_period || 'yearly');
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

    const getCurrentPlanPrice = () => {
        if (!organization.plan.price) return 0;
        return billingCycle === 'monthly' ? organization.plan.price.monthly : organization.plan.price.yearly;
    };

    const getPlanPrice = (plan: Plan) => {
        return billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly;
    };

    const getSavingsPercentage = (plan: Plan) => {
        if (plan.price.monthly === 0) return 0;
        const monthlyTotal = plan.price.monthly * 12;
        const savings = monthlyTotal - plan.price.yearly;
        return Math.round((savings / monthlyTotal) * 100);
    };

    const canChangeToPlan = (plan: Plan) => {
        if (plan.id === organization.plan.id) return { allowed: false, reason: 'current' };

        // Check usage constraints for downgrades
        const constraints = [];

        if (plan.max_servers !== -1 && currentUsage.servers > plan.max_servers) {
            constraints.push(`Vous avez ${currentUsage.servers} serveurs mais ce plan limite à ${plan.max_servers}`);
        }

        if (plan.max_metrics !== -1 && currentUsage.metrics > plan.max_metrics) {
            constraints.push(`Vous avez ${currentUsage.metrics} métriques mais ce plan limite à ${plan.max_metrics}`);
        }

        return {
            allowed: constraints.length === 0,
            reason: constraints.length > 0 ? 'constraints' : 'allowed',
            constraints,
        };
    };

    const isUpgrade = (plan: Plan) => {
        const planHierarchy = { Free: 0, Pro: 1, Business: 2 };
        return planHierarchy[plan.name as keyof typeof planHierarchy] > planHierarchy[organization.plan.name as keyof typeof planHierarchy];
    };

    const isDowngrade = (plan: Plan) => {
        const planHierarchy = { Free: 0, Pro: 1, Business: 2 };
        return planHierarchy[plan.name as keyof typeof planHierarchy] < planHierarchy[organization.plan.name as keyof typeof planHierarchy];
    };

    const getPlanIcon = (planName: string) => {
        switch (planName) {
            case 'Business':
                return <Crown className="h-5 w-5 text-purple-600" />;
            case 'Pro':
                return <Zap className="h-5 w-5 text-blue-600" />;
            default:
                return <Building className="h-5 w-5 text-gray-600" />;
        }
    };

    const handlePlanChange = (plan: Plan) => {
        // Here you would typically send a request to change the plan
        router.post(`/organizations/${organization.id}/change-plan`, {
            plan_id: plan.id,
            billing_period: billingCycle,
        });
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
        {
            title: 'Change Plan',
            href: `/organizations/${organization.id}/change-plan`,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${organization.name} - Change Plan`} />

            <div className="p-6">
                <div className="mb-8">
                    <h1 className="text-2xl font-semibold">Change Plan</h1>
                    <p className="text-muted-foreground mt-2">Update your organization's subscription plan. Changes take effect immediately.</p>
                </div>

                {/* Current Plan Summary */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            Current Plan: {organization.plan.name}
                            {getPlanIcon(organization.plan.name)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Current Usage</p>
                                <div className="mt-2 space-y-1">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Server className="h-4 w-4" />
                                        {currentUsage.servers} servers
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Users className="h-4 w-4" />
                                        {currentUsage.members} members
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <BarChart3 className="h-4 w-4" />
                                        {currentUsage.metrics} metrics
                                    </div>
                                </div>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Current Price</p>
                                <p className="mt-2 text-2xl font-bold text-green-600">
                                    {getCurrentPlanPrice() === 0 ? 'Free' : `€${getCurrentPlanPrice()}`}
                                </p>
                                <p className="text-muted-foreground text-sm">
                                    {getCurrentPlanPrice() > 0 && `per ${billingCycle === 'monthly' ? 'month' : 'year'}`}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Billing Cycle</p>
                                <Badge variant="outline" className="mt-2">
                                    {organization.plan.billing_period === 'monthly' ? 'Monthly' : 'Yearly'}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Billing Cycle Toggle */}
                <div className="mb-8 flex justify-center">
                    <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 p-1">
                        <button
                            className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                                billingCycle === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                            }`}
                            onClick={() => setBillingCycle('monthly')}
                        >
                            Monthly
                        </button>
                        <button
                            className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                                billingCycle === 'yearly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                            }`}
                            onClick={() => setBillingCycle('yearly')}
                        >
                            Yearly
                            <span className="ml-1 text-green-600">Save {getSavingsPercentage(organization.plan)}%</span>
                        </button>
                    </div>
                </div>

                {/* Available Plans */}
                <div className="grid gap-6 md:grid-cols-3">
                    {plans.map((plan) => {
                        const changeCheck = canChangeToPlan(plan);
                        const isCurrentPlan = plan.id === organization.plan.id;

                        return (
                            <Card
                                key={plan.id}
                                className={`relative transition-all ${isCurrentPlan ? 'bg-blue-500 ring-2 ring-blue-500' : ''} ${
                                    !changeCheck.allowed && !isCurrentPlan ? 'opacity-75' : ''
                                }`}
                            >
                                {isCurrentPlan && (
                                    <div className="absolute top-4 right-4">
                                        <Badge variant="default">Current</Badge>
                                    </div>
                                )}

                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        {getPlanIcon(plan.name)}
                                        <CardTitle>{plan.name}</CardTitle>
                                    </div>
                                    <CardDescription>{plan.description}</CardDescription>

                                    <div className="mt-4">
                                        <div className="flex items-baseline">
                                            <span className="text-3xl font-bold">{getPlanPrice(plan) === 0 ? 'Free' : `€${getPlanPrice(plan)}`}</span>
                                            {getPlanPrice(plan) > 0 && (
                                                <span className="text-muted-foreground ml-2">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                                            )}
                                        </div>

                                        {billingCycle === 'yearly' && plan.price.monthly > 0 && (
                                            <p className="mt-1 text-sm text-green-600">Save {getSavingsPercentage(plan)}% vs monthly</p>
                                        )}
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    {/* Plan limits */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span>Servers</span>
                                            <span className="font-medium">{plan.max_servers === -1 ? 'Unlimited' : plan.max_servers}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span>Metrics per server</span>
                                            <span className="font-medium">{plan.max_metrics === -1 ? 'Unlimited' : plan.max_metrics}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span>Monitoring frequency</span>
                                            <span className="font-medium">{plan.frequency} min</span>
                                        </div>
                                    </div>

                                    {/* Usage constraints warnings */}
                                    {changeCheck.reason === 'constraints' && (
                                        <Alert className="border-red-200 bg-red-50">
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertDescription className="text-sm">
                                                <strong>Cannot downgrade:</strong>
                                                <ul className="mt-1 list-inside list-disc">
                                                    {changeCheck.constraints?.map((constraint, idx) => <li key={idx}>{constraint}</li>)}
                                                </ul>
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {/* Action button */}
                                    <div className="pt-2">
                                        {isCurrentPlan ? (
                                            <Button disabled className="w-full">
                                                Current Plan
                                            </Button>
                                        ) : changeCheck.allowed ? (
                                            <Button
                                                className={`w-full gap-2 ${
                                                    isUpgrade(plan) ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'
                                                }`}
                                                onClick={() => handlePlanChange(plan)}
                                            >
                                                {isUpgrade(plan) ? (
                                                    <>
                                                        <TrendingUp className="h-4 w-4" />
                                                        Upgrade to {plan.name}
                                                    </>
                                                ) : (
                                                    <>
                                                        <TrendingDown className="h-4 w-4" />
                                                        Downgrade to {plan.name}
                                                    </>
                                                )}
                                            </Button>
                                        ) : (
                                            <Button disabled className="w-full" variant="outline">
                                                Cannot Switch
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Help Section */}
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>Need help choosing?</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <h4 className="mb-2 font-medium">Upgrading</h4>
                                <p className="text-muted-foreground text-sm">
                                    Upgrades take effect immediately. You'll be charged the prorated amount for the rest of your billing cycle.
                                </p>
                            </div>
                            <div>
                                <h4 className="mb-2 font-medium">Downgrading</h4>
                                <p className="text-muted-foreground text-sm">
                                    To downgrade, you may need to reduce your usage first (delete servers, remove team members) to fit within the new
                                    plan's limits.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
