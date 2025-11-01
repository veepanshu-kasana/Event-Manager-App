'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';

export default function DeleteEventButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;

    setLoading(true);
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    setLoading(false);
    if (!error) {
      router.refresh();
    } else {
      alert('Delete failed: ' + error.message);
    }
  }

  return (
    <Button 
      variant="destructive" 
      size="icon"
      onClick={handleDelete} 
      disabled={loading}
      className="shrink-0"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </Button>
  );
}
