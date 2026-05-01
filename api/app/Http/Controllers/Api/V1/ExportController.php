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
            'txt' => $this->textDownload($this->exporter->toText($space), 'text/plain', $space->slug.'.txt'),
            'md', 'markdown' => $this->textDownload($this->exporter->toMarkdown($space), 'text/markdown', $space->slug.'.md'),
            default => abort(Response::HTTP_BAD_REQUEST, 'format must be pdf, txt, or md'),
        };
    }

    private function textDownload(string $body, string $mime, string $filename): \Illuminate\Http\Response
    {
        return response($body, Response::HTTP_OK, [
            'Content-Type' => $mime.'; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }
}
