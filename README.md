# VisioAd

VisioAd is a full-stack ad performance monitoring platform built with Next.js, Prisma, and PostgreSQL.

It helps a marketing team or agency:
- manage brands and users
- upload CSV exports from ad platforms
- map raw columns into a normalized analytics model
- ingest performance data into the database
- view KPI dashboards and trend charts
- detect anomalies and threshold breaches
- send alert and password-reset emails

## What the app does

VisioAd is centered around ad-performance visibility for multiple brands.

The main workflow is:
1. A user signs in.
2. The user selects a brand they can access.
3. CSV performance data is uploaded for Google Ads, Meta Ads, or generic CSV imports.
4. The app stores the upload, infers columns, and suggests mappings.
5. The mapped data is ingested into a flexible `PerformanceFact` table.
6. Dashboard and analytics endpoints aggregate that data into KPIs, trends, alerts, and anomalies.

## Core product areas

- Authentication and session management
- Brand and user management
- CSV upload and mapping workflow
- KPI analytics and dashboard charts
- Alert rules and alert inbox
- Statistical anomaly detection
- Lead management
- Password reset and email notifications

## Tech stack

- Next.js App Router
- React 19
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT authentication
- Zod validation
- Ant Design
- Recharts
- Nodemailer
- Python script for anomaly scoring

## Architecture overview

This is a monolithic full-stack Next.js app.

- Frontend pages live in `src/app`
- Backend API route handlers live in `src/app/api`
- Shared server/client utilities live in `src/lib`
- Auth/session state lives in `src/context`
- Database schema and migrations live in `prisma`

### Main flow

- Client components call internal routes like `/api/auth/login`, `/api/brands`, `/api/uploads`, `/api/analytics/kpis`
- Protected API routes use Bearer access tokens
- Refresh tokens are stored in an HTTP-only cookie
- Prisma talks to PostgreSQL
- Analytics are generated from the `PerformanceFact` table plus alert/anomaly tables

## Roles

The app currently uses two roles:

- `MARKETER`
- `AGENCY_ADMIN`

General behavior:
- `AGENCY_ADMIN` can see all brands and admin-facing areas
- `MARKETER` can only access brands they are assigned to through `BrandMember`

## Authentication model

VisioAd uses a two-token session model:

- Access token: short-lived JWT returned in the login response
- Refresh token: long-lived JWT stored in an HTTP-only cookie and hashed in the database

Important auth behavior:
- `POST /api/auth/login` verifies credentials, returns an access token, and sets the refresh cookie
- `POST /api/auth/refresh` rotates the refresh token and returns a fresh access token
- `src/lib/apiFetch.ts` retries once after a `401` by calling the refresh route
- `src/lib/auth-guard.ts` protects API routes with `requireAuth()` and `requireAdmin()`

## Data model summary

Important Prisma models:

- `User`: application users with email, password hash, and role
- `Brand`: brands/workspaces inside the system
- `BrandMember`: join table connecting users to brands
- `Upload`: uploaded CSV files and their processing status
- `UploadColumn`: discovered columns from an upload
- `ColumnMapping`: source-to-target mapping for ingestion
- `PerformanceFact`: normalized analytics records with flexible JSON metrics/dimensions
- `AlertRule`: threshold rules per brand
- `Alert`: threshold-triggered alerts
- `Anomaly`: anomaly detection results
- `Notification` and `NotificationRecipient`: stored notifications and recipients
- `RefreshToken`: hashed refresh tokens
- `PasswordResetToken`: password reset flow
- `Lead`: CRM-style lead records
- `Accuracy`: per-brand detection tuning values

## Folder structure

```text
.
|-- prisma/
|   |-- schema.prisma
|   `-- migrations/
|-- public/
|-- scripts/
|   |-- anomaly_detection.py
|   `-- create-admin.mjs
|-- src/
|   |-- app/
|   |   |-- (auth)/
|   |   |-- (dashboard)/
|   |   |-- api/
|   |   |-- landing/
|   |   |-- globals.css
|   |   |-- layout.tsx
|   |   `-- page.tsx
|   |-- components/
|   |-- context/
|   `-- lib/
|-- tests/
|   `-- integration.test.mjs
|-- package.json
|-- next.config.ts
|-- prisma.config.ts
`-- tsconfig.json
```

### Important folders

- `src/app/(auth)`: login, register, forgot-password, reset-password pages
- `src/app/(dashboard)`: authenticated dashboard pages such as uploads, alerts, anomalies, brands, users, settings, and detection
- `src/app/api`: backend endpoints for auth, users, brands, uploads, analytics, alerts, leads, datasets, metrics, and admin utilities
- `src/lib`: Prisma client, auth helpers, cookie helpers, mailers, and fetch wrappers
- `scripts/anomaly_detection.py`: Python-based anomaly detection engine using Z-score + IQR

## Key workflows

### 1. Sign in

- User submits email and password on the login page
- `/api/auth/login` verifies the user with `bcryptjs`
- The response returns:
  - an access token
  - basic user info
