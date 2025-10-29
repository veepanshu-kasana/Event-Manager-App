import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import RegisterButton from './RegisterButton';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

interface EventProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailsPage({ params }: EventProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !event) {
    notFound();
  }

  // Fetch current user's id from session
  const { data: { session } } = await supabase.auth.getSession();

  // Fetch current user role only if logged in
  let currentUserRole = null;
  let isUserRegistered = false;
  let userId = null;
  let isUserBlocked = false;
  
  if (session) {
    userId = session.user.id;
    
    const { data: user } = await supabase
      .from('users')
      .select('role, is_blocked')
      .eq('id', session.user.id)
      .single();
    currentUserRole = user?.role ?? null;
    isUserBlocked = user?.is_blocked ?? false;
    
    // Check if current user is registered for this event
    const { data: registration } = await supabase
      .from('registrations')
      .select('*')
      .eq('user_id', userId)
      .eq('event_id', id)
      .single();
    
    isUserRegistered = !!registration;
  }

  // Fetch count of registered users for this event
  const { count: registrationCount, error: regError } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true }) // efficient count query
    .eq('event_id', id);


  // Determine if the event is in the future
  const eventDate = new Date(event.date);
  const isFutureEvent = eventDate >= new Date();

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <Card className="p-6 space-y-4">
        <h1 className="text-3xl font-bold">{event.title}</h1>
        {event.banner_url && (
          <img src={event.banner_url} alt={event.title} className="w-full h-60 object-cover rounded" />
        )}
        <p>{event.description}</p>
        <p className="font-semibold">Date: {eventDate.toLocaleString()}</p>
        
        {/* Only render link if current user is admin */}
        <p>Total Registered Users: {currentUserRole === 'admin' ? (
          <Link href={`/admin/events/${event.id}/registrations`} className="text-blue-600 underline">
            {registrationCount ?? 0}
          </Link>
        ) : (
          registrationCount ?? 0
        )}</p>
        
        {isFutureEvent ? (
          <RegisterButton eventId={event.id} userId={userId} isRegistered={isUserRegistered} isBlocked={isUserBlocked} />
        ) : (
          <p className="text-red-500 font-semibold">Registration is closed for this past event.</p>
        )}
      </Card>
    </div>
  );
}
