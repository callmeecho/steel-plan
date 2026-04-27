-- 订单导入池（用于“订单查询 -> 一键导入订单 -> 方案生成”）
-- 执行位置：Supabase SQL Editor

create table if not exists public.imported_order_selections (
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, order_id)
);

create index if not exists idx_imported_order_selections_user_id
  on public.imported_order_selections(user_id);

alter table public.imported_order_selections enable row level security;

drop policy if exists "imported_order_selections_select_own" on public.imported_order_selections;
create policy "imported_order_selections_select_own"
  on public.imported_order_selections
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "imported_order_selections_insert_own" on public.imported_order_selections;
create policy "imported_order_selections_insert_own"
  on public.imported_order_selections
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "imported_order_selections_delete_own" on public.imported_order_selections;
create policy "imported_order_selections_delete_own"
  on public.imported_order_selections
  for delete
  to authenticated
  using (auth.uid() = user_id);
