-- The tax taken from a saving plan's profit, as a percent (15.00 is 15%).
-- Until now the web applied a fixed 15% to every plan; the default keeps every
-- existing plan on exactly that.
--
-- The bounds and the default match src/constants/limits.js.
alter table public.saving_plans
  add column tax_rate numeric(5, 2) not null default 15;

alter table public.saving_plans
  add constraint saving_plans_tax_rate_check check (
    tax_rate between 0 and 100
  );
