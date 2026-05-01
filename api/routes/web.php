<?php

use Illuminate\Support\Facades\Route;

// Catch-all: any non-API GET request returns the built SPA so client-side
// routing can take over. The SPA bundle is dropped into public/ at release
// build time as `spa.html` + `assets/`. In dev, the SPA is served by Vite
// on its own port and this route is unused.
Route::get('/{any?}', function () {
    $path = public_path('spa.html');
    if (! file_exists($path)) {
        return response(
            'VaultDocs SPA bundle not found. Run `npm run build` in web/ and copy '.
            'web/dist/* into api/public/ (with index.html renamed to spa.html), or '.
            'use the Docker / ZIP release.',
            404
        );
    }

    return response(file_get_contents($path), 200, ['Content-Type' => 'text/html; charset=utf-8']);
})->where('any', '^(?!api/|sanctum/|storage/|up$).*$');
