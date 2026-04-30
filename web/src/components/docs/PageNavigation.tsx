import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface NavItem {
  title: string;
  path: string[];
}

export function PageNavigation({
  basePath,
  prev,
  next,
}: {
  basePath: string;
  prev?: NavItem;
  next?: NavItem;
}) {
  if (!prev && !next) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-16">
      {prev ? (
        <Link
          to={`${basePath}/${prev.path.join("/")}`}
          className="group rounded-lg border border-border p-4 hover:border-primary transition-colors"
        >
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Previous
          </div>
          <div className="font-medium group-hover:text-primary transition-colors">{prev.title}</div>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          to={`${basePath}/${next.path.join("/")}`}
          className="group rounded-lg border border-border p-4 text-right hover:border-primary transition-colors"
        >
          <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground mb-1">
            Next <ArrowRight className="h-3.5 w-3.5" />
          </div>
          <div className="font-medium group-hover:text-primary transition-colors">{next.title}</div>
        </Link>
      ) : (
        <div />
      )}
    </div>
  );
}
