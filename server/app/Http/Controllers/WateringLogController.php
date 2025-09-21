<?php

namespace App\Http\Controllers;

use App\Models\WateringLog;
use Illuminate\Http\Request;

class WateringLogController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $logs = WateringLog::latest()->get();
        return response()->json($logs);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $log = WateringLog::create([
            'started_at' => now(),
            'ended_at' => now()->addSeconds(5), // simulate watering duration
            'soil_moisture_before' => $request->input('soil_moisture_before', rand(20, 50)),
            'soil_moisture_after' => $request->input('soil_moisture_after', rand(50, 80)),
            'water_level_before' => $request->input('water_level_before', rand(40, 100)),
            'water_level_after' => $request->input('water_level_after', rand(20, 90)),
        ]);

        return response()->json($log, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(WateringLog $wateringLog)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(WateringLog $wateringLog)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, WateringLog $wateringLog)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(WateringLog $wateringLog)
    {
        //
    }
}
