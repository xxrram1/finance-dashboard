// src/hooks/useAuth.tsx

import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
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
  
    if (data.user && !error) {
      // CHANGE: Use .upsert() instead of .insert()
      // This is more robust. It will create a profile if one doesn't exist,
      // or update it if it does. This resolves the "duplicate key" error
      // for users who might already have a profile created via another flow.
      const { error: profileError } = await supabase.from('profiles').upsert(
        {
          id: data.user.id,
          full_name: fullName,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' } // Specify the column to check for conflicts
      );
  
      if (profileError) {
        console.error("Error upserting profile:", profileError.message);
        // Return the profile error because it's the more specific issue now.
        return { error: profileError };
      }
      
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