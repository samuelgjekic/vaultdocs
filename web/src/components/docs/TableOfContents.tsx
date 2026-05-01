import { useEffect, useState } from "react";
import { List } from "lucide-react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents({ contentSelector = ".prose-doc" }: { contentSelector?: string }) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    let mutObserver: MutationObserver | null = null;
    let debounce: number | undefined;

    const requery = () => {
      const root = document.querySelector(contentSelector);
      if (!root) return;
      const els = Array.from(root.querySelectorAll("h2, h3, h4")) as HTMLElement[];
      const list: Heading[] = els.map((el) => ({
        id: el.id,
        text: el.textContent || "",
        level: Number(el.tagName.replace("H", "")),
      }));
      setHeadings(list);

      observer?.disconnect();
      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          if (visible[0]) setActive((visible[0].target as HTMLElement).id);
        },
        { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
      );
      els.forEach((e) => observer!.observe(e));
    };

    requery();

    // Watch the content area; PageContent sets innerHTML and assigns heading IDs
    // in its own useEffect, so we may have queried before either ran. Debounced
    // because PageContent also injects anchor buttons into each heading, which
    // would otherwise trigger requery on every button add.
    const root = document.querySelector(contentSelector);
    if (root) {
      mutObserver = new MutationObserver(() => {
        window.clearTimeout(debounce);
        debounce = window.setTimeout(requery, 80);
      });
      mutObserver.observe(root, { childList: true, subtree: true });
    }

    return () => {
      window.clearTimeout(debounce);
      observer?.disconnect();
      mutObserver?.disconnect();
    };
  }, [contentSelector]);

  return (
    <nav className="text-[13px]">
      <p className="text-muted-foreground uppercase tracking-wide text-[11px] font-semibold mb-3 inline-flex items-center gap-1.5">
        <List className="h-3 w-3" />
        On this page
      </p>
      {headings.length === 0 ? (
        <p className="text-muted-foreground/70 text-xs italic">No sections on this page yet.</p>
      ) : (
        <ul className="space-y-1.5 border-l border-border">
          {headings.map((h) => (
            <li key={h.id} style={{ paddingLeft: (h.level - 2) * 12 + 12 }}>
              <a
                href={`#${h.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  history.replaceState(null, "", `#${h.id}`);
                }}
                className={`block -ml-px border-l-2 pl-3 py-0.5 transition-colors ${
                  active === h.id
                    ? "border-primary text-primary font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
