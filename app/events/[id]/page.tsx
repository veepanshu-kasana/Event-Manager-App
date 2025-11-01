import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import RegisterButton from './RegisterButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';

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

  // Fetch current user
  const { data: { user: authUser } } = await supabase.auth.getUser();

  // Fetch current user role only if logged in
  let currentUserRole = null;
  let isUserRegistered = false;
  let userId = null;
  let isUserBlocked = false;
  
  if (authUser) {
    userId = authUser.id;
    
    const { data: user } = await supabase
      .from('users')
      .select('role, is_blocked')
      .eq('id', authUser.id)
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
  const { count: registrationCount } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', id);

  // Event date information
  const eventDate = new Date(event.date);
  const isFutureEvent = eventDate >= new Date();
  
  const formatEventDate = () => {
    return {
      day: eventDate.getDate(),
      month: eventDate.toLocaleDateString('en-US', { month: 'short' }),
      fullDate: eventDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: eventDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const dateInfo = formatEventDate();

  const getDaysUntil = () => {
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 0) return 'Past Event';
    return `In ${diffDays} days`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-slate-900 dark:to-indigo-950">
      {/* Back Button */}
      <div className="container mx-auto px-4 pt-8">
        <Link href="/events">
          <Button variant="outline" className="group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Events
          </Button>
        </Link>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Hero Banner Section */}
        <div className="relative h-[400px] rounded-2xl overflow-hidden mb-8 shadow-2xl">
          {event.banner_url ? (
            <Image
              src={event.banner_url}
              alt={event.title}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center">
              <Calendar className="w-32 h-32 text-white/30" />
            </div>
          )}
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          
          {/* Event Title & Status */}
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1">
                <Badge className={`mb-4 ${
                  isFutureEvent 
                    ? 'bg-emerald-500 hover:bg-emerald-600' 
                    : 'bg-slate-500 hover:bg-slate-600'
                } text-white border-0 text-sm px-3 py-1`}>
                  {getDaysUntil()}
                </Badge>
                <h1 className="text-4xl sm:text-5xl font-black text-white mb-2 drop-shadow-lg">
                  {event.title}
                </h1>
              </div>
              
              {/* Date Badge */}
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-4 text-center min-w-[90px]">
                <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400 leading-none">
                  {dateInfo.day}
                </div>
                <div className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase mt-1">
                  {dateInfo.month}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description Card */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl">About This Event</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed whitespace-pre-wrap">
                  {event.description || 'Join us for an amazing event experience!'}
                </p>
              </CardContent>
            </Card>

            {/* Registration Status */}
            {isUserRegistered && (
              <Card className="border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-emerald-900 dark:text-emerald-100 text-lg">
                        You&apos;re Registered!
                      </h3>
                      <p className="text-emerald-700 dark:text-emerald-300 text-sm">
                        We look forward to seeing you at this event
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isUserBlocked && (
              <Card className="border-2 border-red-200 dark:border-red-800 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
                      <XCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-red-900 dark:text-red-100 text-lg">
                        Account Blocked
                      </h3>
                      <p className="text-red-700 dark:text-red-300 text-sm">
                        Your account has been blocked. You cannot register for events.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Event Details Card */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
                <CardDescription>Important information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Date</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{dateInfo.fullDate}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Time</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{dateInfo.time}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Registered Attendees</p>
                    {currentUserRole === 'admin' ? (
                      <Link 
                        href={`/admin/events/${event.id}/registrations`}
                        className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        {registrationCount ?? 0} {registrationCount === 1 ? 'person' : 'people'}
                      </Link>
                    ) : (
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {registrationCount ?? 0} {registrationCount === 1 ? 'person' : 'people'}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Registration Action Card */}
            <Card className="border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950">
              <CardHeader>
                <CardTitle className="text-lg">
                  {isFutureEvent ? 'Join This Event' : 'Event Ended'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isFutureEvent ? (
                  <RegisterButton 
                    eventId={event.id} 
                    userId={userId} 
                    isRegistered={isUserRegistered} 
                    isBlocked={isUserBlocked}
                  />
                ) : (
                  <div className="text-center py-4">
                    <XCircle className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                    <p className="text-slate-600 dark:text-slate-400 font-medium">
                      Registration is closed for this past event
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
