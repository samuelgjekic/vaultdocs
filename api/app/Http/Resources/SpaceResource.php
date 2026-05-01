<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SpaceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'org_id' => (string) $this->organization_id,
            'org_slug' => $this->organization?->slug,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'icon' => $this->icon,
            'cover' => $this->cover,
            'visibility' => $this->visibility,
            'password_protected' => ! is_null($this->password),
            'accent_color' => $this->accent_color,
            'default_theme' => $this->default_theme,
            'show_powered_by' => (bool) $this->show_powered_by,
            'logo' => $this->logo,
            'custom_domain' => $this->custom_domain,
        ];
    }
}
