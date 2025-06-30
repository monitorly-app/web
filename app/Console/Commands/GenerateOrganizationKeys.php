<?php

namespace App\Console\Commands;

use App\Models\Organization;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class GenerateOrganizationKeys extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'organizations:generate-keys';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate missing API and encryption keys for existing organizations';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Generating missing organization keys...');

        $organizations = Organization::whereNull('api_key')
            ->orWhereNull('encryption_key')
            ->orWhere('api_key', '')
            ->orWhere('encryption_key', '')
            ->get();

        if ($organizations->isEmpty()) {
            $this->info('All organizations already have their keys generated.');
            return;
        }

        $count = 0;
        foreach ($organizations as $organization) {
            $updated = false;

            if (empty($organization->api_key)) {
                $organization->api_key = 'org_' . Str::random(32);
                $updated = true;
                $this->line("Generated API key for organization: {$organization->name}");
            }

            if (empty($organization->encryption_key)) {
                $organization->encryption_key = Str::random(64);
                $updated = true;
                $this->line("Generated encryption key for organization: {$organization->name}");
            }

            if ($updated) {
                $organization->save();
                $count++;
            }
        }

        $this->info("Successfully generated keys for {$count} organizations.");
    }
}
