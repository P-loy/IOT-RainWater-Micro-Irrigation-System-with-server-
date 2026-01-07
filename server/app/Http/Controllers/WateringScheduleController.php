<?php

namespace App\Http\Controllers;

use App\Models\WateringSchedule;
use Illuminate\Http\Request;

class WateringScheduleController extends Controller
{
    public function index(Request $request)
    {
        // return schedules for logged-in user
        return $request->user()->wateringSchedules;
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'start_time'   => 'required',
            // 'duration' retained for backward compatibility; prefer 'liters'
            'duration'     => 'sometimes|required|integer',
            'liters'       => 'sometimes|required|integer',
            'days_of_week' => 'nullable|string',
        ]);

        // Normalize: if client provided liters, persist it; otherwise keep duration value
        $data = $validated;
        if (isset($validated['liters'])) {
            $data['liters'] = $validated['liters'];
        }

        $schedule = $request->user()->wateringSchedules()->create($data);

        return response()->json($schedule, 201);
    }

    public function show(Request $request, WateringSchedule $schedule)
    {
        $this->authorizeAccess($request, $schedule);
        return $schedule;
    }

    public function update(Request $request, WateringSchedule $schedule)
    {
        $this->authorizeAccess($request, $schedule);

        $validated = $request->validate([
            'start_time'   => 'sometimes|required',
            'duration'     => 'sometimes|required|integer',
            'liters'       => 'sometimes|required|integer',
            'days_of_week' => 'nullable|string',
        ]);

        $schedule->update($validated);

        return response()->json($schedule);
    }

    public function destroy(Request $request, WateringSchedule $schedule)
    {
        $this->authorizeAccess($request, $schedule);
        $schedule->delete();

        return response()->json(['message' => 'Deleted']);
    }

    private function authorizeAccess(Request $request, WateringSchedule $schedule)
    {
        if ($schedule->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized');
        }
    }
}
