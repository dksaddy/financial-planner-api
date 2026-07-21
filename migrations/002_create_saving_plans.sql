create table public.saving_plans (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  name character varying(100) not null,
  amount numeric(10, 2) not null,
  frequency integer not null,
  months integer not null,
  deposit_amount numeric(10, 2) not null,
  deposit_frequency integer not null,
  withdrawal_amount numeric(10, 2) not null,
  status character varying(20) null default 'active'::character varying,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint saving_plans_pkey primary key (id),
  constraint saving_plans_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint saving_plans_status_check check (
    (
      (status)::text = any (
        (
          array[
            'active'::character varying,
            'completed'::character varying,
            'cancelled'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;