'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

interface User {
  id: string;
  email: string;
  role: string;
}

interface UserRowProps {
  user: User;
}

export default function UserRow({ user }: UserRowProps) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function deleteUser() {
    if (!confirm(`Delete user ${user.email}? This action cannot be undone.`)) return;
    setLoading(true);
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', user.id);
    setLoading(false);

    if (error) {
      alert('Error deleting user: ' + error.message);
    } else {
      location.reload();
    }
  }

  return (
    <li className="flex justify-between items-center border p-3 rounded">
      <span>{user.email} ({user.role})</span>
      <Button onClick={deleteUser} disabled={loading} variant="destructive">
        Delete
      </Button>
    </li>
  );
}
