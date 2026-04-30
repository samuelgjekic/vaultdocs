import type { InstallationSettings, Organization, PageNode, Space, User } from "@/types";

export const installation: InstallationSettings = {
  app_name: "VaultDocs",
  registration_enabled: true,
  setup_required: false,
};

export const currentUser: User = {
  id: "u_1",
  name: "Ada Lovelace",
  email: "ada@vaultdocs.io",
  role: "admin",
  is_admin: true,
  created_at: "2025-01-01T00:00:00Z",
};

export const organizations: Organization[] = [
  { id: "o_1", name: "Acme", slug: "acme", created_at: "2025-01-01T00:00:00Z" },
];

export const spaces: Space[] = [
  {
    id: "s_1",
    org_id: "o_1",
    org_slug: "acme",
    name: "Product Docs",
    slug: "product-docs",
    description: "Everything you need to know about Acme.",
    icon: "📘",
    visibility: "public",
    accent_color: "#4F46E5",
    show_powered_by: true,
  },
  {
    id: "s_2",
    org_id: "o_1",
    org_slug: "acme",
    name: "API Reference",
    slug: "api",
    description: "Technical reference for the Acme API.",
    icon: "⚙️",
    visibility: "public",
    accent_color: "#4F46E5",
    show_powered_by: true,
  },
];

const tip = (text: string) => ({
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Welcome to " },
        { type: "text", marks: [{ type: "bold" }], text: "VaultDocs" },
        { type: "text", text: " — an open-source, self-hosted documentation platform built for teams who care about polish." },
      ],
    },
    {
      type: "callout",
      attrs: { variant: "info" },
      content: [{ type: "paragraph", content: [{ type: "text", text: "This page is rendered from Tiptap JSON." }] }],
    },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Getting started" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Use the sidebar to navigate, " },
        { type: "text", marks: [{ type: "code" }], text: "⌘K" },
        { type: "text", text: " to search, and the right rail to jump between sections." },
      ],
    },
    {
      type: "bulletList",
      content: [
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Clean three-column layout designed for long-form docs" }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Tiptap-based editor with slash commands" }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Drag-and-drop sidebar reordering" }] }] },
      ],
    },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Code example" }] },
    {
      type: "codeBlock",
      attrs: { language: "ts" },
      content: [{ type: "text", text: "import { vault } from 'vaultdocs';\n\nawait vault.connect({ apiKey: process.env.KEY });" }],
    },
    { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Next steps" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Try editing this page by clicking " },
        { type: "text", marks: [{ type: "bold" }], text: "Edit" },
        { type: "text", text: " in the top-right corner." },
      ],
    },
  ],
});

const now = "2025-04-29T10:00:00Z";

export const pageTreeBySpace: Record<string, PageNode[]> = {
  "product-docs": [
    {
      id: "p_intro_group",
      parent_id: null,
      type: "group",
      title: "Introduction",
      slug: "introduction",
      position: 0,
      updated_at: now,
      children: [
        { id: "p_welcome", parent_id: "p_intro_group", type: "page", title: "Welcome", slug: "welcome", emoji: "👋", position: 0, updated_at: now, content: tip("Welcome") },
        { id: "p_quickstart", parent_id: "p_intro_group", type: "page", title: "Quickstart", slug: "quickstart", emoji: "⚡", position: 1, updated_at: now, content: tip("Quickstart") },
        { id: "p_concepts", parent_id: "p_intro_group", type: "page", title: "Core concepts", slug: "concepts", position: 2, updated_at: now, content: tip("Core concepts"), children: [
          { id: "p_spaces", parent_id: "p_concepts", type: "page", title: "Spaces", slug: "spaces", position: 0, updated_at: now, content: tip("Spaces") },
          { id: "p_pages", parent_id: "p_concepts", type: "page", title: "Pages", slug: "pages", position: 1, updated_at: now, content: tip("Pages"), is_draft: true },
        ]},
      ],
    },
    { id: "p_div_1", parent_id: null, type: "divider", title: "", slug: "div-1", position: 1, updated_at: now },
    {
      id: "p_guides_group",
      parent_id: null,
      type: "group",
      title: "Guides",
      slug: "guides",
      position: 2,
      updated_at: now,
      children: [
        { id: "p_install", parent_id: "p_guides_group", type: "page", title: "Self-hosting", slug: "self-hosting", position: 0, updated_at: now, content: tip("Self-hosting") },
        { id: "p_themes", parent_id: "p_guides_group", type: "page", title: "Theming", slug: "theming", position: 1, updated_at: now, content: tip("Theming") },
        { id: "p_link_gh", parent_id: "p_guides_group", type: "link", title: "GitHub repository", slug: "github", external_url: "https://github.com", position: 2, updated_at: now },
      ],
    },
  ],
  "api": [
    {
      id: "p_api_group",
      parent_id: null,
      type: "group",
      title: "Reference",
      slug: "reference",
      position: 0,
      updated_at: now,
      children: [
        { id: "p_auth", parent_id: "p_api_group", type: "page", title: "Authentication", slug: "auth", position: 0, updated_at: now, content: tip("Authentication") },
        { id: "p_rate", parent_id: "p_api_group", type: "page", title: "Rate limits", slug: "rate-limits", position: 1, updated_at: now, content: tip("Rate limits") },
      ],
    },
  ],
};
