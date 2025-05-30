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
            $table->foreignUuid('project_id')->constrained('projects')->onDelete('cascade');
            $table->string('name');
            $table->string('host');
            $table->integer('port')->default(22);
            $table->text('description')->nullable();
            $table->string('token')->unique();
            $table->enum('status', ['pending', 'online', 'offline', 'warning', 'error'])->default('pending');
            $table->timestamp('last_seen_at')->nullable();
            $table->json('last_metrics')->nullable();
            $table->string('agent_version')->nullable();
            $table->json('system_info')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['project_id', 'status']);
            $table->index(['project_id', 'is_active']);
            $table->index('token');
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
