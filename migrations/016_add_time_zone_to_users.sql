-- The IANA zone a user's "today" and "this week" are read in, for the
-- dashboard's week queries and the future-date check on expense records. UTC
-- until the web reports the browser's zone; validated against Intl in
-- validations/fields.js and against pg_timezone_names in the services, since
-- Postgres has no check constraint that names a real zone.
--
-- IF NOT EXISTS: before this and 017 were split apart, a combined
-- 016_add_password_changed_at_and_time_zone_to_users.sql was applied to some
-- databases. Those already have the column, and must record this file without
-- failing on it.
alter table public.users
  add column if not exists time_zone character varying(64) not null default 'UTC';
