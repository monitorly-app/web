<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Vérifions que organization_roles existe
        if (!Schema::hasTable('organization_roles')) {
            Schema::create('organization_roles', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('description')->nullable();
                $table->timestamps();
            });
        }

        // Table des organisations
        Schema::create('organizations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('logo')->nullable();
            $table->foreignId('owner_id')->constrained('users');

            // Champs de facturation  
            $table->foreignId('plan_id')->nullable()->constrained('plans');
            $table->enum('subscription_status', ['active', 'cancelled', 'suspended'])->default('active');
            $table->enum('billing_period', ['monthly', 'yearly'])->default('monthly');

            // Champs API
            $table->string('api_key')->unique();
            $table->string('encryption_key');
            $table->timestamp('api_key_last_used_at')->nullable();
            $table->integer('api_requests_count')->default(0);
            $table->date('api_requests_reset_date')->default(now()->toDateString());
            $table->timestamps();
        });

        // Table pivot organisation_utilisateur
        Schema::create('organization_user', function (Blueprint $table) {
            $table->foreignUuid('organization_id')->constrained('organizations')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('organization_role_id')->constrained('organization_roles');
            $table->primary(['organization_id', 'user_id']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('organization_user');
        Schema::dropIfExists('organizations');
        // Ne pas supprimer organization_roles car il peut être référencé par d'autres tables
    }
};
