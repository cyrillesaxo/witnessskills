import { useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { AuthContext } from './auth-context';
import { logger } from '../lib/logger';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        logger.error('AuthProvider: failed to restore session', {}, error);
      } else if (session?.user) {
        logger.info('AuthProvider: session restored', { userId: session.user.id });
      }
      setUser(session?.user ?? null);
      logger.setUser(session?.user?.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      logger.setUser(session?.user?.id);
      logger.info('AuthProvider: auth state changed', { event, userId: session?.user?.id });
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    logger.info('AuthProvider: sign-in attempt', { email });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      logger.warn('AuthProvider: sign-in failed', { email, code: (error as { code?: string }).code }, error);
      throw error;
    }
    logger.info('AuthProvider: sign-in success', { email });
  };

  const signUp = async (email: string, password: string) => {
    logger.info('AuthProvider: sign-up attempt', { email });
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      logger.warn('AuthProvider: sign-up failed', { email, code: (error as { code?: string }).code }, error);
      throw error;
    }
    logger.info('AuthProvider: sign-up success', { email });
  };

  const signOut = async () => {
    logger.info('AuthProvider: sign-out', { userId: user?.id });
    const { error } = await supabase.auth.signOut();
    if (error) {
      logger.error('AuthProvider: sign-out failed', {}, error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    logger.info('AuthProvider: password reset requested', { email });
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    });
    if (error) {
      logger.warn('AuthProvider: password reset failed', { email }, error);
      throw error;
    }
    logger.info('AuthProvider: password reset email sent', { email });
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}
