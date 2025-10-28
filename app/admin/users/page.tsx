// Server component part
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import React from 'react';
import UserRow from './UserRow'; // client component for delete button row

interface User {
  id: string;
  email: string;
  role: string;
}

export default async function UsersPage() {
  const supabase = await createClient();

  // Check authentication
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect('/auth/login');
  }

  // Check admin role
  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (currentUser?.role !== 'admin') {
    redirect('/events');
  }

  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, role')
    .order('email');

  if (error) return <p>Error loading users: {error.message}</p>;
  if (!users || users.length === 0) return <p>No users found</p>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      <ul className="space-y-2">
        {users.map((user: User) => (
          <UserRow key={user.id} user={user} />
        ))}
      </ul>
    </div>
  );
}
