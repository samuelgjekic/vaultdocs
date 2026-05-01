<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\Space;
use App\Services\Export\SpaceExporter;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ExportController extends Controller
{
    public function __construct(private readonly SpaceExporter $exporter) {}

    public function export(Request $request, Organization $organization, Space $space): mixed
    {
        $this->authorize('view', $space);

        $format = strtolower((string) $request->query('format', 'pdf'));

        return match ($format) {
            'pdf' => $this->exporter->toPdfResponse($space),
            'txt' => response($this->exporter->toText($space), Response::HTTP_OK, [
                'Content-Type' => 'text/plain; charset=utf-8',
                'Content-Disposition' => 'attachment; filename="'.$space->slug.'.txt"',
            ]),
            default => abort(Response::HTTP_BAD_REQUEST, 'format must be pdf or txt'),
        };
    }
}
