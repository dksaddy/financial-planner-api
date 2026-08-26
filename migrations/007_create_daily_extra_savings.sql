create table public.daily_extra_savings (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  date date not null,
  budget_amount numeric(10, 2) not null default 0,
  spent_amount numeric(10, 2) not null default 0,
  extra_amount numeric(10, 2) not null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint daily_extra_savings_pkey primary key (id),
  constraint daily_extra_savings_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint daily_extra_savings_user_id_date_key unique (user_id, date)
) TABLESPACE pg_default;

create index daily_extra_savings_user_id_date_idx on public.daily_extra_savings (user_id, date);