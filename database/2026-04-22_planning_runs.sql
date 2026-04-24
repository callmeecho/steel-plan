create table if not exists public.planning_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (
    status in (
      'draft',
      'waiting',
      'executing',
      'processing',
      'standby',
      'completed',
      'failed',
      'cancelled'
    )
  ),
  mode text not null check (mode in ('balanced', 'delivery-first', 'grade-batch')),
  preference_enabled boolean not null default false,
  test_mode_enabled boolean not null default false,
  short_enabled boolean not null default false,
  cross_group_enabled boolean not null default false,
  selected_order_count integer not null default 0,
  total_weight_tons numeric(12, 2) not null default 0,
  unique_grade_count integer not null default 0,
  nearest_delivery_date date,
  last_transition_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.planning_run_orders (
  id uuid primary key default gen_random_uuid(),
  planning_run_id uuid not null references public.planning_runs(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (planning_run_id, order_id)
);

create index if not exists planning_runs_user_created_idx
  on public.planning_runs (user_id, created_at desc);

create index if not exists planning_run_orders_run_idx
  on public.planning_run_orders (planning_run_id);

alter table public.planning_runs enable row level security;
alter table public.planning_run_orders enable row level security;

drop policy if exists "planning_runs_select_own" on public.planning_runs;
create policy "planning_runs_select_own"
on public.planning_runs
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "planning_runs_insert_own" on public.planning_runs;
create policy "planning_runs_insert_own"
on public.planning_runs
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "planning_runs_update_own" on public.planning_runs;
create policy "planning_runs_update_own"
on public.planning_runs
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "planning_run_orders_select_via_run" on public.planning_run_orders;
create policy "planning_run_orders_select_via_run"
on public.planning_run_orders
for select
to authenticated
using (
  exists (
    select 1
    from public.planning_runs runs
    where runs.id = planning_run_orders.planning_run_id
      and runs.user_id = auth.uid()
  )
);

drop policy if exists "planning_run_orders_insert_via_run" on public.planning_run_orders;
create policy "planning_run_orders_insert_via_run"
on public.planning_run_orders
for insert
to authenticated
with check (
  exists (
    select 1
    from public.planning_runs runs
    where runs.id = planning_run_orders.planning_run_id
      and runs.user_id = auth.uid()
  )
);

drop trigger if exists set_planning_runs_updated_at on public.planning_runs;
create trigger set_planning_runs_updated_at
before update on public.planning_runs
for each row
execute function public.handle_updated_at();
