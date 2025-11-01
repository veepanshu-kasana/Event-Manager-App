import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import BlockButton from '@/components/BlockButton';
import DeleteButton from '@/components/DeleteButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Mail, ShieldAlert } from 'lucide-react';

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

  if (regError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-950 dark:to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Registrations</CardTitle>
            <CardDescription>{regError.message}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        {/* Back Button */}
        <Link href="/admin">
          <Button variant="outline" className="mb-6 group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Button>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Event Registrations
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-1">
                {event.title}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="px-4 py-2">
            {registrations?.length || 0} {registrations?.length === 1 ? 'Registration' : 'Registrations'}
          </Badge>
        </div>

        {/* Registrations List */}
        {!registrations?.length ? (
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="pt-12 pb-12">
              <Users className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
              <CardTitle className="mb-2">No Registrations Yet</CardTitle>
              <CardDescription>
                No users have registered for this event yet.
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {registrations.map((registration: Registration) => {
              const user = Array.isArray(registration.user)
                ? registration.user[0]
                : registration.user;
            
              return user && (
                <Card 
                  key={user.id} 
                  className={`border-2 hover:shadow-lg transition-all ${
                    user.is_blocked 
                      ? 'border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-950/30' 
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* User Info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${
                          user.is_blocked 
                            ? 'bg-gradient-to-br from-red-500 to-red-700' 
                            : 'bg-gradient-to-br from-blue-500 to-cyan-600'
                        }`}>
                          {user.email.charAt(0).toUpperCase()}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base sm:text-lg truncate">
                              {user.email.split('@')[0]}
                            </h3>
                            {user.is_blocked && (
                              <Badge variant="destructive" className="text-xs">
                                <ShieldAlert className="w-3 h-3 mr-1" />
                                Blocked
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <Mail className="w-4 h-4 shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <BlockButton user={user} />
                        <DeleteButton userId={user.id} eventId={id} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
