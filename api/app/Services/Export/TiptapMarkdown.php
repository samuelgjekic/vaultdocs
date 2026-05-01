<?php

namespace App\Services\Export;

/**
 * Walks a Tiptap document JSON and emits CommonMark/GFM-flavored Markdown.
 *
 * Mirrors the node types registered in web/src/lib/tiptap/extensions.ts.
 * Used by SpaceExporter for `format=md` export.
 */
class TiptapMarkdown
{
    public function render(?array $doc): string
    {
        if (! is_array($doc)) {
            return '';
        }

        return rtrim($this->node($doc, 0))."\n";
    }

    private function node(array $node, int $listDepth, int $orderedIndex = 0): string
    {
        $type = $node['type'] ?? '';
        $attrs = $node['attrs'] ?? [];
        $content = $node['content'] ?? [];

        return match ($type) {
            'doc' => $this->blocks($content, $listDepth),
            'paragraph' => $this->inline($content)."\n\n",
            'heading' => str_repeat('#', max(1, min(6, (int) ($attrs['level'] ?? 2))))
                .' '.$this->inline($content)."\n\n",
            'bulletList' => $this->bulletList($content, $listDepth)."\n",
            'orderedList' => $this->orderedList($content, $listDepth)."\n",
            'taskList' => $this->taskList($content, $listDepth)."\n",
            'blockquote' => $this->blockquote($content)."\n",
            'codeBlock' => $this->codeBlock($attrs, $content),
            'horizontalRule' => "---\n\n",
            'hardBreak' => "  \n",
            'image' => $this->image($attrs)."\n\n",
            'callout' => $this->callout($attrs, $content)."\n",
            'table' => $this->table($content)."\n",
            'text' => $this->text($node),
            default => $this->blocks($content, $listDepth),
        };
    }

    private function blocks(array $nodes, int $listDepth): string
    {
        $out = '';
        foreach ($nodes as $child) {
            if (is_array($child)) {
                $out .= $this->node($child, $listDepth);
            }
        }

        return $out;
    }

    private function inline(array $nodes): string
    {
        $out = '';
        foreach ($nodes as $child) {
            if (! is_array($child)) {
                continue;
            }
            if (($child['type'] ?? '') === 'text') {
                $out .= $this->text($child);
            } elseif (($child['type'] ?? '') === 'hardBreak') {
                $out .= "  \n";
            } else {
                $out .= $this->inline($child['content'] ?? []);
            }
        }

        return $out;
    }

    private function text(array $node): string
    {
        $text = (string) ($node['text'] ?? '');
        foreach ($node['marks'] ?? [] as $mark) {
            $type = $mark['type'] ?? '';
            $attrs = $mark['attrs'] ?? [];
            $text = match ($type) {
                'bold' => "**{$text}**",
                'italic' => "*{$text}*",
                'underline' => "<u>{$text}</u>",
                'strike' => "~~{$text}~~",
                'code' => "`{$text}`",
                'link' => '['.$text.']('.((string) ($attrs['href'] ?? '#')).')',
                default => $text,
            };
        }

        return $text;
    }

    private function bulletList(array $items, int $depth): string
    {
        $indent = str_repeat('  ', $depth);
        $out = '';
        foreach ($items as $item) {
            if (! is_array($item)) {
                continue;
            }
            $out .= $indent.'- '.$this->listItemBody($item['content'] ?? [], $depth + 1)."\n";
        }

        return $out;
    }

    private function orderedList(array $items, int $depth): string
    {
        $indent = str_repeat('  ', $depth);
        $out = '';
        $i = 1;
        foreach ($items as $item) {
            if (! is_array($item)) {
                continue;
            }
            $out .= $indent.$i.'. '.$this->listItemBody($item['content'] ?? [], $depth + 1)."\n";
            $i++;
        }

        return $out;
    }

    private function taskList(array $items, int $depth): string
    {
        $indent = str_repeat('  ', $depth);
        $out = '';
        foreach ($items as $item) {
            if (! is_array($item)) {
                continue;
            }
            $box = ! empty($item['attrs']['checked']) ? '[x]' : '[ ]';
            $out .= $indent.'- '.$box.' '.$this->listItemBody($item['content'] ?? [], $depth + 1)."\n";
        }

        return $out;
    }

    private function listItemBody(array $children, int $childDepth): string
    {
        $first = '';
        $rest = '';
        $primed = false;
        foreach ($children as $child) {
            if (! is_array($child)) {
                continue;
            }
            $rendered = trim($this->node($child, $childDepth));
            if (! $primed) {
                $first = $rendered;
                $primed = true;
            } else {
                $rest .= "\n".str_repeat('  ', $childDepth).$rendered;
            }
        }

        return $first.$rest;
    }

    private function blockquote(array $content): string
    {
        $inner = trim($this->blocks($content, 0));
        $lines = preg_split('/\n/', $inner) ?: [];

        return implode("\n", array_map(fn ($l) => '> '.$l, $lines))."\n";
    }

    private function codeBlock(array $attrs, array $content): string
    {
        $lang = (string) ($attrs['language'] ?? '');
        $code = '';
        foreach ($content as $child) {
            if (is_array($child) && ($child['type'] ?? '') === 'text') {
                $code .= (string) ($child['text'] ?? '');
            }
        }

        return "```{$lang}\n{$code}\n```\n\n";
    }

    private function image(array $attrs): string
    {
        $src = (string) ($attrs['src'] ?? '');
        $alt = (string) ($attrs['alt'] ?? '');
        if ($src === '') {
            return '';
        }

        return "![{$alt}]({$src})";
    }

    private function callout(array $attrs, array $content): string
    {
        $variant = strtoupper((string) ($attrs['variant'] ?? 'info'));
        $tag = match ($variant) {
            'WARNING' => 'WARNING',
            'DANGER' => 'CAUTION',
            'SUCCESS' => 'TIP',
            default => 'NOTE',
        };
        $body = trim($this->blocks($content, 0));
        $lines = preg_split('/\n/', $body) ?: [];

        return "> [!{$tag}]\n".implode("\n", array_map(fn ($l) => '> '.$l, $lines))."\n";
    }

    private function table(array $content): string
    {
        $rows = [];
        $header = [];
        $first = true;
        foreach ($content as $row) {
            if (! is_array($row) || ($row['type'] ?? '') !== 'tableRow') {
                continue;
            }
            $cells = [];
            $isHeaderRow = false;
            foreach ($row['content'] ?? [] as $cell) {
                if (! is_array($cell)) {
                    continue;
                }
                if (($cell['type'] ?? '') === 'tableHeader') {
                    $isHeaderRow = true;
                }
                $cells[] = trim($this->inline($cell['content'][0]['content'] ?? $cell['content'] ?? []));
            }
            if ($first && $isHeaderRow) {
                $header = $cells;
            } else {
                $rows[] = $cells;
            }
            $first = false;
        }

        if (! $header && $rows) {
            $header = $rows[0];
            $rows = array_slice($rows, 1);
        }
        if (! $header) {
            return '';
        }

        $sep = array_fill(0, count($header), '---');
        $out = '| '.implode(' | ', $header)." |\n";
        $out .= '| '.implode(' | ', $sep)." |\n";
        foreach ($rows as $r) {
            $out .= '| '.implode(' | ', $r)." |\n";
        }

        return $out."\n";
    }
}
