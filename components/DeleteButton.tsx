'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function DeleteButton({ userId, eventId }: { userId: string; eventId: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function deleteRegistration() {
    if (!confirm('Delete registration for this user?')) return;
    setLoading(true);

    const { error } = await supabase
      .from('registrations')
      .delete()
      .eq('user_id', userId)
      .eq('event_id', eventId);
    setLoading(false);

    if (error) {
      alert('Failed to delete registration: ' + error.message);
    } else {
      router.refresh();
    }
  }

  return (
    <Button variant="destructive" onClick={deleteRegistration} disabled={loading}>
      Delete
    </Button>
  );
}
