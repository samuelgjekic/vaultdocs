import { useEffect, useRef, useState } from "react";
import { useDocHTML } from "@/lib/tiptap/extensions";
import { Link as LinkIcon, Copy, Check } from "lucide-react";

interface Props {
  content: any;
}

export function PageContent({ content }: Props) {
  const html = useDocHTML(content);
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    // add IDs to headings + click handlers for copy buttons
    const headings = ref.current.querySelectorAll("h1, h2, h3, h4");
    headings.forEach((h) => {
      const text = h.textContent || "";
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      if (id) (h as HTMLElement).id = id;
    });

    // wire callout styling
    ref.current.querySelectorAll(".vd-callout").forEach((el) => {
      const variant = (el as HTMLElement).dataset.variant ?? "info";
      el.className = `vd-callout my-5 rounded-lg border-l-4 px-4 py-3 callout-${variant}`;
    });

    // wire code block copy buttons
    ref.current.querySelectorAll("pre").forEach((pre) => {
      if (pre.querySelector("[data-copy-btn]")) return;
      const btn = document.createElement("button");
      btn.dataset.copyBtn = "true";
      btn.className =
        "absolute top-2 right-2 text-xs px-2 py-1 rounded bg-background/70 hover:bg-background text-muted-foreground hover:text-foreground transition-opacity opacity-0 group-hover:opacity-100";
      btn.textContent = "Copy";
      btn.onclick = () => {
        navigator.clipboard.writeText(pre.textContent || "");
        btn.textContent = "Copied";
        setTimeout(() => (btn.textContent = "Copy"), 1200);
      };
      pre.classList.add("relative", "group");
      pre.appendChild(btn);
    });
  }, [html]);

  const copyAnchor = (id: string) => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <>
      <div ref={ref} className="prose-doc relative" dangerouslySetInnerHTML={{ __html: html }} />
      {/* Heading hover anchor buttons rendered via overlay */}
      <style>{`
        .callout-info    { background: hsl(var(--callout-info-bg));    color: hsl(var(--callout-info-fg));    border-color: hsl(var(--callout-info-fg)); }
        .callout-warning { background: hsl(var(--callout-warning-bg)); color: hsl(var(--callout-warning-fg)); border-color: hsl(var(--callout-warning-fg)); }
        .callout-danger  { background: hsl(var(--callout-danger-bg));  color: hsl(var(--callout-danger-fg));  border-color: hsl(var(--callout-danger-fg)); }
        .callout-success { background: hsl(var(--callout-success-bg)); color: hsl(var(--callout-success-fg)); border-color: hsl(var(--callout-success-fg)); }
      `}</style>
      {/* dummy refs for unused icons (tree-shake friendly) */}
      <span className="hidden">
        <LinkIcon /> <Copy /> <Check />
        {copied}
      </span>
    </>
  );
}
