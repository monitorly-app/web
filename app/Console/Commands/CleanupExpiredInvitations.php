<?php

namespace App\Console\Commands;

use App\Models\ProjectInvitation;
use Illuminate\Console\Command;

class CleanupExpiredInvitations extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'invitations:cleanup {--force : Force cleanup without confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up expired project invitations';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        // Get expired invitations
        $expiredInvitations = ProjectInvitation::expired()
            ->where('status', 'pending')
            ->get();

        if ($expiredInvitations->isEmpty()) {
            $this->info('No expired invitations found.');
            return Command::SUCCESS;
        }

        $count = $expiredInvitations->count();

        $this->info("Found {$count} expired invitation(s).");

        if (!$this->option('force')) {
            if (!$this->confirm('Do you want to mark these invitations as expired?')) {
                $this->info('Operation cancelled.');
                return Command::SUCCESS;
            }
        }

        // Mark as expired instead of deleting
        ProjectInvitation::expired()
            ->where('status', 'pending')
            ->update(['status' => 'expired']);

        $this->info("Successfully marked {$count} invitation(s) as expired.");

        return Command::SUCCESS;
    }
}
