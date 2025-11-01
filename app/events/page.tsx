import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ArrowRight, CalendarDays } from 'lucide-react';

export default async function EventsPage() {
  const supabase = await createClient();

  // Fetch only upcoming events, sorted by nearest date first
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .gte('date', new Date().toISOString())
    .order('date', { ascending: true });

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-950 dark:to-slate-900">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Events</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Helper function to format date
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      fullDate: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  // Helper function to get days until event
  const getDaysUntil = (dateString: string) => {
    const eventDate = new Date(dateString);
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `In ${diffDays} days`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
        {/* Header Section */}
        <div className="mb-10 text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
              <CalendarDays className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Upcoming Events
            </h1>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Discover and register for exciting events happening soon
          </p>
          {events && events.length > 0 && (
            <Badge variant="secondary" className="px-4 py-2 text-sm bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border-0">
              {events.length} {events.length === 1 ? 'Event' : 'Events'} Available
            </Badge>
          )}
        </div>

        {/* Events Grid */}
        {!events || events.length === 0 ? (
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="pt-12 pb-12">
              <CalendarDays className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
              <CardTitle className="mb-2">No Upcoming Events</CardTitle>
              <CardDescription>
                There are no upcoming events scheduled at the moment. Check back soon!
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {events.map((event) => {
              const dateInfo = formatEventDate(event.date);
              const daysUntil = getDaysUntil(event.date);
              
              return (
                <Card 
                  key={event.id} 
                  className="group overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 hover:border-indigo-300 dark:hover:border-indigo-700 flex flex-col"
                >
                  {/* Event Banner */}
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600">
                    {event.banner_url ? (
                      <Image
                        src={event.banner_url}
                        alt={event.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Calendar className="w-20 h-20 text-white/30" />
                      </div>
                    )}
                    
                    {/* Date Badge */}
                    <div className="absolute top-4 right-4 bg-white dark:bg-gray-900 rounded-lg shadow-xl p-3 text-center min-w-[70px]">
                      <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 leading-none">
                        {dateInfo.day}
                      </div>
                      <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mt-1">
                        {dateInfo.month}
                      </div>
                    </div>

                    {/* Days Until Badge */}
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 shadow-lg">
                        {daysUntil}
                      </Badge>
                    </div>
                  </div>

                  {/* Event Details */}
                  <CardHeader className="flex-grow">
                    <CardTitle className="text-xl group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                      {event.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {event.description || 'Join us for an amazing event experience!'}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>{dateInfo.fullDate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>{dateInfo.time}</span>
                    </div>
                  </CardContent>

                  <CardFooter>
                    <Link href={`/events/${event.id}`} className="w-full">
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 group/btn"
                      >
                        View Details
                        <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
