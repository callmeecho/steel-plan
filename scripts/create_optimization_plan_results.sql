-- 真实优化结果落库表（V2）
-- 执行位置：Supabase SQL Editor

create table if not exists public.optimization_plan_results (
  task_id text primary key,
  status text not null default 'completed',
  message text null,
  source_dir text null,
  generated_at timestamptz null,
  snapshot jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_optimization_plan_results_status
  on public.optimization_plan_results(status);

create index if not exists idx_optimization_plan_results_updated_at
  on public.optimization_plan_results(updated_at desc);

create or replace function public.set_optimization_plan_results_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_optimization_plan_results_updated_at on public.optimization_plan_results;
create trigger trg_optimization_plan_results_updated_at
before update on public.optimization_plan_results
for each row execute function public.set_optimization_plan_results_updated_at();

alter table public.optimization_plan_results enable row level security;

drop policy if exists "optimization_plan_results_select_authenticated" on public.optimization_plan_results;
create policy "optimization_plan_results_select_authenticated"
  on public.optimization_plan_results
  for select
  to authenticated
  using (true);

drop policy if exists "optimization_plan_results_write_admin_only" on public.optimization_plan_results;
create policy "optimization_plan_results_write_admin_only"
  on public.optimization_plan_results
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );
