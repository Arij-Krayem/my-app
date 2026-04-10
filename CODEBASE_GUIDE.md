# CODEBASE_GUIDE

This guide is based on the actual code in this repository as inspected on April 9, 2026.

It explains how the project works in beginner-friendly language and points to the real files that implement each part.

## Project Overview

This project is a full-stack ad performance monitoring platform called `VisioAd`.

In simple words, it helps a team:

- sign in and manage users
- create and manage brands/workspaces
- upload CSV exports from ad platforms like Google Ads and Meta Ads
- map raw CSV columns to a standard internal format
- ingest the cleaned data into the database
- show dashboard analytics and charts
- create threshold-based alert rules
- detect anomalies in performance data
- send email notifications for alerts and password resets
- receive real-time anomaly notifications through Socket.IO

The app is built as one Next.js project that contains both the frontend UI and the backend API routes.

## Tech Stack

### Main framework

- `Next.js 16` in App Router mode
  - Used for routing, layouts, pages, and backend API routes in one project.
  - Main folder: [`src/app`](/c:/Users/Asus/my-app/src/app)

- `React 19`
  - Used for building the UI.
  - Most dashboard pages are client components with `"use client"`.

- `TypeScript`
  - Used across frontend and backend for safer code and better editor support.

### Database and ORM

- `PostgreSQL`
  - Main database.

- `Prisma`
  - Used to define the schema and talk to PostgreSQL.
  - Schema file: [`prisma/schema.prisma`](/c:/Users/Asus/my-app/prisma/schema.prisma)
  - Prisma client setup: [`src/lib/prisma.ts`](/c:/Users/Asus/my-app/src/lib/prisma.ts)

### Authentication and security

- `jsonwebtoken`
  - Used to create and verify access tokens and refresh tokens.

- `bcryptjs`
  - Used to hash passwords and verify passwords during login.

- `cookie`
  - Used to create the refresh-token cookie.

- `zod`
  - Used to validate request bodies and query data in many API routes.

### UI and charts

- `Recharts`
  - Used for charts in dashboard analytics.

- `Ant Design`
  - Used lightly in the dashboard layout for tooltips.

- `Tailwind CSS 4`
  - Present in the project, imported in [`src/app/globals.css`](/c:/Users/Asus/my-app/src/app/globals.css).
  - In practice, a lot of the UI is custom CSS and inline styles rather than heavy Tailwind usage.

### Notifications and integrations

- `nodemailer`
  - Used for password reset emails and alert/anomaly emails.

- `socket.io` and `socket.io-client`
  - Used for live anomaly notifications.
  - Server setup lives in [`server.ts`](/c:/Users/Asus/my-app/server.ts)

- `csv-parse`
  - Used to parse uploaded CSV files.

- `scripts/anomaly_detection.py`
  - Python script for anomaly detection using Z-score and IQR.

## Folder and File Structure

### Root files

- [`package.json`](/c:/Users/Asus/my-app/package.json)
  - Defines dependencies and scripts.

- [`server.ts`](/c:/Users/Asus/my-app/server.ts)
  - Custom Next.js server that attaches Socket.IO.

- [`next.config.ts`](/c:/Users/Asus/my-app/next.config.ts)
  - Next.js config. Currently minimal.

- [`prisma.config.ts`](/c:/Users/Asus/my-app/prisma.config.ts)
  - Prisma config that reads `DATABASE_URL`.

- [`README.md`](/c:/Users/Asus/my-app/README.md)
  - Already contains a project overview, but this guide is more detailed.

### `prisma/`

- [`prisma/schema.prisma`](/c:/Users/Asus/my-app/prisma/schema.prisma)
  - Main database schema.

- [`prisma/migrations`](/c:/Users/Asus/my-app/prisma/migrations)
  - Database migration history.

### `scripts/`

- [`scripts/anomaly_detection.py`](/c:/Users/Asus/my-app/scripts/anomaly_detection.py)
  - Detects anomalies from metric series.

- [`scripts/create-admin.mjs`](/c:/Users/Asus/my-app/scripts/create-admin.mjs)
  - Tries to create an admin through register.
  - Important note: the current register API forces `MARKETER`, so this script is misleading right now.

### `tests/`

- [`tests/integration.test.mjs`](/c:/Users/Asus/my-app/tests/integration.test.mjs)
  - Lightweight integration checks using plain `fetch`.

### `src/app/`

This is the main App Router folder.

- [`src/app/layout.tsx`](/c:/Users/Asus/my-app/src/app/layout.tsx)
  - Root layout for the whole app.

- [`src/app/page.tsx`](/c:/Users/Asus/my-app/src/app/page.tsx)
  - Redirects `/` to `/landing`.

- [`src/app/landing/page.tsx`](/c:/Users/Asus/my-app/src/app/landing/page.tsx)
  - Public marketing landing page.

- [`src/app/(auth)`](/c:/Users/Asus/my-app/src/app/(auth))
  - Login, register, forgot password, reset password.

- [`src/app/(dashboard)`](/c:/Users/Asus/my-app/src/app/(dashboard))
  - Main authenticated app area.

- [`src/app/api`](/c:/Users/Asus/my-app/src/app/api)
  - Backend API routes.

### `src/components/`

Shared UI and layout-related components.

- [`src/components/AnomalyToast.tsx`](/c:/Users/Asus/my-app/src/components/AnomalyToast.tsx)
  - Global live toast for anomaly Socket.IO events.

- [`src/components/DashboardEnhanced.tsx`](/c:/Users/Asus/my-app/src/components/DashboardEnhanced.tsx)
  - Large advanced analytics dashboard section.

- [`src/components/ui/dialog.tsx`](/c:/Users/Asus/my-app/src/components/ui/dialog.tsx)
  - Custom dialog modal primitives.

- [`src/components/ProtectedRoute.tsx`](/c:/Users/Asus/my-app/src/components/ProtectedRoute.tsx)
- [`src/components/RequireRole.tsx`](/c:/Users/Asus/my-app/src/components/RequireRole.tsx)
- [`src/components/AppShell.tsx`](/c:/Users/Asus/my-app/src/components/AppShell.tsx)
  - These look like older/shared auth-shell components.
  - They do not appear to drive the current dashboard layout.

### `src/context/`

- [`src/context/AuthContext.tsx`](/c:/Users/Asus/my-app/src/context/AuthContext.tsx)
  - Auth context with login/logout/refresh bootstrap logic.
  - Important note: it exists, but the current main pages seem to rely more on direct `sessionStorage` and direct `fetch` than on this context.

### `src/lib/`

Shared logic used by API routes and components.

- [`src/lib/auth.ts`](/c:/Users/Asus/my-app/src/lib/auth.ts)
  - JWT signing/verifying and token hashing.

- [`src/lib/auth-guard.ts`](/c:/Users/Asus/my-app/src/lib/auth-guard.ts)
  - Route protection helpers like `requireAuth()` and `requireAdmin()`.

- [`src/lib/cookies.ts`](/c:/Users/Asus/my-app/src/lib/cookies.ts)
  - Refresh cookie creation/clearing.

- [`src/lib/prisma.ts`](/c:/Users/Asus/my-app/src/lib/prisma.ts)
  - Prisma client singleton.

- [`src/lib/apiFetch.ts`](/c:/Users/Asus/my-app/src/lib/apiFetch.ts)
  - Fetch wrapper with silent refresh logic.

- [`src/lib/mailer.ts`](/c:/Users/Asus/my-app/src/lib/mailer.ts)
  - Password reset email sender.

- [`src/lib/notification-mailer.ts`](/c:/Users/Asus/my-app/src/lib/notification-mailer.ts)
  - Alert/anomaly email sender.

- [`src/lib/anomaly-engine.ts`](/c:/Users/Asus/my-app/src/lib/anomaly-engine.ts)
  - Main anomaly pipeline after ingest.

- [`src/lib/socket-server.ts`](/c:/Users/Asus/my-app/src/lib/socket-server.ts)
- [`src/lib/socket-client.ts`](/c:/Users/Asus/my-app/src/lib/socket-client.ts)
  - Shared Socket.IO helpers.

## Application Entry Points

### Frontend entry points

- Root HTML/layout entry: [`src/app/layout.tsx`](/c:/Users/Asus/my-app/src/app/layout.tsx)
- Root route: [`src/app/page.tsx`](/c:/Users/Asus/my-app/src/app/page.tsx)
  - Redirects users to `/landing`

### Public frontend routes

- `/landing` -> [`src/app/landing/page.tsx`](/c:/Users/Asus/my-app/src/app/landing/page.tsx)
- `/login` -> [`src/app/(auth)/login/page.tsx`](/c:/Users/Asus/my-app/src/app/(auth)/login/page.tsx)
- `/register` -> [`src/app/(auth)/register/page.tsx`](/c:/Users/Asus/my-app/src/app/(auth)/register/page.tsx)
- `/forgot-password` -> [`src/app/(auth)/forgot-password/page.tsx`](/c:/Users/Asus/my-app/src/app/(auth)/forgot-password/page.tsx)
- `/reset-password` -> [`src/app/(auth)/reset-password/page.tsx`](/c:/Users/Asus/my-app/src/app/(auth)/reset-password/page.tsx)

### Authenticated frontend entry

- Dashboard layout: [`src/app/(dashboard)/layout.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/layout.tsx)
  - This is the real shell users see after login.
  - It handles sidebar, top bar, brand switcher, notifications, logout, and mounts `AnomalyToast`.

### Backend entry points

- API routes live under [`src/app/api`](/c:/Users/Asus/my-app/src/app/api)
- Custom HTTP + Socket.IO server entry: [`server.ts`](/c:/Users/Asus/my-app/server.ts)

### Dev server start

From [`package.json`](/c:/Users/Asus/my-app/package.json):

- `npm run dev` runs:
  - `ts-node --project tsconfig.server.json -r tsconfig-paths/register server.ts`

That means development starts from the custom server, not plain `next dev`.

## Full Project Flow

### 1. When the user opens the app

1. Browser hits `/`.
2. [`src/app/page.tsx`](/c:/Users/Asus/my-app/src/app/page.tsx) redirects to `/landing`.
3. The root layout from [`src/app/layout.tsx`](/c:/Users/Asus/my-app/src/app/layout.tsx) wraps the page and loads fonts and global CSS.

### 2. How routing works

This project uses Next.js App Router.

- `page.tsx` files define pages.
- `layout.tsx` files define shared wrappers for groups of routes.
- Route groups:
  - `(auth)` for auth pages
  - `(dashboard)` for logged-in pages

The route group folder names do not appear in the URL.

Example:

- [`src/app/(dashboard)/uploads/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/uploads/page.tsx)
  becomes `/uploads`

