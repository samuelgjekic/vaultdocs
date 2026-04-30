<?php

namespace App\Services;

use App\Models\Page;
use App\Models\Space;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class PageService
{
    /**
     * Eager-load all pages of a space and group them by parent_id, then return roots
     * with `children` already attached recursively. One DB query, O(n) tree assembly.
     */
    public function tree(Space $space): Collection
    {
        $pages = $space->pages()->orderBy('position')->get();
        $byParent = $pages->groupBy('parent_id');

        $attach = function (Page $page) use ($byParent, &$attach): Page {
            $children = $byParent->get($page->id, collect())->each($attach);
            $page->setRelation('children', $children);

            return $page;
        };

        return $byParent->get(null, collect())->each($attach);
    }

    /**
     * Replace the tree with a new ordering. Each entry is { id, parent_id, position }.
     * Validates all referenced ids belong to the space; runs in a transaction.
     */
    public function reorder(Space $space, array $items): void
    {
        $ids = array_column($items, 'id');
        $parentIds = array_filter(array_column($items, 'parent_id'), fn ($v) => $v !== null);
        $referenced = array_unique([...$ids, ...$parentIds]);

        $owned = $space->pages()->whereIn('id', $referenced)->pluck('id')->all();

        if (count($owned) !== count($referenced)) {
            abort(422, 'Some pages do not belong to this space.');
        }

        DB::transaction(function () use ($items): void {
            foreach ($items as $item) {
                Page::where('id', $item['id'])->update([
                    'parent_id' => $item['parent_id'] ?? null,
                    'position' => $item['position'] ?? 0,
                ]);
            }
        });
    }

    /**
     * Flatten Tiptap JSON into a plain-text string for full-text-ish search.
     */
    public function contentToText(?array $content): string
    {
        if (! $content) {
            return '';
        }

        $out = [];
        $walk = function ($node) use (&$walk, &$out): void {
            if (! is_array($node)) {
                return;
            }
            if (isset($node['text']) && is_string($node['text'])) {
                $out[] = $node['text'];
            }
            foreach ($node['content'] ?? [] as $child) {
                $walk($child);
            }
        };
        $walk($content);

        return implode(' ', $out);
    }
}
