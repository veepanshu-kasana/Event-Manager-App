import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import AdminForm from './AdminForm'; // Your admin form component from previous step

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login'); // or whatever your login path is
  }

  return (
    <Suspense fallback={<p>Loading...</p>}>
      <AdminForm />
    </Suspense>
  );
}
