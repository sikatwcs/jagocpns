import { supabase } from '../../lib/supabase/client';
import type {
  PaymentStatus,
  QuestionCategory,
  TryoutStatus,
} from '../../lib/supabase/database.types';

export type TryoutFormInput = {
  title: string;
  description: string;
  price: number;
  batch: number;
  type: string;
  status: TryoutStatus;
  duration_minutes: number;
  is_online: boolean;
};

export type QuestionFormInput = {
  tryout_list_id: string;
  question_number: number;
  category: QuestionCategory;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e: string;
  score_a: number;
  score_b: number;
  score_c: number;
  score_d: number;
  score_e: number;
  explanation: string;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const getAdminMetrics = async () => {
  const [
    tryouts,
    questions,
    profiles,
    transactions,
    scores,
  ] = await Promise.all([
    supabase.from('tryout_lists').select('id', { count: 'exact', head: true }),
    supabase
      .from('tryout_questions')
      .select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('transactions').select('id', { count: 'exact', head: true }),
    supabase.from('user_scores').select('id', { count: 'exact', head: true }),
  ]);

  const errors = [tryouts, questions, profiles, transactions, scores]
    .map((item) => item.error)
    .filter(Boolean);
  if (errors[0]) throw errors[0];

  return {
    tryouts: tryouts.count ?? 0,
    questions: questions.count ?? 0,
    profiles: profiles.count ?? 0,
    transactions: transactions.count ?? 0,
    scores: scores.count ?? 0,
  };
};

export const listAdminTryouts = async () => {
  const { data, error } = await supabase
    .from('tryout_lists')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data ?? [];
};

export const saveTryout = async (input: TryoutFormInput) => {
  const { data, error } = await supabase
    .from('tryout_lists')
    .insert({
      ...input,
      slug: `${slugify(input.title)}-${Date.now()}`,
      is_premium: input.price > 0,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

export const saveQuestion = async (input: QuestionFormInput) => {
  const { data, error } = await supabase
    .from('tryout_questions')
    .insert(input)
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

export const listAdminTransactions = async (status?: PaymentStatus) => {
  let query = supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (status) query = query.eq('payment_status', status);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};

export const updateTransactionStatus = async (
  id: string,
  payment_status: PaymentStatus,
) => {
  const { data, error } = await supabase
    .from('transactions')
    .update({
      payment_status,
      paid_at: payment_status === 'paid' ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data;
};
