<?php

use App\Models\Server;
use App\Models\Organization;
use App\Models\Metric;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('Server Model', function () {
    test('server has fillable attributes', function () {
        $server = new Server();
        
        $fillable = [
            'name', 'hostname', 'ip_address', 'description', 'os', 'status',
            'last_ping', 'last_seen_at', 'monitoring_token', 'organization_id',
            'token', 'monitoring_config', 'monitoring_config_updated_at',
            'system_info', 'last_metrics'
        ];
        
        expect($server->getFillable())->toMatchArray($fillable);
    });

    test('server uses UUID as primary key', function () {
        $server = Server::factory()->create();
        
        expect($server->getKeyType())->toBe('string');
        expect($server->getIncrementing())->toBeFalse();
        expect(strlen($server->id))->toBe(36); // UUID length
    });

    test('server belongs to an organization', function () {
        $organization = Organization::factory()->create();
        $server = Server::factory()->create(['organization_id' => $organization->id]);

        expect($server->organization)->toBeInstanceOf(Organization::class);
        expect($server->organization->id)->toBe($organization->id);
    });

    test('server has many metrics', function () {
        $server = Server::factory()->create();
        $metric = Metric::factory()->create(['server_id' => $server->id]);

        expect($server->metrics)->toHaveCount(1);
        expect($server->metrics->first())->toBeInstanceOf(Metric::class);
    });

    test('server generates token on creation', function () {
        $server = Server::factory()->create();
        
        expect($server->token)->not->toBeNull();
        expect(strlen($server->token))->toBe(64);
    });

    test('server can check if online', function () {
        // Online server (last seen recently)
        $onlineServer = Server::factory()->create([
            'status' => 'online',
            'last_seen_at' => now()->subMinutes(5)
        ]);
        
        // Offline server (last seen more than 10 minutes ago)
        $offlineServer = Server::factory()->create([
            'status' => 'offline',
            'last_seen_at' => now()->subMinutes(15)
        ]);

        expect($onlineServer->isOnline())->toBeTrue();
        expect($offlineServer->isOnline())->toBeFalse();
    });

    test('server can check if offline', function () {
        // Server with no last_seen_at
        $newServer = Server::factory()->create(['last_seen_at' => null]);
        
        // Server last seen more than 10 minutes ago
        $oldServer = Server::factory()->create(['last_seen_at' => now()->subMinutes(15)]);

        expect($newServer->isOffline())->toBeTrue();
        expect($oldServer->isOffline())->toBeTrue();
    });

    test('server can get current metrics', function () {
        $server = Server::factory()->create([
            'last_metrics' => [
                'system.cpu' => ['value' => ['usage_percent' => 75.5]],
                'system.ram' => ['value' => ['usage_percent' => 60.2]],
                'system.disk' => ['value' => ['usage_percent' => 45.8]]
            ]
        ]);

        $metrics = $server->getCurrentMetrics();
        
        expect($metrics)->toHaveKey('cpu_usage');
        expect($metrics)->toHaveKey('memory_usage');
        expect($metrics)->toHaveKey('disk_usage');
        expect($metrics['cpu_usage'])->toBe(75.5);
        expect($metrics['memory_usage'])->toBe(60.2);
        expect($metrics['disk_usage'])->toBe(45.8);
    });

    test('server can get formatted system info', function () {
        $server = Server::factory()->create([
            'system_info' => [
                'hostname' => 'test-server',
                'os' => 'Ubuntu 22.04',
                'cpu' => [
                    'name' => 'Intel i7',
                    'cores' => 8,
                    'frequency_mhz' => 3200
                ],
                'ram' => [
                    'total_bytes' => 16777216000
                ]
            ]
        ]);

        $systemInfo = $server->getFormattedSystemInfo();
        
        expect($systemInfo)->toHaveKey('hostname');
        expect($systemInfo)->toHaveKey('os');
        expect($systemInfo)->toHaveKey('cpu');
        expect($systemInfo)->toHaveKey('ram');
        expect($systemInfo['hostname'])->toBe('test-server');
        expect($systemInfo['cpu']['cores'])->toBe(8);
    });

    test('server can regenerate token', function () {
        $server = Server::factory()->create();
        $originalToken = $server->token;
        
        $newToken = $server->regenerateToken();
        
        expect($newToken)->not->toBe($originalToken);
        expect(strlen($newToken))->toBe(64);
        expect($server->fresh()->token)->toBe($newToken);
    });

    test('server can get install command', function () {
        $server = Server::factory()->create();
        
        $command = $server->getInstallCommand();
        
        expect($command)->toContain('curl -sSL');
        expect($command)->toContain($server->token);
        expect($command)->toContain('| bash');
    });

    test('server can scope by status', function () {
        $onlineServer = Server::factory()->create(['status' => 'online']);
        $offlineServer = Server::factory()->create(['status' => 'offline']);
        $warningServer = Server::factory()->create(['status' => 'warning']);

        $activeServers = Server::active()->get();
        $onlineServers = Server::online()->get();
        $offlineServers = Server::offline()->get();

        expect($activeServers)->toHaveCount(2); // online and warning
        expect($onlineServers)->toHaveCount(1);
        expect($offlineServers)->toHaveCount(1);
    });

    test('server can get last metric of specific type', function () {
        $server = Server::factory()->create();
        
        $oldMetric = Metric::factory()->create([
            'server_id' => $server->id,
            'category' => 'system',
            'name' => 'cpu',
            'timestamp' => now()->subHours(2)
        ]);
        
        $newMetric = Metric::factory()->create([
            'server_id' => $server->id,
            'category' => 'system',
            'name' => 'cpu',
            'timestamp' => now()->subHour()
        ]);

        $lastMetric = $server->getLastMetric('system', 'cpu');
        
        expect($lastMetric->id)->toBe($newMetric->id);
    });
});