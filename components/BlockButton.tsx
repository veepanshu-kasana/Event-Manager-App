'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function BlockButton({ user }: { user: { id: string; is_blocked: boolean } }) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggleBlock() {
    setLoading(true);
    const { error } = await supabase
      .from('users')
      .update({ is_blocked: !user.is_blocked })
      .eq('id', user.id);
    setLoading(false);

    if (error) {
      alert('Failed to update user block status: ' + error.message);
    } else {
      router.refresh();
    }
  }

  return (
    <Button
      variant={user.is_blocked ? 'destructive' : 'default'}
      onClick={toggleBlock}
      disabled={loading}
    >
      {user.is_blocked ? 'Unblock' : 'Block'}
    </Button>
  );
}
