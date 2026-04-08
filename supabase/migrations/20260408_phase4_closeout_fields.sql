alter table public.work_orders
add column if not exists closed_by_user_id uuid references public.users(id) on delete set null,
add column if not exists repair_summary text,
add column if not exists materials_used text,
add column if not exists closeout_internal_notes text;

create index if not exists work_orders_closed_by_user_id_idx
  on public.work_orders(closed_by_user_id);
