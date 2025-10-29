'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

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
      alert('Please log in to register');
      router.push('/auth/login');
      return;
    }

    if (isBlocked) {
      alert('Your account has been blocked. You cannot register for events.');
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
      } else {
        alert('Registration failed: ' + error.message);
      }
    } else {
      setRegistered(true);
      router.refresh();
      alert('Registration successful!');
    }
  };

  if (isBlocked) {
    return <p className="text-red-600 font-semibold">Your account is blocked. You cannot register for events.</p>;
  }

  if (registered) {
    return <p className="text-green-600 font-semibold">You are already registered for this event.</p>;
  }

  return (
    <Button onClick={handleRegister} disabled={loading}>
      {loading ? 'Registering...' : 'Register for this Event'}
    </Button>
  );
}
