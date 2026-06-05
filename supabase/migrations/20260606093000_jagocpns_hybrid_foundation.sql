create extension if not exists "pgcrypto";

create schema if not exists app_private;
revoke all on schema app_private from public;
grant usage on schema app_private to anon, authenticated, service_role;

do $$ begin
  create type public.app_role as enum ('student', 'admin', 'questioner');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.tryout_status as enum ('draft', 'published', 'archived');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.user_tryout_status as enum ('in_progress', 'submitted', 'expired', 'graded');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_status as enum ('unpaid', 'checking', 'pending', 'paid', 'rejected', 'failed', 'expired', 'refunded');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_kind as enum ('topup', 'tryout_purchase', 'manual_adjustment');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_method as enum ('bank_transfer', 'qris', 'ewallet', 'credit_card', 'va', 'other');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.question_category as enum ('TWK', 'TIU', 'TKP', 'OTHER');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.gender_type as enum ('male', 'female', 'other');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.content_status as enum ('draft', 'published', 'archived');
exception when duplicate_object then null;
end $$;

create or replace function app_private.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text unique,
  logo_url text,
  primary_color text not null default '#1D4EDB',
  secondary_color text not null default '#F59E0B',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_brands_updated on public.brands;
create trigger trg_brands_updated
before update on public.brands
for each row execute function app_private.set_updated_at();

insert into public.brands (id, name, domain, primary_color, secondary_color)
values ('00000000-0000-0000-0000-000000000001', 'Jago CPNS Indonesia', 'jagocpns.id', '#1D4EDB', '#F59E0B')
on conflict (id) do update set
  name = excluded.name,
  domain = excluded.domain,
  primary_color = excluded.primary_color,
  secondary_color = excluded.secondary_color,
  updated_at = now();

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id) on delete set null default '00000000-0000-0000-0000-000000000001',
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  legacy_user_id integer,
  legacy_admin_id integer,
  legacy_questioner_id integer,
  email text,
  full_name text,
  avatar_url text,
  phone text,
  province text,
  city text,
  gender public.gender_type,
  target_instansi text,
  education text,
  bio text,
  is_active boolean not null default true,
  password_migrated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_has_identity check (
    auth_user_id is not null
    or legacy_user_id is not null
    or legacy_admin_id is not null
    or legacy_questioner_id is not null
  )
);

create unique index if not exists idx_profiles_legacy_user on public.profiles(legacy_user_id) where legacy_user_id is not null;
create unique index if not exists idx_profiles_legacy_admin on public.profiles(legacy_admin_id) where legacy_admin_id is not null;
create unique index if not exists idx_profiles_legacy_questioner on public.profiles(legacy_questioner_id) where legacy_questioner_id is not null;
create index if not exists idx_profiles_auth_user on public.profiles(auth_user_id);
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_brand on public.profiles(brand_id);

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated
before update on public.profiles
for each row execute function app_private.set_updated_at();

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete cascade,
  legacy_user_id integer,
  legacy_admin_id integer,
  legacy_questioner_id integer,
  role public.app_role not null default 'student',
  created_at timestamptz not null default now(),
  constraint user_roles_has_identity check (
    profile_id is not null
    or auth_user_id is not null
    or legacy_user_id is not null
    or legacy_admin_id is not null
    or legacy_questioner_id is not null
  )
);

create unique index if not exists idx_user_roles_profile_role on public.user_roles(profile_id, role) where profile_id is not null;
create unique index if not exists idx_user_roles_auth_role on public.user_roles(auth_user_id, role) where auth_user_id is not null;
create unique index if not exists idx_user_roles_legacy_user_role on public.user_roles(legacy_user_id, role) where legacy_user_id is not null;
create unique index if not exists idx_user_roles_legacy_admin_role on public.user_roles(legacy_admin_id, role) where legacy_admin_id is not null;
create unique index if not exists idx_user_roles_legacy_questioner_role on public.user_roles(legacy_questioner_id, role) where legacy_questioner_id is not null;

create table if not exists public.tryout_categories (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade default '00000000-0000-0000-0000-000000000001',
  name text not null,
  description text,
  icon text,
  color text,
  created_at timestamptz not null default now()
);

create index if not exists idx_tryout_categories_brand on public.tryout_categories(brand_id);

