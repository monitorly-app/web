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
        Schema::table('organizations', function (Blueprint $table) {
            // Type d'organisation
            $table->enum('organization_type', ['company', 'individual'])->default('company')->after('description');
            
            // Adresse de facturation stockée en JSON
            $table->json('billing_address')->nullable()->after('organization_type');
            
            // Numéro de TVA/identification fiscale
            $table->string('tax_number')->nullable()->after('billing_address');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            $table->dropColumn(['organization_type', 'billing_address', 'tax_number']);
        });
    }
};