'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, UserPlus, LogIn } from 'lucide-react';

interface RegisterButtonProps {
  eventId: string;
  userId: string | null;
  isRegistered: boolean;
  isBlocked: boolean;
}

export default function RegisterButton({ eventId, userId, isRegistered, isBlocked }: RegisterButtonProps) {
  const router = useRouter();
  const [registered, setRegistered] = useState(isRegistered);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!userId) {
      router.push('/auth/login');
      return;
    }

    if (isBlocked) {
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from('registrations').insert({
      user_id: userId,
      event_id: eventId,
    });
    setLoading(false);

    if (error) {
      if (error.code === '23505') {
        alert('You have already registered for this event.');
        setRegistered(true);
      } else {
        alert('Registration failed: ' + error.message);
      }
    } else {
      setRegistered(true);
      router.refresh();
    }
  };

  if (isBlocked) {
    return null;
  }

  if (registered) {
    return (
      <div className="text-center py-2">
        <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-bold">Already Registered</span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          You&apos;re all set for this event!
        </p>
      </div>
    );
  }

  if (!userId) {
    return (
      <Button 
        onClick={handleRegister}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-12 text-base font-bold shadow-lg hover:shadow-xl transition-all duration-300"
      >
        <LogIn className="w-5 h-5 mr-2" />
        Login to Register
      </Button>
    );
  }

  return (
    <Button 
      onClick={handleRegister} 
      disabled={loading}
      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 h-12 text-base font-bold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Registering...
        </>
      ) : (
        <>
          <UserPlus className="w-5 h-5 mr-2" />
          Register for Event
        </>
      )}
    </Button>
  );
}
