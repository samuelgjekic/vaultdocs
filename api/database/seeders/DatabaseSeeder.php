<?php

namespace Database\Seeders;

use App\Models\Organization;
use App\Models\Page;
use App\Models\Setting;
use App\Models\Space;
use App\Models\User;
use App\Services\PageService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $password = Str::random(16);

        $admin = User::create([
            'name' => 'Ada Lovelace',
            'email' => 'ada@vaultdocs.io',
            'password' => $password,
            'role' => 'admin',
            'is_admin' => true,
        ]);

        $org = Organization::create([
            'name' => 'Acme',
            'slug' => 'acme',
            'owner_id' => $admin->id,
        ]);

        $org->members()->attach($admin->id, ['role' => 'owner']);

        Setting::put('setup_complete', '1');
        Setting::put('app_name', 'VaultDocs');
        Setting::put('registration_enabled', '1');

        $productDocs = Space::create([
            'organization_id' => $org->id,
            'name' => 'Product Docs',
            'slug' => 'product-docs',
            'description' => 'Everything you need to know about Acme.',
            'icon' => '📘',
            'visibility' => 'public',
            'accent_color' => '#4F46E5',
            'show_powered_by' => true,
        ]);

        $apiSpace = Space::create([
            'organization_id' => $org->id,
            'name' => 'API Reference',
            'slug' => 'api',
            'description' => 'Technical reference for the Acme API.',
            'icon' => '⚙️',
            'visibility' => 'public',
            'accent_color' => '#4F46E5',
            'show_powered_by' => true,
        ]);

        $this->seedProductDocs($productDocs);
        $this->seedApiReference($apiSpace);

        $this->command->info("\n  Default admin credentials:");
        $this->command->info("    email:    ada@vaultdocs.io");
        $this->command->info("    password: {$password}\n");
    }

    private function seedProductDocs(Space $space): void
    {
        $intro = $this->createPage($space, null, [
            'title' => 'Introduction',
            'slug' => 'introduction',
            'type' => 'group',
            'position' => 0,
        ]);

        $this->createPage($space, $intro, [
            'title' => 'Welcome', 'slug' => 'welcome', 'emoji' => '👋', 'position' => 0,
        ], $this->tiptap('Welcome'));

        $this->createPage($space, $intro, [
            'title' => 'Quickstart', 'slug' => 'quickstart', 'emoji' => '⚡', 'position' => 1,
        ], $this->tiptap('Quickstart'));

        $concepts = $this->createPage($space, $intro, [
            'title' => 'Core concepts', 'slug' => 'concepts', 'position' => 2,
        ], $this->tiptap('Core concepts'));

        $this->createPage($space, $concepts, [
            'title' => 'Spaces', 'slug' => 'spaces', 'position' => 0,
        ], $this->tiptap('Spaces'));

        $this->createPage($space, $concepts, [
            'title' => 'Pages', 'slug' => 'pages', 'position' => 1, 'is_draft' => true,
        ], $this->tiptap('Pages'));

        $this->createPage($space, null, [
            'title' => '', 'slug' => 'div-1', 'type' => 'divider', 'position' => 1,
        ]);

        $guides = $this->createPage($space, null, [
            'title' => 'Guides', 'slug' => 'guides', 'type' => 'group', 'position' => 2,
        ]);

        $this->createPage($space, $guides, [
            'title' => 'Self-hosting', 'slug' => 'self-hosting', 'position' => 0,
        ], $this->tiptap('Self-hosting'));

        $this->createPage($space, $guides, [
            'title' => 'Theming', 'slug' => 'theming', 'position' => 1,
        ], $this->tiptap('Theming'));

        $this->createPage($space, $guides, [
            'title' => 'GitHub repository',
            'slug' => 'github',
            'type' => 'link',
            'external_url' => 'https://github.com',
            'position' => 2,
        ]);
    }

    private function seedApiReference(Space $space): void
    {
        $reference = $this->createPage($space, null, [
            'title' => 'Reference', 'slug' => 'reference', 'type' => 'group', 'position' => 0,
        ]);

        $this->createPage($space, $reference, [
            'title' => 'Authentication', 'slug' => 'auth', 'position' => 0,
        ], $this->tiptap('Authentication'));

        $this->createPage($space, $reference, [
            'title' => 'Rate limits', 'slug' => 'rate-limits', 'position' => 1,
        ], $this->tiptap('Rate limits'));
    }

    private function createPage(Space $space, ?Page $parent, array $attrs, ?array $content = null): Page
    {
        return Page::create(array_merge([
            'space_id' => $space->id,
            'parent_id' => $parent?->id,
            'type' => 'page',
            'is_draft' => false,
            'content' => $content,
            'content_markdown' => app(PageService::class)->contentToText($content),
        ], $attrs));
    }

    private function tiptap(string $heading): array
    {
        return [
            'type' => 'doc',
            'content' => [
                ['type' => 'heading', 'attrs' => ['level' => 1], 'content' => [['type' => 'text', 'text' => $heading]]],
                [
                    'type' => 'paragraph',
                    'content' => [
                        ['type' => 'text', 'text' => 'Welcome to '],
                        ['type' => 'text', 'marks' => [['type' => 'bold']], 'text' => 'VaultDocs'],
                        ['type' => 'text', 'text' => ' — an open-source, self-hosted documentation platform built for teams who care about polish.'],
                    ],
                ],
                [
                    'type' => 'callout',
                    'attrs' => ['variant' => 'info'],
                    'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'This page is rendered from Tiptap JSON.']]]],
                ],
                ['type' => 'heading', 'attrs' => ['level' => 2], 'content' => [['type' => 'text', 'text' => 'Getting started']]],
                [
                    'type' => 'paragraph',
                    'content' => [
                        ['type' => 'text', 'text' => 'Use the sidebar to navigate, '],
                        ['type' => 'text', 'marks' => [['type' => 'code']], 'text' => '⌘K'],
                        ['type' => 'text', 'text' => ' to search, and the right rail to jump between sections.'],
                    ],
                ],
            ],
        ];
    }
}
