'use client';

import Link from 'next/link';
import {LogoutButton} from './logout-button';
import {ThemeSwitcher} from './theme-switcher';
import type { Session } from '@supabase/supabase-js';

interface User {
  email: string;
  role?: string;
}

interface NavbarProps {
  currentSession: Session | null;
  currentUser?: User | null;
}

export default function Navbar({ currentSession, currentUser }: NavbarProps) {
  const session = currentSession;
  const user = currentUser;

  if (!session) {
    return (
      <nav className="p-4 flex justify-between items-center bg-muted border-b">
        <Link href="/" className="font-bold text-lg">Event App</Link>
        <div className="flex space-x-4 items-center">
          <Link href="/events" className="hover:underline">Events</Link>
          <Link href="/auth/login" className="hover:underline">Login</Link>
          <ThemeSwitcher />
        </div>
      </nav>
    );
  }

  const isAdmin = user?.role === 'admin';

  return (
    <nav className="p-4 flex justify-between items-center bg-muted border-b">
      <Link href="/" className="font-bold text-lg">Event App</Link>
      <div className="flex space-x-4 items-center">
        <Link href="/events" className="hover:underline">Events</Link>
        {isAdmin && <Link href="/admin" className="hover:underline">Admin Dashboard</Link>}
        {isAdmin && <Link href="/admin/users" className="hover:underline">User Management</Link>}
        {isAdmin && <Link href="/admin/chat" className="hover:underline">AI Chatbot</Link>}
        <span className="text-sm">Hi, {session?.user?.email?.split("@")[0]?.replace(/\d+$/, "") || "Unknown"}</span>
        <ThemeSwitcher />
        <LogoutButton />
      </div>
    </nav>
  );
}
