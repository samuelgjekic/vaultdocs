<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\SpaceResource;
use App\Models\Organization;
use App\Models\Space;
use Illuminate\Http\Request;

class SpaceController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Space::query()->with('organization');

        if (! $user) {
            $query->where('visibility', 'public');
        } elseif (! $user->is_admin) {
            $orgIds = $user->organizations()->pluck('organizations.id');
            $query->where(function ($q) use ($orgIds): void {
                $q->where('visibility', 'public')
                    ->orWhereIn('organization_id', $orgIds);
            });
        }

        return SpaceResource::collection($query->orderBy('id')->get());
    }

    public function show(Organization $organization, Space $space)
    {
        $this->authorize('view', $space);

        return new SpaceResource($space->load('organization'));
    }

    public function update(Request $request, Organization $organization, Space $space)
    {
        $this->authorize('manage', $space);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'icon' => ['sometimes', 'nullable', 'string'],
            'cover' => ['sometimes', 'nullable', 'string'],
            'visibility' => ['sometimes', 'in:public,private,unlisted'],
            'accent_color' => ['sometimes', 'nullable', 'string', 'max:9'],
            'show_powered_by' => ['sometimes', 'boolean'],
            'logo' => ['sometimes', 'nullable', 'string'],
            'custom_domain' => ['sometimes', 'nullable', 'string'],
        ]);

        $space->update($data);

        return new SpaceResource($space->load('organization'));
    }
}
