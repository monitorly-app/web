<?php

namespace App\Console\Commands;

use App\Models\Organization;
use App\Models\Plan;
use Illuminate\Console\Command;

class FixOrganizationPlans extends Command
{
    protected $signature = 'fix:organization-plans';
    protected $description = 'Fix organization plans to match their owner\'s plans';

    public function handle()
    {
        $this->info('Starting to fix organization plans...');

        $organizations = Organization::with(['owner.plan', 'plan'])->get();

        $fixed = 0;
        $skipped = 0;

        foreach ($organizations as $organization) {
            $owner = $organization->owner;
            $ownerPlan = $owner->plan;

            if (!$ownerPlan) {
                // Owner has no plan, set organization to Free
                $freePlan = Plan::where('name', 'Free')->first();
                if ($organization->plan_id !== $freePlan->id) {
                    $organization->update(['plan_id' => $freePlan->id]);
                    $this->info("Updated organization '{$organization->name}' to Free plan (owner has no plan)");
                    $fixed++;
                } else {
                    $skipped++;
                }
                continue;
            }

            // If organization plan doesn't match owner plan, update it
            if ($organization->plan_id !== $ownerPlan->id) {
                $organization->update(['plan_id' => $ownerPlan->id]);
                $this->info("Updated organization '{$organization->name}' from '{$organization->plan->name}' to '{$ownerPlan->name}' plan");
                $fixed++;
            } else {
                $this->line("Organization '{$organization->name}' already has correct plan: {$ownerPlan->name}");
                $skipped++;
            }
        }

        $this->info("Fixed {$fixed} organizations, skipped {$skipped} organizations");
        $this->info('Organization plans fix completed!');
    }
}
