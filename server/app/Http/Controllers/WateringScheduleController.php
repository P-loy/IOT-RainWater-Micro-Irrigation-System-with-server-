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
            'duration'     => 'required|integer',
            'days_of_week' => 'nullable|string',
        ]);

        $schedule = $request->user()->wateringSchedules()->create($validated);

        return response()->json($schedule, 201);
    }

    public function show(WateringSchedule $schedule)
    {
        $this->authorizeAccess($schedule);
        return $schedule;
    }

    public function update(Request $request, WateringSchedule $schedule)
    {
        $this->authorizeAccess($schedule);

        $validated = $request->validate([
            'start_time'   => 'sometimes|required',
            'duration'     => 'sometimes|required|integer',
            'days_of_week' => 'nullable|string',
        ]);

        $schedule->update($validated);

        return response()->json($schedule);
    }

    public function destroy(WateringSchedule $schedule)
    {
        $this->authorizeAccess($schedule);
        $schedule->delete();

        return response()->json(['message' => 'Deleted']);
    }

    private function authorizeAccess(WateringSchedule $schedule)
    {
        if ($schedule->user_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }
    }
}
