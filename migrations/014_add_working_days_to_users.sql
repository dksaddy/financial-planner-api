-- How many days a user spreads their spending over, per month and per week.
-- calculateBudget divided by a fixed 26 and multiplied by a fixed 6 until now;
-- the defaults keep every existing user on exactly those figures.
--
-- Stored daily budgets in daily_extra_savings are not recalculated: like a
-- salary change, new figures apply from the next expense record written.
--
-- The bounds match src/constants/limits.js.
alter table public.users
  add column working_days_per_month integer not null default 26,
  add column working_days_per_week integer not null default 6;

alter table public.users
  add constraint users_working_days_per_month_check check (
    working_days_per_month between 1 and 31
  ),
  add constraint users_working_days_per_week_check check (
    working_days_per_week between 1 and 7
  ),
  add constraint users_working_days_week_within_month_check check (
    working_days_per_week <= working_days_per_month
  );
