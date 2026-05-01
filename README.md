# VaultDocs

> **Self-hosted, open-source documentation platform.** Your docs. Your rules.

A clean, polished docs platform you can run on your own server. Tiptap editor, three-column layout, full-text search, drag-to-reorder, themeable per space. MIT licensed.

<img width="1309" height="664" alt="image" src="https://github.com/user-attachments/assets/1f65a574-0fed-46df-a795-c843382993b4" />


---

## Get started in 60 seconds

```sh
git clone https://github.com/samuelgjekic/vaultdocs.git
cd vaultdocs
docker-compose up
```

Open <http://localhost:5173> and walk through `/setup` to create your admin user and first organization.

That's it. Sign in, start writing.

---

## What's inside

- **Rich editor** — Tiptap with formatting toolbar, slash menu (`/` for blocks), bubble menu on selection, drag-to-reorder pages, autosave
- **Custom blocks** — callouts (info / warning / danger / success), code blocks with syntax highlighting, tables, task lists, images
- **Search** — `⌘K` command palette, full-text within a space
- **Export** — download a whole space as PDF (formatting preserved), Markdown (GFM, callouts as `> [!NOTE]` admonitions), or plain text from space settings
- **Icons** — emoji, Lucide icon, image upload, or none — picker per space
- **Themes** — light / dark / system, persisted per user
- **Visibility** — public, private (org members only), or unlisted spaces
- **Auth** — login, register (toggleable), first-run setup wizard

---

## Daily use

### Sign in

Visit your VaultDocs URL and log in with the admin account you created during setup. The seeded demo creds are `admin@dev.dev` / `password`.

### Edit a page

1. Click any page in the sidebar
2. Click **Edit** (top right)
3. Use the toolbar above the editor, type `/` for a block menu, or select text for the bubble toolbar
4. Changes autosave

### Reorder

Drag any page in the sidebar — drop on another page to nest, drop between pages to reorder.

### Export

Open space settings → scroll to **Export** → click **PDF**, **Markdown**, or **TXT**. Downloads start immediately.

### Search

Press `⌘K` (or `Ctrl+K`). Searches titles and content in the current space.

---

## Self-hosting

Docker Compose is the supported path:

```sh
docker-compose up -d
```

Data persists in the `vaultdocs-data` named volume. To start fresh: `docker-compose down -v`.

To put VaultDocs behind your own domain, point a reverse proxy (Caddy / Traefik / nginx) at the `web` container on port 80 and the `api` container on port 8000.

---

<details>
<summary><b>Advanced</b> — tech stack, architecture, configuration, contributing</summary>

## Tech stack

### Backend (`api/`)

- **PHP 8.3** + **Laravel 11+**
- **Sanctum** for SPA cookie auth (CSRF protected)
- **First-party policies** for authorization (`app/Policies/SpacePolicy.php`)
- **SQLite** by default; **MySQL 8+** / **PostgreSQL 14+** by changing `DB_CONNECTION`
- **dompdf** for PDF export
- **Spatie Sluggable** for slugs, **Spatie Permission** wired in for future role expansion
- **PHPUnit 12** — `php artisan test` (25 feature tests at v1)

The backend is intentionally thin: controllers delegate tree assembly, reorder transactions, and Tiptap JSON walking to services in `app/Services/`. Page content is stored as raw Tiptap JSON in `pages.content`; a denormalized plain-text mirror lives in `pages.content_markdown` for `LIKE`-based search. Switching to Laravel Scout (Meilisearch / Typesense / Algolia) is a one-driver-swap upgrade.

### Frontend (`web/`)

- **TypeScript 5** + **React 18** + **Vite 5**
- **React Router v6** for routing
- **TanStack Query v5** for server state, **Zustand v5** for client state (auth, theme)
- **axios** with `withCredentials: true` for Sanctum cookies
- **Tiptap v3** + extensions for tables, task lists, code blocks (lowlight), images, links, placeholder, text-align, underline + a custom callout node
- **Tailwind CSS 3** + **Radix UI** primitives + shadcn/ui patterns
- **@dnd-kit** for sidebar drag-and-drop
- **cmdk** for the search palette
- **lucide-react** for icons, **sonner** for toasts, **nprogress** for the page loader

### Self-hosting containers

- **api** — `php:8.3-cli-alpine` running `php artisan serve` (suitable up to mid traffic; swap in `php-fpm` + nginx for production scale)
- **web** — multi-stage `node:20-alpine` build → `nginx:1.27-alpine` serving the Vite static build
- **storage** — SQLite on a named Docker volume

## Architecture

### Auth

Sanctum SPA cookie flow:

1. Frontend calls `GET /sanctum/csrf-cookie` to seed the `XSRF-TOKEN` cookie
2. Frontend `POST /api/v1/auth/login` — Sanctum's stateful middleware writes a session cookie
3. Subsequent requests carry both cookies automatically
4. `<AuthBoot />` calls `GET /api/v1/auth/me` once on mount to rehydrate the user

In dev, the Vite proxy forwards `/api` and `/sanctum` to the API so SPA + API share an origin (no cross-origin cookie issues).

### Page tree

