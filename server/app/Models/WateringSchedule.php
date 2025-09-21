<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WateringSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'start_time',   // e.g. "08:00"
        'duration',     // minutes
        'days_of_week', // e.g. "Mon,Wed,Fri"
        'user_id',      // link schedule to a user
    ];

    // Each schedule belongs to a user
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
