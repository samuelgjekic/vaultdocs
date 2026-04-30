<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\Page;
use App\Models\Space;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PagesTest extends TestCase
{
    use RefreshDatabase;

    private function setupSpace(): array
    {
        $admin = User::create([
            'name' => 'Admin', 'email' => 'admin@example.com', 'password' => 'secret123',
            'role' => 'admin', 'is_admin' => true,
        ]);
        $org = Organization::create(['name' => 'Acme', 'owner_id' => $admin->id]);
        $org->members()->attach($admin->id, ['role' => 'owner']);
        $space = Space::create([
            'organization_id' => $org->id, 'name' => 'Docs', 'slug' => 'docs', 'visibility' => 'public',
        ]);

        return [$admin, $org, $space];
    }

    public function test_tree_returns_nested_structure_with_positions(): void
    {
        [, , $space] = $this->setupSpace();
        $group = Page::create(['space_id' => $space->id, 'title' => 'Intro', 'slug' => 'intro', 'type' => 'group', 'position' => 0]);
        Page::create(['space_id' => $space->id, 'parent_id' => $group->id, 'title' => 'B', 'slug' => 'b', 'position' => 1]);
        Page::create(['space_id' => $space->id, 'parent_id' => $group->id, 'title' => 'A', 'slug' => 'a', 'position' => 0]);

        $response = $this->getJson('/api/v1/orgs/acme/spaces/docs/pages')->assertOk();

        $tree = $response->json();
        $this->assertCount(1, $tree);
        $this->assertSame('Intro', $tree[0]['title']);
        $this->assertSame(['A', 'B'], collect($tree[0]['children'])->pluck('title')->all());
    }

    public function test_update_page_persists_tiptap_json_and_markdown_index(): void
    {
        [$admin, , $space] = $this->setupSpace();
        $page = Page::create(['space_id' => $space->id, 'title' => 'Welcome', 'slug' => 'welcome', 'position' => 0]);

        $content = ['type' => 'doc', 'content' => [
            ['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Hello world from Tiptap']]],
        ]];

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/orgs/acme/spaces/docs/pages/{$page->id}", [
                'content' => $content, 'is_draft' => true,
            ])->assertOk();

        $page->refresh();
        $this->assertSame($content, $page->content);
        $this->assertStringContainsString('Hello world from Tiptap', $page->content_markdown);
        $this->assertTrue($page->is_draft);
    }

    public function test_reorder_moves_pages_in_transaction(): void
    {
        [$admin, , $space] = $this->setupSpace();
        $a = Page::create(['space_id' => $space->id, 'title' => 'A', 'slug' => 'a', 'position' => 0]);
        $b = Page::create(['space_id' => $space->id, 'title' => 'B', 'slug' => 'b', 'position' => 1]);

        $this->actingAs($admin, 'sanctum')
            ->putJson('/api/v1/orgs/acme/spaces/docs/tree', [
                'items' => [
                    ['id' => $a->id, 'parent_id' => null, 'position' => 1],
                    ['id' => $b->id, 'parent_id' => null, 'position' => 0],
                ],
            ])->assertNoContent();

        $this->assertSame(1, $a->fresh()->position);
        $this->assertSame(0, $b->fresh()->position);
    }

    public function test_reorder_rejects_pages_from_other_spaces(): void
    {
        [$admin, $org, $space] = $this->setupSpace();
        $other = Space::create(['organization_id' => $org->id, 'name' => 'Other', 'slug' => 'other', 'visibility' => 'public']);
        $foreign = Page::create(['space_id' => $other->id, 'title' => 'X', 'slug' => 'x', 'position' => 0]);

        $this->actingAs($admin, 'sanctum')
            ->putJson('/api/v1/orgs/acme/spaces/docs/tree', [
                'items' => [['id' => $foreign->id, 'parent_id' => null, 'position' => 0]],
            ])->assertStatus(422);
    }

    public function test_reorder_rejects_parent_id_from_other_space(): void
    {
        [$admin, $org, $space] = $this->setupSpace();
        $other = Space::create(['organization_id' => $org->id, 'name' => 'Other', 'slug' => 'other', 'visibility' => 'public']);
        $foreignParent = Page::create(['space_id' => $other->id, 'title' => 'Foreign', 'slug' => 'foreign', 'position' => 0]);
        $ownPage = Page::create(['space_id' => $space->id, 'title' => 'Own', 'slug' => 'own', 'position' => 0]);

        $this->actingAs($admin, 'sanctum')
            ->putJson('/api/v1/orgs/acme/spaces/docs/tree', [
                'items' => [['id' => $ownPage->id, 'parent_id' => $foreignParent->id, 'position' => 0]],
            ])->assertStatus(422);

        $this->assertNull($ownPage->fresh()->parent_id);
    }

    public function test_search_returns_hits_with_breadcrumb(): void
    {
        [, , $space] = $this->setupSpace();
        $group = Page::create(['space_id' => $space->id, 'title' => 'Guides', 'slug' => 'guides', 'type' => 'group', 'position' => 0]);
        Page::create([
            'space_id' => $space->id, 'parent_id' => $group->id, 'title' => 'Self-hosting',
            'slug' => 'self-hosting', 'position' => 0,
            'content_markdown' => 'How to self-host VaultDocs with Docker',
        ]);

        $response = $this->getJson('/api/v1/orgs/acme/spaces/docs/search?q=docker')->assertOk();
        $hits = $response->json();

        $this->assertCount(1, $hits);
        $this->assertSame('Self-hosting', $hits[0]['title']);
        $this->assertSame(['Guides'], $hits[0]['breadcrumb']);
        $this->assertSame(['self-hosting'], $hits[0]['slug_path']);
    }
}
