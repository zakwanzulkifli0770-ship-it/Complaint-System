# E-Aduan Smart Management System

A full-stack government-grade complaint management web app for reporting, tracking, and resolving public issues.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, shadcn/ui, Tailwind CSS, TanStack Query, Wouter
- API: Express 5, JWT auth, bcryptjs, helmet, express-rate-limit
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contracts)
- `lib/api-client-react/src/` — generated React Query hooks + custom fetch with JWT support
- `lib/db/src/schema.ts` — Drizzle ORM schema (users, complaints, comments)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/middlewares/auth.ts` — JWT middleware
- `artifacts/e-aduan/src/` — React frontend
  - `contexts/AuthContext.tsx` — JWT auth state, localStorage-backed
  - `components/layout/AppLayout.tsx` — sidebar nav (adapts for admin vs user)
  - `components/shared/ThemeProvider.tsx` — dark/light mode
  - `pages/auth/` — Login, Register
  - `pages/public/Track.tsx` — public ticket tracker (no auth)
  - `pages/user/` — Dashboard, Complaints, ComplaintNew, ComplaintDetail, Profile
  - `pages/admin/` — Dashboard (analytics), Complaints, Users

## Architecture decisions

- Contract-first API: OpenAPI spec drives Zod validation on the backend and React Query hooks on the frontend.
- JWT stored in localStorage (not cookies) — frontend reads token on mount and attaches via custom fetch.
- `@workspace/api-client-react/custom-fetch` subpath export provides `setAuthTokenGetter` for attaching Bearer tokens to all API requests.
- Status/priority enums are string literals throughout the frontend (no generated enum imports) to avoid subpath resolution issues.
- Admin routes protected at both frontend (AdminRoute component) and backend (requireAdmin middleware).

## Product

- **Public**: Track any complaint by ticket ID without logging in.
- **Users**: Register/login, submit complaints (with category, priority, location, image URL), view own complaint history, check detail + admin comments, update profile.
- **Admins**: Full complaint management (filter, update status, delete), user management (promote/demote, ban/unban, delete), analytics dashboard with charts.

## Demo Credentials

| Role  | Email | Password |
|-------|-------|----------|
| Admin | admin@eaduan.gov.my | admin123 |
| User  | ahmad@example.com | user123 |
| User  | siti@example.com | user123 |
| User  | faizal@example.com | user123 |

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`.
- Do NOT import from `@workspace/api-client-react/api.schemas` — that subpath does not exist. Use inline string literals for status/priority values.
- Express `trust proxy` must be set to `1` for `express-rate-limit` to work correctly behind the Replit proxy.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