### 3. How UI pages are loaded

Most pages in `(dashboard)` are client components.

That means:

- the page renders in the browser
- it reads `sessionStorage`
- it makes `fetch()` calls to internal API routes
- it stores results in React state

Example:

- Dashboard page fetches:
  - `/api/brands`
  - `/api/uploads`
  - `/api/analytics/kpis`
  - `/api/alerts`
  - `/api/analytics/global-status`
  - `/api/analytics/trends`
  - `/api/analytics/bi-summary`

### 4. How data is fetched

The main pattern is:

1. Page reads `access_token` from `sessionStorage`
2. Page sends `Authorization: Bearer <token>`
3. API route calls `requireAuth(req)`
4. API route checks access and queries Prisma/Postgres
5. API route returns JSON
6. Page stores JSON in `useState`
7. UI renders cards, tables, charts, or forms

### 5. How forms are submitted

Common pattern:

1. User types into local component state
2. On submit, component does a `fetch()`
3. API validates input with Zod or manual checks
4. API updates Prisma models
5. UI shows success or error message

Examples:

- login form -> `/api/auth/login`
- register form -> `/api/auth/register`
- forgot password form -> `/api/auth/forgot-password`
- upload form -> `/api/uploads`
- guardrail form -> `/api/alerts/rules`
- user invite form -> `/api/users`
- settings profile form -> `/api/users/me`

### 6. How the backend handles requests

Each route file exports HTTP handlers like `GET`, `POST`, `PATCH`, or `DELETE`.

Typical route flow:

1. authenticate with `requireAuth()` or `requireAdmin()`
2. validate input
3. check role or brand membership
4. query/update Prisma
5. return JSON

### 7. How data is stored

There are two major data layers:

- relational data
  - users, brands, memberships, uploads, alerts, rules, tokens

- flexible analytics data
  - `PerformanceFact`
  - metrics stored in JSON
  - dimensions stored in JSON

This design lets the app support many metrics without changing the schema every time.

### 8. How results are displayed

Results come back as JSON and are shown as:

- cards
- KPI widgets
- tables
- progress bars
- line/bar/pie/area charts with Recharts
- badges for alert/anomaly severity
- toast notifications for live anomaly events

## Authentication and Authorization Flow

### Authentication model

The app uses two tokens:

- Access token
  - JWT
  - returned from login
  - stored in `sessionStorage` under `access_token`

- Refresh token
  - JWT
  - stored in an `httpOnly` cookie
  - hashed and stored in `RefreshToken` table

### Main auth files

- [`src/lib/auth.ts`](/c:/Users/Asus/my-app/src/lib/auth.ts)
- [`src/lib/auth-guard.ts`](/c:/Users/Asus/my-app/src/lib/auth-guard.ts)
- [`src/lib/cookies.ts`](/c:/Users/Asus/my-app/src/lib/cookies.ts)
- [`src/app/api/auth/login/route.ts`](/c:/Users/Asus/my-app/src/app/api/auth/login/route.ts)
- [`src/app/api/auth/refresh/route.ts`](/c:/Users/Asus/my-app/src/app/api/auth/refresh/route.ts)
- [`src/app/api/auth/logout/route.ts`](/c:/Users/Asus/my-app/src/app/api/auth/logout/route.ts)

### Login flow

1. User submits email/password on login page.
2. [`/api/auth/login`](/c:/Users/Asus/my-app/src/app/api/auth/login/route.ts) finds the user by email.
3. Password is checked with `bcrypt.compare`.
4. Backend creates:
   - access token
   - refresh token
5. Refresh token hash is saved in database.
6. Refresh cookie is set on response.
7. Frontend stores:
   - `access_token`
   - `user`
8. User is redirected to `/dashboard`.

### Refresh flow

1. Browser sends refresh cookie to `/api/auth/refresh`.
2. Backend verifies:
   - cookie exists
   - refresh JWT is valid
   - hashed token exists in DB
   - token is not revoked
   - token is not expired
3. Old refresh token record is revoked.
4. New refresh token is created and stored.
5. New access token is returned.
6. New refresh cookie is set.

### Logout flow

1. Frontend calls `/api/auth/logout`.
2. Backend revokes the stored refresh token hash.
3. Backend clears the cookie.
4. Frontend clears `sessionStorage`.
5. Frontend redirects to `/login`.

### Password reset flow

1. User enters email on forgot-password page.
2. `/api/auth/forgot-password` creates a random reset token.
3. Token is stored in `PasswordResetToken`.
4. Reset email is sent with a URL like `/reset-password?token=...`
5. User submits new password.
6. `/api/auth/reset-password` validates token, expiry, and `used` flag.
7. User password is updated.
8. Token is marked as used.
9. All refresh tokens for that user are revoked.

### Authorization model

Roles:

- `MARKETER`
- `AGENCY_ADMIN`

Authorization is mostly enforced inside API routes.

Patterns used:

- `requireAuth(req)`
  - verifies JWT and returns `{ userId, role }`

- `requireAdmin(req)`
  - same, but also checks role is `AGENCY_ADMIN`

- brand membership checks
  - many routes verify a marketer belongs to the requested brand through `BrandMember`

### Protected routes

There is no active global `middleware.ts`.

Important consequence:

- page-level protection is mostly client-side
- real security is on the API side

The dashboard layout checks `sessionStorage` and redirects to `/login` if token/user is missing.

### Where access control is enforced

Examples:

- users admin endpoints:
  - [`src/app/api/users/route.ts`](/c:/Users/Asus/my-app/src/app/api/users/route.ts)

- admin-only detection settings:
  - [`src/app/api/detection/accuracy/route.ts`](/c:/Users/Asus/my-app/src/app/api/detection/accuracy/route.ts)

- brand-aware analytics:
  - [`src/app/api/analytics/kpis/route.ts`](/c:/Users/Asus/my-app/src/app/api/analytics/kpis/route.ts)

- alert routes:
  - [`src/app/api/alerts/route.ts`](/c:/Users/Asus/my-app/src/app/api/alerts/route.ts)

## Database Flow

### Main idea

The database stores both operational app data and analytics data.

Operational app data:

- users
- roles
- brand memberships
- uploads
- mappings
- alert rules
- alerts
- notifications
- tokens

Analytics data:

- `PerformanceFact`
- `Anomaly`
- `Accuracy`

### Data flow from UI to DB and back

#### Example: upload to analytics

1. User uploads a CSV on `/uploads/new`.
2. `/api/uploads`:
   - parses CSV
   - creates `Upload`
   - creates `UploadColumn`
   - creates suggested `ColumnMapping`
3. User reviews mapping on `/uploads/[id]/mapping`.
4. `/api/uploads/[id]` or `/api/uploads/[id]/mapping` saves mappings.
5. `/api/uploads/[id]/ingest`:
   - reads `rawCsv`
   - applies mappings
   - creates `PerformanceFact` rows
   - marks upload `IMPORTED`
6. Dashboard analytics endpoints query `PerformanceFact`.
7. UI displays charts and KPIs.

#### Example: creating an alert rule

1. User fills form on `/guardrails`.
2. `/api/alerts/rules` creates an `AlertRule`.
3. After ingest, alert checks compare aggregated metrics to rules.
4. Matching conditions create `Alert` rows and `Notification` rows.
5. UI fetches alerts from `/api/alerts`.

## API / Backend Flow

### Backend architecture style

This project does not use a separate `controllers/` or `services/` folder structure.

Instead, most backend logic lives directly inside route files under [`src/app/api`](/c:/Users/Asus/my-app/src/app/api).

So the practical mapping is:

- route file = route + controller logic
- `src/lib/*` = shared helper logic
- Prisma models = data layer

### Route categories

#### Auth routes

- `/api/auth/login`
- `/api/auth/register`
- `/api/auth/refresh`
- `/api/auth/me`
- `/api/auth/logout`
- `/api/auth/forgot-password`
- `/api/auth/reset-password`

#### User routes

- `/api/users`
- `/api/users/[id]`
- `/api/users/me`
- `/api/users/me/password`

#### Brand routes

- `/api/brands`
- `/api/brands/[id]/members`

#### Upload routes

- `/api/uploads`
- `/api/uploads/[id]`
- `/api/uploads/[id]/mapping`
- `/api/uploads/[id]/ingest`

#### Analytics routes

- `/api/analytics/kpis`
- `/api/analytics/trends`
- `/api/analytics/bi-summary`
- `/api/analytics/alert-trends`
- `/api/analytics/global-status`
- `/api/analytics/python-anomalies`

#### Alerts and anomalies

- `/api/alerts`
- `/api/alerts/[id]`
- `/api/alerts/rules`
- `/api/alerts/check`
- `/api/anomalies`

#### Misc/secondary APIs

- `/api/detection/accuracy`
- `/api/metrics/overview`
- `/api/datasets/bulk`
- `/api/leads`
- `/api/leads/[id]`
- `/api/admin/ping`

### Middleware/shared backend helpers

There is no global Next middleware file.

Important shared backend helpers are:

- auth checking: [`src/lib/auth-guard.ts`](/c:/Users/Asus/my-app/src/lib/auth-guard.ts)
- token creation/verification: [`src/lib/auth.ts`](/c:/Users/Asus/my-app/src/lib/auth.ts)
- Prisma client: [`src/lib/prisma.ts`](/c:/Users/Asus/my-app/src/lib/prisma.ts)
- email sending: [`src/lib/mailer.ts`](/c:/Users/Asus/my-app/src/lib/mailer.ts), [`src/lib/notification-mailer.ts`](/c:/Users/Asus/my-app/src/lib/notification-mailer.ts)
- anomaly pipeline: [`src/lib/anomaly-engine.ts`](/c:/Users/Asus/my-app/src/lib/anomaly-engine.ts)

