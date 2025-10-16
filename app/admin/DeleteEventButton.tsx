'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function DeleteEventButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this event?')) return;

    setLoading(true);
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    setLoading(false);
    if (!error) {
      alert('Event deleted!');
      router.refresh();
    } else {
      alert('Delete failed: ' + error.message);
    }
  }

  return (
    <Button variant="destructive" onClick={handleDelete} disabled={loading}>
      {loading ? 'Deleting...' : 'Delete'}
    </Button>
  );
}
