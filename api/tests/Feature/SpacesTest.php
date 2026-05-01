<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\Space;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SpacesTest extends TestCase
{
    use RefreshDatabase;

    private function makeOrg(): array
    {
        $admin = User::create([
            'name' => 'Admin', 'email' => 'admin@example.com',
            'password' => 'secret123', 'role' => 'admin', 'is_admin' => true,
        ]);
        $org = Organization::create(['name' => 'Acme', 'owner_id' => $admin->id]);
        $org->members()->attach($admin->id, ['role' => 'owner']);

        return [$admin, $org];
    }

    public function test_listing_spaces_includes_public_for_anonymous(): void
    {
        [, $org] = $this->makeOrg();
        Space::create(['organization_id' => $org->id, 'name' => 'Public Docs', 'slug' => 'public', 'visibility' => 'public']);
        Space::create(['organization_id' => $org->id, 'name' => 'Private Docs', 'slug' => 'private', 'visibility' => 'private']);

        $response = $this->getJson('/api/v1/spaces');
        $response->assertOk();
        $slugs = collect($response->json())->pluck('slug')->all();
        $this->assertSame(['public'], $slugs);
    }

    public function test_show_returns_space_with_org_slug(): void
    {
        [, $org] = $this->makeOrg();
        Space::create(['organization_id' => $org->id, 'name' => 'Public Docs', 'slug' => 'public', 'visibility' => 'public']);

        $this->getJson('/api/v1/orgs/acme/spaces/public')
            ->assertOk()
            ->assertJsonPath('slug', 'public')
            ->assertJsonPath('org_slug', 'acme')
            ->assertJsonPath('visibility', 'public')
            ->assertJsonPath('show_powered_by', true);
    }

    public function test_private_space_blocks_non_member(): void
    {
        [, $org] = $this->makeOrg();
        Space::create(['organization_id' => $org->id, 'name' => 'Private', 'slug' => 'private', 'visibility' => 'private']);

        $outsider = User::create(['name' => 'Out', 'email' => 'out@example.com', 'password' => 'secret123', 'role' => 'viewer']);

        $this->actingAs($outsider, 'sanctum')
            ->getJson('/api/v1/orgs/acme/spaces/private')
            ->assertStatus(403);
    }

    public function test_create_space_requires_auth(): void
    {
        $this->makeOrg();
        $this->postJson('/api/v1/orgs/acme/spaces', [
            'name' => 'New', 'visibility' => 'public',
        ])->assertStatus(401);
    }

    public function test_create_space_requires_org_membership(): void
    {
        $this->makeOrg();
        $outsider = User::create([
            'name' => 'Out', 'email' => 'out@example.com', 'password' => 'secret123', 'role' => 'viewer',
        ]);

        $this->actingAs($outsider, 'sanctum')
            ->postJson('/api/v1/orgs/acme/spaces', ['name' => 'New', 'visibility' => 'public'])
            ->assertStatus(403);
    }

    public function test_create_space_succeeds_for_member(): void
    {
        [$admin] = $this->makeOrg();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/orgs/acme/spaces', [
                'name' => 'My New Space',
                'description' => 'Hello',
                'visibility' => 'private',
                'icon' => '🚀',
            ]);

        $response->assertCreated()
            ->assertJsonPath('name', 'My New Space')
            ->assertJsonPath('slug', 'my-new-space')
            ->assertJsonPath('visibility', 'private')
            ->assertJsonPath('org_slug', 'acme')
            ->assertJsonPath('icon', '🚀');
    }

    public function test_create_space_resolves_duplicate_slug(): void
    {
        [$admin, $org] = $this->makeOrg();
        Space::create(['organization_id' => $org->id, 'name' => 'Docs', 'slug' => 'docs', 'visibility' => 'public']);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/orgs/acme/spaces', ['name' => 'Docs', 'visibility' => 'public']);

        $response->assertCreated();
        $this->assertNotSame('docs', $response->json('slug'));
        $this->assertStringStartsWith('docs-', $response->json('slug'));
    }

    public function test_update_space_requires_org_role(): void
    {
        [$admin, $org] = $this->makeOrg();
        Space::create(['organization_id' => $org->id, 'name' => 'Public', 'slug' => 'public', 'visibility' => 'public']);

        $this->actingAs($admin, 'sanctum')
            ->putJson('/api/v1/orgs/acme/spaces/public', ['name' => 'Renamed'])
            ->assertOk()
            ->assertJsonPath('name', 'Renamed');
    }
}
