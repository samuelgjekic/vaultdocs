# VaultDocs

> **Self-hosted, open-source documentation platform.** Your docs. Your rules.

VaultDocs is a beautifully designed documentation platform you can self-host. Tiptap editor, three-column layout, full-text search, drag-and-drop reordering, password-protected spaces, custom domains. MIT licensed.

## Repo layout

```
vaultdocs/
├── api/                 Laravel backend (Sanctum SPA auth, SQLite by default)
├── web/                 React + Vite + Tiptap frontend
├── docker-compose.yml   One-command self-host
└── LICENSE              MIT
```

## Quickstart with Docker

```sh
git clone https://github.com/samuelgjekic/vaultdocs.git
cd vaultdocs
docker-compose up
```

Open <http://localhost:5173>, walk through `/setup` to create your admin user and first organization.

The SQLite database persists in the `vaultdocs-data` named volume. To start fresh: `docker-compose down -v`.

---

## Tech stack

### Backend (`api/`)

| Layer | Choice |
|---|---|
| Language | PHP 8.3 |
| Framework | Laravel 11+ (`laravel/framework: ^13.0`) |
| Auth | `laravel/sanctum` ^4.0 — SPA cookie-based, CSRF protected |
| Authorization | First-party Laravel policies (`app/Policies/SpacePolicy.php`) |
| Database (default) | SQLite (file at `database/database.sqlite`) |
| Database (supported) | MySQL 8+, PostgreSQL 14+ — set `DB_CONNECTION` in `.env` |
| Slug generation | `spatie/laravel-sluggable` ^4.0 |
| Roles & permissions | `spatie/laravel-permission` ^7.4 (wired in, used in Phase 2) |
| Routing | API-only, prefixed at `/api/v1`, scoped route bindings (`{organization}/{space}`) |
| Resources | `JsonResource` with global `withoutWrapping()` so responses are flat |
| Testing | PHPUnit 12 via `php artisan test` (20 feature tests at v1) |

The backend is intentionally thin: controllers delegate tree assembly and reorder transactions to `app/Services/PageService.php`, and authorization is centralized in `SpacePolicy`. Page content is stored as raw Tiptap JSON in `pages.content`; a denormalized plain-text mirror lives in `pages.content_markdown` for `LIKE`-based search. Switching to Laravel Scout (Meilisearch / Typesense / Algolia) is a one-driver-swap upgrade.

### Frontend (`web/`)

| Layer | Choice |
|---|---|
| Language | TypeScript 5 |
| Framework | React 18 |
| Bundler | Vite 5 |
| Routing | `react-router-dom` v6 |
| Data fetching | `@tanstack/react-query` v5 (server state) |
| Client state | `zustand` v5 with `persist` middleware (auth, theme, unlocked-space registry) |
| HTTP client | `axios` with `withCredentials: true` for Sanctum cookies |
| Editor | `@tiptap/react` v3 + StarterKit, plus extensions for tables, task lists, code blocks (lowlight), images, links, placeholder, text-align, underline |
| UI primitives | Radix UI suite + shadcn/ui patterns |
| Styling | Tailwind CSS 3 with CSS-variable theming (light/dark/system) |
| Drag & drop | `@dnd-kit/core` + `@dnd-kit/sortable` |
| Command palette | `cmdk` (`⌘K` search overlay) |
| Forms | `react-hook-form` + `zod` resolvers |
| Icons | `lucide-react` |
| Toasts | `sonner` |
| Progress bar | `nprogress` |

### Self-hosting

| Layer | Choice |
|---|---|
| API container | `php:8.3-cli-alpine` running `php artisan serve` (suitable up to mid traffic; swap in `php-fpm` + nginx for production scale) |
| Web container | Multi-stage `node:20-alpine` build → `nginx:1.27-alpine` serving the Vite static build |
| Persistence | SQLite on a named Docker volume (`vaultdocs-data`) |
| Reverse proxy | Bring your own — Caddy, Traefik, or nginx in front of `web` and `api` works fine |

---

## Architecture overview

### Auth flow

1. Frontend hits `GET /sanctum/csrf-cookie` to seed the `XSRF-TOKEN` cookie.
2. Frontend `POST /api/v1/auth/login` with credentials. Sanctum's stateful middleware writes a session cookie.
3. Subsequent requests carry the session + CSRF cookies automatically (`axios.create({ withCredentials: true })`).
4. `App.tsx`'s `<AuthBoot />` calls `GET /api/v1/auth/me` once on mount to rehydrate the user.

### Page tree

Pages are stored flat in a single table with a self-referencing `parent_id`. The tree endpoint loads all rows for a space in one query and assembles the nested structure in O(n) via `PageService::tree()`. Reorders are bulk operations: the client sends a flat list of `{ id, parent_id, position }`, the server validates that every `id` and every non-null `parent_id` belongs to the space, then runs the writes inside a single DB transaction.

### Content storage

