import { api } from "@/api/client";
import type { PageNode, SearchResult, Space } from "@/types";

export const listSpaces = async (): Promise<Space[]> => {
  const { data } = await api.get<Space[]>("/spaces");
  return data;
};

export const getSpace = async (orgSlug: string, spaceSlug: string): Promise<Space | undefined> => {
  try {
    const { data } = await api.get<Space>(`/orgs/${orgSlug}/spaces/${spaceSlug}`);
    return data;
  } catch {
    return undefined;
  }
};

export const updateSpace = async (
  orgSlug: string,
  spaceSlug: string,
  patch: Partial<Space>
): Promise<Space> => {
  const { data } = await api.put<Space>(`/orgs/${orgSlug}/spaces/${spaceSlug}`, patch);
  return data;
};

export interface CreateSpaceInput {
  name: string;
  visibility: "public" | "private" | "unlisted";
  description?: string;
  icon?: string;
}

export const createSpace = async (orgSlug: string, input: CreateSpaceInput): Promise<Space> => {
  const { data } = await api.post<Space>(`/orgs/${orgSlug}/spaces`, input);
  return data;
};

export const getPageTree = async (orgSlug: string, spaceSlug: string): Promise<PageNode[]> => {
  const { data } = await api.get<PageNode[]>(`/orgs/${orgSlug}/spaces/${spaceSlug}/pages`);
  return data;
};

interface ReorderEntry {
  id: string;
  parent_id: string | null;
  position: number;
}

export const reorderTree = async (orgSlug: string, spaceSlug: string, tree: PageNode[]) => {
  const items: ReorderEntry[] = [];
  const walk = (nodes: PageNode[], parentId: string | null) => {
    nodes.forEach((n, position) => {
      items.push({ id: n.id, parent_id: parentId, position });
      if (n.children?.length) walk(n.children, n.id);
    });
  };
  walk(tree, null);
  await api.put(`/orgs/${orgSlug}/spaces/${spaceSlug}/tree`, { items });
};

export const updatePageContent = async (
  orgSlug: string,
  spaceSlug: string,
  pageId: string,
  content: unknown,
  meta?: { title?: string; is_draft?: boolean }
): Promise<PageNode> => {
  const { data } = await api.put<PageNode>(
    `/orgs/${orgSlug}/spaces/${spaceSlug}/pages/${pageId}`,
    { content, ...meta }
  );
  return data;
};

export const searchSpace = async (
  orgSlug: string,
  spaceSlug: string,
  q: string
): Promise<SearchResult[]> => {
  if (!q.trim()) return [];
  const { data } = await api.get<SearchResult[]>(
    `/orgs/${orgSlug}/spaces/${spaceSlug}/search`,
    { params: { q } }
  );
  return data;
};

export const flatPages = (
  tree: PageNode[],
  path: string[] = []
): { node: PageNode; path: string[] }[] => {
  const out: { node: PageNode; path: string[] }[] = [];
  for (const n of tree) {
    const p = n.type === "group" || n.type === "divider" ? path : [...path, n.slug];
    if (n.type === "page") out.push({ node: n, path: p });
    if (n.children?.length) out.push(...flatPages(n.children, p));
  }
  return out;
};

export const findPageByPath = (tree: PageNode[], segments: string[]): PageNode | undefined => {
  const flat = flatPages(tree);
  if (segments.length === 0) return flat[0]?.node;
  return flat.find((f) => f.path.join("/") === segments.join("/"))?.node;
};
