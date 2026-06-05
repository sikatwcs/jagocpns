set statement_timeout = '10min';

create or replace function app_private.slugify(value text)
returns text
language sql
immutable
set search_path = pg_catalog
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(value, '')), '[^a-z0-9]+', '-', 'g'));
$$;

insert into public.profiles (
  legacy_user_id,
  email,
  full_name,
  phone,
  province,
  gender,
  target_instansi,
  created_at,
  updated_at,
  password_migrated
)
select
  u.id,
  u.email,
  p.name,
  p.phone,
  p.province,
  case
    when p.gender::text = 'male' then 'male'::public.gender_type
    when p.gender::text = 'female' then 'female'::public.gender_type
    else null
  end,
  p.instance,
  u."createdAt",
  u."updatedAt",
  false
from public."User" u
left join public."Profile" p on p."userId" = u.id
on conflict (legacy_user_id) where legacy_user_id is not null do update set
  email = excluded.email,
  full_name = excluded.full_name,
  phone = excluded.phone,
  province = excluded.province,
  gender = excluded.gender,
  target_instansi = excluded.target_instansi,
  updated_at = excluded.updated_at;

insert into public.profiles (
  legacy_admin_id,
  email,
  full_name,
  created_at,
  updated_at,
  password_migrated
)
select a.id, a.email, a.name, a."createdAt", a."updatedAt", false
from public."Admin" a
on conflict (legacy_admin_id) where legacy_admin_id is not null do update set
  email = excluded.email,
  full_name = excluded.full_name,
  updated_at = excluded.updated_at;

insert into public.profiles (
  legacy_questioner_id,
  email,
  full_name,
  created_at,
  updated_at,
  password_migrated
)
select q.id, q.email, q.name, q."createdAt", q."updatedAt", false
from public."Questioner" q
on conflict (legacy_questioner_id) where legacy_questioner_id is not null do update set
  email = excluded.email,
  full_name = excluded.full_name,
  updated_at = excluded.updated_at;

insert into public.user_roles (profile_id, legacy_user_id, role)
select p.id, p.legacy_user_id, 'student'::public.app_role
from public.profiles p
where p.legacy_user_id is not null
on conflict do nothing;

insert into public.user_roles (profile_id, legacy_admin_id, role)
select p.id, p.legacy_admin_id, 'admin'::public.app_role
from public.profiles p
where p.legacy_admin_id is not null
on conflict do nothing;

insert into public.user_roles (profile_id, legacy_questioner_id, role)
select p.id, p.legacy_questioner_id, 'questioner'::public.app_role
from public.profiles p
where p.legacy_questioner_id is not null
on conflict do nothing;

insert into public.tryout_categories (name, description)
select distinct
  coalesce(nullif(tl.type, ''), 'Tryout'),
  'Migrasi kategori dari JagoCPNS lama'
from public."TryoutList" tl
where not exists (
  select 1
  from public.tryout_categories tc
  where lower(tc.name) = lower(coalesce(nullif(tl.type, ''), 'Tryout'))
);

insert into public.tryout_lists (
  category_id,
  legacy_id,
  title,
  slug,
  description,
  thumbnail_url,
  price,
  batch,
  type,
  whatsapp_link,
  is_online,
  is_premium,
  total_questions,
  status,
  created_at,
  updated_at
)
select
  (
    select tc.id
    from public.tryout_categories tc
    where lower(tc.name) = lower(coalesce(nullif(tl.type, ''), 'Tryout'))
    order by tc.created_at asc
    limit 1
  ),
  tl.id,
  tl.title,
  coalesce(nullif(app_private.slugify(tl.title), ''), 'tryout') || '-' || tl.id::text,
  tl.description,
  tl."imageUrl",
  tl.price::numeric,
  tl.batch,
  tl.type,
  tl."whatsappLink",
  tl."isOnline",
  tl.price > 0,
  (
    select count(*)::integer
    from public."Tryout" tq
    where tq."tryoutListId" = tl.id
  ),
  case when tl.status then 'published'::public.tryout_status else 'draft'::public.tryout_status end,
  tl."createdAt",
  tl."updatedAt"
from public."TryoutList" tl
on conflict (legacy_id) where legacy_id is not null do update set
  title = excluded.title,
  slug = excluded.slug,
  description = excluded.description,
  thumbnail_url = excluded.thumbnail_url,
  price = excluded.price,
  batch = excluded.batch,
  type = excluded.type,
  whatsapp_link = excluded.whatsapp_link,
  is_online = excluded.is_online,
  is_premium = excluded.is_premium,
  total_questions = excluded.total_questions,
  status = excluded.status,
  updated_at = excluded.updated_at;

