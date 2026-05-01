<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Tree-shaped page payload with recursively nested `children`. Includes the
 * editor `content` so the SPA can render and navigate without a second fetch
 * per page. Pages are bounded per-space, so the payload stays reasonable.
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
            'content' => $this->content,
            'children' => self::collection($this->whenLoaded('children')),
        ];
    }
}
