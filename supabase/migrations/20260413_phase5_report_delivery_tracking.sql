alter table public.reports
add column if not exists email_message_id text,
add column if not exists last_error text;
