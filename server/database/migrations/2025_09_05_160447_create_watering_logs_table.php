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
        Schema::create('watering_logs', function (Blueprint $table) {
            $table->id();
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table->integer('soil_moisture_before')->nullable();
            $table->integer('soil_moisture_after')->nullable();
            $table->integer('water_level_before')->nullable();
            $table->integer('water_level_after')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('watering_logs');
    }
};
