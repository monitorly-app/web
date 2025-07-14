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
            $table->string('category'); // e.g., 'system'
            $table->string('name'); // e.g., 'cpu', 'ram', 'disk', 'service', etc.
            $table->json('metadata')->nullable(); // Optional metadata like mountpoint, service name
            $table->json('value'); // The actual metric data
            $table->timestamp('timestamp'); // When the metric was recorded
            $table->timestamps();

            // Indexes for efficient querying based on PROBE.md structure
            $table->index(['server_id', 'category', 'name', 'timestamp']);
            $table->index(['server_id', 'timestamp']);
            $table->index(['category', 'name']);
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
