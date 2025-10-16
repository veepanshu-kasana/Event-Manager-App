'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Navbar from './Navbar';

export default function NavbarWrapper() {
  const supabase = createClient();

  const [session, setSession] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    async function loadSessionAndUser() {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session?.user) {
        await upsertUser(session.user);
        fetchUserRole(session.user.id);
      }
    }

    loadSessionAndUser();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        await upsertUser(session.user);
        fetchUserRole(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  async function upsertUser(user: { id: string; email?: string | null }) {
    const { error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email ?? null,
      });
    if (error) {
      console.error('Failed to upsert user:', error.message);
    }
  }

  async function fetchUserRole(userId: string) {
    const { data } = await supabase
      .from('users')
      .select('role,email')
      .eq('id', userId)
      .single();
    setUser(data);
  }

  return <Navbar currentSession={session} currentUser={user} />;
}