Pages are stored flat with a self-referencing `parent_id`. The tree endpoint loads all rows for a space in one query and assembles the nested structure in O(n) via `PageService::tree()`. Reorders are bulk: client sends `{ id, parent_id, position }[]`, server validates every id and parent belongs to the space, then writes in one transaction.

### Content storage

Pages persist Tiptap JSON verbatim. The frontend calls `editor.getJSON()` and `PUT`s it; the backend stores it in a `JSON` column. Plain-text extraction for search runs through `PageService::contentToText()`. PDF export goes through `app/Services/Export/TiptapHtml.php` which walks the same JSON tree and emits semantic HTML for dompdf.

### API surface

```
GET    /api/v1/settings                                              public
POST   /api/v1/setup                                                 public, locks after first run
POST   /api/v1/auth/login
POST   /api/v1/auth/register                                         disable via Setting `registration_enabled`
POST   /api/v1/auth/logout                                           auth
GET    /api/v1/auth/me                                               auth
GET    /api/v1/spaces                                                returns spaces visible to caller
GET    /api/v1/orgs/{org}/spaces/{space}                             scoped binding
PUT    /api/v1/orgs/{org}/spaces/{space}                             policy: manage
GET    /api/v1/orgs/{org}/spaces/{space}/pages                       returns nested tree, includes content
POST   /api/v1/orgs/{org}/spaces/{space}/pages                       policy: manage
PUT    /api/v1/orgs/{org}/spaces/{space}/pages/{page}                policy: manage
DELETE /api/v1/orgs/{org}/spaces/{space}/pages/{page}                policy: manage, soft-delete
PUT    /api/v1/orgs/{org}/spaces/{space}/tree                        bulk reorder, transactional
GET    /api/v1/orgs/{org}/spaces/{space}/search?q=                   LIKE on title + content_markdown
GET    /api/v1/orgs/{org}/spaces/{space}/export?format=pdf|md|txt    policy: view
```

All responses are flat JSON (no `data` wrapper). Field shapes are pinned to TypeScript types in `web/src/types/index.ts` — change them in lockstep across api and web.

## Local development

### Backend

```sh
cd api
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed     # seeds demo data + prints admin creds
php artisan serve              # http://localhost:8000
```

For MySQL/Postgres, edit `.env` (`DB_CONNECTION=mysql` etc.) and re-run `php artisan migrate --seed`.

### Frontend

```sh
cd web
npm install --legacy-peer-deps
cp .env.example .env
npm run dev                    # http://localhost:5173
```

The `--legacy-peer-deps` flag is needed because some Radix and Tiptap peer ranges drift slightly.

### Common commands

```sh
php artisan migrate:fresh --seed   # reset DB, prints admin creds
php artisan route:list             # list all API routes
php artisan test                   # run all tests
php artisan tinker                 # REPL with full app context
npm run build                      # production frontend bundle
```

## Configuration

### Backend env (`api/.env`)

| Variable | Default | Purpose |
|---|---|---|
| `APP_URL` | `http://localhost:8000` | Public URL of the API |
| `APP_FRONTEND_URL` | `http://localhost:5173` | SPA origin — used by CORS |
| `SANCTUM_STATEFUL_DOMAINS` | `localhost:5173,127.0.0.1:5173` | Domains that get session cookies |
| `DB_CONNECTION` | `sqlite` | `sqlite`, `mysql`, or `pgsql` |
| `DB_DATABASE` | `database/database.sqlite` | Path or DB name |
| `SESSION_DRIVER` | `database` | `cookie` works for stateless deployments |
| `SESSION_SAME_SITE` | `lax` | Set to `none` (with HTTPS) for cross-origin SPA hosts |
| `DOMPDF_ENABLE_REMOTE` | `true` | Allow PDF export to fetch remote `<img src="https://...">`. Set to `false` to harden against SSRF. |
| `MAIL_MAILER` | `log` | Switch to `smtp` for password resets |

### Frontend env (`web/.env`)

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `/api/v1` (proxied in dev) | Where the SPA hits the API |

### DB-backed runtime settings

Settings in the `settings` table take effect at runtime without restart:

- `setup_complete` — `'1'` once first-run wizard succeeds; locks `/setup`
- `app_name` — header / page title
- `registration_enabled` — when `'0'`, `POST /auth/register` returns 403

Edit via `php artisan tinker`:

```php
\App\Models\Setting::put('registration_enabled', '0');
```

## Tests

```sh
cd api
php artisan test
```

25 feature tests covering auth, setup, space visibility, page tree shape, reorder transactions, cross-space rejection, search, and PDF/TXT export. In-memory SQLite via `RefreshDatabase`. The shared `TestCase` sets `Origin` / `Referer` headers matching the test `SANCTUM_STATEFUL_DOMAINS` so Sanctum's stateful middleware activates and starts a session — same code path as production, no test-only branches in the controllers.

## Roadmap

- Page revisions and history
- "Create new space" UI flow
- Media uploads (Spatie Media Library)
- Password gate enforcement for public spaces
- Organizations CRUD UI + invitations
- Custom domain routing
- Scout / Meilisearch for search at scale
- Markdown export

## Contributing

PRs welcome. The API and frontend are tightly coupled through `web/src/types/index.ts` — changes to JSON shape need to be made on both sides in the same PR. Run `php artisan test` before pushing.

</details>

## License

[MIT](./LICENSE)
