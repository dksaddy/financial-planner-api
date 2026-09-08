-- Every listing is "this user's records, newest first", now read a page at
-- a time. This index serves the WHERE, the ORDER BY and the COUNT without
-- a sort, and matches the pagination tiebreaker column order.
create index if not exists expense_records_user_id_date_idx
  on public.expense_records (user_id, date desc, created_at desc, id desc);
