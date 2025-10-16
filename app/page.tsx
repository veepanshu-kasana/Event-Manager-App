import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {LogoutButton} from "@/components/logout-button";

export default async function Home() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl text-center mt-32 space-y-8">
        <h1 className="text-4xl font-bold">Welcome to the Event App</h1>
        <p className="text-lg text-gray-600">
          Browse upcoming and past events, register for events, or log in as an admin to manage your events.
        </p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mt-10">
          <Link href="/events">
            <span className="px-6 py-3 bg-blue-600 rounded text-white font-semibold hover:bg-blue-700 transition">Browse Events</span>
          </Link>

          {!session ? (
            <Link href="/auth/login">
              <span className="px-6 py-3 border border-blue-600 rounded text-blue-600 font-semibold hover:bg-blue-50 transition">Admin Login</span>
            </Link>
          ) : (
            <div className="flex items-center gap-4">
              <p className="text-sm">Logged in as {session.user.email}</p>
              <LogoutButton />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