create table if not exists public.tryout_lists (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade default '00000000-0000-0000-0000-000000000001',
  category_id uuid references public.tryout_categories(id) on delete set null,
  legacy_id integer,
  title text not null,
  slug text not null,
  description text,
  thumbnail_url text,
  price numeric(12,2) not null default 0 check (price >= 0),
  batch integer not null default 1,
  type text not null default 'Tryout',
  whatsapp_link text,
  is_online boolean not null default false,
  is_premium boolean not null default false,
  duration_minutes integer not null default 120,
  total_questions integer not null default 0,
  passing_grade integer not null default 0,
  status public.tryout_status not null default 'draft',
  start_at timestamptz,
  end_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_tryout_lists_legacy_id on public.tryout_lists(legacy_id) where legacy_id is not null;
create unique index if not exists idx_tryout_lists_slug on public.tryout_lists(slug);
create index if not exists idx_tryout_lists_brand on public.tryout_lists(brand_id);
create index if not exists idx_tryout_lists_category on public.tryout_lists(category_id);
create index if not exists idx_tryout_lists_status on public.tryout_lists(status);
create index if not exists idx_tryout_lists_batch on public.tryout_lists(batch);

drop trigger if exists trg_tryout_lists_updated on public.tryout_lists;
create trigger trg_tryout_lists_updated
before update on public.tryout_lists
for each row execute function app_private.set_updated_at();

create table if not exists public.tryout_questions (
  id uuid primary key default gen_random_uuid(),
  tryout_list_id uuid not null references public.tryout_lists(id) on delete cascade,
  legacy_id integer,
  legacy_tryout_list_id integer,
  question_number integer not null,
  question_type text,
  category public.question_category not null default 'OTHER',
  question_text text not null,
  explanation text,
  image_url text,
  image_explanation_url text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  option_e text,
  option_image_a text,
  option_image_b text,
  option_image_c text,
  option_image_d text,
  option_image_e text,
  answer_key char(1),
  score_a integer not null default 0,
  score_b integer not null default 0,
  score_c integer not null default 0,
  score_d integer not null default 0,
  score_e integer not null default 0,
  difficulty_level integer not null default 1,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tryout_questions_answer_key check (answer_key is null or answer_key in ('A', 'B', 'C', 'D', 'E'))
);

create unique index if not exists idx_tryout_questions_legacy_id on public.tryout_questions(legacy_id) where legacy_id is not null;
create unique index if not exists idx_tryout_questions_number on public.tryout_questions(tryout_list_id, question_number);
create index if not exists idx_tryout_questions_tryout on public.tryout_questions(tryout_list_id);
create index if not exists idx_tryout_questions_category on public.tryout_questions(category);

drop trigger if exists trg_tryout_questions_updated on public.tryout_questions;
create trigger trg_tryout_questions_updated
before update on public.tryout_questions
for each row execute function app_private.set_updated_at();

create table if not exists public.user_tryouts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete cascade,
  legacy_user_id integer,
  tryout_list_id uuid not null references public.tryout_lists(id) on delete cascade,
  legacy_tryout_list_id integer,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status public.user_tryout_status not null default 'in_progress',
  total_score numeric(8,2) not null default 0,
  ranking integer,
  time_spent integer not null default 0,
  is_passed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_tryouts_has_identity check (
    profile_id is not null
    or auth_user_id is not null
    or legacy_user_id is not null
  )
);

create index if not exists idx_user_tryouts_profile on public.user_tryouts(profile_id);
create index if not exists idx_user_tryouts_auth_user on public.user_tryouts(auth_user_id);
create index if not exists idx_user_tryouts_legacy_user on public.user_tryouts(legacy_user_id);
create index if not exists idx_user_tryouts_tryout on public.user_tryouts(tryout_list_id);
create index if not exists idx_user_tryouts_status on public.user_tryouts(status);

drop trigger if exists trg_user_tryouts_updated on public.user_tryouts;
create trigger trg_user_tryouts_updated
before update on public.user_tryouts
for each row execute function app_private.set_updated_at();

