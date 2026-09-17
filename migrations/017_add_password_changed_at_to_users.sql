-- When the password last changed. A token issued before it is refused by
-- auth.middleware.js, so changing the password ends every other session. Null
-- for a user who has never changed it, which refuses nothing.
--
-- IF NOT EXISTS for the same reason as 016: a database that ran the combined
-- migration already has the column.
alter table public.users
  add column if not exists password_changed_at timestamp with time zone null;
