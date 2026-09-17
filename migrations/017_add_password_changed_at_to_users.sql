-- When the password last changed. A token issued before it is refused by
-- auth.middleware.js, so changing the password ends every other session. Null
-- for a user who has never changed it, which refuses nothing.
alter table public.users
  add column password_changed_at timestamp with time zone null;