Pages persist Tiptap JSON verbatim (`{ type: "doc", content: [...] }`). The frontend calls `editor.getJSON()` and `PUT`s it; the backend stores it in a `JSON` column. Plain-text extraction for search runs through `PageService::contentToText()` — a recursive walker over the AST — and is denormalized into `pages.content_markdown` on every write.

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
GET    /api/v1/orgs/{org}/spaces/{space}/pages                       returns nested tree
POST   /api/v1/orgs/{org}/spaces/{space}/pages                       policy: manage
PUT    /api/v1/orgs/{org}/spaces/{space}/pages/{page}                policy: manage
DELETE /api/v1/orgs/{org}/spaces/{space}/pages/{page}                policy: manage, soft-delete
PUT    /api/v1/orgs/{org}/spaces/{space}/tree                        bulk reorder, transactional
GET    /api/v1/orgs/{org}/spaces/{space}/search?q=                   LIKE on title + content_markdown
```

All responses are flat JSON (no `data` wrapper). Field shapes are pinned to TypeScript types in `web/src/types/index.ts` — change them in lockstep.

---

## Local development

### Backend (`api/`)

Requirements: PHP 8.3+, Composer 2, SQLite (or MySQL 8+ / PostgreSQL 14+).

```sh
cd api
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed     # seeds demo data + prints admin creds
php artisan serve              # http://localhost:8000
```

To use MySQL/Postgres instead, edit `.env` (`DB_CONNECTION=mysql`, host, port, db, user, password) and re-run `php artisan migrate --seed`.

### Frontend (`web/`)

Requirements: Node 20+.

```sh
cd web
npm install --legacy-peer-deps
cp .env.example .env
npm run dev                    # http://localhost:5173
```

The `--legacy-peer-deps` flag is needed because some Radix and Tiptap peer ranges drift slightly. CI uses the same flag.

### Useful artisan commands

```sh
php artisan migrate:fresh --seed   # nuke and reseed (prints admin creds)
php artisan route:list             # list all API routes
php artisan test                   # run feature + unit tests
php artisan tinker                 # REPL with full app context
```

### Useful npm scripts

```sh
npm run dev                        # Vite dev server with HMR
npm run build                      # production build to dist/
npm run lint                       # ESLint
npm run test                       # Vitest
```

---

## Configuration

### Backend env vars (`api/.env`)

| Variable | Default | Purpose |
|---|---|---|
| `APP_URL` | `http://localhost:8000` | Public URL of the API |
| `APP_FRONTEND_URL` | `http://localhost:5173` | SPA origin — used by CORS |
| `SANCTUM_STATEFUL_DOMAINS` | `localhost:5173,127.0.0.1:5173` | Domains that get session cookies |
| `DB_CONNECTION` | `sqlite` | `sqlite`, `mysql`, or `pgsql` |
| `DB_DATABASE` | `database/database.sqlite` | Path or DB name |
| `SESSION_DRIVER` | `database` | `cookie` works for stateless deployments |
| `SESSION_SAME_SITE` | `lax` | Set to `none` (with HTTPS) for cross-origin SPA hosts |
| `MAIL_MAILER` | `log` | Switch to `smtp` for password resets |

### Frontend env vars (`web/.env`)

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000/api/v1` | Where the SPA hits the API |

### Runtime settings (DB-backed)

Settings stored in the `settings` table override env where overlap exists:

- `setup_complete` — `'1'` once first-run wizard succeeds; locks `/setup`
- `app_name` — header / page title
- `registration_enabled` — when `'0'`, `POST /auth/register` returns 403

Edit via `php artisan tinker`:

```php
\App\Models\Setting::put('registration_enabled', '0');
```

---

## Tests

20 feature tests covering auth, setup, space visibility, page tree shape, reorder transactions, cross-space rejection, and search:

```sh
cd api
php artisan test
```

Tests use an in-memory SQLite database and the `RefreshDatabase` trait. The shared `TestCase` sets `Origin` / `Referer` headers matching `SANCTUM_STATEFUL_DOMAINS` so Sanctum's stateful middleware activates the session — same code path as production, no test-only branches in the controllers.

---

## What's in v1

- Auth: login, logout, register (toggleable), first-run setup wizard
- Spaces: list / view / update with public / private / unlisted visibility
- Pages: nested tree, Tiptap JSON content, drag-to-reorder, soft delete
- Search: full-text within a space (title + content)
- Themes, command palette, table of contents, keyboard shortcuts

## Coming next

- Page revisions and history
- Media uploads (Spatie Media Library)
- Password gate enforcement for public spaces
- Organizations CRUD UI + invitations
- Custom domain routing
- Scout / Meilisearch for search at scale

## Contributing

PRs welcome. The API and frontend are tightly coupled through `web/src/types/index.ts` — changes to JSON shape need to be made on both sides in the same PR. Run `php artisan test` before pushing.

## License

[MIT](./LICENSE)