create table if not exists public.user_answers (
  id uuid primary key default gen_random_uuid(),
  user_tryout_id uuid references public.user_tryouts(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete cascade,
  legacy_user_id integer,
  tryout_list_id uuid not null references public.tryout_lists(id) on delete cascade,
  legacy_tryout_list_id integer,
  question_id uuid references public.tryout_questions(id) on delete set null,
  question_number integer not null,
  selected_answer char(1) not null,
  score integer not null default 0,
  is_doubt boolean not null default false,
  answered_at timestamptz not null default now(),
  constraint user_answers_has_identity check (
    profile_id is not null
    or auth_user_id is not null
    or legacy_user_id is not null
  ),
  constraint user_answers_selected_answer check (selected_answer in ('A', 'B', 'C', 'D', 'E'))
);

create index if not exists idx_user_answers_user_tryout on public.user_answers(user_tryout_id);
create index if not exists idx_user_answers_profile on public.user_answers(profile_id);
create index if not exists idx_user_answers_auth_user on public.user_answers(auth_user_id);
create index if not exists idx_user_answers_legacy_user on public.user_answers(legacy_user_id);
create index if not exists idx_user_answers_tryout on public.user_answers(tryout_list_id);
create unique index if not exists idx_user_answers_profile_unique on public.user_answers(profile_id, tryout_list_id, question_number) where profile_id is not null;
create unique index if not exists idx_user_answers_auth_unique on public.user_answers(auth_user_id, tryout_list_id, question_number) where auth_user_id is not null;
create unique index if not exists idx_user_answers_legacy_unique on public.user_answers(legacy_user_id, legacy_tryout_list_id, question_number) where legacy_user_id is not null and legacy_tryout_list_id is not null;

create table if not exists public.user_scores (
  id uuid primary key default gen_random_uuid(),
  user_tryout_id uuid references public.user_tryouts(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete cascade,
  legacy_user_id integer,
  legacy_score_id integer,
  tryout_list_id uuid not null references public.tryout_lists(id) on delete cascade,
  legacy_tryout_list_id integer,
  twk_score numeric(6,2) not null default 0,
  tiu_score numeric(6,2) not null default 0,
  tkp_score numeric(6,2) not null default 0,
  total_score numeric(8,2) not null default 0,
  national_ranking integer,
  percentile numeric(5,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_scores_has_identity check (
    profile_id is not null
    or auth_user_id is not null
    or legacy_user_id is not null
  )
);

create unique index if not exists idx_user_scores_legacy_score on public.user_scores(legacy_score_id) where legacy_score_id is not null;
create unique index if not exists idx_user_scores_profile_tryout on public.user_scores(profile_id, tryout_list_id) where profile_id is not null;
create unique index if not exists idx_user_scores_auth_tryout on public.user_scores(auth_user_id, tryout_list_id) where auth_user_id is not null;
create unique index if not exists idx_user_scores_legacy_tryout on public.user_scores(legacy_user_id, legacy_tryout_list_id) where legacy_user_id is not null and legacy_tryout_list_id is not null;
create index if not exists idx_user_scores_tryout on public.user_scores(tryout_list_id);

drop trigger if exists trg_user_scores_updated on public.user_scores;
create trigger trg_user_scores_updated
before update on public.user_scores
for each row execute function app_private.set_updated_at();

create table if not exists public.wallet_balances (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete cascade,
  legacy_user_id integer,
  legacy_balance_id integer,
  amount numeric(12,2) not null default 0 check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wallet_balances_has_identity check (
    profile_id is not null
    or auth_user_id is not null
    or legacy_user_id is not null
  )
);

create unique index if not exists idx_wallet_balances_legacy_balance on public.wallet_balances(legacy_balance_id) where legacy_balance_id is not null;
create unique index if not exists idx_wallet_balances_profile on public.wallet_balances(profile_id) where profile_id is not null;
create unique index if not exists idx_wallet_balances_auth on public.wallet_balances(auth_user_id) where auth_user_id is not null;
create unique index if not exists idx_wallet_balances_legacy_user on public.wallet_balances(legacy_user_id) where legacy_user_id is not null;

drop trigger if exists trg_wallet_balances_updated on public.wallet_balances;
create trigger trg_wallet_balances_updated
before update on public.wallet_balances
for each row execute function app_private.set_updated_at();

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  auth_user_id uuid references auth.users(id) on delete set null,
  legacy_user_id integer,
  legacy_transaction_id integer,
  legacy_payment_id integer,
  tryout_list_id uuid references public.tryout_lists(id) on delete set null,
  legacy_tryout_list_id integer,
  invoice_number text,
  kind public.payment_kind not null default 'tryout_purchase',
  amount numeric(12,2) not null default 0 check (amount >= 0),
  payment_status public.payment_status not null default 'unpaid',
  payment_method public.payment_method,
  promo_code text,
  payment_proof_url text,
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_transactions_invoice on public.transactions(invoice_number) where invoice_number is not null;
create unique index if not exists idx_transactions_legacy_transaction on public.transactions(legacy_transaction_id) where legacy_transaction_id is not null;
create unique index if not exists idx_transactions_legacy_payment on public.transactions(legacy_payment_id) where legacy_payment_id is not null;
create index if not exists idx_transactions_profile on public.transactions(profile_id);
create index if not exists idx_transactions_auth_user on public.transactions(auth_user_id);
create index if not exists idx_transactions_legacy_user on public.transactions(legacy_user_id);
create index if not exists idx_transactions_tryout on public.transactions(tryout_list_id);
create index if not exists idx_transactions_status on public.transactions(payment_status);

drop trigger if exists trg_transactions_updated on public.transactions;
create trigger trg_transactions_updated
before update on public.transactions
for each row execute function app_private.set_updated_at();

create table if not exists public.user_tryout_access (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete cascade,
  legacy_user_id integer,
  tryout_list_id uuid not null references public.tryout_lists(id) on delete cascade,
  legacy_tryout_list_id integer,
  transaction_id uuid references public.transactions(id) on delete set null,
  source text not null default 'purchase' check (source in ('purchase', 'free', 'admin', 'manual', 'legacy')),
  is_done boolean not null default false,
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint user_tryout_access_has_identity check (
    profile_id is not null
    or auth_user_id is not null
    or legacy_user_id is not null
  )
);

create unique index if not exists idx_user_tryout_access_profile_tryout on public.user_tryout_access(profile_id, tryout_list_id) where profile_id is not null;
create unique index if not exists idx_user_tryout_access_auth_tryout on public.user_tryout_access(auth_user_id, tryout_list_id) where auth_user_id is not null;
create unique index if not exists idx_user_tryout_access_legacy_tryout on public.user_tryout_access(legacy_user_id, legacy_tryout_list_id) where legacy_user_id is not null and legacy_tryout_list_id is not null;
create index if not exists idx_user_tryout_access_tryout on public.user_tryout_access(tryout_list_id);
create index if not exists idx_user_tryout_access_transaction on public.user_tryout_access(transaction_id);

create table if not exists public.information_items (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade default '00000000-0000-0000-0000-000000000001',
  legacy_id integer,
  title text not null,
  description text,
  image_url text,
  type text not null check (type in ('banner', 'info', 'news')),
  url text,
  status public.content_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_information_items_legacy on public.information_items(legacy_id) where legacy_id is not null;
create index if not exists idx_information_items_brand on public.information_items(brand_id);
create index if not exists idx_information_items_type_status on public.information_items(type, status);

drop trigger if exists trg_information_items_updated on public.information_items;
create trigger trg_information_items_updated
before update on public.information_items
for each row execute function app_private.set_updated_at();

create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade default '00000000-0000-0000-0000-000000000001',
  legacy_id integer,
  title text not null,
  url text not null,
  image_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_links_legacy on public.links(legacy_id) where legacy_id is not null;
create index if not exists idx_links_brand_active on public.links(brand_id, is_active);

drop trigger if exists trg_links_updated on public.links;
create trigger trg_links_updated
before update on public.links
for each row execute function app_private.set_updated_at();

create table if not exists public.free_forms (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete cascade,
  legacy_user_id integer,
  tryout_list_id uuid references public.tryout_lists(id) on delete cascade,
  legacy_tryout_list_id integer,
  legacy_id integer,
  status public.content_status not null default 'draft',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint free_forms_has_identity check (
    profile_id is not null
    or auth_user_id is not null
    or legacy_user_id is not null
  )
);

create unique index if not exists idx_free_forms_legacy on public.free_forms(legacy_id) where legacy_id is not null;
create unique index if not exists idx_free_forms_profile on public.free_forms(profile_id) where profile_id is not null;
create unique index if not exists idx_free_forms_auth on public.free_forms(auth_user_id) where auth_user_id is not null;
create unique index if not exists idx_free_forms_legacy_user on public.free_forms(legacy_user_id) where legacy_user_id is not null;

drop trigger if exists trg_free_forms_updated on public.free_forms;
create trigger trg_free_forms_updated
before update on public.free_forms
for each row execute function app_private.set_updated_at();

create table if not exists public.question_bank_items (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade default '00000000-0000-0000-0000-000000000001',
  category public.question_category not null default 'OTHER',
  question_type text,
  question_text text not null,
  explanation text,
  image_url text,
  image_explanation_url text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  option_e text,
  option_image_a text,
  option_image_b text,
  option_image_c text,
  option_image_d text,
  option_image_e text,
  answer_key char(1),
  score_a integer not null default 0,
  score_b integer not null default 0,
  score_c integer not null default 0,
  score_d integer not null default 0,
  score_e integer not null default 0,
  source text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint question_bank_answer_key check (answer_key is null or answer_key in ('A', 'B', 'C', 'D', 'E'))
);

create index if not exists idx_question_bank_brand on public.question_bank_items(brand_id);
create index if not exists idx_question_bank_category on public.question_bank_items(category);

drop trigger if exists trg_question_bank_items_updated on public.question_bank_items;
create trigger trg_question_bank_items_updated
before update on public.question_bank_items
for each row execute function app_private.set_updated_at();

create table if not exists public.rankings (
  id uuid primary key default gen_random_uuid(),
  tryout_list_id uuid not null references public.tryout_lists(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete cascade,
  legacy_user_id integer,
  total_score numeric(8,2) not null default 0,
  rank integer not null,
  computed_at timestamptz not null default now()
);

create index if not exists idx_rankings_tryout_rank on public.rankings(tryout_list_id, rank);
create index if not exists idx_rankings_profile on public.rankings(profile_id);
create index if not exists idx_rankings_auth_user on public.rankings(auth_user_id);
create index if not exists idx_rankings_legacy_user on public.rankings(legacy_user_id);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  is_public boolean not null default false,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_site_settings_updated on public.site_settings;
create trigger trg_site_settings_updated
before update on public.site_settings
for each row execute function app_private.set_updated_at();

create or replace function app_private.has_role(_auth_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    _auth_user_id is not null and exists (
      select 1
      from public.user_roles
      where role = _role
        and (
          auth_user_id = _auth_user_id
          or profile_id in (
            select id
            from public.profiles
            where auth_user_id = _auth_user_id
          )
        )
    ),
    false
  );
$$;

create or replace function app_private.is_staff(_auth_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select app_private.has_role(_auth_user_id, 'admin')
    or app_private.has_role(_auth_user_id, 'questioner');
$$;

create or replace function app_private.is_owner(_profile_id uuid, _auth_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    _auth_user_id = auth.uid()
    or exists (
      select 1
      from public.profiles
      where id = _profile_id
        and auth_user_id = auth.uid()
    ),
    false
  );
$$;

grant execute on function app_private.has_role(uuid, public.app_role) to anon, authenticated, service_role;
grant execute on function app_private.is_staff(uuid) to anon, authenticated, service_role;
grant execute on function app_private.is_owner(uuid, uuid) to anon, authenticated, service_role;

create or replace function app_private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
begin
  insert into public.profiles (auth_user_id, email, full_name, brand_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    '00000000-0000-0000-0000-000000000001'
  )
  on conflict (auth_user_id) do update set
    email = excluded.email,
    updated_at = now()
  returning id into v_profile_id;

  insert into public.user_roles (profile_id, auth_user_id, role)
  values (v_profile_id, new.id, 'student')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_jagocpns on auth.users;
create trigger on_auth_user_created_jagocpns
after insert on auth.users
for each row execute function app_private.handle_new_auth_user();

create or replace function app_private.prevent_untrusted_paid_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_user in ('postgres', 'supabase_admin') then
    return new;
  end if;

  if coalesce(auth.role(), '') = 'service_role'
    or app_private.has_role(auth.uid(), 'admin') then
    return new;
  end if;

  if tg_op = 'INSERT'
    and (new.payment_status in ('paid', 'refunded') or new.paid_at is not null) then
    raise exception 'paid transactions must be created by a trusted server';
  end if;

  if tg_op = 'UPDATE'
    and (
      (old.payment_status is distinct from new.payment_status and new.payment_status in ('paid', 'refunded'))
      or (old.paid_at is distinct from new.paid_at and new.paid_at is not null)
    ) then
    raise exception 'transaction payment confirmation requires a trusted server';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_untrusted_paid_transaction on public.transactions;
create trigger trg_prevent_untrusted_paid_transaction
before insert or update on public.transactions
for each row execute function app_private.prevent_untrusted_paid_transaction();

create or replace function app_private.grant_tryout_access_from_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.payment_status = 'paid' and new.tryout_list_id is not null then
    update public.user_tryout_access
    set
      transaction_id = new.id,
      source = 'purchase',
      granted_at = coalesce(new.paid_at, now()),
      expires_at = null,
      is_done = false
    where tryout_list_id = new.tryout_list_id
      and (
        (new.profile_id is not null and profile_id = new.profile_id)
        or (new.auth_user_id is not null and auth_user_id = new.auth_user_id)
        or (new.legacy_user_id is not null and legacy_user_id = new.legacy_user_id)
      );

    if not found then
      insert into public.user_tryout_access (
        profile_id,
        auth_user_id,
        legacy_user_id,
        tryout_list_id,
        legacy_tryout_list_id,
        transaction_id,
        source,
        granted_at
      )
      values (
        new.profile_id,
        new.auth_user_id,
        new.legacy_user_id,
        new.tryout_list_id,
        new.legacy_tryout_list_id,
        new.id,
        'purchase',
        coalesce(new.paid_at, now())
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_grant_tryout_access_from_transaction on public.transactions;
create trigger trg_grant_tryout_access_from_transaction
after insert or update of payment_status, paid_at, tryout_list_id
on public.transactions
for each row execute function app_private.grant_tryout_access_from_transaction();

create or replace function app_private.ensure_user_tryout_access()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_premium boolean;
  v_price numeric;
begin
  select is_premium, price
  into v_is_premium, v_price
  from public.tryout_lists
  where id = new.tryout_list_id;

  if coalesce(v_is_premium, false) = true and coalesce(v_price, 0) > 0 then
    if not exists (
      select 1
      from public.user_tryout_access
      where tryout_list_id = new.tryout_list_id
        and (expires_at is null or expires_at > now())
        and (
          (new.profile_id is not null and profile_id = new.profile_id)
          or (new.auth_user_id is not null and auth_user_id = new.auth_user_id)
          or (new.legacy_user_id is not null and legacy_user_id = new.legacy_user_id)
        )
    ) then
      raise exception 'Akses tryout premium belum tersedia' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_ensure_user_tryout_access on public.user_tryouts;
create trigger trg_ensure_user_tryout_access
before insert on public.user_tryouts
for each row execute function app_private.ensure_user_tryout_access();

alter table public.brands enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.tryout_categories enable row level security;
alter table public.tryout_lists enable row level security;
alter table public.tryout_questions enable row level security;
alter table public.user_tryouts enable row level security;
alter table public.user_answers enable row level security;
alter table public.user_scores enable row level security;
alter table public.wallet_balances enable row level security;
alter table public.transactions enable row level security;
alter table public.user_tryout_access enable row level security;
alter table public.information_items enable row level security;
alter table public.links enable row level security;
alter table public.free_forms enable row level security;
alter table public.question_bank_items enable row level security;
alter table public.rankings enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists "public read brands" on public.brands;
create policy "public read brands"
on public.brands for select
to anon, authenticated
using (true);

drop policy if exists "admin manage brands" on public.brands;
create policy "admin manage brands"
on public.brands for all
to authenticated
using (app_private.has_role(auth.uid(), 'admin'))
with check (app_private.has_role(auth.uid(), 'admin'));

drop policy if exists "profiles read own or admin" on public.profiles;
create policy "profiles read own or admin"
on public.profiles for select
to authenticated
using (app_private.is_owner(id, auth_user_id) or app_private.has_role(auth.uid(), 'admin'));

drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own"
on public.profiles for insert
to authenticated
with check (auth_user_id = auth.uid() or app_private.has_role(auth.uid(), 'admin'));

drop policy if exists "profiles update own or admin" on public.profiles;
create policy "profiles update own or admin"
on public.profiles for update
to authenticated
using (app_private.is_owner(id, auth_user_id) or app_private.has_role(auth.uid(), 'admin'))
with check (app_private.is_owner(id, auth_user_id) or app_private.has_role(auth.uid(), 'admin'));

drop policy if exists "roles read own or admin" on public.user_roles;
create policy "roles read own or admin"
on public.user_roles for select
to authenticated
using (
  auth_user_id = auth.uid()
  or app_private.is_owner(profile_id, auth_user_id)
  or app_private.has_role(auth.uid(), 'admin')
);

drop policy if exists "admin manage roles" on public.user_roles;
create policy "admin manage roles"
on public.user_roles for all
to authenticated
using (app_private.has_role(auth.uid(), 'admin'))
with check (app_private.has_role(auth.uid(), 'admin'));

drop policy if exists "public read categories" on public.tryout_categories;
create policy "public read categories"
on public.tryout_categories for select
to anon, authenticated
using (true);

drop policy if exists "staff manage categories" on public.tryout_categories;
create policy "staff manage categories"
on public.tryout_categories for all
to authenticated
using (app_private.is_staff(auth.uid()))
with check (app_private.is_staff(auth.uid()));

drop policy if exists "public read published tryouts" on public.tryout_lists;
create policy "public read published tryouts"
on public.tryout_lists for select
to anon, authenticated
using (status = 'published');

drop policy if exists "staff manage tryouts" on public.tryout_lists;
create policy "staff manage tryouts"
on public.tryout_lists for all
to authenticated
using (app_private.is_staff(auth.uid()))
with check (app_private.is_staff(auth.uid()));

drop policy if exists "read available questions" on public.tryout_questions;
create policy "read available questions"
on public.tryout_questions for select
to anon, authenticated
using (
  app_private.is_staff(auth.uid())
  or exists (
    select 1
    from public.tryout_lists tl
    where tl.id = tryout_questions.tryout_list_id
      and tl.status = 'published'
      and (
        tl.is_premium = false
        or tl.price = 0
        or exists (
          select 1
          from public.user_tryout_access uta
          where uta.tryout_list_id = tryout_questions.tryout_list_id
            and (uta.expires_at is null or uta.expires_at > now())
            and (
              uta.auth_user_id = auth.uid()
              or exists (
                select 1
                from public.profiles p
                where p.id = uta.profile_id
                  and p.auth_user_id = auth.uid()
              )
            )
        )
      )
  )
);

drop policy if exists "staff manage questions" on public.tryout_questions;
create policy "staff manage questions"
on public.tryout_questions for all
to authenticated
using (app_private.is_staff(auth.uid()))
with check (app_private.is_staff(auth.uid()));

drop policy if exists "user_tryouts owner read" on public.user_tryouts;
create policy "user_tryouts owner read"
on public.user_tryouts for select
to authenticated
using (app_private.is_owner(profile_id, auth_user_id) or app_private.has_role(auth.uid(), 'admin'));

drop policy if exists "user_tryouts owner insert" on public.user_tryouts;
create policy "user_tryouts owner insert"
on public.user_tryouts for insert
to authenticated
with check (app_private.is_owner(profile_id, auth_user_id));

drop policy if exists "user_tryouts owner update" on public.user_tryouts;
create policy "user_tryouts owner update"
on public.user_tryouts for update
to authenticated
using (app_private.is_owner(profile_id, auth_user_id) or app_private.has_role(auth.uid(), 'admin'))
with check (app_private.is_owner(profile_id, auth_user_id) or app_private.has_role(auth.uid(), 'admin'));

drop policy if exists "answers owner manage" on public.user_answers;
create policy "answers owner manage"
on public.user_answers for all
to authenticated
using (app_private.is_owner(profile_id, auth_user_id) or app_private.has_role(auth.uid(), 'admin'))
with check (app_private.is_owner(profile_id, auth_user_id) or app_private.has_role(auth.uid(), 'admin'));

drop policy if exists "scores owner read" on public.user_scores;
create policy "scores owner read"
on public.user_scores for select
to authenticated
using (app_private.is_owner(profile_id, auth_user_id) or app_private.has_role(auth.uid(), 'admin'));

drop policy if exists "admin manage scores" on public.user_scores;
create policy "admin manage scores"
on public.user_scores for all
to authenticated
using (app_private.has_role(auth.uid(), 'admin'))
with check (app_private.has_role(auth.uid(), 'admin'));

drop policy if exists "wallet owner read" on public.wallet_balances;
create policy "wallet owner read"
on public.wallet_balances for select
to authenticated
using (app_private.is_owner(profile_id, auth_user_id) or app_private.has_role(auth.uid(), 'admin'));

drop policy if exists "admin manage wallet" on public.wallet_balances;
create policy "admin manage wallet"
on public.wallet_balances for all
to authenticated
using (app_private.has_role(auth.uid(), 'admin'))
with check (app_private.has_role(auth.uid(), 'admin'));

drop policy if exists "transactions owner read" on public.transactions;
create policy "transactions owner read"
on public.transactions for select
to authenticated
using (app_private.is_owner(profile_id, auth_user_id) or app_private.has_role(auth.uid(), 'admin'));

drop policy if exists "transactions owner insert pending" on public.transactions;
create policy "transactions owner insert pending"
on public.transactions for insert
to authenticated
with check (
  app_private.is_owner(profile_id, auth_user_id)
  and payment_status in ('unpaid', 'checking', 'pending')
  and paid_at is null
);

drop policy if exists "transactions owner update proof" on public.transactions;
create policy "transactions owner update proof"
on public.transactions for update
to authenticated
using (app_private.is_owner(profile_id, auth_user_id))
with check (
  app_private.is_owner(profile_id, auth_user_id)
  and payment_status in ('unpaid', 'checking', 'pending')
  and paid_at is null
);

drop policy if exists "admin manage transactions" on public.transactions;
create policy "admin manage transactions"
on public.transactions for all
to authenticated
using (app_private.has_role(auth.uid(), 'admin'))
with check (app_private.has_role(auth.uid(), 'admin'));

drop policy if exists "tryout access owner read" on public.user_tryout_access;
create policy "tryout access owner read"
on public.user_tryout_access for select
to authenticated
using (app_private.is_owner(profile_id, auth_user_id) or app_private.has_role(auth.uid(), 'admin'));

drop policy if exists "admin manage tryout access" on public.user_tryout_access;
create policy "admin manage tryout access"
on public.user_tryout_access for all
to authenticated
using (app_private.has_role(auth.uid(), 'admin'))
with check (app_private.has_role(auth.uid(), 'admin'));

drop policy if exists "public read published information" on public.information_items;
create policy "public read published information"
on public.information_items for select
to anon, authenticated
using (status = 'published');

drop policy if exists "staff manage information" on public.information_items;
create policy "staff manage information"
on public.information_items for all
to authenticated
using (app_private.is_staff(auth.uid()))
with check (app_private.is_staff(auth.uid()));

drop policy if exists "public read active links" on public.links;
create policy "public read active links"
on public.links for select
to anon, authenticated
using (is_active = true);

drop policy if exists "staff manage links" on public.links;
create policy "staff manage links"
on public.links for all
to authenticated
using (app_private.is_staff(auth.uid()))
with check (app_private.is_staff(auth.uid()));

drop policy if exists "free forms owner manage" on public.free_forms;
create policy "free forms owner manage"
on public.free_forms for all
to authenticated
using (app_private.is_owner(profile_id, auth_user_id) or app_private.has_role(auth.uid(), 'admin'))
with check (app_private.is_owner(profile_id, auth_user_id) or app_private.has_role(auth.uid(), 'admin'));

drop policy if exists "staff manage question bank" on public.question_bank_items;
create policy "staff manage question bank"
on public.question_bank_items for all
to authenticated
using (app_private.is_staff(auth.uid()))
with check (app_private.is_staff(auth.uid()));

drop policy if exists "public read rankings" on public.rankings;
create policy "public read rankings"
on public.rankings for select
to anon, authenticated
using (true);

drop policy if exists "admin manage rankings" on public.rankings;
create policy "admin manage rankings"
on public.rankings for all
to authenticated
using (app_private.has_role(auth.uid(), 'admin'))
with check (app_private.has_role(auth.uid(), 'admin'));

drop policy if exists "public read site settings" on public.site_settings;
create policy "public read site settings"
on public.site_settings for select
to anon, authenticated
using (is_public = true);

drop policy if exists "admin manage site settings" on public.site_settings;
create policy "admin manage site settings"
on public.site_settings for all
to authenticated
using (app_private.has_role(auth.uid(), 'admin'))
with check (app_private.has_role(auth.uid(), 'admin'));

grant select on public.brands to anon, authenticated;
grant select on public.tryout_categories to anon, authenticated;
grant select on public.tryout_lists to anon, authenticated;
grant select on public.tryout_questions to anon, authenticated;
grant select on public.information_items to anon, authenticated;
grant select on public.links to anon, authenticated;
grant select on public.rankings to anon, authenticated;
grant select on public.site_settings to anon, authenticated;

grant select, insert, update on public.profiles to authenticated;
grant select on public.user_roles to authenticated;
grant select, insert, update on public.user_tryouts to authenticated;
grant select, insert, update, delete on public.user_answers to authenticated;
grant select on public.user_scores to authenticated;
grant select on public.wallet_balances to authenticated;
grant select, insert, update on public.transactions to authenticated;
grant select on public.user_tryout_access to authenticated;
grant select, insert, update on public.free_forms to authenticated;
grant select, insert, update, delete on public.question_bank_items to authenticated;
grant insert, update, delete on public.tryout_categories to authenticated;
grant insert, update, delete on public.tryout_lists to authenticated;
grant insert, update, delete on public.tryout_questions to authenticated;
grant insert, update, delete on public.information_items to authenticated;
grant insert, update, delete on public.links to authenticated;
grant insert, update, delete on public.rankings to authenticated;
grant insert, update, delete on public.site_settings to authenticated;

grant all on all tables in schema public to service_role;
grant usage on all sequences in schema public to service_role;
