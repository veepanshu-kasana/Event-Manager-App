import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ChatClient from './ChatClient';

export default async function ChatPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/auth/login');
  }

  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', authUser.id)
    .single();
  
  if (user?.role !== 'admin') {
    redirect('/events');
  }

  return <ChatClient />;
}
