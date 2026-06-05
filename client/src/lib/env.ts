const fallbackSupabaseUrl = 'https://wmefmwezfjraqfauwmrg.supabase.co';
const fallbackSupabaseKey = 'sb_publishable_MpUXg_5U-NBo9758kmRqNA_gvPc3TjG';

export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || fallbackSupabaseUrl,
  supabasePublishableKey:
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || fallbackSupabaseKey,
};
