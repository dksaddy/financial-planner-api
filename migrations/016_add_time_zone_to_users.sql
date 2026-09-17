-- The IANA zone a user's "today" and "this week" are read in, for the
-- dashboard's week queries and the future-date check on expense records. UTC
-- until the web reports the browser's zone; validated against Intl in
-- validations/fields.js and against pg_timezone_names in the services, since
-- Postgres has no check constraint that names a real zone.
alter table public.users
  add column time_zone character varying(64) not null default 'UTC';
