import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPageTree, getSpace, listSpaces, reorderTree } from "@/api/spaces";
import { SidebarTree } from "@/components/docs/SidebarTree";
import { CommandPalette } from "@/components/docs/CommandPalette";
import { ThemeToggle } from "@/components/docs/ThemeToggle";
import { PoweredBy } from "@/components/docs/PoweredBy";
import { Search, Menu, X, Settings, LogOut, ChevronDown, Plus } from "lucide-react";
import { IconRender } from "@/lib/icon";
import { CreateSpaceDialog } from "@/components/docs/CreateSpaceDialog";
import { useAuthStore } from "@/store/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import logo from "@/assets/vaultdocs-logo.png";

interface Props {
  orgSlug: string;
  spaceSlug: string;
  activePath: string[];
  children: React.ReactNode;
  rightRail?: React.ReactNode;
}

export function DocsLayout({ orgSlug, spaceSlug, activePath, children, rightRail }: Props) {
  const basePath = `/${orgSlug}/${spaceSlug}`;
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [createSpaceOpen, setCreateSpaceOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const { data: space } = useQuery({ queryKey: ["space", orgSlug, spaceSlug], queryFn: () => getSpace(orgSlug, spaceSlug) });
  const { data: tree, refetch } = useQuery({ queryKey: ["tree", orgSlug, spaceSlug], queryFn: () => getPageTree(orgSlug, spaceSlug) });
  const { data: allSpaces } = useQuery({ queryKey: ["spaces"], queryFn: listSpaces });

  const location = useLocation();
  useEffect(() => setMobileOpen(false), [location.pathname]);

  // ⌘/ toggle sidebar (desktop)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setMobileOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!space) {
    return <div className="h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }

  const canEdit = user?.role === "editor" || user?.role === "admin";

  const sidebarContent = (
    <>
      <div className="px-3 pt-4 pb-2">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full flex items-center gap-2 rounded-md px-2 py-2 hover:bg-muted text-left">
            <IconRender value={space.icon} className="h-6 w-6" fallback={<span className="text-2xl leading-none">📘</span>} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{space.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{orgSlug}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>Switch space</DropdownMenuLabel>
            {allSpaces?.map((sp) => (
              <DropdownMenuItem key={sp.id} asChild>
                <Link to={`/${sp.org_slug}/${sp.slug}`} className="flex items-center gap-2">
                  <IconRender value={sp.icon} className="h-4 w-4" />
                  <span>{sp.name}</span>
                </Link>
              </DropdownMenuItem>
            ))}
            {user && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setCreateSpaceOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-2" /> New space
                </DropdownMenuItem>
              </>
            )}
            {canEdit && (
              <DropdownMenuItem asChild>
                <Link to={`${basePath}/~/settings`} className="flex items-center gap-2">
                  <Settings className="h-3.5 w-3.5" /> Space settings
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={() => setPaletteOpen(true)}
          className="mt-3 w-full flex items-center gap-2 px-2.5 py-1.5 text-sm text-muted-foreground bg-background border border-border rounded-md hover:border-foreground/20 transition-colors"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1 text-left">Search…</span>
          <kbd className="text-[10px] border border-border rounded px-1 py-0.5">⌘K</kbd>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {tree && (
          <SidebarTree
            space={space}
            tree={tree}
            basePath={basePath}
            activePath={activePath}
            canEdit={canEdit}
            onReorder={async (next) => {
              await reorderTree(orgSlug, spaceSlug, next);
              refetch();
            }}
          />
        )}
      </div>

      {space.show_powered_by && (
        <div className="border-t border-border">
          <PoweredBy />
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[260px] shrink-0 flex-col border-r border-border bg-[hsl(var(--sidebar-bg))] sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[280px] bg-[hsl(var(--sidebar-bg))] border-r border-border flex flex-col">
            <button
              className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-muted"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-14 border-b border-border bg-background/80 backdrop-blur flex items-center gap-2 px-4">
          <button
            className="md:hidden p-2 rounded-md hover:bg-muted"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <Link to="/" className="md:hidden flex items-center gap-2">
            <img src={logo} alt="VaultDocs" width={20} height={20} />
          </Link>
          <div className="flex-1" />
          <button
            onClick={() => setPaletteOpen(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground border border-border rounded-md hover:border-foreground/20"
          >
            <Search className="h-3.5 w-3.5" />
            <kbd className="text-[10px]">⌘K</kbd>
          </button>
          <ThemeToggle />
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger className="h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center justify-center">
                {user.name.charAt(0)}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/~/settings"><Settings className="h-3.5 w-3.5 mr-2" /> Account settings</Link>
                </DropdownMenuItem>
                {user.is_admin && (
                  <DropdownMenuItem asChild>
                    <Link to="/~/admin">Installation admin</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { void logout(); }} className="text-destructive">
                  <LogOut className="h-3.5 w-3.5 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </header>

        <div className="flex-1 flex justify-center">
          <div className="flex w-full max-w-[1100px]">
            <main className="flex-1 min-w-0 max-w-[760px] px-6 lg:px-12 py-10">
              {children}
            </main>
            {rightRail && (
              <aside className="docs-toc-rail hidden lg:block w-[220px] shrink-0 px-4 py-10 sticky top-14 self-start max-h-[calc(100vh-3.5rem)] overflow-y-auto">
                {rightRail}
              </aside>
            )}
          </div>
        </div>
      </div>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        orgSlug={orgSlug}
        spaceSlug={spaceSlug}
        tree={tree ?? []}
        basePath={basePath}
      />

      <CreateSpaceDialog
        orgSlug={orgSlug}
        open={createSpaceOpen}
        onOpenChange={setCreateSpaceOpen}
      />
    </div>
  );
}
