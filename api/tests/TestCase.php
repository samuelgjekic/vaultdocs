<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Make every request appear to come from the SPA so Sanctum's stateful
        // middleware attaches the session — otherwise login/logout can't write to it.
        // The host must match SANCTUM_STATEFUL_DOMAINS (see .env / .env.example).
        // Match SANCTUM_STATEFUL_DOMAINS in phpunit.xml so Sanctum's stateful
        // middleware activates and the session is started for every request.
        $this->withHeaders([
            'Referer' => 'http://localhost',
            'Origin' => 'http://localhost',
        ]);
    }
}