insert into public.tryout_questions (
  tryout_list_id,
  legacy_id,
  legacy_tryout_list_id,
  question_number,
  question_type,
  category,
  question_text,
  explanation,
  image_url,
  image_explanation_url,
  option_a,
  option_b,
  option_c,
  option_d,
  option_e,
  option_image_a,
  option_image_b,
  option_image_c,
  option_image_d,
  option_image_e,
  answer_key,
  score_a,
  score_b,
  score_c,
  score_d,
  score_e,
  created_at,
  updated_at
)
select
  ntl.id,
  tq.id,
  tq."tryoutListId",
  tq.number,
  tq.type,
  case upper(tq.type)
    when 'TWK' then 'TWK'::public.question_category
    when 'TIU' then 'TIU'::public.question_category
    when 'TKP' then 'TKP'::public.question_category
    else 'OTHER'::public.question_category
  end,
  tq.question,
  tq.explanation,
  tq."imageUrl",
  tq."imageExplanation",
  tq."optionA",
  tq."optionB",
  tq."optionC",
  tq."optionD",
  tq."optionE",
  tq."imageA",
  tq."imageB",
  tq."imageC",
  tq."imageD",
  tq."imageE",
  case
    when tq."scoreA" > tq."scoreB" and tq."scoreA" > tq."scoreC" and tq."scoreA" > tq."scoreD" and tq."scoreA" > tq."scoreE" then 'A'
    when tq."scoreB" > tq."scoreA" and tq."scoreB" > tq."scoreC" and tq."scoreB" > tq."scoreD" and tq."scoreB" > tq."scoreE" then 'B'
    when tq."scoreC" > tq."scoreA" and tq."scoreC" > tq."scoreB" and tq."scoreC" > tq."scoreD" and tq."scoreC" > tq."scoreE" then 'C'
    when tq."scoreD" > tq."scoreA" and tq."scoreD" > tq."scoreB" and tq."scoreD" > tq."scoreC" and tq."scoreD" > tq."scoreE" then 'D'
    when tq."scoreE" > tq."scoreA" and tq."scoreE" > tq."scoreB" and tq."scoreE" > tq."scoreC" and tq."scoreE" > tq."scoreD" then 'E'
    else null
  end,
  tq."scoreA",
  tq."scoreB",
  tq."scoreC",
  tq."scoreD",
  tq."scoreE",
  tq."createdAt",
  tq."updatedAt"
from public."Tryout" tq
join public.tryout_lists ntl on ntl.legacy_id = tq."tryoutListId"
on conflict (legacy_id) where legacy_id is not null do update set
  tryout_list_id = excluded.tryout_list_id,
  question_number = excluded.question_number,
  question_type = excluded.question_type,
  category = excluded.category,
  question_text = excluded.question_text,
  explanation = excluded.explanation,
  image_url = excluded.image_url,
  image_explanation_url = excluded.image_explanation_url,
  option_a = excluded.option_a,
  option_b = excluded.option_b,
  option_c = excluded.option_c,
  option_d = excluded.option_d,
  option_e = excluded.option_e,
  option_image_a = excluded.option_image_a,
  option_image_b = excluded.option_image_b,
  option_image_c = excluded.option_image_c,
  option_image_d = excluded.option_image_d,
  option_image_e = excluded.option_image_e,
  answer_key = excluded.answer_key,
  score_a = excluded.score_a,
  score_b = excluded.score_b,
  score_c = excluded.score_c,
  score_d = excluded.score_d,
  score_e = excluded.score_e,
  updated_at = excluded.updated_at;

insert into public.information_items (
  legacy_id,
  title,
  description,
  image_url,
  type,
  url,
  status,
  created_at,
  updated_at
)
select
  i.id,
  i.title,
  i.description,
  i."imageUrl",
  i.type::text,
  i.url,
  'published'::public.content_status,
  i."createdAt",
  i."updatedAt"
from public."Information" i
on conflict (legacy_id) where legacy_id is not null do update set
  title = excluded.title,
  description = excluded.description,
  image_url = excluded.image_url,
  type = excluded.type,
  url = excluded.url,
  updated_at = excluded.updated_at;

insert into public.links (legacy_id, title, url, image_url, is_active)
select l.id, l.title, l.url, l."imageUrl", true
from public."Links" l
on conflict (legacy_id) where legacy_id is not null do update set
  title = excluded.title,
  url = excluded.url,
  image_url = excluded.image_url,
  is_active = excluded.is_active,
  updated_at = now();
