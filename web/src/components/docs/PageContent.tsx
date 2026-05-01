import { useEffect, useRef } from "react";
import { useDocHTML } from "@/lib/tiptap/extensions";

interface Props {
  content: any;
}

export function PageContent({ content }: Props) {
  const html = useDocHTML(content);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    // Assign anchor IDs + add a copy-link button to each heading on hover.
    const headings = ref.current.querySelectorAll<HTMLElement>("h1, h2, h3, h4");
    headings.forEach((h) => {
      const text = h.textContent || "";
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      if (id) h.id = id;

      if (h.querySelector("[data-anchor-btn]")) return;
      h.classList.add("group", "relative");

      const btn = document.createElement("button");
      btn.dataset.anchorBtn = "true";
      btn.setAttribute("aria-label", "Copy link to this section");
      btn.className =
        "ml-2 inline-flex items-center text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity align-middle text-[0.7em]";
      btn.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="0.85em" height="0.85em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';

      btn.onclick = (ev) => {
        ev.preventDefault();
        const url = `${window.location.origin}${window.location.pathname}#${id}`;
        navigator.clipboard.writeText(url);
        const original = btn.innerHTML;
        btn.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="0.85em" height="0.85em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
        setTimeout(() => { btn.innerHTML = original; }, 1200);
      };

      h.appendChild(btn);
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

  return <div ref={ref} className="prose-doc relative" dangerouslySetInnerHTML={{ __html: html }} />;
}