## Frontend Flow

### App Router structure

- root layout: [`src/app/layout.tsx`](/c:/Users/Asus/my-app/src/app/layout.tsx)
- auth layout: [`src/app/(auth)/layout.tsx`](/c:/Users/Asus/my-app/src/app/(auth)/layout.tsx)
- dashboard layout: [`src/app/(dashboard)/layout.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/layout.tsx)

### Server vs client components

Most important pages in this app are client components because they:

- use `useState`
- use `useEffect`
- access `sessionStorage`
- make browser-side API calls

Examples:

- [`src/app/(dashboard)/dashboard/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/dashboard/page.tsx)
- [`src/app/(dashboard)/uploads/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/uploads/page.tsx)
- [`src/app/(dashboard)/settings/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/settings/page.tsx)

### Shared components

Important shared components:

- [`src/components/DashboardEnhanced.tsx`](/c:/Users/Asus/my-app/src/components/DashboardEnhanced.tsx)
  - extended analytics section

- [`src/components/AnomalyToast.tsx`](/c:/Users/Asus/my-app/src/components/AnomalyToast.tsx)
  - real-time anomaly toast

- [`src/components/ui/dialog.tsx`](/c:/Users/Asus/my-app/src/components/ui/dialog.tsx)
  - modal system used by Brands, Users, Guardrails

### State and props patterns

The frontend heavily uses:

- local `useState`
- `useEffect` for fetching
- callbacks defined inside page components
- props passed into chart-heavy components

Example:

- `DashboardPage` passes:
  - `brandId`
  - `platform`
  - `dateFrom`
  - `dateTo`
  into [`src/components/DashboardEnhanced.tsx`](/c:/Users/Asus/my-app/src/components/DashboardEnhanced.tsx)

### Styling system

Styling is a mix of:

- global CSS variables in [`src/app/globals.css`](/c:/Users/Asus/my-app/src/app/globals.css)
- CSS module in [`src/app/(dashboard)/layout.module.css`](/c:/Users/Asus/my-app/src/app/(dashboard)/layout.module.css)
- many inline style objects in components/pages
- a small amount of utility classes

### Dashboard flow

The dashboard is split into:

- main page: [`src/app/(dashboard)/dashboard/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/dashboard/page.tsx)
- advanced analytics: [`src/components/DashboardEnhanced.tsx`](/c:/Users/Asus/my-app/src/components/DashboardEnhanced.tsx)

Main dashboard page loads:

- brands
- active brand selection
- uploads summary
- KPI summary
- alerts preview
- top campaigns
- spend over time

Then `DashboardEnhanced` loads:

- trends
- current-vs-previous comparison
- alert trends
- funnel summary
- platform donut
- campaign donut
- country breakdown
- conversion trend

## Important Features

### 1. Authentication

What it does:

- lets users log in, register, refresh sessions, log out, and reset passwords

Main files:

- [`src/app/(auth)/login/page.tsx`](/c:/Users/Asus/my-app/src/app/(auth)/login/page.tsx)
- [`src/app/(auth)/register/page.tsx`](/c:/Users/Asus/my-app/src/app/(auth)/register/page.tsx)
- [`src/app/api/auth/login/route.ts`](/c:/Users/Asus/my-app/src/app/api/auth/login/route.ts)
- [`src/app/api/auth/refresh/route.ts`](/c:/Users/Asus/my-app/src/app/api/auth/refresh/route.ts)
- [`src/lib/auth.ts`](/c:/Users/Asus/my-app/src/lib/auth.ts)

Flow:

- UI form -> auth API route -> Prisma user lookup -> token creation -> browser storage/cookie -> dashboard redirect

### 2. CSV upload and mapping

What it does:

- accepts CSV files
- inspects columns
- suggests mappings
- lets user confirm mappings

Main files:

- [`src/app/(dashboard)/uploads/new/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/uploads/new/page.tsx)
- [`src/app/(dashboard)/uploads/[id]/mapping/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/uploads/[id]/mapping/page.tsx)
- [`src/app/api/uploads/route.ts`](/c:/Users/Asus/my-app/src/app/api/uploads/route.ts)
- [`src/app/api/uploads/[id]/route.ts`](/c:/Users/Asus/my-app/src/app/api/uploads/[id]/route.ts)

Flow:

- UI upload form -> CSV parsing -> `Upload` + `UploadColumn` + suggested `ColumnMapping` -> mapping UI -> save mappings

### 3. Data ingest into analytics model

What it does:

- converts mapped CSV rows into normalized analytics rows

Main files:

- [`src/app/api/uploads/[id]/ingest/route.ts`](/c:/Users/Asus/my-app/src/app/api/uploads/[id]/ingest/route.ts)
- [`prisma/schema.prisma`](/c:/Users/Asus/my-app/prisma/schema.prisma)

Flow:

- upload mapping -> ingest route -> parse `rawCsv` -> map columns -> build `metrics` and `dimensions` JSON -> insert `PerformanceFact`

### 4. KPI dashboard

What it does:

- shows business metrics and chart visualizations

Main files:

- [`src/app/(dashboard)/dashboard/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/dashboard/page.tsx)
- [`src/components/DashboardEnhanced.tsx`](/c:/Users/Asus/my-app/src/components/DashboardEnhanced.tsx)
- [`src/app/api/analytics/kpis/route.ts`](/c:/Users/Asus/my-app/src/app/api/analytics/kpis/route.ts)
- [`src/app/api/analytics/trends/route.ts`](/c:/Users/Asus/my-app/src/app/api/analytics/trends/route.ts)
- [`src/app/api/analytics/bi-summary/route.ts`](/c:/Users/Asus/my-app/src/app/api/analytics/bi-summary/route.ts)

Flow:

- dashboard page -> analytics APIs -> raw SQL/Prisma aggregation over `PerformanceFact` -> chart-ready JSON -> Recharts UI

### 5. Alert rules and alert center

What it does:

- lets users create threshold rules
- creates alerts when metrics cross those thresholds

Main files:

- [`src/app/(dashboard)/guardrails/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/guardrails/page.tsx)
- [`src/app/(dashboard)/alerts/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/alerts/page.tsx)
- [`src/app/api/alerts/rules/route.ts`](/c:/Users/Asus/my-app/src/app/api/alerts/rules/route.ts)
- [`src/app/api/alerts/check/route.ts`](/c:/Users/Asus/my-app/src/app/api/alerts/check/route.ts)
- [`src/app/api/alerts/[id]/route.ts`](/c:/Users/Asus/my-app/src/app/api/alerts/[id]/route.ts)

Flow:

- user creates rule -> rule saved in `AlertRule` -> after ingest/check, aggregated facts are evaluated -> `Alert` and `Notification` may be created -> alerts page lists and updates status

### 6. Anomaly detection

What it does:

- detects unusual metric behavior statistically
- stores anomalies
- emails high-severity anomalies
- emits real-time socket events

Main files:

- [`src/lib/anomaly-engine.ts`](/c:/Users/Asus/my-app/src/lib/anomaly-engine.ts)
- [`scripts/anomaly_detection.py`](/c:/Users/Asus/my-app/scripts/anomaly_detection.py)
- [`src/app/api/anomalies/route.ts`](/c:/Users/Asus/my-app/src/app/api/anomalies/route.ts)
- [`src/components/AnomalyToast.tsx`](/c:/Users/Asus/my-app/src/components/AnomalyToast.tsx)

Flow:

- ingest route -> `runAnomalyCheck()` -> Python detection (or JS fallback) -> `Anomaly` rows -> notification email -> Socket.IO event -> UI toast

### 7. Admin management

What it does:

- manage brands
- manage users
- adjust per-brand detection accuracy settings

Main files:

- [`src/app/(dashboard)/brands/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/brands/page.tsx)
- [`src/app/(dashboard)/users/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/users/page.tsx)
- [`src/app/(dashboard)/detection/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/detection/page.tsx)

## Function-by-Function Explanation

This section focuses on the most important files and functions rather than every tiny helper.

### Auth functions

#### `signAccessToken`

- File: [`src/lib/auth.ts`](/c:/Users/Asus/my-app/src/lib/auth.ts)
- Parameters: `payload: { userId: string; role: "MARKETER" | "AGENCY_ADMIN" }`
- Returns: signed JWT string
- Called from:
  - [`/api/auth/login`](/c:/Users/Asus/my-app/src/app/api/auth/login/route.ts)
  - [`/api/auth/refresh`](/c:/Users/Asus/my-app/src/app/api/auth/refresh/route.ts)
- Why it matters:
  - creates the short-lived access token used by most API requests

#### `signRefreshToken`

- File: [`src/lib/auth.ts`](/c:/Users/Asus/my-app/src/lib/auth.ts)
- Parameters: `payload: { userId: string }`
- Returns: signed refresh JWT
- Called from:
  - login route
  - refresh route
- Why it matters:
  - powers session continuation

#### `verifyAccessToken`

- File: [`src/lib/auth.ts`](/c:/Users/Asus/my-app/src/lib/auth.ts)
- Parameters: `token: string`
- Returns: decoded access payload
- Used by:
  - low-level auth helpers and a few routes using `getBearer`

#### `hashToken`

- File: [`src/lib/auth.ts`](/c:/Users/Asus/my-app/src/lib/auth.ts)
- Parameters: `token: string`
- Returns: SHA-256 hash string
- Used by:
  - login/logout/refresh routes
- Why it matters:
  - refresh tokens are stored hashed, not in plain text

#### `requireAuth`

- File: [`src/lib/auth-guard.ts`](/c:/Users/Asus/my-app/src/lib/auth-guard.ts)
- Parameters: `req: NextRequest`
- Returns: `{ userId, role }`
- Called from:
  - most protected API routes
- Why it matters:
  - this is the main gatekeeper for backend access

#### `requireAdmin`

- File: [`src/lib/auth-guard.ts`](/c:/Users/Asus/my-app/src/lib/auth-guard.ts)
- Parameters: `req: NextRequest`
- Returns: access payload
- Called from:
  - admin-only routes like `/api/admin/ping`
- Why it matters:
  - blocks non-admin users

### Upload pipeline functions

#### `detectPlatform`

- File: [`src/app/api/uploads/route.ts`](/c:/Users/Asus/my-app/src/app/api/uploads/route.ts)
- Parameters: `headers: string[]`
- Returns: `"GOOGLE" | "META" | null`
- Called from:
  - upload create route
- Why it matters:
  - helps auto-detect the likely source platform from column names

#### `inferType`

- File: [`src/app/api/uploads/route.ts`](/c:/Users/Asus/my-app/src/app/api/uploads/route.ts)
- Parameters: `values: string[]`
- Returns: `"number" | "date" | "string"`
- Called from:
  - upload create route
- Why it matters:
  - creates useful metadata for mapping UI

#### `POST` in `/api/uploads`

- File: [`src/app/api/uploads/route.ts`](/c:/Users/Asus/my-app/src/app/api/uploads/route.ts)
- Parameters: uploaded multipart request
- Returns: created upload summary JSON
- Called from:
  - [`src/app/(dashboard)/uploads/new/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/uploads/new/page.tsx)
