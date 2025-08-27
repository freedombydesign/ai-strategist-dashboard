'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase-client';

interface Profile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  business_name?: string;
  industry?: string;
  company_size?: string;
  goals?: string[];
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ data: any; error: any }>;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ data: any; error: any }>;
  supabase: SupabaseClient;
}

// Using centralized supabase client

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await getProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      await getProfile(session.user.id);
    }
    setLoading(false);
  }

  async function getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setProfile(data);
    } else if (error && error.code === 'PGRST116') {
      // Profile doesn't exist, create one
      await createProfile(userId);
    }
  }

  async function createProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .insert([
        {
          id: userId,
          email: user?.email,
          full_name: user?.user_metadata?.full_name || '',
        }
      ])
      .select()
      .single();

    if (data) {
      setProfile(data);
    }
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });
    return { data, error };
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  async function updateProfile(updates: Partial<Profile>) {
    if (!user) return { data: null, error: { message: 'No user logged in' } };

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (data) {
      setProfile(data);
    }
    return { data, error };
  }

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    supabase
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}