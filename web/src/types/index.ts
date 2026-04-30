export type Role = "viewer" | "editor" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: Role;
  is_admin?: boolean;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export type SpaceVisibility = "public" | "private" | "unlisted";

export interface Space {
  id: string;
  org_id: string;
  org_slug: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string; // emoji or url
  cover?: string;
  visibility: SpaceVisibility;
  password_protected?: boolean;
  accent_color?: string; // hex
  show_powered_by: boolean;
  logo?: string;
  custom_domain?: string;
}

export interface Member {
  id: string;
  user: User;
  role: Role;
}

export type PageItemType = "page" | "group" | "divider" | "link";

export interface PageNode {
  id: string;
  parent_id: string | null;
  type: PageItemType;
  title: string;
  slug: string;
  emoji?: string;
  is_draft?: boolean;
  external_url?: string;
  position: number;
  updated_at: string;
  children?: PageNode[];
  // Tiptap JSON content (for `page` type)
  content?: any;
}

export interface SearchResult {
  page_id: string;
  title: string;
  breadcrumb: string[];
  snippet: string;
  slug_path: string[];
}

export interface InstallationSettings {
  app_name: string;
  logo?: string;
  registration_enabled: boolean;
  smtp?: { host: string; port: number; user: string };
  setup_required: boolean;
}