- Why it matters:
  - starts the whole CSV pipeline

#### `PATCH` in `/api/uploads/[id]`

- File: [`src/app/api/uploads/[id]/route.ts`](/c:/Users/Asus/my-app/src/app/api/uploads/[id]/route.ts)
- Parameters: mapping array
- Returns: success + new status
- Called from:
  - mapping page save action
- Why it matters:
  - confirms how CSV columns map to normalized keys

#### `POST` in `/api/uploads/[id]/ingest`

- File: [`src/app/api/uploads/[id]/ingest/route.ts`](/c:/Users/Asus/my-app/src/app/api/uploads/[id]/ingest/route.ts)
- Parameters: upload id through route params
- Returns: ingest summary
- Called from:
  - mapping page ingest action
- Why it matters:
  - turns uploaded data into analytics records

#### `runAlertCheck`

- File: [`src/app/api/uploads/[id]/ingest/route.ts`](/c:/Users/Asus/my-app/src/app/api/uploads/[id]/ingest/route.ts)
- Parameters: `brandId`
- Returns: nothing useful to caller; side effects only
- Called from:
  - ingest route
- Why it matters:
  - evaluates alert rules after data import

#### `runAnomalyCheck`

- File: [`src/lib/anomaly-engine.ts`](/c:/Users/Asus/my-app/src/lib/anomaly-engine.ts)
- Parameters: `brandId`, `uploadId`
- Returns: `Promise<void>`
- Called from:
  - ingest route
- Why it matters:
  - runs the anomaly pipeline end-to-end

#### `runPythonDetection`

- File: [`src/lib/anomaly-engine.ts`](/c:/Users/Asus/my-app/src/lib/anomaly-engine.ts)
- Parameters: array of metric series rows
- Returns: Python anomaly result object
- Called from:
  - `runAnomalyCheck`
- Why it matters:
  - connects Node code to the Python scoring script

#### `runJSDetection`

- File: [`src/lib/anomaly-engine.ts`](/c:/Users/Asus/my-app/src/lib/anomaly-engine.ts)
- Parameters: simplified time-series rows
- Returns: fallback anomaly result
- Called from:
  - `runAnomalyCheck` if Python fails
- Why it matters:
  - keeps anomaly detection working even if Python is unavailable

### Dashboard/analytics functions

#### `fetchAnalytics`

- File: [`src/app/(dashboard)/dashboard/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/dashboard/page.tsx)
- Parameters: `brandId`, `platform`, `from`, `to`
- Returns: no direct return; updates local state
- Called from:
  - dashboard page effects and filter actions
- Why it matters:
  - loads KPI data for the main dashboard cards

#### `fetchPrevSpend`

- File: [`src/app/(dashboard)/dashboard/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/dashboard/page.tsx)
- Parameters: same filter values
- Returns: no direct return; updates previous-period chart state
- Why it matters:
  - supports current-vs-previous spend charting

#### `GET` in `/api/analytics/kpis`

- File: [`src/app/api/analytics/kpis/route.ts`](/c:/Users/Asus/my-app/src/app/api/analytics/kpis/route.ts)
- Parameters: `brandId`, optional `platform`, `dateFrom`, `dateTo`
- Returns: KPI totals, platform breakdown, spend-over-time, top campaigns
- Called from:
  - main dashboard
  - brands page enrichment
- Why it matters:
  - one of the most important analytics endpoints

#### `GET` in `/api/analytics/trends`

- File: [`src/app/api/analytics/trends/route.ts`](/c:/Users/Asus/my-app/src/app/api/analytics/trends/route.ts)
- Parameters: brand/date/platform filters
- Returns: time series with platform-split and previous-period overlay data
- Called from:
  - `DashboardEnhanced`
- Why it matters:
  - powers most trend charts

#### `GET` in `/api/analytics/bi-summary`

- File: [`src/app/api/analytics/bi-summary/route.ts`](/c:/Users/Asus/my-app/src/app/api/analytics/bi-summary/route.ts)
- Parameters: brand/date/platform filters
- Returns: funnel, platform donut, campaign donut, geo, conversion trend
- Called from:
  - `DashboardEnhanced`
- Why it matters:
  - powers the richer BI visualizations

### Alerts/anomalies functions

#### `POST` in `/api/alerts/check`

- File: [`src/app/api/alerts/check/route.ts`](/c:/Users/Asus/my-app/src/app/api/alerts/check/route.ts)
- Parameters: `{ brandId }`
- Returns: how many rules were checked/alerts created
- Why it matters:
  - manual threshold evaluation endpoint

#### `GET` in `/api/anomalies`

- File: [`src/app/api/anomalies/route.ts`](/c:/Users/Asus/my-app/src/app/api/anomalies/route.ts)
- Parameters: optional `brandId`
- Returns: anomaly list, summary, engine name
- Called from:
  - anomalies page
- Why it matters:
  - anomaly review UI depends on it

#### `getSocket`

- File: [`src/lib/socket-client.ts`](/c:/Users/Asus/my-app/src/lib/socket-client.ts)
- Parameters: none
- Returns: shared Socket.IO client
- Called from:
  - `AnomalyToast`
- Why it matters:
  - enables live browser notifications

## React / Next.js Component Explanation

### `RootLayout`

- File: [`src/app/layout.tsx`](/c:/Users/Asus/my-app/src/app/layout.tsx)
- Renders:
  - base HTML, font links, body wrapper
- Props:
  - `children`
- Server or client:
  - server component
- Why it matters:
  - top-level wrapper for every page

### `DashboardLayout`

- File: [`src/app/(dashboard)/layout.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/layout.tsx)
- Renders:
  - sidebar
  - topbar
  - brand selector for admins
  - notification bell
  - user menu
  - `AnomalyToast`
- Props:
  - `children`
- Local state:
  - sidebar collapsed state
  - user info
  - brands
  - selected brand
  - notifications
  - dropdown open state
- Hooks:
  - `useState`, `useEffect`, `useCallback`, `useRef`, `useRouter`, `usePathname`
- Client or server:
  - client component
- Why it matters:
  - this is the real app shell for authenticated pages

### `DashboardPage`

- File: [`src/app/(dashboard)/dashboard/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/dashboard/page.tsx)
- Renders:
  - KPI cards
  - global status widget
  - spend chart
  - alert preview
  - platform split
  - recent uploads
  - top campaigns
  - `DashboardEnhanced`
- Props:
  - none
- Local state:
  - uploads
  - analytics
  - brands
  - active brand
  - filters
  - alerts
  - previous-period spend
- Hooks:
  - `useState`, `useEffect`
- Client or server:
  - client component
- Why it matters:
  - central user-facing dashboard

### `DashboardEnhanced`

- File: [`src/components/DashboardEnhanced.tsx`](/c:/Users/Asus/my-app/src/components/DashboardEnhanced.tsx)
- Renders:
  - extended analytics blocks and many charts
- Props:
  - `brandId`
  - `platform`
  - `dateFrom`
  - `dateTo`
- Local state:
  - trends
  - comparisons
  - alert day stats
  - funnel data
  - donut data
  - geo data
  - conversion trend
- Hooks:
  - `useState`, `useEffect`, `useCallback`
- Client or server:
  - client component
- Why it matters:
  - biggest analytics visualization component in the codebase

### `NewUploadPage`

- File: [`src/app/(dashboard)/uploads/new/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/uploads/new/page.tsx)
- Renders:
  - file chooser/dropzone
  - platform selector
  - brand selector
  - upload submit
- Local state:
  - selected file
  - platform
  - brand
  - brands list
  - drag state
  - loading state
- Why it matters:
  - starts the data pipeline

### `ColumnMappingPage`

- File: [`src/app/(dashboard)/uploads/[id]/mapping/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/uploads/[id]/mapping/page.tsx)
- Renders:
  - mapping progress
  - auto-map button
  - mapping table
  - save and ingest actions
- Local state:
  - upload details
  - mapping selections
  - save/ingest status
  - errors
- Why it matters:
  - converts raw columns into normalized analytics fields

### `AlertsPage`

- File: [`src/app/(dashboard)/alerts/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/alerts/page.tsx)
- Renders:
  - tabs by alert status
  - alert cards
  - acknowledge/resolve buttons
- Local state:
  - alerts
  - active tab
  - updating item id
- Why it matters:
  - operational triage UI for alert management

### `AnomaliesPage`

- File: [`src/app/(dashboard)/anomalies/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/anomalies/page.tsx)
- Renders:
  - anomaly summary pills
  - metric/severity filters
  - expandable anomaly cards
- Local state:
  - anomaly list
  - filters
  - expanded row
- Why it matters:
  - lets users inspect anomaly findings in detail

