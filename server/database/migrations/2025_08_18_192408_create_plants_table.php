<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::create('plants', function (Blueprint $table) {
        $table->id();
        $table->unsignedInteger('soil_moisture')->default(0);
        $table->unsignedInteger('water_level')->default(0);
        $table->integer('temperature')->default(0);
        $table->boolean('auto_mode')->default(false);
        $table->timestamp('last_watered')->nullable();
        $table->timestamps();
    });
}

public function down()
{
    Schema::dropIfExists('plants');
}

};
