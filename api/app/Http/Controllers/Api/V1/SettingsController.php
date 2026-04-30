<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Organization;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class SettingsController extends Controller
{
    public function show(): array
    {
        return [
            'app_name' => Setting::get('app_name', config('app.name')),
            'logo' => Setting::get('logo'),
            'registration_enabled' => Setting::get('registration_enabled', '1') === '1',
            'setup_required' => ! Setting::isSetupComplete() || User::count() === 0,
        ];
    }

    public function setup(Request $request)
    {
        if (Setting::isSetupComplete() || User::count() > 0) {
            abort(Response::HTTP_FORBIDDEN, 'Setup has already been completed.');
        }

        $data = $request->validate([
            'app_name' => ['required', 'string', 'max:255'],
            'admin_name' => ['required', 'string', 'max:255'],
            'admin_email' => ['required', 'email', 'unique:users,email'],
            'admin_password' => ['required', 'string', 'min:8'],
            'organization_name' => ['required', 'string', 'max:255'],
        ]);

        $user = DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => $data['admin_name'],
                'email' => $data['admin_email'],
                'password' => $data['admin_password'],
                'role' => 'admin',
                'is_admin' => true,
            ]);

            $org = Organization::create([
                'name' => $data['organization_name'],
                'owner_id' => $user->id,
            ]);

            $org->members()->attach($user->id, ['role' => 'owner']);

            Setting::put('app_name', $data['app_name']);
            Setting::put('setup_complete', '1');

            return $user;
        });

        Auth::login($user, true);

        $request->session()->regenerate();

        return response()->json([
            'user' => new UserResource($user),
        ], Response::HTTP_CREATED);
    }
}
