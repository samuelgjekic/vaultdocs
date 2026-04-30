import { useEffect, useState } from "react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents({ contentSelector = ".prose-doc" }: { contentSelector?: string }) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const root = document.querySelector(contentSelector);
    if (!root) return;
    const els = Array.from(root.querySelectorAll("h2, h3, h4")) as HTMLElement[];
    const list: Heading[] = els.map((el) => ({
      id: el.id,
      text: el.textContent || "",
      level: Number(el.tagName.replace("H", "")),
    }));
    setHeadings(list);

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive((visible[0].target as HTMLElement).id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );
    els.forEach((e) => obs.observe(e));
    return () => obs.disconnect();
  }, [contentSelector]);

  if (headings.length === 0) return null;

  return (
    <nav className="text-[13px]">
      <p className="text-muted-foreground uppercase tracking-wide text-[11px] font-semibold mb-3">
        On this page
      </p>
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
    </nav>
  );
}
