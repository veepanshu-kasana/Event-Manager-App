'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Navbar from './Navbar';
import type { Session } from '@supabase/supabase-js';

interface UserData {
  role?: string;
  email: string;
}

export default function NavbarWrapper() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function upsertUser(authUser: { id: string; email?: string | null }) {
      const { error } = await supabase
        .from('users')
        .upsert({
          id: authUser.id,
          email: authUser.email ?? null,
        });
      if (error) {
        console.error('Failed to upsert user:', error.message);
      }
    }

    async function fetchUserRole(userId: string) {
      const { data, error } = await supabase
        .from('users')
        .select('role,email')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Failed to fetch user role:', error.message);
        return;
      }
      
      console.log('User role fetched:', data);
      setUser(data);
    }

    async function loadSessionAndUser() {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        return;
      }
      
      setSession(session);
      
      if (session?.user) {
        await upsertUser(session.user);
        await fetchUserRole(session.user.id);
      }
    }

    loadSessionAndUser();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.email);
      setSession(session);
      
      if (session?.user) {
        await upsertUser(session.user);
        await fetchUserRole(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [supabase]);

  return <Navbar currentSession={session} currentUser={user} />;
}
