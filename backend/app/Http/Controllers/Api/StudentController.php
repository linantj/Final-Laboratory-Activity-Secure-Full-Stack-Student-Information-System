<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use PDOException;

class StudentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'source' => ['required', 'string', Rule::in(['cloud', 'physical'])],
        ]);

        $source = $validated['source'];
        $connection = $source === 'cloud'
            ? config('students.cloud_connection')
            : config('students.physical_connection');

        try {
            $students = DB::connection($connection)
                ->table(config('students.table'))
                ->get();
        } catch (PDOException|QueryException $exception) {
            Log::warning('Student database request failed.', [
                'source' => $source,
                'sql_state' => $exception->errorInfo[0] ?? null,
            ]);

            return response()->json([
                'message' => 'The selected student database is unavailable or its configured students table does not exist.',
            ], 503);
        }

        return response()->json([
            'source' => $source,
            'count' => $students->count(),
            'students' => $students,
        ]);
    }
}
