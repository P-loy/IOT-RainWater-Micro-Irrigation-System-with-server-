<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WateringLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'started_at',
        'ended_at',
        'soil_moisture_before',
        'soil_moisture_after',
        'water_level_before',
        'water_level_after',
    ];
}
