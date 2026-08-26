create table public.token_denylist (
  jti uuid not null,
  user_id uuid not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone null default now(),
  constraint token_denylist_pkey primary key (jti),
  constraint token_denylist_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index token_denylist_expires_at_idx on public.token_denylist (expires_at);