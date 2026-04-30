import { Zap } from "lucide-react";

export function PoweredBy() {
  return (
    <a
      href="https://vaultdocs.io"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
    >
      <Zap className="h-3 w-3" />
      <span>
        Powered by <strong className="font-semibold">VaultDocs</strong>
      </span>
    </a>
  );
}
