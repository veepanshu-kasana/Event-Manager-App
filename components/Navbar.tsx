import Link from 'next/link';
import {LogoutButton} from './logout-button';

interface User {
  email: string;
  role?: string;
}

interface NavbarProps {
  currentSession: any | null;
  currentUser?: User | null; // Pass the user info including role here
}

export default function Navbar({ currentSession, currentUser }: NavbarProps) {
  const session = currentSession;
  const user = currentUser;

  if (!session) {
    return (
      <nav className="p-4 flex justify-between items-center bg-gray-100">
        <Link href="/" className="font-bold">Event App</Link>
        <div className="flex space-x-4">
          <Link href="/events">Events</Link>
          <Link href="/auth/login">Login</Link>
        </div>
      </nav>
    );
  }

  const isAdmin = user?.role === 'admin';

  return (
    <nav className="p-4 flex justify-between items-center bg-gray-100">
      <Link href="/" className="font-bold">Event App</Link>
      <div className="flex space-x-4 items-center">
        <Link href="/events">Events</Link>
        {isAdmin && <Link href="/admin">Admin Dashboard</Link>}
        {isAdmin && <Link href="/admin/users">User Management</Link>}
        {isAdmin && <Link href="/admin/chat">AI Chatbot</Link>}
        <span className="text-sm">Hi, {session.user.email}</span>
        <LogoutButton />
      </div>
    </nav>
  );
}
