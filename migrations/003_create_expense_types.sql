create table public.expense_types (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  name character varying(100) not null,
  categories jsonb not null,
  total numeric(10, 2) not null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint expense_types_pkey primary key (id),
  constraint expense_types_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;