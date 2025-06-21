// src/hooks/useAuth.tsx

import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useMemo } from 'react'; // Added useMemo
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>; // Added refreshUser method
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to refresh the user data from Supabase
  const refreshUser = useCallback(async () => {
    setLoading(true);
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();
    if (error) {
      console.error("Error refreshing user:", error.message);
      setUser(null);
      setSession(null);
    } else {
      setUser(supabaseUser);
    }
    setLoading(false);
  }, []); 

  useEffect(() => {
    // Initial session and user fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        // Only set loading to false if not already loading for an explicit refreshUser call
        if (event !== 'INITIAL' && event !== 'SIGNED_IN') { 
           setLoading(false); 
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    // On successful signup, data.user will contain the user, update state
    if (data.user) {
      setUser(data.user);
      setSession(data.session);
    }
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    // On successful signin, data.user will contain the user, update state
    if (data.user) {
        setUser(data.user);
        setSession(data.session);
    }
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null); 
    setSession(null);
  };

  const value = useMemo(() => ({
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    refreshUser 
  }), [user, session, loading, signUp, signIn, signOut, refreshUser]); 

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};