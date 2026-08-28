alter table public.saving_plans
  add column currently_deposited numeric(10, 2) not null default 0;