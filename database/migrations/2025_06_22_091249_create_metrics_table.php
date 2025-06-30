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
        Schema::create('metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('organization_id')->constrained('organizations')->onDelete('cascade');
            $table->foreignUuid('server_id')->constrained('servers')->onDelete('cascade');
            $table->string('type'); // cpu, memory, disk, network, etc.
            $table->json('data'); // Les données de la métrique
            $table->timestamp('recorded_at');
            $table->timestamps();

            // Index pour optimiser les requêtes
            $table->index(['organization_id', 'server_id', 'type', 'recorded_at']);
            $table->index(['server_id', 'type', 'recorded_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('metrics');
    }
};
