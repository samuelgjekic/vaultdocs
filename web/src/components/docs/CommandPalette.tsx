import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useNavigate } from "react-router-dom";
import { Search, FileText, ArrowRight } from "lucide-react";
import { searchSpace, flatPages } from "@/api/spaces";
import type { PageNode, SearchResult } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgSlug: string;
  spaceSlug: string;
  tree: PageNode[];
  basePath: string;
}

export function CommandPalette({ open, onOpenChange, orgSlug, spaceSlug, tree, basePath }: Props) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const id = setTimeout(async () => {
      if (!q.trim()) {
        const recent = flatPages(tree)
          .slice(0, 6)
          .map((f) => ({
            page_id: f.node.id,
            title: f.node.title,
            breadcrumb: f.path.slice(0, -1),
            snippet: "",
            slug_path: f.path,
          }));
        setResults(recent);
        return;
      }
      setResults(await searchSpace(orgSlug, spaceSlug, q));
    }, 120);
    return () => clearTimeout(id);
  }, [q, open, orgSlug, spaceSlug, tree]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4 animate-fade-in"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-2xl bg-popover text-popover-foreground rounded-xl border border-border shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Command shouldFilter={false} className="flex flex-col">
          <div className="flex items-center gap-3 px-4 border-b border-border">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Command.Input
              autoFocus
              value={q}
              onValueChange={setQ}
              placeholder="Search pages…"
              className="flex-1 h-12 bg-transparent outline-none text-[15px] placeholder:text-muted-foreground"
            />
            <kbd className="text-[11px] text-muted-foreground border border-border rounded px-1.5 py-0.5">ESC</kbd>
          </div>
          <Command.List className="max-h-[60vh] overflow-y-auto p-2">
            {results.length === 0 && (
              <Command.Empty className="text-center text-muted-foreground py-10 text-sm">
                No results
              </Command.Empty>
            )}
            {!q && results.length > 0 && (
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-2 pt-2 pb-1">
                Recent
              </p>
            )}
            {results.map((r) => (
              <Command.Item
                key={r.page_id}
                value={r.page_id + r.title}
                onSelect={() => {
                  navigate(`${basePath}/${r.slug_path.join("/")}`);
                  onOpenChange(false);
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.title}</p>
                  {r.breadcrumb.length > 0 && (
                    <p className="text-xs text-muted-foreground truncate">{r.breadcrumb.join(" / ")}</p>
                  )}
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
