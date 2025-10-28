import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import DeleteEventButton from './DeleteEventButton';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();
  
  if (user?.role !== 'admin') {
    redirect('/events'); // or show unauthorized error
  }

  // Fetch all events (for management)
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true });

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard - Event Management</h1>
        <p className="text-red-600">Error loading events: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-10">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard - Event Management</h1>

      <Link href="/admin/AdminForm">
        <Button>Add New Event</Button>
      </Link>

      {!events || events.length === 0 ? (
        <p className="text-muted-foreground">No events found. Create your first event!</p>
      ) : (
        <ul className="space-y-4 mt-8">
          {events.map(event => (
          <Card key={event.id} className="p-4 flex justify-between items-center">
            <div>
              <Link href={`/events/${event.id}`}>
                <h2 className="text-xl font-semibold cursor-pointer hover:underline">{event.title}</h2>
              </Link>
              <p>{new Date(event.date).toLocaleString()}</p>
            </div>
            <div className="space-x-2">
              <Link href={`/admin/AdminForm?id=${event.id}`}>
                <Button variant="outline">Edit</Button>
              </Link>
              <DeleteEventButton eventId={event.id} />
            </div>
          </Card>
        ))}
        </ul>
      )}
    </div>
  );
}
