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
        Schema::create('organization_invitations', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('organization_id')->constrained('organizations')->onDelete('cascade');
            $table->foreignId('organization_role_id')->constrained('organization_roles');
            $table->string('email');
            $table->uuid('token')->unique();
            $table->enum('status', ['pending', 'accepted', 'declined'])->default('pending');
            $table->foreignId('invited_by')->constrained('users');
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            // Chaque email ne peut être invité qu'une seule fois par organisation
            $table->unique(['organization_id', 'email']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('organization_invitations');
    }
};
