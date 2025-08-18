<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class DeviceController extends Controller
{
    private static $autoMode = false;

    public function stats()
    {
        return response()->json([
            'soilMoisture' => 65,
            'waterLevel'   => 40,
            'temperature'  => 29,
            'autoMode'     => self::$autoMode,
        ]);
    }

    public function waterNow(Request $request)
    {
        return response()->json([ 'message' => 'Watering started' ]);
    }

    public function toggleAutoMode(Request $request)
    {
        self::$autoMode = !self::$autoMode;
        return response()->json([ 'message' => 'Auto mode ' . (self::$autoMode ? 'enabled' : 'disabled') ]);
    }
}
