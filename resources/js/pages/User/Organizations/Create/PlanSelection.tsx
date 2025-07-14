import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import clsx from 'clsx';
import { BarChart3, Check, Clock, Server, Users } from 'lucide-react';
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

interface PlanSelectionProps {
    plans: Plan[];
    onPlanSelect: (plan: Plan, billingCycle: 'monthly' | 'yearly') => void;
}

export default function PlanSelection({ plans, onPlanSelect }: PlanSelectionProps) {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    const getRecommended = (planName: string) => {
        return planName.toLowerCase() === 'pro';
    };

    const getPriceForCycle = (plan: Plan) => {
        return billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly;
    };

    const getSavingsPercentage = (plan: Plan) => {
        if (plan.price.monthly === 0) return 0;
        const monthlyTotal = plan.price.monthly * 12;
        const savings = monthlyTotal - plan.price.yearly;
        return Math.round((savings / monthlyTotal) * 100);
    };

    return (
        <>
            <div className="fixed top-8 left-8 z-50 flex gap-2">
                <button
                    onClick={() => console.log('ddd')}
                    className="hover:bg-accent hover:text-accent-foreground flex size-8 cursor-pointer items-center justify-center rounded-full border border-white/5 bg-white/5 text-white"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" width="20" height="20">
                        <path
                            fill-rule="evenodd"
                            d="M4.558 4.558a.625.625 0 0 1 .884 0L10 9.116l4.558-4.558a.625.625 0 1 1 .884.884L10.884 10l4.558 4.558a.625.625 0 1 1-.884.884L10 10.884l-4.558 4.558a.625.625 0 1 1-.884-.884L9.116 10 4.558 5.442a.625.625 0 0 1 0-.884Z"
                            clip-rule="evenodd"
                            fill="currentColor"
                        ></path>
                    </svg>
                </button>
            </div>
            <div className="relative max-w-full space-y-10 py-24">
                <div>
                    <h1 className="motion-preset-blur-up text-2xl font-semibold">Select your plan</h1>
                    <p className="motion-preset-blur-up motion-delay-100 mt-1 text-neutral-400">Pick one of the following Organization plans.</p>
                </div>

                {/* Billing cycle toggle */}
                <div className="motion-preset-blur-up motion-delay-200 flex justify-center">
                    <div className="flex items-center rounded-lg border border-white/10 bg-white/5 p-1">
                        <button
                            className={clsx(
                                'rounded-md px-4 py-2 text-sm font-medium transition-all',
                                billingCycle === 'monthly' ? 'bg-white text-black shadow-sm' : 'text-neutral-400 hover:text-white',
                            )}
                            onClick={() => setBillingCycle('monthly')}
                        >
                            Monthly
                        </button>
                        <button
                            className={clsx(
                                'relative rounded-md px-4 py-2 text-sm font-medium transition-all',
                                billingCycle === 'yearly' ? 'bg-white text-black shadow-sm' : 'text-neutral-400 hover:text-white',
                            )}
                            onClick={() => setBillingCycle('yearly')}
                        >
                            Yearly
                            <span className="absolute -top-3 -right-3 rounded-full bg-emerald-500 px-1.5 py-0.5 text-xs text-white">Save 20%</span>
                        </button>
                    </div>
                </div>

                <div className="scrollbar-none flex snap-x snap-mandatory gap-2 overflow-x-auto overflow-y-hidden scroll-smooth rounded-3xl border border-white/5 bg-white/1 p-2 backdrop-blur-md">
                    {plans.map((plan) => (
                        <Card
                            key={plan.id}
                            className={clsx(
                                'motion-preset-blur-up motion-duration-1000 motion-delay-0 flex min-w-[308px] flex-1 shrink-0 snap-center flex-col gap-6 rounded-2xl border border-neutral-800 bg-white/2 p-8 pb-9 shadow-2xl',
                                getRecommended(plan.name) && 'border-emerald-800 bg-emerald-950',
                            )}
                        >
                            <div className="space-y-0.5 border-b border-dashed border-neutral-800 pb-6">
                                <CardTitle className="text-xl leading-7 font-semibold text-white">{plan.name}</CardTitle>
                                <CardDescription className="text-sm/tight font-light text-neutral-400">{plan.description}</CardDescription>
                            </div>

                            <div className="inline-flex items-center gap-2 text-neutral-400">
                                <p className="text-5xl font-semibold text-white">
                                    {getPriceForCycle(plan) === 0 ? '$0' : `€${getPriceForCycle(plan)}`}
                                </p>
                                <p className="text-neutral-400">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</p>
                            </div>

                            {billingCycle === 'yearly' && plan.price.monthly > 0 && (
                                <div className="text-center">
                                    <p className="text-sm text-emerald-400">
                                        Save {getSavingsPercentage(plan)}% (€{plan.price.monthly * 12 - plan.price.yearly}/year)
                                    </p>
                                </div>
                            )}

                            <div className="border-b border-dashed border-neutral-800 pb-6">
                                <button
                                    className={clsx(
                                        'ring-offset-background hover:bg-accent hover:text-accent-foreground inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-white/5 bg-white/5 px-3 whitespace-nowrap text-neutral-400 transition-colors focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none active:translate-y-px disabled:pointer-events-none disabled:opacity-50',
                                        getRecommended(plan.name) && 'hover:border-emerald-800 hover:bg-emerald-900',
                                    )}
                                    onClick={() => onPlanSelect(plan, billingCycle)}
                                >
                                    Start with {plan.name}
                                </button>
                            </div>

                            <CardContent className="flex flex-col gap-5 text-sm leading-tight">
                                <div className="flex items-center">
                                    <Server className="mr-3 h-4 w-4 text-emerald-600" />
                                    <span className="text-sm">
                                        {plan.max_servers === -1 ? 'Unlimited' : plan.max_servers} servers per organization
                                    </span>
                                </div>

                                <div className="flex items-center">
                                    <BarChart3 className="mr-3 h-4 w-4 text-emerald-600" />
                                    <span className="text-sm">
                                        {plan.max_organizations === -1 ? 'Unlimited' : plan.max_organizations} organization
                                        {plan.max_organizations !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                <div className="flex items-center">
                                    <Clock className="mr-3 h-4 w-4 text-emerald-600" />
                                    <span className="text-sm">
                                        Monitoring every {plan.frequency} minute{plan.frequency !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                <div className="flex items-center">
                                    <Users className="mr-3 h-4 w-4 text-emerald-600" />
                                    <span className="text-sm">Unlimited team members</span>
                                </div>

                                <div className="flex items-center">
                                    <Check className="mr-3 h-4 w-4 text-emerald-600" />
                                    <span className="text-sm">{plan.max_metrics === -1 ? 'Unlimited' : plan.max_metrics} metrics per server</span>
                                </div>
                            </CardContent>
                            {plan.price.monthly === 0 && <p className="mt-4 text-sm text-neutral-400">Max 3 free orgs per user.</p>}
                        </Card>
                    ))}
                </div>

                <div className="text-center">
                    <p className="text-sm text-gray-500">No setup fees • Cancel anytime • 14-day free trial on paid plans</p>
                </div>
            </div>
        </>
    );
}
