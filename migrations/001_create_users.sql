create table public.users (
  id uuid not null default gen_random_uuid (),
  name character varying(100) not null,
  email character varying(255) not null,
  password text not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  salary numeric(10, 2) null default 0,
  avatar_url text null,
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email)
) TABLESPACE pg_default;