- A refresh token is set as a secure HTTP-only cookie

### 2. Upload CSV data

- Frontend sends a multipart request to `POST /api/uploads`
- The API:
  - validates the file and brand
  - parses the CSV
  - detects likely platform columns
  - infers basic column types
  - saves the raw CSV in the `Upload` row
  - stores discovered columns in `UploadColumn`
  - stores suggested mappings in `ColumnMapping`

### 3. Ingest mapped upload

- Frontend calls `POST /api/uploads/[id]/ingest`
- The API:
  - loads the upload and mappings
  - validates the upload state
  - parses the stored raw CSV
  - remaps source columns into normalized keys
  - builds metric and dimension JSON objects
  - inserts rows into `PerformanceFact`
  - marks the upload as `IMPORTED`
  - runs threshold alert checks

### 4. View dashboard analytics

- Dashboard pages call analytics endpoints such as:
  - `/api/analytics/kpis`
  - `/api/alerts`
  - `/api/analytics/global-status`
  - `/api/analytics/trends`
- These endpoints aggregate `PerformanceFact`, `Alert`, `Brand`, and related records into chart-friendly JSON

### 5. Alerts and anomaly monitoring

- Threshold rules live in `AlertRule`
- Alert checks run after successful CSV ingestion
- Alerts are stored in `Alert`
- Email notifications can be sent through `src/lib/notification-mailer.ts`
- The anomaly detection engine is implemented in `scripts/anomaly_detection.py`

## Environment variables

Create a `.env` file with the values required by your environment.

### Database

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB_NAME"
```

### JWT and session

```env
JWT_ACCESS_SECRET="replace-with-a-long-random-secret"
JWT_REFRESH_SECRET="replace-with-a-different-long-random-secret"
ACCESS_TOKEN_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"
REFRESH_COOKIE_NAME="refresh_token"
COOKIE_SECURE="false"
```

### App URL

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Email

```env
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
```

Notes:
- The mailers currently use Gmail via Nodemailer.
- In production, set `COOKIE_SECURE="true"` behind HTTPS.

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Add the variables shown above to your `.env`.

### 3. Run database migrations

```bash
npx prisma migrate dev
```

If you just want the Prisma client refreshed:

```bash
npx prisma generate
```

### 4. Start the development server

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Useful scripts

From `package.json`:

```bash
npm run dev
npm run build
npm run start
npm run lint
```

Project scripts:

- `scripts/create-admin.mjs`: helper script that hits the register route
- `scripts/anomaly_detection.py`: anomaly scoring helper
- `tests/integration.test.mjs`: lightweight end-to-end style integration checks

## Running the integration test

Start the app first:

```bash
npm run dev
```

In another terminal:

```bash
node tests/integration.test.mjs
```

Note:
- The integration script expects test users and data to already exist in your local environment.

## Main pages

Public pages:
- `/landing`
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`

Dashboard pages:
- `/dashboard`
- `/uploads`
- `/uploads/new`
- `/uploads/[id]/mapping`
- `/alerts`
- `/anomalies`
- `/brands`
- `/brands/[id]`
- `/users`
- `/settings`
- `/detection`
- `/guardrails`

## Main API areas

- `/api/auth/*`: login, logout, register, refresh, me, forgot-password, reset-password
- `/api/users/*`: current-user profile and admin user management
- `/api/brands/*`: brand listing, creation, and membership management
- `/api/uploads/*`: CSV upload, mapping, ingestion, and upload inspection
- `/api/analytics/*`: KPIs, trends, BI summary, global status, anomaly-related analytics
- `/api/alerts/*`: alert listing, rule management, alert status checks
- `/api/leads/*`: lead CRUD
- `/api/metrics/*`: metrics overview
- `/api/detection/*`: detection accuracy data
- `/api/datasets/*`: bulk dataset utilities

## Current implementation notes

These are worth knowing if you continue developing the app:

- The root `README.md` was originally the default Next.js template and has now been replaced with app-specific documentation.
- Some UI pages are large client-side files that mix rendering, fetching, and state management.
- Access tokens are client-managed, so frontend auth state depends on browser storage and refresh behavior.
- The registration route currently creates `MARKETER` users only, even if another role is submitted.
- The `create-admin.mjs` script posts `AGENCY_ADMIN`, but the register route currently forces `MARKETER`, so that script is misleading unless the route is changed.
- Some files contain encoding artifacts in comments or strings, which is worth cleaning up later.

## Recommended files to read first

If you want to understand the system quickly, start here:

- `prisma/schema.prisma`
- `src/lib/prisma.ts`
- `src/lib/auth.ts`
- `src/lib/auth-guard.ts`
- `src/lib/apiFetch.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/refresh/route.ts`
- `src/app/api/uploads/route.ts`
- `src/app/api/uploads/[id]/ingest/route.ts`
- `src/app/api/analytics/kpis/route.ts`
- `src/app/(dashboard)/layout.tsx`
- `src/app/(dashboard)/dashboard/page.tsx`

## License

This repository currently does not declare a license file.
