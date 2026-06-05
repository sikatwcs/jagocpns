/* eslint-disable react-refresh/only-export-components */
import type { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { supabase } from '../../lib/supabase/client';
import type { AppRole, ProfileRow } from '../../lib/supabase/database.types';

type SignUpPayload = {
  email: string;
  password: string;
  fullName: string;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: ProfileRow | null;
  roles: AppRole[];
  loading: boolean;
  isAdmin: boolean;
  isQuestioner: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: SignUpPayload) => Promise<void>;
  signOut: () => Promise<void>;
  reloadProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const loadProfile = async (user: User | null) => {
  if (!user) {
    return { profile: null, roles: [] as AppRole[] };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (profileError) throw profileError;

  const { data: roles, error: rolesError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('auth_user_id', user.id);

  if (rolesError) throw rolesError;

  return {
    profile,
    roles: (roles ?? []).map((item) => item.role),
  };
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const reloadProfile = useCallback(async () => {
    const currentUser = session?.user ?? null;
    const next = await loadProfile(currentUser);
    setProfile(next.profile);
    setRoles(next.roles);
  }, [session?.user]);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      setLoading(true);
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!active) return;

      setSession(data.session);
      const next = await loadProfile(data.session?.user ?? null);
      if (!active) return;
      setProfile(next.profile);
      setRoles(next.roles);
      setLoading(false);
    };

    void bootstrap().catch(() => {
      if (active) setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        void loadProfile(nextSession?.user ?? null).then((next) => {
          setProfile(next.profile);
          setRoles(next.roles);
        });
      },
    );

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async ({ email, password, fullName }: SignUpPayload) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      roles,
      loading,
      isAdmin: roles.includes('admin'),
      isQuestioner: roles.includes('questioner'),
      signIn,
      signUp,
      signOut,
      reloadProfile,
    }),
    [loading, profile, reloadProfile, roles, session, signIn, signOut, signUp],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return value;
};
