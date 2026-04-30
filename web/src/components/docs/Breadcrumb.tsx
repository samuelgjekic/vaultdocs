import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export function Breadcrumb({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[13px] text-muted-foreground mb-2">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1 min-w-0">
          {i > 0 && <ChevronRight className="h-3 w-3 shrink-0" />}
          {it.to ? (
            <Link to={it.to} className="hover:text-foreground truncate">
              {it.label}
            </Link>
          ) : (
            <span className="text-foreground truncate">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
