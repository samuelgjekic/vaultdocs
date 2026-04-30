<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\Page;
use App\Models\Space;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class SearchController extends Controller
{
    public function space(Request $request, Organization $organization, Space $space)
    {
        $q = trim((string) $request->query('q', ''));

        if ($q === '') {
            return response()->json([]);
        }

        $hits = $space->pages()
            ->where('type', 'page')
            ->where(function ($query) use ($q): void {
                $query->where('title', 'like', "%{$q}%")
                    ->orWhere('content_markdown', 'like', "%{$q}%");
            })
            ->orderByRaw("CASE WHEN title LIKE ? THEN 0 ELSE 1 END", ["%{$q}%"])
            ->limit(25)
            ->get();

        $byId = $space->pages()->select('id', 'parent_id', 'title', 'slug', 'type')->get()->keyBy('id');

        return response()->json(
            $hits->map(fn (Page $page) => $this->shape($page, $byId, $q))->values()
        );
    }

    private function shape(Page $page, Collection $allPages, string $q): array
    {
        $breadcrumb = [];
        $slugPath = [];

        $current = $page;
        while ($current) {
            if ($current->type === 'page' || $current->type === 'group') {
                array_unshift($breadcrumb, $current->title);
                if ($current->type === 'page') {
                    array_unshift($slugPath, $current->slug);
                }
            }
            $current = $current->parent_id ? $allPages->get($current->parent_id) : null;
        }

        $snippet = $this->extractSnippet($page->content_markdown ?? '', $q) ?: $page->title;

        return [
            'page_id' => (string) $page->id,
            'title' => $page->title,
            'breadcrumb' => array_slice($breadcrumb, 0, -1),
            'snippet' => $snippet,
            'slug_path' => $slugPath,
        ];
    }

    private function extractSnippet(string $text, string $q): string
    {
        if ($text === '') {
            return '';
        }
        $pos = stripos($text, $q);
        if ($pos === false) {
            return mb_substr($text, 0, 120);
        }
        $start = max(0, $pos - 40);

        return ($start > 0 ? '…' : '').mb_substr($text, $start, 160);
    }
}
