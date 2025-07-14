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
        Schema::create('servers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->onDelete('cascade');
            $table->string('token')->unique();
            $table->string('name');
            $table->string('hostname')->nullable();
            $table->string('ip_address')->nullable();
            $table->text('description')->nullable();
            $table->string('os')->nullable();
            $table->string('status')->default('offline');
            $table->json('system_info')->nullable();
            $table->json('last_metrics')->nullable();
            $table->timestamp('last_ping')->nullable();
            $table->timestamp('last_seen_at')->nullable();
            $table->json('monitoring_config')->nullable();
            $table->timestamp('monitoring_config_updated_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('servers');
    }
};