### `BrandsPage`

- File: [`src/app/(dashboard)/brands/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/brands/page.tsx)
- Renders:
  - stats cards
  - searchable/filterable brand table
  - create brand modal
- Why it matters:
  - admin brand management UI

### `UsersPage`

- File: [`src/app/(dashboard)/users/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/users/page.tsx)
- Renders:
  - stats cards
  - user table
  - invite/edit/delete dialogs
- Why it matters:
  - admin user management UI

### `BrandDetailPage`

- File: [`src/app/(dashboard)/brands/[id]/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/brands/[id]/page.tsx)
- Important note:
  - this page currently uses hard-coded mock data instead of real backend data
- Why it matters:
  - it exists in routes, but it is not fully integrated yet

## Endpoint Summary

### Auth

| Method | Route | Purpose | Auth | Related logic |
|---|---|---|---|---|
| `POST` | `/api/auth/login` | Login and create session | No | login route |
| `POST` | `/api/auth/register` | Register user | No | register route |
| `POST` | `/api/auth/refresh` | Rotate refresh token and issue new access token | Refresh cookie | refresh route |
| `GET` | `/api/auth/me` | Return current user | Yes | auth me route |
| `POST` | `/api/auth/logout` | Revoke refresh token and clear cookie | Cookie/token context | logout route |
| `POST` | `/api/auth/forgot-password` | Start reset flow | No | forgot-password route |
| `POST` | `/api/auth/reset-password` | Save new password with token | No | reset-password route |

### Users

| Method | Route | Purpose | Auth | Related logic |
|---|---|---|---|---|
| `GET` | `/api/users` | List users | Admin | users route |
| `POST` | `/api/users` | Create user | Admin | users route |
| `PATCH` | `/api/users?id=...` | Update user | Admin | users route |
| `DELETE` | `/api/users?id=...` | Delete user | Admin | users route |
| `GET` | `/api/users/[id]` | Get one user | Self/Admin | users/[id] route |
| `PATCH` | `/api/users/[id]` | Update one user | Self/Admin with limits | users/[id] route |
| `DELETE` | `/api/users/[id]` | Delete one user | Admin | users/[id] route |
| `GET` | `/api/users/me` | Current user profile | Yes | users/me route |
| `PATCH` | `/api/users/me` | Update own profile | Yes | users/me route |
| `POST` | `/api/users/me/password` | Change own password | Yes | users/me/password route |

### Brands

| Method | Route | Purpose | Auth | Related logic |
|---|---|---|---|---|
| `GET` | `/api/brands` | List accessible brands | Yes | brands route |
| `POST` | `/api/brands` | Create brand | Admin | brands route |
| `GET` | `/api/brands/[id]/members` | List brand members | Brand access/Admin | members route |

### Uploads

| Method | Route | Purpose | Auth | Related logic |
|---|---|---|---|---|
| `GET` | `/api/uploads` | List uploads | Yes | uploads route |
| `POST` | `/api/uploads` | Upload CSV | Yes | uploads route |
| `GET` | `/api/uploads/[id]` | Get upload details | Owner/Admin | uploads/[id] route |
| `PATCH` | `/api/uploads/[id]` | Save mappings | Owner/Admin | uploads/[id] route |
| `DELETE` | `/api/uploads/[id]` | Delete upload | Owner/Admin | uploads/[id] route |
| `POST` | `/api/uploads/[id]/mapping` | Alternative mapping save route | Brand member/Admin | uploads/[id]/mapping route |
| `POST` | `/api/uploads/[id]/ingest` | Ingest mapped upload | Owner/Admin | uploads/[id]/ingest route |

### Analytics / Alerts / Anomalies

| Method | Route | Purpose | Auth | Related logic |
|---|---|---|---|---|
| `GET` | `/api/analytics/kpis` | KPI summary and chart data | Brand access | kpis route |
| `GET` | `/api/analytics/trends` | Trend data and period comparison | Brand access | trends route |
| `GET` | `/api/analytics/bi-summary` | Funnel/donut/geo BI payload | Auth, expects brandId | bi-summary route |
| `GET` | `/api/analytics/alert-trends` | Alert chart data | Brand access | alert-trends route |
| `GET` | `/api/analytics/global-status` | Admin alert status matrix | Admin | global-status route |
| `POST` | `/api/analytics/python-anomalies` | Run Python anomaly check for one metric | Yes | python-anomalies route |
| `GET` | `/api/alerts` | List alerts | Brand access | alerts route |
| `PATCH` | `/api/alerts/[id]` | Update alert status | Brand access | alerts/[id] route |
| `GET` | `/api/alerts/rules` | List rules | Brand access | rules route |
| `POST` | `/api/alerts/rules` | Create rule | Brand access/Admin | rules route |
| `POST` | `/api/alerts/check` | Manually check rules | Brand access | check route |
| `GET` | `/api/anomalies` | List anomalies | Brand access | anomalies route |

### Misc

| Method | Route | Purpose | Auth | Related logic |
|---|---|---|---|---|
| `GET` | `/api/detection/accuracy` | Read brand detection settings | Admin | detection route |
| `POST` | `/api/detection/accuracy` | Save brand detection settings | Admin | detection route |
| `GET` | `/api/metrics/overview` | Older metrics overview endpoint | Brand member | metrics overview route |
| `POST` | `/api/datasets/bulk` | Bulk insert facts | Brand member | datasets bulk route |
| `GET` | `/api/leads` | List leads | Yes | leads route |
| `POST` | `/api/leads` | Create lead | Yes | leads route |
| `PATCH` | `/api/leads/[id]` | Update lead | Yes | leads/[id] route |
| `DELETE` | `/api/leads/[id]` | Delete lead | Yes | leads/[id] route |
| `GET` | `/api/admin/ping` | Admin test route | Admin | admin ping route |

## Important Functions Summary

| Name | File | Purpose | Used by |
|---|---|---|---|
| `requireAuth` | [`src/lib/auth-guard.ts`](/c:/Users/Asus/my-app/src/lib/auth-guard.ts) | Verifies access token | Most protected routes |
| `signAccessToken` | [`src/lib/auth.ts`](/c:/Users/Asus/my-app/src/lib/auth.ts) | Creates access JWT | login, refresh |
| `signRefreshToken` | [`src/lib/auth.ts`](/c:/Users/Asus/my-app/src/lib/auth.ts) | Creates refresh JWT | login, refresh |
| `apiFetch` | [`src/lib/apiFetch.ts`](/c:/Users/Asus/my-app/src/lib/apiFetch.ts) | Fetch wrapper with silent refresh | AuthContext and any caller using wrapper |
| `POST /api/uploads` | [`src/app/api/uploads/route.ts`](/c:/Users/Asus/my-app/src/app/api/uploads/route.ts) | Creates upload and inferred columns | new upload page |
| `PATCH /api/uploads/[id]` | [`src/app/api/uploads/[id]/route.ts`](/c:/Users/Asus/my-app/src/app/api/uploads/[id]/route.ts) | Saves mappings | mapping page |
| `POST /api/uploads/[id]/ingest` | [`src/app/api/uploads/[id]/ingest/route.ts`](/c:/Users/Asus/my-app/src/app/api/uploads/[id]/ingest/route.ts) | Converts CSV rows into facts | mapping page |
| `runAnomalyCheck` | [`src/lib/anomaly-engine.ts`](/c:/Users/Asus/my-app/src/lib/anomaly-engine.ts) | Runs anomaly pipeline | ingest route |
| `GET /api/analytics/kpis` | [`src/app/api/analytics/kpis/route.ts`](/c:/Users/Asus/my-app/src/app/api/analytics/kpis/route.ts) | KPI aggregation | dashboard, brands page |
| `GET /api/analytics/trends` | [`src/app/api/analytics/trends/route.ts`](/c:/Users/Asus/my-app/src/app/api/analytics/trends/route.ts) | Trend and comparison data | DashboardEnhanced |

## Step-by-Step User Journey

### Normal user journey

1. User lands on `/landing`.
2. User registers or logs in.
3. Login stores `access_token` and `user` in `sessionStorage`.
4. User enters dashboard layout.
5. Layout loads user info and available notifications.
6. User opens `/uploads/new`.
7. User chooses CSV, platform, and brand.
8. App uploads CSV to `/api/uploads`.
9. User is sent to mapping page.
10. User reviews auto-mapped columns and fixes anything missing.
11. User clicks save mappings.
12. User clicks ingest.
13. Backend creates `PerformanceFact` rows.
14. Alert check and anomaly check run in the background.
15. User opens dashboard and sees KPI charts built from ingested data.
16. If anomalies are detected, user may receive:
    - anomaly page results
    - emails
    - live toast via Socket.IO
17. User can open alerts page to acknowledge or resolve alerts.

## Admin Flow

If the user is `AGENCY_ADMIN`, they get extra capabilities:

- see all brands
- use brand selector in dashboard layout
- create brands
- manage users
- manage detection accuracy settings
- access global status analytics
- see all uploads and alerts across brands

Admin pages:

- [`src/app/(dashboard)/brands/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/brands/page.tsx)
- [`src/app/(dashboard)/users/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/users/page.tsx)
- [`src/app/(dashboard)/detection/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/detection/page.tsx)

## Environment Variables and Config

### Environment variables found in code

#### `DATABASE_URL`

- Used by:
  - [`prisma.config.ts`](/c:/Users/Asus/my-app/prisma.config.ts)
  - [`src/lib/prisma.ts`](/c:/Users/Asus/my-app/src/lib/prisma.ts)
- Purpose:
  - PostgreSQL connection string

#### `JWT_ACCESS_SECRET`

- Used by:
  - [`src/lib/auth.ts`](/c:/Users/Asus/my-app/src/lib/auth.ts)
  - [`src/lib/auth-guard.ts`](/c:/Users/Asus/my-app/src/lib/auth-guard.ts)
- Purpose:
  - signs and verifies access tokens

#### `JWT_REFRESH_SECRET`

- Used by:
  - [`src/lib/auth.ts`](/c:/Users/Asus/my-app/src/lib/auth.ts)
