<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PageResource;
use App\Http\Resources\PageTreeResource;
use App\Models\Organization;
use App\Models\Page;
use App\Models\Space;
use App\Services\PageService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Str;

class PageController extends Controller
{
    public function __construct(private readonly PageService $pages) {}

    public function index(Organization $organization, Space $space)
    {
        $this->authorize('view', $space);

        return PageTreeResource::collection($this->pages->tree($space));
    }

    public function store(Request $request, Organization $organization, Space $space)
    {
        $this->authorize('manage', $space);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'parent_id' => ['nullable', 'integer', 'exists:pages,id'],
            'type' => ['nullable', 'in:page,group,divider,link'],
            'emoji' => ['nullable', 'string'],
            'external_url' => ['nullable', 'string'],
            'position' => ['nullable', 'integer'],
            'content' => ['nullable', 'array'],
        ]);

        $page = $space->pages()->create([
            'parent_id' => $data['parent_id'] ?? null,
            'title' => $data['title'],
            'slug' => $data['slug'] ?? Str::slug($data['title']) ?: Str::random(8),
            'type' => $data['type'] ?? 'page',
            'emoji' => $data['emoji'] ?? null,
            'external_url' => $data['external_url'] ?? null,
            'position' => $data['position'] ?? 0,
            'content' => $data['content'] ?? null,
            'content_markdown' => $this->pages->contentToText($data['content'] ?? null),
        ]);

        return new PageResource($page);
    }

    public function update(Request $request, Organization $organization, Space $space, Page $page)
    {
        $this->authorize('manage', $space);
        $this->ensurePageInSpace($space, $page);

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:255'],
            'emoji' => ['sometimes', 'nullable', 'string'],
            'external_url' => ['sometimes', 'nullable', 'string'],
            'is_draft' => ['sometimes', 'boolean'],
            'content' => ['sometimes', 'nullable', 'array'],
        ]);

        if (array_key_exists('content', $data)) {
            $data['content_markdown'] = $this->pages->contentToText($data['content']);
        }

        $page->update($data);

        return new PageResource($page);
    }

    public function destroy(Request $request, Organization $organization, Space $space, Page $page)
    {
        $this->authorize('manage', $space);
        $this->ensurePageInSpace($space, $page);

        $page->delete();

        return response()->noContent();
    }

    public function reorder(Request $request, Organization $organization, Space $space)
    {
        $this->authorize('manage', $space);

        $items = $request->validate([
            'items' => ['required', 'array'],
            'items.*.id' => ['required', 'integer'],
            'items.*.parent_id' => ['nullable', 'integer'],
            'items.*.position' => ['required', 'integer'],
        ])['items'];

        $this->pages->reorder($space, $items);

        return response()->noContent();
    }

    private function ensurePageInSpace(Space $space, Page $page): void
    {
        abort_unless($page->space_id === $space->id, Response::HTTP_NOT_FOUND);
    }
}
