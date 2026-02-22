import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import { User } from '../../types';

interface UserContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  session: null,
  loading: true,
  refresh: async () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    setUser(data ?? null);
  }, []);

  const refresh = useCallback(async () => {
    if (session?.user.id) {
      await fetchProfile(session.user.id);
    }
  }, [session, fetchProfile]);

  // Effetto 1: gestione sessione auth
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session) await fetchProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // Effetto 2: realtime sulla riga dell'utente corrente
  // Separato così userId è già noto quando il canale viene creato
  useEffect(() => {
    if (!session?.user.id) return;

    const userId = session.user.id;

    const channel = supabase
      .channel(`user-profile-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          setUser(payload.new as User);
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session?.user.id]);

  return (
    <UserContext.Provider value={{ user, session, loading, refresh }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
