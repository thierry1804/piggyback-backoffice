import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { SUPERADMIN_ROLE_ID } from '@/lib/constants';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function isSuperadmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('role_id')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return false;
  return data.role_id === SUPERADMIN_ROLE_ID;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const signOut = useCallback(async () => {
    setError(null);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) {
        const message =
          authError.message === 'Invalid login credentials'
            ? 'Email ou mot de passe incorrect.'
            : authError.message;
        setError(message);
        throw authError;
      }
      const allowed = await isSuperadmin(data.user.id);
      if (!allowed) {
        await supabase.auth.signOut();
        setError('Accès réservé aux superadministrateurs.');
        return;
      }
      setUser(data.user);
      setSession(data.session);
    } catch {
      // Erreur déjà gérée via setError
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    async function verifyAndSetSession(session: Session | null) {
      if (!session) {
        setSession(null);
        setUser(null);
        setIsLoading(false);
        return;
      }
      const allowed = await isSuperadmin(session.user.id);
      if (!allowed) {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setIsLoading(false);
        return;
      }
      setSession(session);
      setUser(session.user);
      setIsLoading(false);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void verifyAndSetSession(session);
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      void verifyAndSetSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value: AuthContextValue = {
    user,
    session,
    isLoading,
    error,
    signIn,
    signOut,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}
