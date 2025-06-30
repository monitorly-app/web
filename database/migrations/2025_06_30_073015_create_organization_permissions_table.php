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
        Schema::create('organization_permissions', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // Ex: 'manage_servers', 'view_metrics'
            $table->string('label'); // Ex: 'Manage Servers', 'View Metrics'
            $table->text('description')->nullable(); // Description de la permission
            $table->string('category'); // Ex: 'servers', 'metrics', 'members', 'settings'
            $table->boolean('is_system')->default(false); // Permissions système non modifiables
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('organization_permissions');
    }
};