- Purpose:
  - signs and verifies refresh tokens

#### `ACCESS_TOKEN_EXPIRES_IN`

- Used by:
  - [`src/lib/auth.ts`](/c:/Users/Asus/my-app/src/lib/auth.ts)
- Purpose:
  - access token expiry

#### `REFRESH_TOKEN_EXPIRES_IN`

- Used by:
  - [`src/lib/auth.ts`](/c:/Users/Asus/my-app/src/lib/auth.ts)
- Purpose:
  - refresh token expiry

#### `REFRESH_COOKIE_NAME`

- Used by:
  - [`src/lib/cookies.ts`](/c:/Users/Asus/my-app/src/lib/cookies.ts)
- Purpose:
  - cookie name for refresh token

#### `COOKIE_SECURE`

- Used by:
  - [`src/lib/cookies.ts`](/c:/Users/Asus/my-app/src/lib/cookies.ts)
- Purpose:
  - controls secure cookie flag

#### `NEXT_PUBLIC_APP_URL`

- Used by:
  - [`server.ts`](/c:/Users/Asus/my-app/server.ts)
  - [`src/app/api/auth/forgot-password/route.ts`](/c:/Users/Asus/my-app/src/app/api/auth/forgot-password/route.ts)
  - [`src/lib/notification-mailer.ts`](/c:/Users/Asus/my-app/src/lib/notification-mailer.ts)
- Purpose:
  - frontend origin for sockets and email links

#### `EMAIL_USER`

- Used by:
  - [`src/lib/mailer.ts`](/c:/Users/Asus/my-app/src/lib/mailer.ts)
  - [`src/lib/notification-mailer.ts`](/c:/Users/Asus/my-app/src/lib/notification-mailer.ts)
- Purpose:
  - Gmail sender account

#### `EMAIL_PASS`

- Used by:
  - [`src/lib/mailer.ts`](/c:/Users/Asus/my-app/src/lib/mailer.ts)
  - [`src/lib/notification-mailer.ts`](/c:/Users/Asus/my-app/src/lib/notification-mailer.ts)
- Purpose:
  - Gmail app password

#### `PORT`

- Used by:
  - [`server.ts`](/c:/Users/Asus/my-app/server.ts)
- Purpose:
  - custom server port

### Config files

- [`next.config.ts`](/c:/Users/Asus/my-app/next.config.ts)
  - currently minimal

- [`prisma.config.ts`](/c:/Users/Asus/my-app/prisma.config.ts)
  - Prisma setup

- [`tsconfig.json`](/c:/Users/Asus/my-app/tsconfig.json)
  - TypeScript config

- [`tsconfig.server.json`](/c:/Users/Asus/my-app/tsconfig.server.json)
  - TypeScript config for custom server

- [`eslint.config.mjs`](/c:/Users/Asus/my-app/eslint.config.mjs)
  - lint configuration

- [`postcss.config.mjs`](/c:/Users/Asus/my-app/postcss.config.mjs)
  - PostCSS config

## External APIs / Services

### PostgreSQL

- Primary data store.

### Prisma

- ORM and schema manager.

### Gmail via Nodemailer

- Used for:
  - password reset emails
  - threshold alert emails
  - anomaly emails

### Socket.IO

- Used for live anomaly notification delivery from server to browser.

### Python anomaly engine

- External process launched from Node using `spawn()`.
- File: [`scripts/anomaly_detection.py`](/c:/Users/Asus/my-app/scripts/anomaly_detection.py)

### Recharts

- Used to render analytics charts in the browser.

### Ant Design

- Used for UI helpers like tooltip in dashboard layout.

### `node-appwrite`

- Installed in dependencies, but I did not find active project code using it in the inspected files.

## Error Handling

### Frontend error handling

Common frontend patterns:

- local `error` state string
- `try/catch` around `fetch`
- conditional banners/messages in UI
- loading spinners during request

Examples:

- login page shows inline error
- mapping page shows save/ingest error banner
- alerts page shows refresh/update error banner
- settings page shows profile/password success or error messages

### Backend error handling

Common backend patterns:

- catch `AuthError` and return its status code
- catch `ZodError` or use `safeParse`
- return JSON `{ error: ... }`
- log unexpected errors with `console.error`

Important note:

Error handling style is not fully standardized across all routes.

Examples:

- some routes use Zod strongly
- some use manual checks
- some use `AuthError`
- some use lower-level `verifyAccessToken`

## Confusing or Important Architecture Notes

### 1. There are two auth styles in the codebase

Current live pages mostly use:

- `sessionStorage`
- direct `fetch`
- dashboard layout manual checks

But the repo also contains:

- [`src/context/AuthContext.tsx`](/c:/Users/Asus/my-app/src/context/AuthContext.tsx)
- [`src/components/ProtectedRoute.tsx`](/c:/Users/Asus/my-app/src/components/ProtectedRoute.tsx)
- [`src/components/RequireRole.tsx`](/c:/Users/Asus/my-app/src/components/RequireRole.tsx)
- [`src/components/AppShell.tsx`](/c:/Users/Asus/my-app/src/components/AppShell.tsx)

These look like an alternate or older auth shell pattern. They do not appear to be the main active path for the current dashboard routes.

### 2. `BrandDetailPage` is not fully real yet

[`src/app/(dashboard)/brands/[id]/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/brands/[id]/page.tsx)
currently uses mock data instead of real API-backed brand details.

### 3. The codebase mixes Prisma queries and raw SQL

This is important for understanding analytics.

- normal app data often uses Prisma model APIs
- analytics endpoints often use raw SQL because metrics and dimensions are inside JSON fields

### 4. `PerformanceFact` is the core analytics table

This is the most important table to understand for dashboard data.

It stores:

- fixed columns like `brandId`, `date`, `platform`, `entityType`, `entityId`
- flexible JSON blobs:
  - `metrics`
  - `dimensions`

### 5. Some defaults look fake or legacy

Examples:

- some analytics routes default to `brand_visioad_001`
- some components/pages use stale assumptions
- the test file expects response shapes that do not always match current code

### 6. Some comments and strings have encoding artifacts

There are visible text artifacts like broken arrows and symbols in several files.

This does not usually break logic, but it hurts readability.

## Cleanup / Refactor Suggestions

These are suggestions only. I did not change code.

1. Unify auth handling.
   - Choose one main approach:
     - `AuthContext` + `apiFetch`
     - or direct `sessionStorage` + direct `fetch`
   - Right now both patterns exist.

2. Move backend business logic out of very large route files.
   - Example:
     - uploads ingest
     - anomalies route
     - analytics routes

3. Standardize authorization helpers.
   - Some routes use `requireAuth`
   - some use `getBearer` + `verifyAccessToken`
   - this should be more consistent

4. Standardize API response shapes.
   - Some pages expect `items`
   - some older code appears to expect raw arrays or other shapes

5. Replace mock brand detail page with real data.
   - [`src/app/(dashboard)/brands/[id]/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/brands/[id]/page.tsx)

6. Review old or unused shell/auth components.
   - [`src/components/AppShell.tsx`](/c:/Users/Asus/my-app/src/components/AppShell.tsx)
   - [`src/components/ProtectedRoute.tsx`](/c:/Users/Asus/my-app/src/components/ProtectedRoute.tsx)
   - [`src/components/RequireRole.tsx`](/c:/Users/Asus/my-app/src/components/RequireRole.tsx)

7. Fix misleading helper script.
   - [`scripts/create-admin.mjs`](/c:/Users/Asus/my-app/scripts/create-admin.mjs)
   - current register route forces `MARKETER`

8. Review tests for drift from current implementation.
   - [`tests/integration.test.mjs`](/c:/Users/Asus/my-app/tests/integration.test.mjs)

9. Reduce inline styling in large pages.
   - Many pages are long and mix logic + rendering + styling in one file.

10. Avoid repeating brand-access helper logic in many analytics routes.
   - this could be extracted into one shared helper

## Questions I Should Ask My Teammate or Supervisor

1. Is `AuthContext` still intended to be the main auth pattern, or has the project officially moved to direct `sessionStorage` checks?

2. Should access tokens stay in `sessionStorage`, or is there a plan to move more auth state to secure cookies?

3. Is [`src/app/(dashboard)/brands/[id]/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/brands/[id]/page.tsx) supposed to be finished soon, or is it just a placeholder?

4. Are the leads APIs actively used by another frontend or are they currently unused in this app?

5. Is `node-appwrite` still needed, since it does not appear to be used in the current inspected code?

6. Should the analytics raw SQL be moved into a dedicated analytics service layer?

7. Should marketers be able to create guardrail rules for only their brands, or should that be admin-only?

8. Is the current anomaly detection behavior intended to run on every ingest, even for small datasets?

9. Is the default brand fallback value in some analytics routes (`brand_visioad_001`) still valid, or should all analytics require explicit brand selection?

10. Should the register route remain marketer-only, or should there be a real admin creation path?

11. Are `ProtectedRoute`, `RequireRole`, and `AppShell` still part of the intended architecture, or can they be removed?

12. Is the test file expected to be kept in sync with the current API response shapes?

## Beginner Summary

This app is a complete ads monitoring system.

The most important idea is this:

- users upload CSV campaign data
- they map the CSV columns to the app’s standard field names
- the app stores the cleaned rows in a flexible analytics table
- the dashboard reads that stored data and turns it into KPIs, charts, alerts, and anomaly results

If you understand:

1. auth
2. brands/users
3. upload + mapping
4. ingest into `PerformanceFact`
5. analytics endpoints

then you understand the heart of this project.

## Technical Summary

This is a monolithic Next.js 16 App Router application with client-heavy dashboard pages and colocated API routes. Authentication uses JWT access tokens in `sessionStorage` plus rotating refresh tokens stored as `httpOnly` cookies and hashed DB rows. Operational data is modeled relationally in Prisma, while analytics data is normalized into a flexible `PerformanceFact` table that stores `metrics` and `dimensions` as JSON. Dashboard and BI endpoints use a mix of Prisma and raw SQL aggregations over `PerformanceFact`. Post-ingest workflows trigger threshold evaluation, anomaly detection via a Python child process with JS fallback, notification persistence, email sending, and live Socket.IO updates.

## Top 10 Most Important Files to Study First

1. [`prisma/schema.prisma`](/c:/Users/Asus/my-app/prisma/schema.prisma)
2. [`src/lib/prisma.ts`](/c:/Users/Asus/my-app/src/lib/prisma.ts)
3. [`src/lib/auth.ts`](/c:/Users/Asus/my-app/src/lib/auth.ts)
4. [`src/lib/auth-guard.ts`](/c:/Users/Asus/my-app/src/lib/auth-guard.ts)
5. [`src/app/api/auth/login/route.ts`](/c:/Users/Asus/my-app/src/app/api/auth/login/route.ts)
6. [`src/app/api/uploads/route.ts`](/c:/Users/Asus/my-app/src/app/api/uploads/route.ts)
7. [`src/app/api/uploads/[id]/ingest/route.ts`](/c:/Users/Asus/my-app/src/app/api/uploads/[id]/ingest/route.ts)
8. [`src/app/api/analytics/kpis/route.ts`](/c:/Users/Asus/my-app/src/app/api/analytics/kpis/route.ts)
9. [`src/lib/anomaly-engine.ts`](/c:/Users/Asus/my-app/src/lib/anomaly-engine.ts)
10. [`src/app/(dashboard)/dashboard/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/dashboard/page.tsx)

