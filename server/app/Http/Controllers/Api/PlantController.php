<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plant;
use Illuminate\Http\Request;

class PlantController extends Controller
{
    // Ensure one row exists
    private function plant()
    {
        return Plant::firstOrCreate([], [
            'soil_moisture' => 60,
            'water_level'   => 50,
            'temperature'   => 25,
            'auto_mode'     => false,
            'last_watered'  => null,
        ]);
    }

    public function stats()
    {
        $p = $this->plant();

        return response()->json([
            'soilMoisture' => $p->soil_moisture,
            'waterLevel'   => $p->water_level,
            'temperature'  => $p->temperature,
            'autoMode'     => $p->auto_mode,
            'lastWatered'  => $p->last_watered
                                ? $p->last_watered->toISOString()
                                : null,
        ]);
    }

    public function waterNow()
    {
        $p = $this->plant();
        $p->last_watered = now();   // ✅ save current timestamp
        $p->save();

        return response()->json([
            'message'      => '💦 Watering triggered!',
            'lastWatered'  => $p->last_watered->toISOString(),
        ]);
    }

    public function toggleAutoMode()
    {
        $p = $this->plant();
        $p->auto_mode = !$p->auto_mode;
        $p->save();

        return response()->json([
            'message'  => '🌿 Auto mode toggled',
            'autoMode' => $p->auto_mode,
        ]);
    }
}
