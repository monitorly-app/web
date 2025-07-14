<?php

use App\Models\Plan;
use App\Models\User;

describe('Admin Plan Management', function () {
    test('admin can view plans list', function () {
        $admin = $this->actingAsAdmin();
        $plans = Plan::factory()->count(3)->create();

        $response = $this->get('/admin/plans');

        $response->assertStatus(200);
        $response->assertInertia(
            fn($page) =>
            $page->component('Admin/Plans/Index')
                ->has('plans', 3)
        );
    });

    test('admin can create new plan', function () {
        $admin = $this->actingAsAdmin();

        $planData = [
            'name' => 'Premium Plan',
            'price_monthly' => 29.99,
            'price_yearly' => 399.99,
            'frequency' => 60,
            'max_servers' => 3,
            'max_users' => -1,
            'max_organizations' => 3,
            'description' => 'Perfect for small organizations',
        ];

        $response = $this->post('/admin/plans', $planData);

        $response->assertRedirect('/admin/plans');
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('plans', [
            'name' => 'Premium Plan',
            'price' => json_encode([
                'monthly' => 29.99,
                'yearly' => 399.99,
            ]),
        ]);
    });


    test('admin can update plan', function () {
        $admin = $this->actingAsAdmin();
        $plan = Plan::factory()->create();

        $updateData = [
            'name' => 'Updated Plan',
            'description' => 'Updated description',
            'price_monthly' => 39.99,
            'price_yearly' => 499.99,
            'frequency' => 30,
            'max_servers' => 5,
            'max_users' => -1,
        ];

        $response = $this->put("/admin/plans/{$plan->id}", $updateData);

        $response->assertRedirect('/admin/plans');
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('plans', [
            'id' => $plan->id,
            'name' => 'Updated Plan',
            'price' => json_encode([
                'monthly' => 39.99,
                'yearly' => 499.99,
            ]),
        ]);
    });

    test('admin can delete plan', function () {
        $admin = $this->actingAsAdmin();
        $plan = Plan::factory()->create();

        $response = $this->delete("/admin/plans/{$plan->id}");

        $response->assertRedirect('/admin/plans');
        $response->assertSessionHas('success');

        $this->assertDatabaseMissing('plans', [
            'id' => $plan->id,
        ]);
    });

    test('admin cannot delete plan with active organizations', function () {
        $admin = $this->actingAsAdmin();
        $plan = Plan::factory()->create();
        $organization = \App\Models\Organization::factory()->create(['plan_id' => $plan->id]);

        $response = $this->delete("/admin/plans/{$plan->id}");

        $response->assertRedirect('/admin/plans');
        $response->assertSessionHas('error');

        $this->assertDatabaseHas('plans', [
            'id' => $plan->id,
        ]);
    });



    test('plan validation works correctly', function () {
        $admin = $this->actingAsAdmin();

        $invalidData = [
            'name' => '', // Required field
            'price_monthly' => -10, // Invalid price
            'price_yearly' => '', // Required field
        ];

        $response = $this->post('/admin/plans', $invalidData);

        $response->assertRedirect();
        $response->assertSessionHasErrors(['name', 'price_monthly', 'price_yearly']);
    });


    test('non-admin cannot access plan management', function () {
        $user = $this->actingAsUser();
        $plan = Plan::factory()->create();

        $routes = [
            '/admin/plans',
            '/admin/plans/create',
            "/admin/plans/{$plan->id}",
        ];

        foreach ($routes as $route) {
            $response = $this->get($route);
            $response->assertStatus(403);
        }
    });

});
