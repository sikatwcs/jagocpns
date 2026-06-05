set statement_timeout = '10min';

insert into public.wallet_balances (
  profile_id,
  legacy_user_id,
  legacy_balance_id,
  amount,
  created_at,
  updated_at
)
select p.id, b."userId", b.id, b.amount::numeric, b."createdAt", b."updatedAt"
from public."Balance" b
join public.profiles p on p.legacy_user_id = b."userId"
on conflict (legacy_balance_id) where legacy_balance_id is not null do update set
  amount = excluded.amount,
  updated_at = excluded.updated_at;

insert into public.transactions (
  profile_id,
  legacy_user_id,
  legacy_transaction_id,
  invoice_number,
  kind,
  amount,
  payment_status,
  payment_method,
  payment_proof_url,
  created_at,
  updated_at
)
select
  p.id,
  t."userId",
  t.id,
  'TOPUP-' || t.id::text,
  'topup'::public.payment_kind,
  t.amount::numeric,
  t.status::text::public.payment_status,
  'qris'::public.payment_method,
  t."imageUrl",
  t."createdAt",
  t."updatedAt"
from public."Transaction" t
join public.profiles p on p.legacy_user_id = t."userId"
on conflict (legacy_transaction_id) where legacy_transaction_id is not null do update set
  amount = excluded.amount,
  payment_status = excluded.payment_status,
  payment_proof_url = excluded.payment_proof_url,
  updated_at = excluded.updated_at;

insert into public.transactions (
  profile_id,
  legacy_user_id,
  legacy_payment_id,
  tryout_list_id,
  legacy_tryout_list_id,
  invoice_number,
  kind,
  amount,
  payment_status,
  promo_code,
  paid_at,
  created_at,
  updated_at
)
select
  p.id,
  pay."userId",
  pay.id,
  ntl.id,
  pay."tryoutListId",
  'PAY-' || pay.id::text,
  'tryout_purchase'::public.payment_kind,
  ntl.price,
  'paid'::public.payment_status,
  pay."promoCode",
  pay."createdAt",
  pay."createdAt",
  pay."updatedAt"
from public."Payment" pay
join public.profiles p on p.legacy_user_id = pay."userId"
join public.tryout_lists ntl on ntl.legacy_id = pay."tryoutListId"
on conflict (legacy_payment_id) where legacy_payment_id is not null do update set
  tryout_list_id = excluded.tryout_list_id,
  amount = excluded.amount,
  payment_status = excluded.payment_status,
  promo_code = excluded.promo_code,
  paid_at = excluded.paid_at,
  updated_at = excluded.updated_at;

insert into public.user_tryout_access (
  profile_id,
  legacy_user_id,
  tryout_list_id,
  legacy_tryout_list_id,
  source,
  is_done,
  granted_at
)
select
  p.id,
  o."userId",
  ntl.id,
  o."tryoutListId",
  'legacy',
  o."isDone",
  now()
from (
  select distinct on (legacy."userId", legacy."tryoutListId") legacy.*
  from public."Ownership" legacy
  order by legacy."userId", legacy."tryoutListId", legacy.id desc
) o
join public.profiles p on p.legacy_user_id = o."userId"
join public.tryout_lists ntl on ntl.legacy_id = o."tryoutListId"
on conflict (legacy_user_id, legacy_tryout_list_id) where legacy_user_id is not null and legacy_tryout_list_id is not null do update set
  is_done = excluded.is_done,
  source = excluded.source;

alter table public.user_tryouts disable trigger trg_ensure_user_tryout_access;

insert into public.user_tryouts (
  profile_id,
  legacy_user_id,
  tryout_list_id,
  legacy_tryout_list_id,
  started_at,
  finished_at,
  status,
  total_score,
  is_passed,
  created_at,
  updated_at
)
select
  p.id,
  s."userId",
  ntl.id,
  s."tryoutListId",
  s."createdAt",
  s."createdAt",
  'graded'::public.user_tryout_status,
  s.total::numeric,
  false,
  s."createdAt",
  s."updatedAt"
from public."Score" s
join public.profiles p on p.legacy_user_id = s."userId"
join public.tryout_lists ntl on ntl.legacy_id = s."tryoutListId"
where not exists (
  select 1
  from public.user_tryouts ut
  where ut.legacy_user_id = s."userId"
    and ut.legacy_tryout_list_id = s."tryoutListId"
    and ut.status = 'graded'
);

alter table public.user_tryouts enable trigger trg_ensure_user_tryout_access;

insert into public.user_scores (
  user_tryout_id,
  profile_id,
  legacy_user_id,
  legacy_score_id,
  tryout_list_id,
  legacy_tryout_list_id,
  twk_score,
  tiu_score,
  tkp_score,
  total_score,
  created_at,
  updated_at
)
select
  (
    select ut.id
    from public.user_tryouts ut
    where ut.legacy_user_id = s."userId"
      and ut.legacy_tryout_list_id = s."tryoutListId"
      and ut.status = 'graded'
    order by ut.created_at desc
    limit 1
  ),
  p.id,
  s."userId",
  s.id,
  ntl.id,
  s."tryoutListId",
  s.twk::numeric,
  s.tiu::numeric,
  s.tkp::numeric,
  s.total::numeric,
  s."createdAt",
  s."updatedAt"
from public."Score" s
join public.profiles p on p.legacy_user_id = s."userId"
join public.tryout_lists ntl on ntl.legacy_id = s."tryoutListId"
on conflict (legacy_score_id) where legacy_score_id is not null do update set
  user_tryout_id = excluded.user_tryout_id,
  twk_score = excluded.twk_score,
  tiu_score = excluded.tiu_score,
  tkp_score = excluded.tkp_score,
  total_score = excluded.total_score,
  updated_at = excluded.updated_at;

create unique index if not exists idx_rankings_legacy_tryout_user
on public.rankings(tryout_list_id, legacy_user_id)
where legacy_user_id is not null;

insert into public.rankings (
  tryout_list_id,
  profile_id,
  legacy_user_id,
  total_score,
  rank,
  computed_at
)
select
  ranked.tryout_list_id,
  ranked.profile_id,
  ranked.legacy_user_id,
  ranked.total_score,
  ranked.rank,
  now()
from (
  select
    us.tryout_list_id,
    us.profile_id,
    us.legacy_user_id,
    us.total_score,
    row_number() over (
      partition by us.tryout_list_id
      order by us.total_score desc, us.created_at asc
    )::integer as rank
  from public.user_scores us
  where us.legacy_user_id is not null
) ranked
on conflict (tryout_list_id, legacy_user_id) where legacy_user_id is not null do update set
  total_score = excluded.total_score,
  rank = excluded.rank,
  computed_at = excluded.computed_at;

insert into public.free_forms (
  profile_id,
  legacy_user_id,
  tryout_list_id,
  legacy_tryout_list_id,
  legacy_id,
  status
)
select p.id, f."userId", ntl.id, f."tryoutListId", f.id, 'published'::public.content_status
from public."FreeForm" f
join public.profiles p on p.legacy_user_id = f."userId"
join public.tryout_lists ntl on ntl.legacy_id = f."tryoutListId"
on conflict (legacy_id) where legacy_id is not null do update set
  profile_id = excluded.profile_id,
  tryout_list_id = excluded.tryout_list_id,
  status = excluded.status,
  updated_at = now();
