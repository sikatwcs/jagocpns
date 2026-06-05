create or replace function app_private.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create index if not exists idx_free_forms_tryout_list
on public.free_forms(tryout_list_id)
where tryout_list_id is not null;

create index if not exists idx_question_bank_created_by
on public.question_bank_items(created_by)
where created_by is not null;

create index if not exists idx_tryout_lists_created_by
on public.tryout_lists(created_by)
where created_by is not null;

create index if not exists idx_tryout_questions_created_by
on public.tryout_questions(created_by)
where created_by is not null;

create index if not exists idx_user_answers_question
on public.user_answers(question_id)
where question_id is not null;

create index if not exists idx_user_scores_user_tryout
on public.user_scores(user_tryout_id)
where user_tryout_id is not null;
