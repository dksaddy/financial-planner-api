alter table public.expense_types
  add column if not exists is_active boolean not null default true;
