<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_is_blocked_when_settings_disable_it(): void
    {
        Setting::put('registration_enabled', '0');

        $this->postJson('/api/v1/auth/register', [
            'name' => 'New', 'email' => 'new@example.com',
            'password' => 'secret123', 'password_confirmation' => 'secret123',
        ])->assertStatus(403);
    }

    public function test_register_creates_viewer_user_when_enabled(): void
    {
        Setting::put('registration_enabled', '1');

        $this->postJson('/api/v1/auth/register', [
            'name' => 'New', 'email' => 'new@example.com',
            'password' => 'secret123', 'password_confirmation' => 'secret123',
        ])->assertCreated()
            ->assertJsonPath('user.email', 'new@example.com')
            ->assertJsonPath('user.role', 'viewer')
            ->assertJsonPath('user.is_admin', false);
    }

    public function test_login_returns_user_resource(): void
    {
        $user = User::create([
            'name' => 'Ada',
            'email' => 'ada@example.com',
            'password' => 'secret123',
            'role' => 'admin',
            'is_admin' => true,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'ada@example.com',
            'password' => 'secret123',
        ]);

        $response->assertOk()
            ->assertJsonPath('user.id', (string) $user->id)
            ->assertJsonPath('user.email', 'ada@example.com')
            ->assertJsonPath('user.is_admin', true)
            ->assertJsonPath('user.role', 'admin');
    }

    public function test_login_with_bad_credentials_fails(): void
    {
        User::create([
            'name' => 'Ada',
            'email' => 'ada@example.com',
            'password' => 'secret123',
            'role' => 'admin',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'ada@example.com',
            'password' => 'wrong-password',
        ])->assertStatus(422);
    }

    public function test_me_requires_auth(): void
    {
        $this->getJson('/api/v1/auth/me')->assertStatus(401);
    }

    public function test_me_returns_authenticated_user(): void
    {
        $user = User::create([
            'name' => 'Ada',
            'email' => 'ada@example.com',
            'password' => 'secret123',
            'role' => 'admin',
        ]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('email', 'ada@example.com');
    }

    public function test_logout_invalidates_session(): void
    {
        $user = User::create([
            'name' => 'Ada',
            'email' => 'ada@example.com',
            'password' => 'secret123',
            'role' => 'admin',
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/auth/logout')
            ->assertNoContent();
    }
}
