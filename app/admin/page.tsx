import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DeleteEventButton from './DeleteEventButton';
import { Calendar, CalendarPlus, TrendingUp, Clock, Edit, Eye, LayoutDashboard } from 'lucide-react';

export default async function AdminPage() {
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

  // Fetch all events
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true });

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-950 dark:to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Dashboard</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Split events into upcoming and past
  const now = new Date();
  const upcomingEvents = events?.filter(event => new Date(event.date) >= now) || [];
  const pastEvents = events?.filter(event => new Date(event.date) < now) || [];
  
  // Sort: upcoming events first (ascending), then past events (descending)
  const sortedEvents = [
    ...upcomingEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    ...pastEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  ];

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

  const isUpcoming = (dateString: string) => new Date(dateString) >= now;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
        
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-xl">
              <LayoutDashboard className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-1">
                Manage your events and track performance
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 mb-10">
          <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Events</CardTitle>
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-3xl font-black text-blue-900 dark:text-blue-100">
                {events?.length || 0}
              </div>
            </CardHeader>
          </Card>

          <Card className="border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Upcoming</CardTitle>
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-3xl font-black text-emerald-900 dark:text-emerald-100">
                {upcomingEvents.length}
              </div>
            </CardHeader>
          </Card>

          <Card className="border-2 border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">Past Events</CardTitle>
                <Clock className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-slate-100">
                {pastEvents.length}
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Add New Event Button */}
        <div className="mb-8">
          <Link href="/admin/AdminForm">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-300 h-14 px-8 text-lg font-bold"
            >
              <CalendarPlus className="w-5 h-5 mr-2" />
              Create New Event
            </Button>
          </Link>
        </div>

        {/* Events Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
              All Events
            </h2>
            <Badge variant="secondary" className="px-3 py-1">
              {sortedEvents.length} Total
            </Badge>
          </div>

          {!sortedEvents || sortedEvents.length === 0 ? (
            <Card className="max-w-md mx-auto text-center">
              <CardContent className="pt-12 pb-12">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                <CardTitle className="mb-2">No Events Yet</CardTitle>
                <CardDescription className="mb-6">
                  Create your first event to get started!
                </CardDescription>
                <Link href="/admin/AdminForm">
                  <Button>
                    <CalendarPlus className="w-4 h-4 mr-2" />
                    Create Event
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {sortedEvents.map((event) => {
                const dateInfo = formatEventDate(event.date);
                const upcoming = isUpcoming(event.date);
                
                return (
                  <Card 
                    key={event.id} 
                    className={`group overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 flex flex-col ${
                      upcoming 
                        ? 'hover:border-emerald-300 dark:hover:border-emerald-700 bg-gradient-to-br from-emerald-50/30 to-transparent dark:from-emerald-950/30' 
                        : 'hover:border-slate-300 dark:hover:border-slate-700 opacity-75'
                    }`}
                  >
                    {/* Event Banner */}
                    <div className="relative h-40 overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600">
                      {event.banner_url ? (
                        <Image
                          src={event.banner_url}
                          alt={event.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Calendar className="w-16 h-16 text-white/30" />
                        </div>
                      )}
                      
                      {/* Status Badge */}
                      <div className="absolute top-3 left-3">
                        <Badge className={upcoming 
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-0 shadow-lg' 
                          : 'bg-slate-500 hover:bg-slate-600 text-white border-0 shadow-lg'
                        }>
                          {upcoming ? 'Upcoming' : 'Completed'}
                        </Badge>
                      </div>

                      {/* Date Badge */}
                      <div className="absolute top-3 right-3 bg-white dark:bg-gray-900 rounded-lg shadow-xl p-2 text-center min-w-[60px]">
                        <div className="text-2xl font-black text-violet-600 dark:text-violet-400 leading-none">
                          {dateInfo.day}
                        </div>
                        <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                          {dateInfo.month}
                        </div>
                      </div>
                    </div>

                    {/* Event Details */}
                    <CardHeader className="flex-grow">
                      <CardTitle className="text-lg line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        {event.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {event.description || 'No description provided'}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-2 pb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Calendar className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        <span className="line-clamp-1">{dateInfo.fullDate}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Clock className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        <span>{dateInfo.time}</span>
                      </div>
                    </CardContent>

                    {/* Actions */}
                    <CardFooter className="flex gap-2 pt-0">
                      <Link href={`/events/${event.id}`} className="flex-1">
                        <Button variant="outline" className="w-full group/btn">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/admin/AdminForm?id=${event.id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </Link>
                      <DeleteEventButton eventId={event.id} />
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
