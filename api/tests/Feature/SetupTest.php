<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SetupTest extends TestCase
{
    use RefreshDatabase;

    public function test_settings_reports_setup_required_when_no_users_exist(): void
    {
        $this->getJson('/api/v1/settings')
            ->assertOk()
            ->assertJsonPath('setup_required', true)
            ->assertJsonPath('app_name', 'VaultDocs');
    }

    public function test_setup_creates_admin_and_organization(): void
    {
        $response = $this->postJson('/api/v1/setup', [
            'app_name' => 'My Docs',
            'admin_name' => 'Ada',
            'admin_email' => 'ada@example.com',
            'admin_password' => 'secret123',
            'organization_name' => 'My Company',
        ]);

        $response->assertCreated()
            ->assertJsonPath('user.email', 'ada@example.com')
            ->assertJsonPath('user.is_admin', true);

        $this->assertDatabaseHas('users', ['email' => 'ada@example.com', 'is_admin' => true]);
        $this->assertDatabaseHas('organizations', ['name' => 'My Company']);
        $this->assertSame('1', Setting::get('setup_complete'));
        $this->assertSame('My Docs', Setting::get('app_name'));
    }

    public function test_setup_is_locked_after_first_run(): void
    {
        User::create([
            'name' => 'Existing',
            'email' => 'existing@example.com',
            'password' => 'secret123',
            'role' => 'admin',
        ]);
        Setting::put('setup_complete', '1');

        $this->postJson('/api/v1/setup', [
            'app_name' => 'X',
            'admin_name' => 'Y',
            'admin_email' => 'y@example.com',
            'admin_password' => 'secret123',
            'organization_name' => 'Z',
        ])->assertStatus(403);
    }
}
