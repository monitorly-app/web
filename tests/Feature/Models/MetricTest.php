<?php

use App\Models\Metric;
use App\Models\Server;
use App\Models\Organization;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('Metric Model', function () {
    test('metric has fillable attributes', function () {
        $metric = new Metric();
        
        $fillable = [
            'server_id', 'category', 'name', 'metadata', 'value', 'timestamp'
        ];
        
        expect($metric->getFillable())->toMatchArray($fillable);
    });

    test('metric has correct casts', function () {
        $metric = new Metric();
        $casts = $metric->getCasts();
        
        expect($casts)->toHaveKey('metadata');
        expect($casts)->toHaveKey('value');
        expect($casts)->toHaveKey('timestamp');
        expect($casts['metadata'])->toBe('array');
        expect($casts['value'])->toBe('array');
        expect($casts['timestamp'])->toBe('datetime');
    });

    test('metric belongs to a server', function () {
        $server = Server::factory()->create();
        $metric = Metric::factory()->create(['server_id' => $server->id]);

        expect($metric->server)->toBeInstanceOf(Server::class);
        expect($metric->server->id)->toBe($server->id);
    });

    test('metric has organization through server', function () {
        $organization = Organization::factory()->create();
        $server = Server::factory()->create(['organization_id' => $organization->id]);
        $metric = Metric::factory()->create(['server_id' => $server->id]);

        expect($metric->organization)->toBeInstanceOf(Organization::class);
        expect($metric->organization->id)->toBe($organization->id);
    });

    test('metric constants are defined correctly', function () {
        expect(Metric::CATEGORY_SYSTEM)->toBe('system');
        expect(Metric::NAME_CPU)->toBe('cpu');
        expect(Metric::NAME_RAM)->toBe('ram');
        expect(Metric::NAME_DISK)->toBe('disk');
        expect(Metric::NAME_SERVICE)->toBe('service');
        expect(Metric::NAME_USER_ACTIVITY)->toBe('user_activity');
        expect(Metric::NAME_LOGIN_FAILURES)->toBe('login_failures');
        expect(Metric::NAME_PORT)->toBe('port');
        expect(Metric::NAME_SYSTEM_INFO)->toBe('system_info');
    });

    test('metric can scope by category', function () {
        $server = Server::factory()->create();
        
        $systemMetric = Metric::factory()->create([
            'server_id' => $server->id,
            'category' => 'system'
        ]);
        
        $networkMetric = Metric::factory()->create([
            'server_id' => $server->id,
            'category' => 'network'
        ]);

        $systemMetrics = Metric::category('system')->get();
        
        expect($systemMetrics)->toHaveCount(1);
        expect($systemMetrics->first()->id)->toBe($systemMetric->id);
    });

    test('metric can scope by name', function () {
        $server = Server::factory()->create();
        
        $cpuMetric = Metric::factory()->create([
            'server_id' => $server->id,
            'name' => 'cpu'
        ]);
        
        $ramMetric = Metric::factory()->create([
            'server_id' => $server->id,
            'name' => 'ram'
        ]);

        $cpuMetrics = Metric::name('cpu')->get();
        
        expect($cpuMetrics)->toHaveCount(1);
        expect($cpuMetrics->first()->id)->toBe($cpuMetric->id);
    });

    test('metric can scope by type (category and name)', function () {
        $server = Server::factory()->create();
        
        $cpuMetric = Metric::factory()->create([
            'server_id' => $server->id,
            'category' => 'system',
            'name' => 'cpu'
        ]);
        
        $ramMetric = Metric::factory()->create([
            'server_id' => $server->id,
            'category' => 'system',
            'name' => 'ram'
        ]);

        $cpuMetrics = Metric::type('system', 'cpu')->get();
        
        expect($cpuMetrics)->toHaveCount(1);
        expect($cpuMetrics->first()->id)->toBe($cpuMetric->id);
    });

    test('metric can scope recent metrics', function () {
        $server = Server::factory()->create();
        
        $oldMetric = Metric::factory()->create([
            'server_id' => $server->id,
            'timestamp' => now()->subDays(2)
        ]);
        
        $recentMetric = Metric::factory()->create([
            'server_id' => $server->id,
            'timestamp' => now()->subHours(2)
        ]);

        $recentMetrics = Metric::recent(24)->get();
        
        expect($recentMetrics)->toHaveCount(1);
        expect($recentMetrics->first()->id)->toBe($recentMetric->id);
    });

    test('metric can scope between dates', function () {
        $server = Server::factory()->create();
        
        $metric1 = Metric::factory()->create([
            'server_id' => $server->id,
            'timestamp' => now()->subDays(3)
        ]);
        
        $metric2 = Metric::factory()->create([
            'server_id' => $server->id,
            'timestamp' => now()->subDay()
        ]);
        
        $metric3 = Metric::factory()->create([
            'server_id' => $server->id,
            'timestamp' => now()
        ]);

        $metrics = Metric::between(now()->subDays(2), now()->subHours(12))->get();
        
        expect($metrics)->toHaveCount(1);
        expect($metrics->first()->id)->toBe($metric2->id);
    });

    test('metric can get numeric value from different value types', function () {
        // Test with direct numeric value
        $numericMetric = Metric::factory()->create(['value' => 75.5]);
        expect($numericMetric->getNumericValue())->toBe(75.5);
        
        // Test with usage_percent in array
        $percentMetric = Metric::factory()->create(['value' => ['usage_percent' => 85.2]]);
        expect($percentMetric->getNumericValue())->toBe(85.2);
        
        // Test with percent in array
        $percentMetric2 = Metric::factory()->create(['value' => ['percent' => 92.1]]);
        expect($percentMetric2->getNumericValue())->toBe(92.1);
        
        // Test with value field in array
        $valueMetric = Metric::factory()->create(['value' => ['value' => 67.8]]);
        expect($valueMetric->getNumericValue())->toBe(67.8);
        
        // Test with non-numeric value
        $nonNumericMetric = Metric::factory()->create(['value' => ['status' => 'active']]);
        expect($nonNumericMetric->getNumericValue())->toBe(0.0);
    });

    test('metric can check if system info', function () {
        $systemInfoMetric = Metric::factory()->create([
            'category' => 'system',
            'name' => 'system_info'
        ]);
        
        $cpuMetric = Metric::factory()->create([
            'category' => 'system',
            'name' => 'cpu'
        ]);
        
        expect($systemInfoMetric->isSystemInfo())->toBeTrue();
        expect($cpuMetric->isSystemInfo())->toBeFalse();
    });

    test('metric can scope system metrics', function () {
        $server = Server::factory()->create();
        
        $systemMetric = Metric::factory()->create([
            'server_id' => $server->id,
            'category' => 'system'
        ]);
        
        $networkMetric = Metric::factory()->create([
            'server_id' => $server->id,
            'category' => 'network'
        ]);

        $systemMetrics = Metric::system()->get();
        
        expect($systemMetrics)->toHaveCount(1);
        expect($systemMetrics->first()->id)->toBe($systemMetric->id);
    });

    test('metric handles PROBE.md service data correctly', function () {
        $serviceMetric = Metric::factory()->create([
            'category' => 'system',
            'name' => 'service',
            'metadata' => [
                'service_name' => 'nginx',
                'label' => 'Nginx Web Server'
            ],
            'value' => [
                'status' => 'active',
                'running' => true
            ]
        ]);
        
        expect($serviceMetric->metadata['service_name'])->toBe('nginx');
        expect($serviceMetric->value['status'])->toBe('active');
        expect($serviceMetric->value['running'])->toBeTrue();
    });

    test('metric handles PROBE.md disk data correctly', function () {
        $diskMetric = Metric::factory()->create([
            'category' => 'system',
            'name' => 'disk',
            'metadata' => [
                'mountpoint' => '/',
                'label' => 'root'
            ],
            'value' => [
                'total_bytes' => 107374182400,
                'available_bytes' => 53687091200,
                'usage_percent' => 50.0
            ]
        ]);
        
        expect($diskMetric->metadata['mountpoint'])->toBe('/');
        expect($diskMetric->value['total_bytes'])->toBe(107374182400);
        expect($diskMetric->getNumericValue())->toBe(50.0);
    });
});