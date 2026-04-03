# Supabase Setup

## 1. Create the project
- Create one Supabase project in a U.S. East region.
- Copy the project URL, anon key, service role key, and pooled Postgres connection string.

## 2. Local environment
- Copy `.env.example` to `.env.local`.
- Fill in all four values before testing the Supabase health route.

## 3. Initial schema
- Open the Supabase SQL Editor.
- Run `supabase/migrations/20260403_initial_schema.sql`.
- This creates the core tables and a private `work-order-photos` bucket.

## 4. Storage conventions
- Use the `work-order-photos` bucket for all uploads.
- Store intake photos under `intake/`.
- Store closeout photos under `closeout/`.

## 5. Vercel variables
- Add the same environment variables from `.env.local` into the Vercel project settings.
- Redeploy after the variables are saved.

## 6. Connectivity check
- Start the app locally and open `/api/health/supabase`.
- A successful response confirms the app can reach Supabase and query the `units` table.
