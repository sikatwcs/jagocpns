export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRole = 'student' | 'admin' | 'questioner';
export type TryoutStatus = 'draft' | 'published' | 'archived';
export type UserTryoutStatus =
  | 'in_progress'
  | 'submitted'
  | 'expired'
  | 'graded';
export type PaymentStatus =
  | 'unpaid'
  | 'checking'
  | 'pending'
  | 'paid'
  | 'rejected'
  | 'failed'
  | 'expired'
  | 'refunded';
export type PaymentKind = 'topup' | 'tryout_purchase' | 'manual_adjustment';
export type PaymentMethod =
  | 'bank_transfer'
  | 'qris'
  | 'ewallet'
  | 'credit_card'
  | 'va'
  | 'other';
export type QuestionCategory = 'TWK' | 'TIU' | 'TKP' | 'OTHER';
export type GenderType = 'male' | 'female' | 'other';
export type ContentStatus = 'draft' | 'published' | 'archived';

type TableDefinition<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type BrandRow = {
  id: string;
  name: string;
  domain: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  created_at: string;
  updated_at: string;
};

export type ProfileRow = {
  id: string;
  auth_user_id: string | null;
  legacy_user_id: number | null;
  legacy_admin_id: number | null;
  legacy_questioner_id: number | null;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  province: string | null;
  city: string | null;
  gender: GenderType | null;
  target_instansi: string | null;
  education: string | null;
  bio: string | null;
  is_active: boolean;
  password_migrated: boolean;
  created_at: string;
  updated_at: string;
};

export type UserRoleRow = {
  id: string;
  profile_id: string | null;
  auth_user_id: string | null;
  legacy_user_id: number | null;
  legacy_admin_id: number | null;
  legacy_questioner_id: number | null;
  role: AppRole;
  created_at: string;
};

export type TryoutCategoryRow = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  created_at: string;
};

export type TryoutListRow = {
  id: string;
  category_id: string | null;
  legacy_id: number | null;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  price: number;
  batch: number;
  type: string;
  whatsapp_link: string | null;
  is_online: boolean;
  is_premium: boolean;
  duration_minutes: number;
  total_questions: number;
  passing_grade: number;
  status: TryoutStatus;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TryoutQuestionRow = {
  id: string;
  tryout_list_id: string;
  legacy_id: number | null;
  legacy_tryout_list_id: number | null;
  question_number: number;
  question_type: string | null;
  category: QuestionCategory;
  question_text: string;
  explanation: string | null;
  image_url: string | null;
  image_explanation_url: string | null;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  option_e: string | null;
  option_image_a: string | null;
  option_image_b: string | null;
  option_image_c: string | null;
  option_image_d: string | null;
  option_image_e: string | null;
  answer_key: string | null;
  score_a: number;
  score_b: number;
  score_c: number;
  score_d: number;
  score_e: number;
  difficulty_level: number;
  created_at: string;
  updated_at: string;
};

export type UserTryoutRow = {
  id: string;
  profile_id: string | null;
  auth_user_id: string | null;
  legacy_user_id: number | null;
  tryout_list_id: string;
  legacy_tryout_list_id: number | null;
  started_at: string;
  finished_at: string | null;
  status: UserTryoutStatus;
  total_score: number;
  ranking: number | null;
  time_spent: number;
  is_passed: boolean;
  created_at: string;
  updated_at: string;
};

export type UserAnswerRow = {
  id: string;
  user_tryout_id: string | null;
  profile_id: string | null;
  auth_user_id: string | null;
  legacy_user_id: number | null;
  tryout_list_id: string;
  legacy_tryout_list_id: number | null;
  question_id: string | null;
  question_number: number;
  selected_answer: string;
  score: number;
  is_doubt: boolean;
  answered_at: string;
};

export type UserScoreRow = {
  id: string;
  user_tryout_id: string | null;
  profile_id: string | null;
  auth_user_id: string | null;
  legacy_user_id: number | null;
  legacy_score_id: number | null;
  tryout_list_id: string;
  legacy_tryout_list_id: number | null;
  twk_score: number;
  tiu_score: number;
  tkp_score: number;
  total_score: number;
  national_ranking: number | null;
  percentile: number | null;
  created_at: string;
  updated_at: string;
};

export type WalletBalanceRow = {
  id: string;
  profile_id: string | null;
  auth_user_id: string | null;
  legacy_user_id: number | null;
  legacy_balance_id: number | null;
  amount: number;
  created_at: string;
  updated_at: string;
};

export type TransactionRow = {
  id: string;
  profile_id: string | null;
  auth_user_id: string | null;
  legacy_user_id: number | null;
  legacy_transaction_id: number | null;
  legacy_payment_id: number | null;
  tryout_list_id: string | null;
  legacy_tryout_list_id: number | null;
  invoice_number: string | null;
  kind: PaymentKind;
  amount: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  promo_code: string | null;
  payment_proof_url: string | null;
  paid_at: string | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
};

export type UserTryoutAccessRow = {
  id: string;
  profile_id: string | null;
  auth_user_id: string | null;
  legacy_user_id: number | null;
  tryout_list_id: string;
  legacy_tryout_list_id: number | null;
  transaction_id: string | null;
  source: string;
  is_done: boolean;
  granted_at: string;
  expires_at: string | null;
  created_at: string;
};

export type InformationItemRow = {
  id: string;
  legacy_id: number | null;
  title: string;
  description: string | null;
  image_url: string | null;
  type: string;
  url: string | null;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
};

export type LinkRow = {
  id: string;
  legacy_id: number | null;
  title: string;
  url: string;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type QuestionBankItemRow = Omit<
  TryoutQuestionRow,
  'tryout_list_id' | 'legacy_id' | 'legacy_tryout_list_id' | 'question_number'
> & {
  source: string | null;
};

export type RankingRow = {
  id: string;
  tryout_list_id: string;
  profile_id: string | null;
  auth_user_id: string | null;
  legacy_user_id: number | null;
  total_score: number;
  rank: number;
  computed_at: string;
};

export type SiteSettingRow = {
  key: string;
  value: Json;
  is_public: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      brands: TableDefinition<BrandRow>;
      profiles: TableDefinition<ProfileRow>;
      user_roles: TableDefinition<UserRoleRow>;
      tryout_categories: TableDefinition<TryoutCategoryRow>;
      tryout_lists: TableDefinition<TryoutListRow>;
      tryout_questions: TableDefinition<TryoutQuestionRow>;
      user_tryouts: TableDefinition<UserTryoutRow>;
      user_answers: TableDefinition<UserAnswerRow>;
      user_scores: TableDefinition<UserScoreRow>;
      wallet_balances: TableDefinition<WalletBalanceRow>;
      transactions: TableDefinition<TransactionRow>;
      user_tryout_access: TableDefinition<UserTryoutAccessRow>;
      information_items: TableDefinition<InformationItemRow>;
      links: TableDefinition<LinkRow>;
      question_bank_items: TableDefinition<QuestionBankItemRow>;
      rankings: TableDefinition<RankingRow>;
      site_settings: TableDefinition<SiteSettingRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      app_role: AppRole;
      tryout_status: TryoutStatus;
      user_tryout_status: UserTryoutStatus;
      payment_status: PaymentStatus;
      payment_kind: PaymentKind;
      payment_method: PaymentMethod;
      question_category: QuestionCategory;
      gender_type: GenderType;
      content_status: ContentStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type TableRow<TableName extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][TableName]['Row'];
