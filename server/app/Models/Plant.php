<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Plant extends Model
{
    protected $fillable = [
        'soil_moisture',
        'water_level',
        'temperature',
        'auto_mode',
        'last_watered',
    ];

    protected $casts = [
        'last_watered' => 'datetime',
    ];
}
