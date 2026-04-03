create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('super', 'backup', 'tenant');
  end if;

  if not exists (select 1 from pg_type where typname = 'work_order_status') then
    create type public.work_order_status as enum ('new', 'in_progress', 'waiting_on_parts', 'closed');
  end if;

  if not exists (select 1 from pg_type where typname = 'photo_type') then
    create type public.photo_type as enum ('intake', 'closeout');
  end if;

  if not exists (select 1 from pg_type where typname = 'work_order_event_type') then
    create type public.work_order_event_type as enum ('submitted', 'escalated', 'status_changed', 'note_added', 'closed');
  end if;

  if not exists (select 1 from pg_type where typname = 'report_delivery_status') then
    create type public.report_delivery_status as enum ('pending', 'sent', 'failed');
  end if;
end
$$;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  role public.user_role not null default 'tenant',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  unit_number text not null unique,
  floor_label text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.work_orders (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid references public.units(id) on delete restrict,
  created_by_user_id uuid references public.users(id) on delete set null,
  assigned_user_id uuid references public.users(id) on delete set null,
  tenant_name text not null,
  tenant_email text not null,
  tenant_phone text,
  category text not null,
  description text not null,
  status public.work_order_status not null default 'new',
  is_emergency boolean not null default false,
  submitted_at timestamptz not null default timezone('utc', now()),
  closed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.work_order_photos (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  uploaded_by_user_id uuid references public.users(id) on delete set null,
  photo_type public.photo_type not null,
  storage_bucket text not null default 'work-order-photos',
  storage_path text not null unique,
  content_type text,
  file_size_bytes bigint,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.work_order_events (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  actor_user_id uuid references public.users(id) on delete set null,
  event_type public.work_order_event_type not null,
  from_status public.work_order_status,
  to_status public.work_order_status,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null unique references public.work_orders(id) on delete cascade,
  storage_bucket text not null default 'work-order-photos',
  storage_path text not null unique,
  delivery_status public.report_delivery_status not null default 'pending',
  delivered_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists work_orders_status_idx on public.work_orders(status);
create index if not exists work_orders_unit_id_idx on public.work_orders(unit_id);
create index if not exists work_orders_is_emergency_idx on public.work_orders(is_emergency);
create index if not exists work_order_photos_work_order_id_idx on public.work_order_photos(work_order_id);
create index if not exists work_order_events_work_order_id_idx on public.work_order_events(work_order_id);

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

drop trigger if exists set_units_updated_at on public.units;
create trigger set_units_updated_at
before update on public.units
for each row
execute function public.set_updated_at();

drop trigger if exists set_work_orders_updated_at on public.work_orders;
create trigger set_work_orders_updated_at
before update on public.work_orders
for each row
execute function public.set_updated_at();

drop trigger if exists set_reports_updated_at on public.reports;
create trigger set_reports_updated_at
before update on public.reports
for each row
execute function public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'work-order-photos',
  'work-order-photos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;
