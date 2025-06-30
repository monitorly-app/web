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
        Schema::create('organization_role_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_role_id')->constrained('organization_roles')->onDelete('cascade');
            $table->foreignId('organization_permission_id')->constrained('organization_permissions')->onDelete('cascade');
            $table->timestamps();

            // Éviter les doublons
            $table->unique(['organization_role_id', 'organization_permission_id'], 'org_role_permission_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('organization_role_permissions');
    }
};
