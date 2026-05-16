# AGENTS.md

> **Before making ANY changes to this repository, read this file in full.**
> It contains critical invariants that will break the build if ignored.
> **After every task, review whether you discovered new non-obvious constraints
> or pitfalls. If yes, update AGENTS.md and push the update.** Keep it under 160 lines — prune stale entries.

## Critical Invariants

Breaking these = broken build or broken runtime. No exceptions.

### i18n (highest risk area)

- **`Messages` type = `typeof fr`** — TypeScript infers the entire i18n type from `fr.json`. Every key used in code MUST exist in `fr.json` or the build fails.
- **NEVER replace i18n JSON files entirely.** Always read current content and merge new keys. `push_files` on GitHub replaces atomically — one wrong push deletes 40% of keys.
- **All 3 locale files (en.json, fr.json, ru.json) MUST have identical key structure.** Missing key in any file = TypeScript error or runtime undefined.
- **Languages:** `fr` (default), `ru`, `en`. EN is interface-only, not liturgical content.
- **Key naming:** dotted namespace — `admin.fields.*`, `service.*`, `auth.*`. Follow existing patterns.

### API routing

- **`API_BASE` in `lib/api.ts`** is empty string (`''`) in production (nginx proxies `/api/` to backend). In dev it may be set via `NEXT_PUBLIC_API_URL`.
- **All `apiGet`/`apiPost`/`apiPut`/`apiPatch`/`apiDelete` calls use RELATIVE paths** — `apiGet('/admin/dashboard')` → `fetch('/api/admin/dashboard')`. NEVER prefix with `/api`: `apiGet('/api/admin/...')` → `/api/api/admin/...` = 404.
- **Backend router chain:** `APIRouter(prefix="/api")` → `APIRouter(prefix="/admin")` → final path = `/api/admin/*`. Nginx `location /api/` proxies to backend.

### CSS

- **shadcn/ui vars use `--shad-` prefix** (`--shad-accent`, `--shad-muted`). Unprefixed vars conflict with bookish design system.
- **Bookish vars** (`--bg`, `--fg`, `--accent`, `--muted`, `--ornament`, `--rule`, etc.) are the PRIMARY design tokens. Do not rename them.
- **`bookish.css` is an aggregator** of `bookish/*.css` subfiles. Do NOT merge subfiles back — decomposition solves file-size limits for GitHub MCP push.
- **`@import` order in `bookish.css`:** `variables.css` first, `base.css` second. Order matters.
- **Do NOT use Tailwind aliases** `border-border`, `bg-background`, `text-foreground` — not configured in tailwind.config.js. Use `hsl(var(--shad-border))` directly.

### Layout

- **NEVER export anything except `default` from layout files** — Next.js forbids named exports from layouts.
- **Root layout MUST contain `<html>` and `<body>`** — required for hydration.
- **`useTopbarTitle` / `TopbarTitleContext`** live in `@/lib/topbar.tsx`, NOT in layout files.

### Fonts

- **Cormorant Garamond** (display/heading) + **DM Sans** (UI) loaded via `next/font/google` in root layout.
- **CSS vars:** `--font-display`, `--font-heading`, `--font-ui` set via className on `<body>`.
- **Do not change fonts** without explicit user request.

### Auth / Backend

- **Nginx passes `X-Forwarded-Proto`** from Traefik via `map`. Do NOT overwrite with `$scheme`.
- **Backend sets `Secure=True`** on cookies when `x-forwarded-proto='https'`. Do NOT remove this.
- **`next.config.js` has NO API rewrites** — nginx handles routing. Do NOT add them.
- **`CreateUserRequest` requires `display_name`** (no default). Admin user form must include it.
- **`PaginatedResponse` uses `.create()` classmethod** — do not construct manually without `pages` field.
- **Superadmin** is NOT created via admin UI — only `admin` role in forms.

## Architecture

```
Request flow:  Browser → Traefik (TLS) → Nginx → { /api/* → Backend (FastAPI :8000)
                                              { /*    → Frontend (Next.js :3000)

Backend:  FastAPI + SQLAlchemy async + PostgreSQL + Redis
          API routers: /api/auth, /api/calendar, /api/service, /api/admin/*
          Admin endpoints require get_current_user dependency

Frontend: Next.js App Router (standalone output)
          i18n: custom provider (NOT next-intl)
          State: SWR for API, React context for auth/i18n
          CSS: bookish design system + shadcn/ui (prefixed)

Infra:    Docker Compose — postgres, redis, backend, frontend, nginx
          CI: Jenkinsfile
```

## Known Pitfalls