## Appendix A: Dashboard Page Deep Dive

This appendix goes page by page through the dashboard area.

### [`src/app/(dashboard)/layout.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/layout.tsx)

This is the most important frontend wrapper in the app.

What it does:

- reads the logged-in user from `sessionStorage`
- redirects to `/login` if there is no session
- fetches brands for admins
- keeps track of the currently selected brand
- fetches open alerts for the notification bell
- mounts the global anomaly toast listener
- provides the sidebar/topbar used by all dashboard pages

Important functions inside:

- `getStoredUser()`
  - reads and parses the `user` object from `sessionStorage`

- `timeAgo(dateStr)`
  - converts alert timestamps into strings like `5m ago`

- `fetchNotifications()`
  - calls `/api/alerts?status=OPEN`
  - updates notification dropdown data

- `handleBrandChange(brandId)`
  - updates local selected brand state
  - dispatches a `brand-change` custom event so pages like the dashboard can react

- `handleLogout()`
  - calls `/api/auth/logout`
  - clears browser session storage
  - redirects to login

Important notes:

- This layout acts like the current authentication shell.
- It is doing work that some projects would put into a global auth provider or middleware.

### [`src/app/(dashboard)/dashboard/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/dashboard/page.tsx)

This is the main business dashboard page.

What it renders:

- dashboard title and active brand name
- filter bar
- KPI cards
- admin-only global status widget
- spend-over-time chart
- active alerts preview
- platform split widget
- recent uploads preview
- top campaigns table
- advanced analytics section through `DashboardEnhanced`

What it fetches:

- `/api/brands`
- `/api/uploads`
- `/api/analytics/kpis`
- `/api/alerts`

Important state:

- `uploads`
- `analytics`
- `brands`
- `activeBrand`
- `platform`
- `dateFrom`
- `dateTo`
- `realAlerts`
- `userRole`
- `prevSpend`

Important functions:

- `getPrevBounds(from, to)`
  - computes the previous comparison period for charts

- `fetchPrevSpend(brandId, plat, from, to)`
  - loads previous-period spend so the spend chart can show an overlay line

- `fetchAnalytics(brandId, plat, from, to)`
  - loads main KPI response from `/api/analytics/kpis`

- `fetchAlerts(brandId)`
  - loads current open alerts for the selected brand

- `handleBrandSwitch(brandId)`
  - changes the active brand and refreshes related data

- `applyFilters()`
  - refreshes analytics using current filters

- `resetFilters()`
  - clears selected filters and reloads the default view

How it fits into the app:

- This page is the “summary homepage” after login.
- It combines quick operational info with analytics and hands off deeper charting to `DashboardEnhanced`.

### [`src/components/DashboardEnhanced.tsx`](/c:/Users/Asus/my-app/src/components/DashboardEnhanced.tsx)

This is the “advanced analytics” engine for the dashboard UI.

What it renders:

- comparison badges
- platform donut
- campaign donut
- funnel view
- conversion trend
- geo/country performance table
- metric trend charts for ROAS, CTR, CPC
- alert trend chart
- metric breakdown table

What it fetches:

- `/api/analytics/trends`
- `/api/analytics/alert-trends`
- `/api/analytics/bi-summary`

Important state:

- `trends`
- `comparison`
- `alertDays`
- `alertSummary`
- `funnel`
- `platformDonut`
- `campaignDonut`
- `geo`
- `convTrend`
- loading states

Important functions:

- `fetchTrends()`
  - loads time-series and alert trend data

- `fetchBI()`
  - loads BI summary data such as funnel/platform/campaign/geo sections

Why it matters:

- If you want to understand how the dashboard gets its richer charts, this is one of the best files to study.

### [`src/app/(dashboard)/uploads/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/uploads/page.tsx)

Purpose:

- shows upload history and lets the user continue mapping when an upload is still pending or mapped

What it fetches:

- `/api/uploads`

Important behavior:

- pulls `items` from the API response
- displays file name, platform, brand, status, and date
- clicking a pending/mapped upload opens the mapping page

### [`src/app/(dashboard)/uploads/new/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/uploads/new/page.tsx)

Purpose:

- collects the file, platform, and brand before upload

What it fetches:

- `/api/brands`

What it submits:

- `POST /api/uploads` using `FormData`

Important behavior:

- normalizes platform text like `Google Ads` to `GOOGLE`
- sends multipart form data
- redirects to the mapping page after successful upload

### [`src/app/(dashboard)/uploads/[id]/mapping/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/uploads/[id]/mapping/page.tsx)

Purpose:

- review columns found in the CSV
- save field mappings
- ingest the upload

What it fetches:

- `/api/uploads/[id]`

What it submits:

- `PATCH /api/uploads/[id]`
- fallback `POST /api/uploads/[id]/mapping`
- `POST /api/uploads/[id]/ingest`

Important functions:

- `fetchUpload()`
  - loads column info and existing saved mappings

- `autoMap()`
  - uses column-name heuristics to auto-assign common keys

- `handleSave()`
  - saves mappings and updates upload status to `MAPPED`

- `handleIngest()`
  - starts final import into analytics tables

### [`src/app/(dashboard)/alerts/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/alerts/page.tsx)

Purpose:

- central alert inbox

What it fetches:

- `/api/alerts`

What it submits:

- `PATCH /api/alerts/[id]`

Important behavior:

- can filter visually by `ALL`, `OPEN`, `ACK`, `RESOLVED`
- lets user acknowledge or resolve alerts

### [`src/app/(dashboard)/guardrails/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/guardrails/page.tsx)

Purpose:

- create and manage threshold rules

What it fetches:

- `/api/alerts/rules`
- `/api/brands`

What it submits:

- `POST /api/alerts/rules`

Important note:

- The UI supports edit/delete/toggle interactions locally, but the backend currently only exposes `GET` and `POST` for rules.
- That means some of the edit/delete/toggle UI behavior is not fully backed by matching route handlers yet.

### [`src/app/(dashboard)/anomalies/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/anomalies/page.tsx)

Purpose:

- review anomaly detection results

What it fetches:

- `/api/anomalies`

Important behavior:

- filters by metric and severity
- expands rows to show z-score, change %, detection method, and recommendation

### [`src/app/(dashboard)/brands/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/brands/page.tsx)

Purpose:

- admin-only brand overview and creation page

What it fetches:

- `/api/brands`
- `/api/analytics/kpis?brandId=...`
- `/api/brands/[id]/members`
- `/api/uploads?brandId=...`
- `/api/alerts?brandId=...&status=OPEN`

What it submits:

- `POST /api/brands`

Important behavior:

- “enriches” each brand by making multiple API calls per brand
- computes a health badge using ROAS and open alert count

### [`src/app/(dashboard)/brands/[id]/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/brands/[id]/page.tsx)

Purpose:

- intended brand detail page

Actual current behavior:

- checks for admin role
- loads mock brand data inside the component
- does not call a real brand-detail API

This page should be treated as incomplete or placeholder code.

### [`src/app/(dashboard)/users/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/users/page.tsx)

Purpose:

- admin-only user management page

What it fetches:

- `/api/users?pageSize=100`
- `/api/brands`

What it submits:

- `POST /api/users`
- `PATCH /api/users?id=...`
- `DELETE /api/users?id=...`

Important behavior:

- lets admin assign brands to users
- supports invite, edit, and delete dialogs

### [`src/app/(dashboard)/settings/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/settings/page.tsx)

Purpose:

- current-user profile and password management

What it fetches:

- `/api/users/me`

What it submits:

- `PATCH /api/users/me`
- `POST /api/users/me/password`
- `POST /api/auth/logout`

Important behavior:

- keeps the `user` value in `sessionStorage` in sync after profile changes

### [`src/app/(dashboard)/detection/page.tsx`](/c:/Users/Asus/my-app/src/app/(dashboard)/detection/page.tsx)

Purpose:

- admin-only detection tuning page per brand

What it fetches:

- `/api/brands`
- `/api/detection/accuracy?brandId=...`

What it submits:

- `POST /api/detection/accuracy`

Important behavior:

- stores `sensitivity` and `threshold` for each brand
- includes a local-only “group alerts” toggle that currently does not persist to backend storage

## Appendix B: API Route Deep Dive

This appendix explains each route file in practical terms.

### Auth routes

#### [`src/app/api/auth/login/route.ts`](/c:/Users/Asus/my-app/src/app/api/auth/login/route.ts)

Purpose:

- validate credentials and start a session

Main steps:

1. validate body with Zod
2. find user by email
3. compare password with bcrypt
4. create access token
5. create refresh token
6. hash and store refresh token
7. set refresh cookie
8. return access token + user summary

