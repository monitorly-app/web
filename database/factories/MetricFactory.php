<?php

namespace Database\Factories;

use App\Models\Metric;
use App\Models\Server;
use Illuminate\Database\Eloquent\Factories\Factory;

class MetricFactory extends Factory
{
    protected $model = Metric::class;

    public function definition(): array
    {
        $category = 'system';
        $name = fake()->randomElement(['cpu', 'ram', 'disk', 'service', 'user_activity', 'login_failures', 'port']);
        
        return [
            'server_id' => Server::factory(),
            'category' => $category,
            'name' => $name,
            'metadata' => $this->generateMetadata($name),
            'value' => $this->generateValue($name),
            'timestamp' => fake()->dateTimeBetween('-7 days', 'now'),
        ];
    }

    public function cpu(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'category' => 'system',
                'name' => 'cpu',
                'metadata' => null,
                'value' => [
                    'usage_percent' => fake()->randomFloat(2, 0, 100),
                    'cores' => [
                        ['core' => 0, 'usage_percent' => fake()->randomFloat(2, 0, 100)],
                        ['core' => 1, 'usage_percent' => fake()->randomFloat(2, 0, 100)],
                    ]
                ],
            ];
        });
    }

    public function ram(): static
    {
        return $this->state(function (array $attributes) {
            $totalBytes = fake()->numberBetween(4000000000, 32000000000);
            $usedBytes = fake()->numberBetween(1000000000, $totalBytes);
            
            return [
                'category' => 'system',
                'name' => 'ram',
                'metadata' => null,
                'value' => [
                    'total_bytes' => $totalBytes,
                    'available_bytes' => $totalBytes - $usedBytes,
                    'usage_percent' => ($usedBytes / $totalBytes) * 100,
                    'swap_total_bytes' => fake()->numberBetween(0, 8000000000),
                    'swap_used_bytes' => fake()->numberBetween(0, 1000000000),
                ],
            ];
        });
    }

    public function disk(): static
    {
        return $this->state(function (array $attributes) {
            $totalBytes = fake()->numberBetween(50000000000, 2000000000000);
            $usedBytes = fake()->numberBetween(10000000000, $totalBytes);
            
            return [
                'category' => 'system',
                'name' => 'disk',
                'metadata' => [
                    'mountpoint' => fake()->randomElement(['/', '/var', '/home', '/tmp']),
                    'label' => fake()->randomElement(['root', 'var', 'home', 'tmp']),
                ],
                'value' => [
                    'total_bytes' => $totalBytes,
                    'available_bytes' => $totalBytes - $usedBytes,
                    'usage_percent' => ($usedBytes / $totalBytes) * 100,
                ],
            ];
        });
    }

    public function service(): static
    {
        return $this->state(function (array $attributes) {
            $serviceName = fake()->randomElement(['nginx', 'apache', 'mysql', 'postgresql', 'redis', 'ssh']);
            
            return [
                'category' => 'system',
                'name' => 'service',
                'metadata' => [
                    'service_name' => $serviceName,
                    'label' => ucfirst($serviceName) . ' Service',
                ],
                'value' => [
                    'status' => fake()->randomElement(['active', 'inactive', 'failed']),
                    'running' => fake()->boolean(80),
                ],
            ];
        });
    }

    public function userActivity(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'category' => 'system',
                'name' => 'user_activity',
                'metadata' => null,
                'value' => [
                    [
                        'username' => fake()->userName(),
                        'terminal' => fake()->randomElement(['pts/0', 'pts/1', 'tty1', 'console']),
                        'login_time' => fake()->dateTimeBetween('-7 days', 'now')->format('c'),
                    ],
                    [
                        'username' => fake()->userName(),
                        'terminal' => fake()->randomElement(['pts/2', 'pts/3', 'tty2']),
                        'login_time' => fake()->dateTimeBetween('-7 days', 'now')->format('c'),
                    ]
                ],
            ];
        });
    }

    public function loginFailures(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'category' => 'system',
                'name' => 'login_failures',
                'metadata' => null,
                'value' => [
                    [
                        'username' => fake()->randomElement(['admin', 'root', 'user', 'test']),
                        'ip' => fake()->ipv4(),
                        'attempt_time' => fake()->dateTimeBetween('-7 days', 'now')->format('c'),
                    ]
                ],
            ];
        });
    }

    public function port(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'category' => 'system',
                'name' => 'port',
                'metadata' => null,
                'value' => [
                    [
                        'port' => 80,
                        'protocol' => 'tcp',
                        'service' => 'http',
                        'state' => 'listening',
                    ],
                    [
                        'port' => 443,
                        'protocol' => 'tcp',
                        'service' => 'https',
                        'state' => 'listening',
                    ],
                    [
                        'port' => 22,
                        'protocol' => 'tcp',
                        'service' => 'ssh',
                        'state' => 'listening',
                    ]
                ],
            ];
        });
    }

    public function systemInfo(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'category' => 'system',
                'name' => 'system_info',
                'metadata' => null,
                'value' => [
                    'hostname' => fake()->word(),
                    'public_ip' => fake()->ipv4(),
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
                    ],
                    'services' => ['nginx', 'postgresql', 'ssh'],
                    'last_boot_time' => fake()->unixTime()
                ],
            ];
        });
    }

    private function generateMetadata(string $name): ?array
    {
        return match ($name) {
            'disk' => [
                'mountpoint' => fake()->randomElement(['/', '/var', '/home']),
                'label' => fake()->randomElement(['root', 'var', 'home']),
            ],
            'service' => [
                'service_name' => fake()->randomElement(['nginx', 'apache', 'mysql']),
                'label' => fake()->randomElement(['Nginx Web Server', 'Apache HTTP Server', 'MySQL Database']),
            ],
            default => null,
        };
    }

    private function generateValue(string $name): mixed
    {
        return match ($name) {
            'cpu' => [
                'usage_percent' => fake()->randomFloat(2, 0, 100),
            ],
            'ram' => [
                'total_bytes' => fake()->numberBetween(4000000000, 32000000000),
                'available_bytes' => fake()->numberBetween(1000000000, 8000000000),
                'usage_percent' => fake()->randomFloat(2, 0, 100),
            ],
            'disk' => [
                'total_bytes' => fake()->numberBetween(50000000000, 2000000000000),
                'available_bytes' => fake()->numberBetween(10000000000, 500000000000),
                'usage_percent' => fake()->randomFloat(2, 0, 100),
            ],
            'service' => [
                'status' => fake()->randomElement(['active', 'inactive']),
                'running' => fake()->boolean(),
            ],
            'user_activity' => [
                [
                    'username' => fake()->userName(),
                    'terminal' => 'pts/0',
                    'login_time' => fake()->dateTimeBetween('-7 days', 'now')->format('c'),
                ]
            ],
            'login_failures' => [
                [
                    'username' => 'admin',
                    'ip' => fake()->ipv4(),
                    'attempt_time' => fake()->dateTimeBetween('-7 days', 'now')->format('c'),
                ]
            ],
            'port' => [
                [
                    'port' => 80,
                    'protocol' => 'tcp',
                    'service' => 'http',
                    'state' => 'listening',
                ]
            ],
            default => ['value' => fake()->randomFloat(2, 0, 100)],
        };
    }
}