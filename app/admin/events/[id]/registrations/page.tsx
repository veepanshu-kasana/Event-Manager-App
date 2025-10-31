import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import BlockButton from '@/components/BlockButton';
import DeleteButton from '@/components/DeleteButton';

interface UserData {
  id: string;
  email: string;
  is_blocked: boolean;
}

interface Registration {
  user_id: string;
  user: UserData | UserData[] | null;
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EventRegistrationsPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // Check authentication - get fresh user data from Supabase
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    redirect('/auth/login');
  }

  // Check admin role
  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', authUser.id)
    .single();

  if (currentUser?.role !== 'admin') {
    redirect('/events');
  }

  // Fetch event info
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('title')
    .eq('id', id)
    .single();

  if (eventError || !event) notFound();

  // Fetch registrations with user details
  const { data: registrations, error: regError } = await supabase
    .from('registrations')
    .select('user_id, user:users(id,email,is_blocked)')
    .eq('event_id', id);

  if (regError) return <p>Error loading registrations: {regError.message}</p>;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-4">
        Registrations for: {event.title}
      </h1>

      {!registrations?.length && <p>No users registered for this event.</p>}

      <ul className="space-y-4">
        {registrations?.map((registration: Registration) => {
          const user = Array.isArray(registration.user)
            ? registration.user[0]
            : registration.user;
        
          return user && (
            <li key={user.id} className="flex justify-between items-center border p-3 rounded">
              <span>
                {user.email}{' '}
                {user.is_blocked && <span className="text-red-600">(Blocked)</span>}
              </span>
              <div className="flex gap-2">
                <BlockButton user={user} />
                <DeleteButton userId={user.id} eventId={id} />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  );
}
