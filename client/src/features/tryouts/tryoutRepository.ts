import { supabase } from '../../lib/supabase/client';
import type {
  PaymentStatus,
  ProfileRow,
  QuestionCategory,
  RankingRow,
  TransactionRow,
  TryoutListRow,
  TryoutQuestionRow,
  UserScoreRow,
  UserTryoutAccessRow,
  UserTryoutRow,
} from '../../lib/supabase/database.types';

export type TryoutFilter = {
  type?: string;
  batch?: number;
  limit?: number;
};

export type TryoutSummary = TryoutListRow & {
  access?: UserTryoutAccessRow | null;
};

export type AttemptResult = {
  attempt: UserTryoutRow;
  score: UserScoreRow;
};

export const getPublishedTryouts = async (filter: TryoutFilter = {}) => {
  let query = supabase
    .from('tryout_lists')
    .select('*')
    .eq('status', 'published')
    .order('batch', { ascending: true })
    .order('title', { ascending: true });

  if (filter.type) query = query.eq('type', filter.type);
  if (filter.batch) query = query.eq('batch', filter.batch);
  if (filter.limit) query = query.limit(filter.limit);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};

export const getTryoutById = async (id: string) => {
  const { data, error } = await supabase
    .from('tryout_lists')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getTryoutQuestions = async (tryoutId: string) => {
  const { data, error } = await supabase
    .from('tryout_questions')
    .select('*')
    .eq('tryout_list_id', tryoutId)
    .order('question_number', { ascending: true });

  if (error) throw error;
  return data ?? [];
};

export const getMyTryoutAccess = async () => {
  const { data, error } = await supabase
    .from('user_tryout_access')
    .select('*')
    .order('granted_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
};

export const getMyScores = async () => {
  const { data, error } = await supabase
    .from('user_scores')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
};

export const getWalletBalance = async () => {
  const { data, error } = await supabase
    .from('wallet_balances')
    .select('*')
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getMyTransactions = async () => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data ?? [];
};

export const createCheckoutTransaction = async (
  profile: ProfileRow,
  tryout: TryoutListRow,
) => {
  const invoiceNumber = `JCP-${Date.now()}`;
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      profile_id: profile.id,
      auth_user_id: profile.auth_user_id,
      tryout_list_id: tryout.id,
      invoice_number: invoiceNumber,
      kind: 'tryout_purchase',
      amount: tryout.price,
      payment_status: 'pending',
      payment_method: 'qris',
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

export const createTopupTransaction = async (
  profile: ProfileRow,
  amount: number,
) => {
  const invoiceNumber = `TOPUP-${Date.now()}`;
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      profile_id: profile.id,
      auth_user_id: profile.auth_user_id,
      invoice_number: invoiceNumber,
      kind: 'topup',
      amount,
      payment_status: 'pending',
      payment_method: 'qris',
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

export const getRankings = async (tryoutId?: string) => {
  let query = supabase
    .from('rankings')
    .select('*')
    .order('rank', { ascending: true })
    .limit(100);

  if (tryoutId) query = query.eq('tryout_list_id', tryoutId);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};

export const startAttempt = async (
  profile: ProfileRow,
  tryoutId: string,
): Promise<UserTryoutRow> => {
  const { data, error } = await supabase
    .from('user_tryouts')
    .insert({
      profile_id: profile.id,
      auth_user_id: profile.auth_user_id,
      tryout_list_id: tryoutId,
      status: 'in_progress',
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

const getAnswerScore = (question: TryoutQuestionRow, answer: string) => {
  const key = answer.toUpperCase();
  if (key === 'A') return question.score_a;
  if (key === 'B') return question.score_b;
  if (key === 'C') return question.score_c;
  if (key === 'D') return question.score_d;
  if (key === 'E') return question.score_e;
  return 0;
};

const categoryKey = (category: QuestionCategory) => {
  if (category === 'TWK') return 'twk';
  if (category === 'TIU') return 'tiu';
  if (category === 'TKP') return 'tkp';
  return 'other';
};

export const submitAttempt = async (
  profile: ProfileRow,
  attempt: UserTryoutRow,
  questions: TryoutQuestionRow[],
  answers: Record<string, string>,
): Promise<AttemptResult> => {
  const rows = questions
    .map((question) => {
      const answer = answers[question.id];
      if (!answer) return null;
      return {
        user_tryout_id: attempt.id,
        profile_id: profile.id,
        auth_user_id: profile.auth_user_id,
        tryout_list_id: attempt.tryout_list_id,
        question_id: question.id,
        question_number: question.question_number,
        selected_answer: answer,
        score: getAnswerScore(question, answer),
      };
    })
    .filter(Boolean);

  if (rows.length > 0) {
    const { error: answersError } = await supabase
      .from('user_answers')
      .insert(rows);
    if (answersError) throw answersError;
  }

  const totals = questions.reduce(
    (acc, question) => {
      const score = getAnswerScore(question, answers[question.id] ?? '');
      const key = categoryKey(question.category);
      if (key === 'twk') acc.twk += score;
      if (key === 'tiu') acc.tiu += score;
      if (key === 'tkp') acc.tkp += score;
      acc.total += score;
      return acc;
    },
    { twk: 0, tiu: 0, tkp: 0, total: 0 },
  );

  const { data: score, error: scoreError } = await supabase
    .from('user_scores')
    .insert({
      user_tryout_id: attempt.id,
      profile_id: profile.id,
      auth_user_id: profile.auth_user_id,
      tryout_list_id: attempt.tryout_list_id,
      twk_score: totals.twk,
      tiu_score: totals.tiu,
      tkp_score: totals.tkp,
      total_score: totals.total,
    })
    .select('*')
    .single();

  if (scoreError) throw scoreError;

  const { data: updatedAttempt, error: attemptError } = await supabase
    .from('user_tryouts')
    .update({
      status: 'graded',
      finished_at: new Date().toISOString(),
      total_score: totals.total,
    })
    .eq('id', attempt.id)
    .select('*')
    .single();

  if (attemptError) throw attemptError;

  return { attempt: updatedAttempt, score };
};

export const transactionStatusLabel = (status: PaymentStatus) => {
  const map: Record<PaymentStatus, string> = {
    unpaid: 'Belum bayar',
    checking: 'Dicek',
    pending: 'Menunggu',
    paid: 'Paid',
    rejected: 'Ditolak',
    failed: 'Gagal',
    expired: 'Expired',
    refunded: 'Refunded',
  };
  return map[status];
};

export type RankingWithTryout = RankingRow;
export type TransactionWithTryout = TransactionRow;
