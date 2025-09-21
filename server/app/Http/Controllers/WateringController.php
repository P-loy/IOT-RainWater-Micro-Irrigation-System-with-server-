<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\WateringLog;
use Carbon\Carbon;

class WateringController extends Controller
{
    public function waterNow()
    {
        $log = WateringLog::create([
            'started_at' => Carbon::now(),
            'ended_at' => Carbon::now()->addSeconds(5),
            'soil_moisture_before' => rand(30, 60),
            'soil_moisture_after' => rand(60, 90),
            'water_level_before' => rand(40, 70),
            'water_level_after' => rand(20, 50),
        ]);

        return response()->json($log);
    }
}
