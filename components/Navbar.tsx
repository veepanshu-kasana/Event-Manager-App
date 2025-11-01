'use client';

import Link from 'next/link';
import { LogoutButton } from './logout-button';
import { ThemeSwitcher } from './theme-switcher';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Calendar, Menu, LayoutDashboard, Users, CalendarCheck, LogOut } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  email: string;
  role?: string;
}

interface NavbarProps {
  currentSession: SupabaseUser | null;
  currentUser?: User | null;
}

export default function Navbar({ currentSession, currentUser }: NavbarProps) {
  const authUser = currentSession;
  const user = currentUser;

  if (!authUser) {
    return (
      <nav className="sticky top-0 z-40 w-full border-b bg-white/95 dark:bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-950/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              VK EVENTS
            </span>
          </Link>
          
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="default" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                Login
              </Button>
            </Link>
            <ThemeSwitcher />
          </div>
        </div>
      </nav>
    );
  }

  const isAdmin = user?.role === 'admin';

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-white/95 dark:bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-950/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            VK EVENTS
          </span>
        </Link>
        
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          
          {/* User/Admin Menu Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                  {authUser?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:inline font-medium">
                  {authUser?.email?.split("@")[0] || "User"}
                </span>
                <Menu className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {authUser?.email?.split("@")[0] || "User"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {authUser?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              
              <DropdownMenuSeparator />
              
              {isAdmin ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Admin Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/users" className="cursor-pointer">
                      <Users className="w-4 h-4 mr-2" />
                      User Management
                    </Link>
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem asChild>
                  <Link href="/my-events" className="cursor-pointer">
                    <CalendarCheck className="w-4 h-4 mr-2" />
                    My Events
                  </Link>
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400">
                <LogOut className="w-4 h-4 mr-2" />
                <LogoutButton />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
