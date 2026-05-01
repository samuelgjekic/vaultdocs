import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import NProgress from "nprogress";
import { findPageByPath, flatPages, getSpace, getPageTree, updatePageContent } from "@/api/spaces";
import type { PageNode } from "@/types";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { PageContent } from "@/components/docs/PageContent";
import { PageEditor } from "@/components/docs/PageEditor";
import { TableOfContents } from "@/components/docs/TableOfContents";
import { PageNavigation } from "@/components/docs/PageNavigation";
import { Breadcrumb } from "@/components/docs/Breadcrumb";
import { useAuthStore } from "@/store/auth";
import { useSpaceStore } from "@/store/space";
import { Pencil, Eye, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpacePasswordGate } from "@/components/docs/SpacePasswordGate";

export default function SpacePage() {
  const { orgSlug = "", spaceSlug = "", "*": rest = "" } = useParams();
  const segments = rest ? rest.split("/").filter(Boolean) : [];
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isUnlocked = useSpaceStore((s) => s.isUnlocked);

  const { data: space, isLoading: loadingSpace } = useQuery({
    queryKey: ["space", orgSlug, spaceSlug],
    queryFn: () => getSpace(orgSlug, spaceSlug),
  });

  const { data: tree } = useQuery({
    queryKey: ["tree", orgSlug, spaceSlug],
    queryFn: () => getPageTree(orgSlug, spaceSlug),
    enabled: !!space,
  });

  const page = useMemo(
    () => (tree ? findPageByPath(tree, segments) : undefined),
    [tree, segments]
  );
  const loadingPage = !!space && !tree;

  useEffect(() => {
    if (loadingPage) NProgress.start();
    else NProgress.done();
  }, [loadingPage]);

  const [editing, setEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Patch the cached tree synchronously so Preview reflects edits without
  // waiting for a refetch round-trip.
  const patchTreeCache = (pageId: string, patch: Partial<PageNode>) => {
    qc.setQueryData<PageNode[]>(["tree", orgSlug, spaceSlug], (prev) => {
      if (!prev) return prev;
      const walk = (nodes: PageNode[]): PageNode[] =>
        nodes.map((n) => {
          if (n.id === pageId) return { ...n, ...patch };
          if (n.children?.length) return { ...n, children: walk(n.children) };
          return n;
        });
      return walk(prev);
    });
  };

  const flat = useMemo(() => (tree ? flatPages(tree) : []), [tree]);
  const idx = page ? flat.findIndex((f) => f.node.id === page.id) : -1;
  const prev = idx > 0 ? { title: flat[idx - 1].node.title, path: flat[idx - 1].path } : undefined;
  const next = idx >= 0 && idx < flat.length - 1 ? { title: flat[idx + 1].node.title, path: flat[idx + 1].path } : undefined;

  if (loadingSpace) {
    return <div className="h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }
  if (!space) return <Navigate to="/" replace />;

  // password / private gate
  const needsGate =
    space.visibility === "private" && !user
      ? true
      : space.password_protected && !isUnlocked(space.slug);

  if (needsGate) {
    return <SpacePasswordGate space={space} />;
  }

  // empty / not-found page handling
  if (!loadingPage && segments.length === 0 && flat[0]) {
    return <Navigate to={`/${orgSlug}/${spaceSlug}/${flat[0].path.join("/")}`} replace />;
  }

  const canEdit = user?.role === "editor" || user?.role === "admin";
  const basePath = `/${orgSlug}/${spaceSlug}`;
  const breadcrumbItems = [
    { label: orgSlug, to: "/" },
    { label: space.name, to: basePath },
    ...segments.slice(0, -1).map((s, i) => ({
      label: s,
      to: `${basePath}/${segments.slice(0, i + 1).join("/")}`,
    })),
    ...(page ? [{ label: page.title }] : []),
  ];

  // key={page.id} forces a remount on navigation so the TOC re-queries headings
  // for the new page; otherwise it holds stale state from the first-loaded page.
  const right = !editing && page ? <TableOfContents key={page.id} /> : null;

  return (
    <DocsLayout orgSlug={orgSlug} spaceSlug={spaceSlug} activePath={segments} rightRail={right}>
      {!page ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">This page doesn’t exist.</p>
          <Button variant="ghost" onClick={() => navigate(basePath)} className="mt-4">
            Back to space
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-4 mb-4">
            <Breadcrumb items={breadcrumbItems} />
            <div className="flex items-center gap-2 shrink-0">
              {editing && (
                <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                  {saveStatus === "saving" ? (
                    <><Loader2 className="h-3 w-3 animate-spin" /> Saving…</>
                  ) : saveStatus === "saved" ? (
                    <><Check className="h-3 w-3" /> Saved</>
                  ) : null}
                </span>
              )}
              {page.is_draft && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-wide">
                  Draft
                </span>
              )}
              {canEdit && (
                <Button variant="outline" size="sm" onClick={() => setEditing((v) => !v)}>
                  {editing ? <><Eye className="h-3.5 w-3.5 mr-1.5" /> Preview</> : <><Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit</>}
                </Button>
              )}
              {editing && page.is_draft && (
                <Button
                  size="sm"
                  onClick={async () => {
                    patchTreeCache(page.id, { is_draft: false });
                    await updatePageContent(orgSlug, spaceSlug, page.id, page.content, { is_draft: false });
                  }}
                >
                  Publish
                </Button>
              )}
            </div>
          </div>

          {editing ? (
            <PageEditor
              key={page.id}
              initialContent={page.content}
              initialTitle={page.title}
              isDraft={page.is_draft}
              onSaveStatus={setSaveStatus}
              onChange={async (content, title) => {
                // Optimistic cache patch — reflects in Preview immediately, no refetch race.
                patchTreeCache(page.id, { content, title });
                await updatePageContent(orgSlug, spaceSlug, page.id, content, { title });
              }}
            />
          ) : (
            <article>
              <h1 className="text-4xl font-bold tracking-tight mb-6">
                {page.emoji && <span className="mr-2">{page.emoji}</span>}
                {page.title}
              </h1>
              <PageContent content={page.content} />
              <PageNavigation basePath={basePath} prev={prev} next={next} />
            </article>
          )}
        </>
      )}
    </DocsLayout>
  );
}
