-- One expense record per user per day.
--
-- daily_extra_savings has carried unique (user_id, date) since 007; this makes
-- expense_records agree with it, so the derived row and its source day are
-- one-to-one.
--
-- This fails if any user already has two records on the same date. Find them
-- first with:
--
--   SELECT user_id, date, count(*)
--   FROM expense_records
--   GROUP BY user_id, date
--   HAVING count(*) > 1;
--
-- There is no down migration in this project — dropping the constraint again
-- is a manual ALTER TABLE.
alter table public.expense_records
  add constraint expense_records_user_id_date_key unique (user_id, date);
