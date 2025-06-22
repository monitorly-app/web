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
            $table->foreignUuid('server_id')->constrained('servers')->onDelete('cascade');
            $table->string('category', 50)->index(); // system, network, etc.
            $table->string('name', 100)->index(); // cpu, ram, disk, etc.
            $table->decimal('value', 15, 4); // Valeur de la métrique
            $table->json('metadata')->nullable(); // Métadonnées supplémentaires
            $table->timestamp('timestamp')->index(); // Timestamp de la métrique
            $table->timestamps();

            // Index composés pour les requêtes fréquentes
            $table->index(['server_id', 'category', 'name']);
            $table->index(['server_id', 'timestamp']);
            $table->index(['category', 'name', 'timestamp']);
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
