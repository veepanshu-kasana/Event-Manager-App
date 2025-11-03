import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import React from 'react';
import UserRow from './UserRow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, UserCog, ShieldAlert, Search } from 'lucide-react';

interface User {
  id: string;
  email: string;
  role: string;
  is_blocked: boolean;
}

export default async function UsersPage() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    redirect('/auth/login');
  }

  // Check admin role
  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', authUser.id)
    .single();

  if (currentUser?.role !== 'admin') {
    redirect('/events');
  }

  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, role, is_blocked')
    .order('email', { ascending: true });

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-950 dark:to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Users</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Calculate statistics
  const totalUsers = users?.length || 0;
  const adminUsers = users?.filter(u => u.role === 'admin').length || 0;
  const regularUsers = users?.filter(u => u.role === 'user').length || 0;
  const blockedUsers = users?.filter(u => u.is_blocked).length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
        
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-xl">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent">
                User Management
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-1">
                Monitor and manage all registered users
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-10">
          <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Users</CardTitle>
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-3xl font-black text-blue-900 dark:text-blue-100">
                {totalUsers}
              </div>
            </CardHeader>
          </Card>

          <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Admins</CardTitle>
                <UserCog className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-3xl font-black text-purple-900 dark:text-purple-100">
                {adminUsers}
              </div>
            </CardHeader>
          </Card>

          <Card className="border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Regular Users</CardTitle>
                <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-3xl font-black text-emerald-900 dark:text-emerald-100">
                {regularUsers}
              </div>
            </CardHeader>
          </Card>

          <Card className="border-2 border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">Blocked</CardTitle>
                <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="text-3xl font-black text-red-900 dark:text-red-100">
                {blockedUsers}
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Users Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
              All Users
            </h2>
            <Badge variant="secondary" className="px-3 py-1">
              {totalUsers} Total
            </Badge>
          </div>

          {!users || users.length === 0 ? (
            <Card className="max-w-md mx-auto text-center">
              <CardContent className="pt-12 pb-12">
                <Search className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                <CardTitle className="mb-2">No Users Found</CardTitle>
                <CardDescription>
                  No registered users in the system yet.
                </CardDescription>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {users.map((user: User) => (
                <UserRow key={user.id} user={user} currentUserId={authUser.id} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
