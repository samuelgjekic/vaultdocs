<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\Page;
use App\Models\Space;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExportTest extends TestCase
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

        Page::create([
            'space_id' => $space->id, 'title' => 'Welcome', 'slug' => 'welcome', 'position' => 0,
            'content' => [
                'type' => 'doc',
                'content' => [
                    ['type' => 'heading', 'attrs' => ['level' => 2], 'content' => [['type' => 'text', 'text' => 'Hello']]],
                    ['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Welcome to VaultDocs.']]],
                ],
            ],
        ]);

        return [$admin, $org, $space];
    }

    public function test_txt_export_contains_page_titles_and_text(): void
    {
        $this->setupSpace();

        $response = $this->get('/api/v1/orgs/acme/spaces/docs/export?format=txt');

        $response->assertOk()
            ->assertHeader('Content-Type', 'text/plain; charset=utf-8')
            ->assertHeader('Content-Disposition', 'attachment; filename="docs.txt"');

        $this->assertStringContainsString('Welcome', $response->getContent());
        $this->assertStringContainsString('Hello', $response->getContent());
        $this->assertStringContainsString('Welcome to VaultDocs.', $response->getContent());
    }

    public function test_pdf_export_returns_a_pdf(): void
    {
        $this->setupSpace();

        $response = $this->get('/api/v1/orgs/acme/spaces/docs/export?format=pdf');

        $response->assertOk()->assertHeader('Content-Type', 'application/pdf');
        $this->assertStringStartsWith('%PDF-', substr($response->getContent(), 0, 5));
    }

    public function test_pdf_export_embeds_data_url_image(): void
    {
        [, , $space] = $this->setupSpace();
        // 1x1 transparent PNG as a data URL
        $png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkAAIAAAoAAv/lxKUAAAAASUVORK5CYII=';

        Page::create([
            'space_id' => $space->id, 'title' => 'With Image', 'slug' => 'with-image', 'position' => 1,
            'content' => [
                'type' => 'doc',
                'content' => [
                    ['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Image:']]],
                    ['type' => 'image', 'attrs' => ['src' => $png, 'alt' => 'tiny']],
                ],
            ],
        ]);

        $response = $this->get('/api/v1/orgs/acme/spaces/docs/export?format=pdf');
        $response->assertOk();

        // dompdf embeds raster images as a Type/XObject/Image stream — check the PDF
        // contains at least one image XObject.
        $this->assertStringContainsString('/Subtype /Image', $response->getContent());
    }

    public function test_md_export_emits_markdown(): void
    {
        [, , $space] = $this->setupSpace();
        Page::create([
            'space_id' => $space->id, 'title' => 'Formatting', 'slug' => 'fmt', 'position' => 1,
            'content' => [
                'type' => 'doc',
                'content' => [
                    ['type' => 'heading', 'attrs' => ['level' => 2], 'content' => [['type' => 'text', 'text' => 'Marks']]],
                    ['type' => 'paragraph', 'content' => [
                        ['type' => 'text', 'marks' => [['type' => 'bold']], 'text' => 'bold'],
                        ['type' => 'text', 'text' => ' and '],
                        ['type' => 'text', 'marks' => [['type' => 'code']], 'text' => 'code'],
                    ]],
                    ['type' => 'callout', 'attrs' => ['variant' => 'warning'], 'content' => [
                        ['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Heads up']]],
                    ]],
                ],
            ],
        ]);

        $response = $this->get('/api/v1/orgs/acme/spaces/docs/export?format=md');

        $response->assertOk()
            ->assertHeader('Content-Type', 'text/markdown; charset=utf-8')
            ->assertHeader('Content-Disposition', 'attachment; filename="docs.md"');

        $body = $response->getContent();
        $this->assertStringContainsString('# Docs', $body);
        $this->assertStringContainsString('## Formatting', $body);
        $this->assertStringContainsString('**bold**', $body);
        $this->assertStringContainsString('`code`', $body);
        $this->assertStringContainsString('> [!WARNING]', $body);
    }

    public function test_invalid_format_returns_400(): void
    {
        $this->setupSpace();
        $this->get('/api/v1/orgs/acme/spaces/docs/export?format=xls')->assertStatus(400);
    }

    public function test_private_space_blocks_outsider(): void
    {
        [, $org] = $this->setupSpace();
        Space::create(['organization_id' => $org->id, 'name' => 'Private', 'slug' => 'private', 'visibility' => 'private']);
        $outsider = User::create(['name' => 'Out', 'email' => 'o@example.com', 'password' => 'secret123', 'role' => 'viewer']);

        $this->actingAs($outsider, 'sanctum')
            ->get('/api/v1/orgs/acme/spaces/private/export?format=txt')
            ->assertStatus(403);
    }
}
