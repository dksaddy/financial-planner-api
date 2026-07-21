create table public.targets (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  name character varying(100) not null,
  target_amount numeric(10, 2) not null,
  status character varying(20) null default 'pending'::character varying,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint targets_pkey primary key (id),
  constraint targets_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint targets_status_check check (
    (
      (status)::text = any (
        (
          array[
            'pending'::character varying,
            'completed'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;