-- Saving plan statuses become active → completed → withdrawn.
--
-- "cancelled" is retired. No row is expected to carry it, but any that does is
-- put back to active rather than guessed at as completed, so no plan can reach
-- withdrawn without passing through completed first.
--
-- There is no down migration in this project — restoring "cancelled" is a
-- manual ALTER TABLE.
update public.saving_plans
  set status = 'active'
  where status = 'cancelled' or status is null;

alter table public.saving_plans
  drop constraint saving_plans_status_check;

alter table public.saving_plans
  alter column status set not null;

alter table public.saving_plans
  add constraint saving_plans_status_check check (
    status in ('active', 'completed', 'withdrawn')
  );
