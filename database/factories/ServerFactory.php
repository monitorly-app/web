<?php

namespace Database\Factories;

use App\Models\Server;
use App\Models\Organization;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ServerFactory extends Factory
{
    protected $model = Server::class;

    public function definition(): array
    {
        return [
            'name' => fake()->word() . '-server',
            'hostname' => fake()->domainName(),
            'ip_address' => fake()->ipv4(),
            'description' => fake()->sentence(),
            'os' => fake()->randomElement(['Ubuntu 22.04', 'CentOS 8', 'Debian 11', 'Rocky Linux 8']),
            'status' => fake()->randomElement(['online', 'offline', 'warning']),
            'last_ping' => fake()->dateTimeBetween('-1 hour', 'now'),
            'last_seen_at' => fake()->dateTimeBetween('-1 hour', 'now'),
            'token' => Str::random(64),
            'organization_id' => Organization::factory(),
            'monitoring_config' => [
                'collection' => [
                    'cpu' => ['enabled' => true, 'interval' => '30s'],
                    'ram' => ['enabled' => true, 'interval' => '30s'],
                    'disk' => ['enabled' => true, 'interval' => '60s'],
                ],
                'sender' => [
                    'target' => 'api',
                    'send_interval' => '5m'
                ]
            ],
            'system_info' => [
                'hostname' => fake()->word(),
                'os' => 'linux',
                'os_version' => 'Ubuntu 22.04.3 LTS',
                'kernel_version' => '5.15.0-91-generic',
                'cpu' => [
                    'name' => 'Intel(R) Xeon(R) CPU E5-2680 v4 @ 2.40GHz',
                    'cores' => fake()->numberBetween(2, 16),
                    'frequency_mhz' => fake()->numberBetween(2000, 4000)
                ],
                'ram' => [
                    'total_bytes' => fake()->numberBetween(4000000000, 64000000000)
                ],
                'disks' => [
                    [
                        'mountpoint' => '/',
                        'label' => '/dev/sda1',
                        'total_bytes' => fake()->numberBetween(50000000000, 2000000000000)
                    ]
                ]
            ],
            'last_metrics' => [
                'system.cpu' => [
                    'value' => ['usage_percent' => fake()->numberBetween(10, 90)],
                    'timestamp' => now()->toISOString(),
                ],
                'system.ram' => [
                    'value' => ['usage_percent' => fake()->numberBetween(20, 80)],
                    'timestamp' => now()->toISOString(),
                ],
                'system.disk' => [
                    'value' => ['usage_percent' => fake()->numberBetween(15, 75)],
                    'timestamp' => now()->toISOString(),
                ]
            ],
        ];
    }

    public function online(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'status' => 'online',
                'last_seen_at' => now()->subMinutes(2),
            ];
        });
    }

    public function offline(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'status' => 'offline',
                'last_seen_at' => now()->subHours(2),
            ];
        });
    }

    public function warning(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'status' => 'warning',
                'last_seen_at' => now()->subMinutes(8),
            ];
        });
    }

    public function withHighCpuUsage(): static
    {
        return $this->state(function (array $attributes) {
            $lastMetrics = $attributes['last_metrics'] ?? [];
            $lastMetrics['system.cpu'] = [
                'value' => ['usage_percent' => fake()->numberBetween(85, 95)],
                'timestamp' => now()->toISOString(),
            ];
            
            return [
                'last_metrics' => $lastMetrics,
            ];
        });
    }
}