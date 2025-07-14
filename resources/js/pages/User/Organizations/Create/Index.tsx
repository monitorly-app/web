import OrganizationCreationLayout from '@/layouts/organization-creation-layout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import OrganizationForm from './OrganizationForm';
import PlanSelection from './PlanSelection';

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
    plans: Plan[];
    isFirstOrganization: boolean;
    currentOrganizationsCount: number;
}

export default function CreateOrganization({ plans }: Props) {
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    const handlePlanSelect = (plan: Plan, cycle: 'monthly' | 'yearly') => {
        setSelectedPlan(plan);
        setBillingCycle(cycle);
        setCurrentStep(2);
    };

    const handleBack = () => {
        setCurrentStep(1);
        setSelectedPlan(null);
        setBillingCycle('monthly');
    };

    return (
        <OrganizationCreationLayout
            showHeader={currentStep === 2}
            title={currentStep === 2 ? 'Organization Details' : undefined}
            description={currentStep === 2 ? 'Complete your organization setup' : undefined}
        >
            <Head title={currentStep === 1 ? 'Choose Your Plan' : 'Create Organization'} />

            {currentStep === 1 ? (
                <PlanSelection plans={plans} onPlanSelect={handlePlanSelect} />
            ) : (
                selectedPlan && <OrganizationForm selectedPlan={selectedPlan} billingCycle={billingCycle} onBack={handleBack} />
            )}
        </OrganizationCreationLayout>
    );
}
