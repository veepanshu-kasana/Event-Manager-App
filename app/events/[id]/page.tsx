import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import RegisterButton from './RegisterButton';
import { Card } from '@/components/ui/card';

interface EventProps {
  params: { id: string };
}

export default async function EventDetailsPage({ params }: EventProps) {
  const supabase = await createClient();

  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !event) {
    notFound();
  }

  // Fetch count of registered users for this event
  const { count: registrationCount, error: regError } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true }) // efficient count query
    .eq('event_id', params.id);


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
        <p>Total Registered Users: {registrationCount ?? 0}</p>
        {isFutureEvent ? (
          <RegisterButton eventId={event.id} />
        ) : (
          <p className="text-red-500 font-semibold">Registration is closed for this past event.</p>
        )}
      </Card>
    </div>
  );
}
