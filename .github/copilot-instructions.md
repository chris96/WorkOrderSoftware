# Workspace Instructions for Work Order Software

## Purpose
This repo is a Vercel-first Next.js App Router application for building a tenant maintenance request workflow with staff management and Supabase integration.

Use these instructions to guide AI assistance for feature work, bug fixes, refactors, and implementation of tenant/staff flows.

## Key commands
- `npm install`
- `npm run dev` — start the Next.js development server
- `npm run build` — verify production build
- `npm run start` — run the built app
- `npm run lint` — run ESLint checks

## Project architecture
- `src/app/` contains the Next.js App Router pages and layout.
- `src/app/api/` contains route handlers (`route.ts`) for the backend API.
- `src/lib/` contains shared helpers for Supabase, authentication, environment config, and work order business logic.
- `src/validation/` contains Zod schemas for form request validation.
- `supabase/migrations/` contains Postgres schema migrations.

## Important conventions
- This repo uses Next.js 16 App Router with TypeScript and Tailwind-compatible styles.
- API and server-side behavior are implemented in `src/app/api/*/route.ts` files.
- Staff interfaces live under `src/app/staff/`.
- Tenant intake lives under `src/app/submit-request/`.
- Closeout and notes are implemented in nested staff routes under `src/app/staff/work-orders/[id]/`.
- Authentication/bootstrap flows are handled in `src/app/staff/bootstrap/` and `src/lib/staff-auth.ts`.
- Validation is centralized in `src/validation/`, and schema changes should align with form behavior and route handlers.
- Keep tenant-facing state and content separate from staff-only internal notes and admin pages.

## Data flow and domain model
- Work orders are the central domain entity.
- Incoming tenant requests are created through `src/app/api/work-orders/intake/route.ts`.
- Staff actions, closeout, and notes are handled through server routes under `src/app/api/staff/work-orders/` and UI pages under `src/app/staff/work-orders/[id]/`.
- Supabase is used in both browser and server contexts via `src/lib/supabase/browser.ts` and `src/lib/supabase/server.ts`.

## When to ask for help from the agent
- Add or extend a tenant request form field.
- Create or update an API route for work order intake, closeout, or notes.
- Fix broken type checks or runtime errors in the staff or tenant UI.
- Implement validation consistent with existing Zod schemas.
- Add support for a new environment-backed feature such as email, SMS, or emergency request handling.
- Refactor code while preserving the clear separation between staff and tenant flows.

## Helpful details for task planning
- The repo is built for a small building workflow, with tenant intake, staff review, and closeout/reporting as core flows.
- The current app structure is intentionally simple: most logic should stay in `src/lib/` or route handlers and not be duplicated across UI components.
- New features should preserve the existing phase-based product direction in `PHASE1.md` through `PHASE5.md`.

## Example prompts
- "Add a new optional `phone` field to the tenant request form and validate it in the intake route."
- "Fix the staff closeout flow so a successful submission redirects to a success page instead of leaving the form filled."
- "Review `src/app/api/work-orders/intake/route.ts` and make sure the request payload schema matches the tenant form fields."
- "Add a new `emergency` indicator to the work order detail page and ensure it is stored in the database schema."