#### [`src/app/api/auth/register/route.ts`](/c:/Users/Asus/my-app/src/app/api/auth/register/route.ts)

Purpose:

- create a new account

Main steps:

1. validate body
2. reject duplicate email
3. hash password
4. create user

Important note:

- even if `role` is provided in input, the route currently forces new users to `MARKETER`

#### [`src/app/api/auth/refresh/route.ts`](/c:/Users/Asus/my-app/src/app/api/auth/refresh/route.ts)

Purpose:

- rotate refresh token and issue a new access token

Main steps:

1. read refresh cookie
2. verify refresh JWT
3. find hashed token row
4. ensure not revoked or expired
5. revoke old row
6. create new refresh token row
7. issue fresh access token
8. set new cookie

#### [`src/app/api/auth/me/route.ts`](/c:/Users/Asus/my-app/src/app/api/auth/me/route.ts)

Purpose:

- return the current authenticated user

#### [`src/app/api/auth/logout/route.ts`](/c:/Users/Asus/my-app/src/app/api/auth/logout/route.ts)

Purpose:

- revoke current refresh token and clear cookie

#### [`src/app/api/auth/forgot-password/route.ts`](/c:/Users/Asus/my-app/src/app/api/auth/forgot-password/route.ts)

Purpose:

- create password reset token and send reset email

Important behavior:

- always returns success-style messaging even if user does not exist
- this is good from a security perspective because it avoids confirming which emails are registered

#### [`src/app/api/auth/reset-password/route.ts`](/c:/Users/Asus/my-app/src/app/api/auth/reset-password/route.ts)

Purpose:

- validate reset token and save a new password

Important behavior:

- marks token as used
- revokes all refresh tokens for that user

### User routes

#### [`src/app/api/users/route.ts`](/c:/Users/Asus/my-app/src/app/api/users/route.ts)

Purpose:

- admin user management list/create/update/delete entry

Handlers:

- `GET`
  - paginated user listing for admins

- `POST`
  - create user and optional brand memberships

- `PATCH`
  - update user name/role and reset brand memberships

- `DELETE`
  - delete user by query-string id
  - prevents self-delete

#### [`src/app/api/users/[id]/route.ts`](/c:/Users/Asus/my-app/src/app/api/users/[id]/route.ts)

Purpose:

- alternative per-user read/update/delete route

Important note:

- This duplicates some capability from `/api/users?id=...`
- The project currently has both patterns in the codebase

#### [`src/app/api/users/me/route.ts`](/c:/Users/Asus/my-app/src/app/api/users/me/route.ts)

Purpose:

- current user profile read/update

Important behavior:

- checks email uniqueness before updating email

#### [`src/app/api/users/me/password/route.ts`](/c:/Users/Asus/my-app/src/app/api/users/me/password/route.ts)

Purpose:

- change current user password

Main steps:

1. validate body
2. load current user hash
3. compare current password
4. hash new password
5. save new hash

### Brand routes

#### [`src/app/api/brands/route.ts`](/c:/Users/Asus/my-app/src/app/api/brands/route.ts)

Purpose:

- list brands user can access
- create new brand for admins

Important behavior:

- admins see all brands
- marketers only see brands connected through `BrandMember`
- creating a brand also:
  - adds the admin as a member
  - creates a default `Accuracy` row

#### [`src/app/api/brands/[id]/members/route.ts`](/c:/Users/Asus/my-app/src/app/api/brands/[id]/members/route.ts)

Purpose:

- list members of a brand

Important behavior:

- marketers can only call it for brands they belong to

### Upload routes

#### [`src/app/api/uploads/route.ts`](/c:/Users/Asus/my-app/src/app/api/uploads/route.ts)

Purpose:

- `POST`: upload CSV and build upload metadata
- `GET`: list uploads

Important `POST` details:

- validates file, brand, and platform
- parses CSV using `csv-parse`
- detects likely platform
- infers column types
- stores raw CSV in `Upload.rawCsv`
- stores discovered columns in `UploadColumn`
- stores suggested mappings in `ColumnMapping`

Important `GET` details:

- supports filters like brand/platform/status/page/pageSize
- marketers only see their own uploads

#### [`src/app/api/uploads/[id]/route.ts`](/c:/Users/Asus/my-app/src/app/api/uploads/[id]/route.ts)

Purpose:

- get one upload
- save mappings
- delete upload

Important `GET` details:

- returns columns plus mapping progress summary

Important `PATCH` details:

- upserts mappings
- marks upload as `MAPPED`

#### [`src/app/api/uploads/[id]/mapping/route.ts`](/c:/Users/Asus/my-app/src/app/api/uploads/[id]/mapping/route.ts)

Purpose:

- alternate mapping save endpoint

Important note:

- The frontend tries `/api/uploads/[id]` first, then falls back to this route.
- This suggests the codebase was adapted to support two possible backend styles.

#### [`src/app/api/uploads/[id]/ingest/route.ts`](/c:/Users/Asus/my-app/src/app/api/uploads/[id]/ingest/route.ts)

Purpose:

- convert mapped CSV rows into analytics facts

Main steps:

1. authenticate and authorize access to upload
2. reject invalid upload states
3. parse `rawCsv`
4. convert source columns to mapped target keys
5. infer date, entity type, and entity id
6. build `metrics` and `dimensions` objects
7. insert rows into `PerformanceFact`
8. mark upload `IMPORTED`
9. run threshold alert check
10. run anomaly detection

This is one of the most important backend files in the whole repo.

### Analytics routes

#### [`src/app/api/analytics/kpis/route.ts`](/c:/Users/Asus/my-app/src/app/api/analytics/kpis/route.ts)

Purpose:

- return main KPI summary for dashboard

Returns:

- totals
- platform breakdown
- spend over time
- top campaigns

Important implementation detail:

- uses raw SQL against `PerformanceFact`

#### [`src/app/api/analytics/trends/route.ts`](/c:/Users/Asus/my-app/src/app/api/analytics/trends/route.ts)

Purpose:

- return trend series for charts

Returns:

- overall metric series
- platform-split per-day data
- previous-period overlay data
- comparison summary

Important implementation detail:

- does a manual “pivot” step in JavaScript after querying SQL rows

#### [`src/app/api/analytics/bi-summary/route.ts`](/c:/Users/Asus/my-app/src/app/api/analytics/bi-summary/route.ts)

Purpose:

- return dashboard BI widgets in one payload

Returns:

- funnel
- platform donut
- campaign donut
- geo summary
- conversion trend

Important implementation detail:

- follows an ETL-style pattern:
  - extract
  - transform
  - load into response JSON

#### [`src/app/api/analytics/alert-trends/route.ts`](/c:/Users/Asus/my-app/src/app/api/analytics/alert-trends/route.ts)

Purpose:

- return alert counts per day and summary stats

#### [`src/app/api/analytics/global-status/route.ts`](/c:/Users/Asus/my-app/src/app/api/analytics/global-status/route.ts)

Purpose:

- admin-only alert status matrix by brand/status/severity

Used by:

- global status widget on dashboard

#### [`src/app/api/analytics/python-anomalies/route.ts`](/c:/Users/Asus/my-app/src/app/api/analytics/python-anomalies/route.ts)

Purpose:

- send one metric series to Python and get anomaly output back

This looks like a focused utility route, separate from the main anomaly pipeline.

### Alerts and anomalies routes

#### [`src/app/api/alerts/route.ts`](/c:/Users/Asus/my-app/src/app/api/alerts/route.ts)

Purpose:

- list accessible alerts, optionally filtered by brand and status

Important behavior:

- admins get all brands
- marketers only get their accessible brands

#### [`src/app/api/alerts/[id]/route.ts`](/c:/Users/Asus/my-app/src/app/api/alerts/[id]/route.ts)

Purpose:

- update one alert status

#### [`src/app/api/alerts/rules/route.ts`](/c:/Users/Asus/my-app/src/app/api/alerts/rules/route.ts)

Purpose:

- list and create alert rules

Important note:

- there is no backend `PATCH`/`DELETE` here yet, even though the guardrails page suggests richer rule management UI

#### [`src/app/api/alerts/check/route.ts`](/c:/Users/Asus/my-app/src/app/api/alerts/check/route.ts)

Purpose:

- manually evaluate active rules for a brand against recent facts

Important side effects:

- may create `Alert`
- may send alert email
- may create `Notification` and `NotificationRecipient`

#### [`src/app/api/anomalies/route.ts`](/c:/Users/Asus/my-app/src/app/api/anomalies/route.ts)

Purpose:

- generate anomaly review data from recent facts

Important behavior:

- tries Python first
- falls back to JS if Python fails
- may send HIGH anomaly emails
- returns anomaly list with summary counts and engine name

### Detection, metrics, datasets, leads, admin

#### [`src/app/api/detection/accuracy/route.ts`](/c:/Users/Asus/my-app/src/app/api/detection/accuracy/route.ts)

Purpose:

- read/write per-brand detection tuning

#### [`src/app/api/metrics/overview/route.ts`](/c:/Users/Asus/my-app/src/app/api/metrics/overview/route.ts)

Purpose:

- older summary endpoint for daily spend and totals

Important note:

- This route uses a slightly different auth helper style than many newer routes.

#### [`src/app/api/datasets/bulk/route.ts`](/c:/Users/Asus/my-app/src/app/api/datasets/bulk/route.ts)

Purpose:

- bulk insert facts from already-normalized rows

This looks like a utility route rather than the main upload flow.

#### [`src/app/api/leads/route.ts`](/c:/Users/Asus/my-app/src/app/api/leads/route.ts)

Purpose:

- lead listing and creation

Important note:

- I did not find a matching visible leads dashboard page in the current route list, so this backend may be unused or intended for future use.

#### [`src/app/api/leads/[id]/route.ts`](/c:/Users/Asus/my-app/src/app/api/leads/[id]/route.ts)

Purpose:

- update/delete one lead

#### [`src/app/api/admin/ping/route.ts`](/c:/Users/Asus/my-app/src/app/api/admin/ping/route.ts)

Purpose:

- simple admin-only test endpoint
