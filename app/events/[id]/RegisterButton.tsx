'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client'; // your existing import pattern
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface RegisterButtonProps {
  eventId: string;
}

export default function RegisterButton({ eventId }: RegisterButtonProps) {
  const supabase = createClient(); // call your createClient function
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkRegistration() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.user) {
          setUser(null);
          setRegistered(false);
          return;
        }
  
        setUser(session.user);
  
        const { data, error } = await supabase
          .from('registrations')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('event_id', eventId)
          .single();
  
        if (error) {
          setRegistered(false);
          return;
        }
  
        setRegistered(!!data);
      } catch (e) {
        setUser(null);
        setRegistered(false);
      }
    }
    checkRegistration();
  }, [eventId]);

  const handleRegister = async () => {
    if (!user) {
      alert('Please log in to register');
      router.push('/auth/login');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('registrations').insert({
      user_id: user.id,
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
      alert('Registration successful!');
    }
  };

  if (registered) {
    return <p className="text-green-600 font-semibold">You are already registered for this event.</p>;
  }

  return (
    <Button onClick={handleRegister} disabled={loading}>
      {loading ? 'Registering...' : 'Register for this Event'}
    </Button>
  );
}