| Pitfall | What happened | Prevention |
|---------|--------------|------------|
| `push_files` replaces entire file | Lost 40% of i18n keys in one push | Always read current GitHub content, merge, then push |
| Double `/api/api/` in URLs | `apiGet('/api/admin/...')` → 404 | Use relative paths: `apiGet('/admin/...')` |
| Missing `useEffect` deps | Component never loads data | Always include dependency array: `useEffect(() => { load() }, [])` |
| Raw field names in admin forms | Users see `date_type`, `book_code` | Use `t.admin.fields.*` translation keys |
| `service.mode_label` key deleted | Bug returned 3 times | Never remove this key from locale files |
| Layout named exports | Next.js build error | Only `export default` from layout files |
| AdminTab in layout | Breaks Next.js rule: no named exports from layouts | AdminTab type + context live in `lib/admin-tab.tsx` |
| Admin inline styles + Tailwind | Clashes with bookish design, inconsistent look | Use `admin-*.css` classes from `bookish/admin.css` |
| Emoji tab icons | Breaks bookish aesthetic, inconsistent rendering | Use SVG icons in sidebar navigation |
| Native `<select>` in admin | Browser chrome clashes with bookish design | Use `AdminSelect` custom component |
| Native `<input type="checkbox">` | Same as above | Use `AdminCheckbox` custom component |
| Native `<input type="number">` | Browser spinners/steppers clash with bookish design | Use `AdminSelect` for small ranges (month/day), `type="text" inputMode="numeric"` for free-form numbers |
| Files >12KB via `push_files` | MCP truncates content | Use `create_or_update_file` with SHA for large files |
| Accidental `push_files` of wrong content | Overwrote i18n.tsx with dummy code | Double-check file content before pushing, never push files marked "don't touch" |
| Pushing components without i18n keys | Build breaks on main — `Property 'x' does not exist on type` | Always push i18n key additions IN THE SAME COMMIT/PR as the component code that references them |

## Conventions

- **After completing work on a feature branch, always create a pull request to `main`** via GitHub MCP (`create_pull_request`). Do not leave branches without PRs.
- **Admin components:** `Admin*.tsx` in `components/`, use `t.admin.*` for all user-facing strings
- **Admin custom controls:** `AdminSelect`, `AdminCheckbox`, `AdminDatePicker` — always use these instead of native browser controls
- **Admin tab switching:** Via `AdminTabContext` in `lib/admin-tab.tsx`, sidebar in `admin/layout.tsx`
- **Admin CSS:** All admin classes in `bookish/admin.css` — sidebar, forms, item cards, stat cards, pagination, drop zone, date picker, select, checkbox
- **Admin API paths:** `/admin/dashboard`, `/admin/blocks`, `/admin/saints`, `/admin/templates`, `/admin/calendar`, `/admin/import/validate`, `/admin/import/batch`, `/auth/users`
- **CSS new classes:** add to appropriate `bookish/*.css` subfile, not `globals.css`
- **Git commits:** descriptive messages, explain why not just what
- **Logo:** `Typikon<em>.</em>` — dot in accent color via `!important` (Tailwind Preflight blocks without it)

## File Map (key files)

```
frontend/src/
  app/
    globals.css                 # --shad- vars, @import bookish.css
    bookish.css                 # Aggregator: @import only
    bookish/                    # Design system subfiles (variables, base, topbar, controls, content, mobile, admin)
    layout.tsx                  # Root: fonts, <html><body>
    [locale]/layout.tsx         # TopbarTitleContext, logo, pills
    [locale]/page.tsx           # Service page + mobile sheets + settings
    admin/layout.tsx            # AuthProvider + AdminShell (sidebar, I18nProvider, AdminTabContext)
    admin/page.tsx              # Content router — reads AdminTabContext, renders Dashboard/Admin*.tsx
  lib/
    api.ts                      # SWR client (API_BASE='', relative paths)
    auth.tsx                    # AuthProvider, useAuth, login/logout
    i18n.tsx                    # I18nProvider, useI18n, Messages type
    topbar.tsx                  # TopbarTitleContext, useTopbarTitle
    admin-tab.tsx               # AdminTab type + AdminTabContext + useAdminTab hook
  i18n/
    config.ts                   # locales=['fr','ru','en'], defaultLocale='fr'
    messages/{en,fr,ru}.json    # Translation files (fr.json = source of truth for types)
  components/
    Admin*.tsx                  # 7 admin components (Calendar, Saints, Blocks, Templates, Users, Import)
    AdminSelect.tsx             # Custom dropdown (replaces native <select>)
    AdminCheckbox.tsx           # Custom checkbox (replaces native <input type="checkbox">)
    AdminDatePicker.tsx         # Custom calendar date picker (dropdown + inline variants)
    LoginForm.tsx               # Auth form

backend/app/
  api/
    __init__.py                 # APIRouter(prefix="/api") — mounts all sub-routers
    auth.py                     # /api/auth/*
    calendar.py                 # /api/calendar/*
    service.py                  # /api/service/*
    admin/
      __init__.py               # APIRouter(prefix="/admin") — requires auth
      dashboard.py              # GET /admin/dashboard
      blocks.py                 # CRUD /admin/blocks
      calendar.py               # CRUD /admin/calendar
      saints.py                 # CRUD /admin/saints
      templates.py              # CRUD /admin/templates
      data_import.py            # POST /admin/import/validate, /admin/import/batch
  models/                       # SQLAlchemy models
  deps.py                       # get_current_user, get_db

nginx/nginx.conf                # /api/ → backend, / → frontend
docker-compose.yml              # postgres, redis, backend, frontend, nginx
```

---

## For agents: how to maintain this file

1. **Read first.** Before any task, read `AGENTS.md`. It contains non-obvious constraints that will break things if ignored.
2. **Update when you learn.** If you discover a new invariant (something that broke the build, a non-obvious dependency, a convention not in code), add it here. Keep it concise — one line per invariant.
3. **Prune stale entries.** If a section becomes outdated (e.g., a bug was permanently fixed in code), remove the entry. Remove it from the table. This file must stay compact (~160 lines max).
4. **No history, no narratives.** This is a contract, not a changelog. Git tracks history. Write facts, not stories.
5. **When in doubt, add to Known Pitfalls.** If something surprised you during work, it will surprise the next agent too. A one-row table entry prevents hours of debugging.