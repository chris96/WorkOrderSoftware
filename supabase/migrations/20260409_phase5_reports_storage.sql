alter table public.reports
add column if not exists generated_at timestamptz;

update public.reports
set generated_at = coalesce(generated_at, created_at)
where generated_at is null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'repair-reports',
  'repair-reports',
  false,
  15728640,
  array['application/pdf']
)
on conflict (id) do nothing;
