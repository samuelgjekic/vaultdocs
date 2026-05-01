<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\SpaceResource;
use App\Models\Organization;
use App\Models\Space;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Str;

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

    public function store(Request $request, Organization $organization)
    {
        $user = $request->user();
        abort_unless($user, Response::HTTP_UNAUTHORIZED);
        abort_unless(
            $user->is_admin || $user->organizations()->where('organizations.id', $organization->id)->exists(),
            Response::HTTP_FORBIDDEN,
            'You must be a member of this organization to create a space.'
        );

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/'],
            'description' => ['nullable', 'string'],
            'icon' => ['nullable', 'string'],
            'visibility' => ['required', 'in:public,private,unlisted'],
        ]);

        $slug = $data['slug'] ?? Str::slug($data['name']);
        if ($organization->spaces()->where('slug', $slug)->exists()) {
            $slug = $slug.'-'.Str::lower(Str::random(4));
        }

        $space = $organization->spaces()->create([
            'name' => $data['name'],
            'slug' => $slug,
            'description' => $data['description'] ?? null,
            'icon' => $data['icon'] ?? null,
            'visibility' => $data['visibility'],
            'show_powered_by' => true,
        ]);

        return (new SpaceResource($space->load('organization')))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
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
            'default_theme' => ['sometimes', 'nullable', 'in:light,dark,system'],
            'show_powered_by' => ['sometimes', 'boolean'],
            'logo' => ['sometimes', 'nullable', 'string'],
            'custom_domain' => ['sometimes', 'nullable', 'string'],
        ]);

        $space->update($data);

        return new SpaceResource($space->load('organization'));
    }
}
