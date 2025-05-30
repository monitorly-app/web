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
        // Vérifions que project_roles existe
        if (!Schema::hasTable('project_roles')) {
            Schema::create('project_roles', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('description')->nullable();
                $table->timestamps();
            });
        }

        // Table des projets
        Schema::create('projects', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->foreignId('owner_id')->constrained('users');
            $table->text('description')->nullable();
            $table->string('api_key')->unique();
            $table->string('encryption_key');
            $table->timestamp('api_key_last_used_at')->nullable();
            $table->integer('api_requests_count')->default(0);
            $table->date('api_requests_reset_date')->default(now()->toDateString());
            $table->timestamps();
        });

        // Table pivot projet_utilisateur
        Schema::create('project_user', function (Blueprint $table) {
            $table->foreignUuid('project_id')->constrained('projects')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('project_role_id')->constrained('project_roles');
            $table->primary(['project_id', 'user_id']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_user');
        Schema::dropIfExists('projects');
        // Ne pas supprimer project_roles car il peut être référencé par d'autres tables
    }
};
