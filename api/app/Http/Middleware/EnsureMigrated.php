<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Self-installing first-run guard. If the SQLite database is missing or has
 * no migrations table yet, create the file (SQLite-only) and run migrations
 * before the request continues. Lets non-CLI users (shared hosting, ZIP
 * install) get a working app from a single browser visit.
 *
 * Once migrations have run, this middleware is a single Schema::hasTable()
 * check per request — negligible.
 */
class EnsureMigrated
{
    private static bool $checked = false;

    public function handle(Request $request, Closure $next): mixed
    {
        if (self::$checked) {
            return $next($request);
        }

        try {
            if (config('database.default') === 'sqlite') {
                $path = config('database.connections.sqlite.database');
                if (is_string($path) && $path !== ':memory:' && ! file_exists($path)) {
                    @mkdir(dirname($path), 0755, true);
                    @touch($path);
                }
            }

            DB::connection()->getPdo();

            if (! Schema::hasTable('migrations')) {
                Artisan::call('migrate', ['--force' => true]);
            }
        } catch (\Throwable) {
            // If the DB still can't be reached, let the actual request handler
            // surface a real error rather than masking it here.
        }

        self::$checked = true;

        return $next($request);
    }
}
