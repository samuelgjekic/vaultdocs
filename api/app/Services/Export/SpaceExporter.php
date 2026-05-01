<?php

namespace App\Services\Export;

use App\Models\Page;
use App\Models\Space;
use App\Services\PageService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Eloquent\Collection;
use Symfony\Component\HttpFoundation\Response;

class SpaceExporter
{
    public function __construct(
        private readonly PageService $pages,
        private readonly TiptapHtml $tiptap,
    ) {}

    /** Plain-text dump of every page in the space, in tree order. */
    public function toText(Space $space): string
    {
        $out = ["# {$space->name}", str_repeat('=', strlen($space->name) + 2), ''];
        foreach ($this->iterExportable($space) as $page) {
            $out[] = $page->title;
            $out[] = str_repeat('-', max(3, strlen($page->title)));
            $out[] = $this->pages->contentToText($page->content);
            $out[] = '';
        }

        return implode("\n", $out);
    }

    /** Full self-contained HTML document (used by the PDF renderer). */
    public function toHtml(Space $space): string
    {
        $sections = '';
        foreach ($this->iterExportable($space) as $i => $page) {
            $body = $this->tiptap->render($page->content);
            $break = $i === 0 ? '' : 'style="page-break-before: always;"';
            $title = htmlspecialchars($page->title, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $sections .= "<section {$break}><h1>{$title}</h1>{$body}</section>";
        }

        $cover = htmlspecialchars($space->name, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $css = $this->stylesheet();

        return <<<HTML
<!doctype html>
<html><head><meta charset="utf-8"><title>{$cover}</title><style>{$css}</style></head>
<body>
  <section class="cover">
    <h1 class="cover-title">{$cover}</h1>
  </section>
  {$sections}
</body></html>
HTML;
    }

    /** Streams a downloadable PDF response. */
    public function toPdfResponse(Space $space): Response
    {
        $pdf = Pdf::loadHTML($this->toHtml($space))->setPaper('a4');
        $filename = $space->slug.'.pdf';

        return $pdf->download($filename);
    }

    /** @return iterable<Page> */
    private function iterExportable(Space $space): iterable
    {
        $tree = $this->pages->tree($space);

        $walk = function (Collection $nodes) use (&$walk) {
            foreach ($nodes as $node) {
                if ($node->type === 'page') {
                    yield $node;
                }
                $children = $node->getRelation('children');
                if ($children instanceof Collection && $children->isNotEmpty()) {
                    yield from $walk($children);
                }
            }
        };

        return $walk($tree);
    }

    private function stylesheet(): string
    {
        return <<<CSS
@page { margin: 24mm 18mm; }
body { font-family: 'DejaVu Sans', sans-serif; color: #1a1a1a; font-size: 11pt; line-height: 1.55; }
.cover { text-align: center; padding: 30mm 0; }
.cover-title { font-size: 28pt; font-weight: 700; }
section { page-break-inside: auto; }
h1 { font-size: 22pt; margin: 0 0 8mm; border-bottom: 1px solid #e5e7eb; padding-bottom: 3mm; }
h2 { font-size: 16pt; margin: 8mm 0 3mm; }
h3 { font-size: 13pt; margin: 6mm 0 2mm; }
h4 { font-size: 11pt; margin: 5mm 0 2mm; }
p  { margin: 0 0 3mm; }
ul, ol { margin: 0 0 3mm; padding-left: 7mm; }
li { margin: 0 0 1mm; }
blockquote { margin: 3mm 0; padding: 2mm 0 2mm 4mm; border-left: 2px solid #4F46E5; color: #4b5563; font-style: italic; }
hr { border: none; border-top: 1px solid #e5e7eb; margin: 6mm 0; }
code { font-family: 'DejaVu Sans Mono', monospace; background: #f3f4f6; padding: 0 1mm; border-radius: 1mm; font-size: 9.5pt; }
pre { font-family: 'DejaVu Sans Mono', monospace; background: #f3f4f6; padding: 3mm; border-radius: 1.5mm; font-size: 9.5pt; white-space: pre-wrap; word-wrap: break-word; margin: 3mm 0; }
pre code { background: none; padding: 0; }
table { width: 100%; border-collapse: collapse; margin: 3mm 0; font-size: 10pt; }
th, td { border: 1px solid #e5e7eb; padding: 2mm 3mm; text-align: left; }
th { background: #f9fafb; font-weight: 600; }
img { max-width: 100%; }
a { color: #4F46E5; text-decoration: underline; }
.callout { padding: 3mm 4mm; border-left: 3px solid; border-radius: 1mm; margin: 4mm 0; }
.callout-info    { background: #eff6ff; color: #1e3a8a; border-color: #1e3a8a; }
.callout-warning { background: #fffbeb; color: #78350f; border-color: #78350f; }
.callout-danger  { background: #fef2f2; color: #7f1d1d; border-color: #7f1d1d; }
.callout-success { background: #ecfdf5; color: #065f46; border-color: #065f46; }
.task-list { list-style: none; padding-left: 4mm; }
.task-item { display: block; }
CSS;
    }
}
