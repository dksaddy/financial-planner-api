create table public.expense_records (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  expense_type_id uuid not null,
  date date not null,
  total numeric(10, 2) not null,
  created_at timestamp with time zone null default now(),
  constraint expense_records_pkey primary key (id),
  constraint expense_records_expense_type_id_fkey foreign KEY (expense_type_id) references expense_types (id) on delete CASCADE,
  constraint expense_records_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;