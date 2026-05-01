<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ExportController;
use App\Http\Controllers\Api\V1\PageController;
use App\Http\Controllers\Api\V1\SearchController;
use App\Http\Controllers\Api\V1\SettingsController;
use App\Http\Controllers\Api\V1\SpaceController;
use Illuminate\Support\Facades\Route;

Route::get('/settings', [SettingsController::class, 'show']);
Route::post('/setup', [SettingsController::class, 'setup']);

Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
});

Route::get('/spaces', [SpaceController::class, 'index']);
Route::post('/orgs/{organization}/spaces', [SpaceController::class, 'store']);

Route::prefix('orgs/{organization}/spaces/{space}')->scopeBindings()->group(function (): void {
    Route::get('/', [SpaceController::class, 'show']);
    Route::put('/', [SpaceController::class, 'update']);

    Route::get('/pages', [PageController::class, 'index']);
    Route::post('/pages', [PageController::class, 'store']);
    Route::put('/pages/{page}', [PageController::class, 'update']);
    Route::delete('/pages/{page}', [PageController::class, 'destroy']);
    Route::put('/tree', [PageController::class, 'reorder']);

    Route::get('/search', [SearchController::class, 'space']);
    Route::get('/export', [ExportController::class, 'export']);
});
