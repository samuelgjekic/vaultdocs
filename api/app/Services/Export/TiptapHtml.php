<?php

namespace App\Services\Export;

/**
 * Walks a Tiptap document JSON and emits semantic HTML.
 *
 * Mirrors the node types registered in web/src/lib/tiptap/extensions.ts.
 * Used by SpaceExporter for both PDF (rendered via dompdf) and any future
 * HTML-based export. Plain-text-style escaping is applied at every text leaf;
 * attribute values that flow into HTML attributes go through htmlspecialchars.
 */
class TiptapHtml
{
    public function render(?array $doc): string
    {
        if (! is_array($doc)) {
            return '';
        }

        return $this->node($doc);
    }

    private function node(array $node): string
    {
        $type = $node['type'] ?? '';
        $attrs = $node['attrs'] ?? [];
        $content = $node['content'] ?? [];

        return match ($type) {
            'doc' => $this->children($content),
            'paragraph' => '<p>'.$this->children($content).'</p>',
            'heading' => $this->heading((int) ($attrs['level'] ?? 2), $content),
            'text' => $this->text($node),
            'bulletList' => '<ul>'.$this->children($content).'</ul>',
            'orderedList' => '<ol>'.$this->children($content).'</ol>',
            'listItem' => '<li>'.$this->children($content).'</li>',
            'taskList' => '<ul class="task-list">'.$this->children($content).'</ul>',
            'taskItem' => $this->taskItem($attrs, $content),
            'blockquote' => '<blockquote>'.$this->children($content).'</blockquote>',
            'codeBlock' => '<pre><code>'.$this->plain($content).'</code></pre>',
            'horizontalRule' => '<hr>',
            'hardBreak' => '<br>',
            'image' => $this->image($attrs),
            'callout' => $this->callout($attrs, $content),
            'table' => '<table>'.$this->children($content).'</table>',
            'tableRow' => '<tr>'.$this->children($content).'</tr>',
            'tableCell' => '<td>'.$this->children($content).'</td>',
            'tableHeader' => '<th>'.$this->children($content).'</th>',
            default => $this->children($content),
        };
    }

    private function children(array $nodes): string
    {
        $out = '';
        foreach ($nodes as $child) {
            if (is_array($child)) {
                $out .= $this->node($child);
            }
        }

        return $out;
    }

    private function heading(int $level, array $content): string
    {
        $level = max(1, min(6, $level));

        return "<h{$level}>".$this->children($content)."</h{$level}>";
    }

    private function text(array $node): string
    {
        $text = htmlspecialchars((string) ($node['text'] ?? ''), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        foreach ($node['marks'] ?? [] as $mark) {
            $type = $mark['type'] ?? '';
            $attrs = $mark['attrs'] ?? [];
            $text = match ($type) {
                'bold' => "<strong>{$text}</strong>",
                'italic' => "<em>{$text}</em>",
                'underline' => "<u>{$text}</u>",
                'strike' => "<s>{$text}</s>",
                'code' => "<code>{$text}</code>",
                'link' => $this->link($text, $attrs),
                default => $text,
            };
        }

        return $text;
    }

    private function link(string $text, array $attrs): string
    {
        $href = htmlspecialchars((string) ($attrs['href'] ?? '#'), ENT_QUOTES, 'UTF-8');

        return '<a href="'.$href.'">'.$text.'</a>';
    }

    private function image(array $attrs): string
    {
        $src = htmlspecialchars((string) ($attrs['src'] ?? ''), ENT_QUOTES, 'UTF-8');
        $alt = htmlspecialchars((string) ($attrs['alt'] ?? ''), ENT_QUOTES, 'UTF-8');
        if ($src === '') {
            return '';
        }

        return '<img src="'.$src.'" alt="'.$alt.'">';
    }

    private function callout(array $attrs, array $content): string
    {
        $variant = htmlspecialchars((string) ($attrs['variant'] ?? 'info'), ENT_QUOTES, 'UTF-8');

        return '<div class="callout callout-'.$variant.'">'.$this->children($content).'</div>';
    }

    private function taskItem(array $attrs, array $content): string
    {
        $checked = ! empty($attrs['checked']) ? 'checked' : '';

        return '<li class="task-item"><input type="checkbox" disabled '.$checked.'> <span>'.$this->children($content).'</span></li>';
    }

    /**
     * For code-block content: collect raw text without applying marks (pre-formatted).
     */
    private function plain(array $nodes): string
    {
        $out = '';
        foreach ($nodes as $child) {
            if (! is_array($child)) {
                continue;
            }
            if (($child['type'] ?? '') === 'text') {
                $out .= htmlspecialchars((string) ($child['text'] ?? ''), ENT_QUOTES | ENT_HTML5, 'UTF-8');
            } elseif (! empty($child['content']) && is_array($child['content'])) {
                $out .= $this->plain($child['content']);
            }
        }

        return $out;
    }
}
