import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import BlockButton from '@/components/BlockButton';
import DeleteButton from '@/components/DeleteButton';

interface Registration {
  user_id: string;
  user: {
    id: string;
    email: string;
    is_blocked: boolean;
  } | null;
}

interface Props {
  params: { id: string };
}

export default async function EventRegistrationsPage({ params }: Props) {
  const supabase = await createClient();

  // Fetch event info
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('title')
    .eq('id', params.id)
    .single();

  if (eventError || !event) notFound();

  // Fetch registrations with user details
  const { data: registrations, error: regError } = await supabase
    .from('registrations')
    .select('user_id, user:users(id,email,is_blocked)')
    .eq('event_id', params.id);

  if (regError) return <p>Error loading registrations: {regError.message}</p>;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-4">
        Registrations for: {event.title}
      </h1>

      {!registrations?.length && <p>No users registered for this event.</p>}

      <ul className="space-y-4">
        {registrations?.map((registration: any) => {
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
                <DeleteButton userId={user.id} eventId={params.id} />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  );
}
