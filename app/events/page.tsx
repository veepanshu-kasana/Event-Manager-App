import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function EventsPage() {
  const supabase = await createClient();

  const { data: events, error } = await supabase
    .from('events')
    .select('*')
     // .gte('date', new Date().toISOString()) // shows only upcoming events
    .order('date', { ascending: true });

  if (error) {
    return <div>Error loading events: {error.message}</div>;
  }

  if (!events || events.length === 0) {
    return <div>No events found</div>;
  }

  // Split events into upcoming and past
  const now = new Date();
  const upcomingEvents = events.filter((event) => new Date(event.date) >= now);
  const pastEvents = events.filter((event) => new Date(event.date) < now);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-10">
      {/* Upcoming Events Section */}
      <section>
        <h1 className="text-2xl font-bold mb-4">Upcoming Events</h1>
        {upcomingEvents.length === 0 ? (
          <p className="text-gray-500">No upcoming events</p>
        ) : (
          <ul className="space-y-4">
            {upcomingEvents.map((event) => (
              <li key={event.id}>
                <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
                  <Link
                    href={`/events/${event.id}`}
                    className="flex items-center space-x-4"
                  >
                    {event.banner_url && (
                      <Image
                        src={event.banner_url}
                        alt={event.title}
                        width={128}
                        height={80}
                        className="w-32 h-20 object-cover rounded"
                      />
                    )}
                    <div>
                      <h2 className="text-xl font-semibold">{event.title}</h2>
                      <p>{new Date(event.date).toLocaleString()}</p>
                    </div>
                    <Button variant="outline" className="ml-auto">
                      View Details
                    </Button>
                  </Link>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Past Events Section */}
      <section>
        <h1 className="text-2xl font-bold mb-4">Past Events</h1>
        {pastEvents.length === 0 ? (
          <p className="text-gray-500">No past events</p>
        ) : (
          <ul className="space-y-4">
            {pastEvents.map((event) => (
              <li key={event.id}>
                <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
                  <Link
                    href={`/events/${event.id}`}
                    className="flex items-center space-x-4"
                  >
                    {event.banner_url && (
                      <Image
                        src={event.banner_url}
                        alt={event.title}
                        width={128}
                        height={80}
                        className="w-32 h-20 object-cover rounded"
                      />
                    )}
                    <div>
                      <h2 className="text-xl font-semibold">{event.title}</h2>
                      <p>{new Date(event.date).toLocaleString()}</p>
                    </div>
                    <Button variant="outline" className="ml-auto">
                      View Details
                    </Button>
                  </Link>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
