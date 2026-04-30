<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Tree-shaped page payload: omits the editor JSON (`content`) and includes
 * recursively nested `children`. Used for the sidebar / outline endpoint.
 */
class PageTreeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'parent_id' => $this->parent_id ? (string) $this->parent_id : null,
            'type' => $this->type,
            'title' => $this->title,
            'slug' => $this->slug,
            'emoji' => $this->emoji,
            'is_draft' => (bool) $this->is_draft,
            'external_url' => $this->external_url,
            'position' => (int) $this->position,
            'updated_at' => $this->updated_at?->toIso8601String(),
            'children' => self::collection($this->whenLoaded('children')),
        ];
    }
}
