'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { Mail, Shield, ShieldAlert, Trash2, Loader2, User as UserIcon } from 'lucide-react';

interface User {
  id: string;
  email: string;
  role: string;
  is_blocked: boolean;
}

interface UserRowProps {
  user: User;
  currentUserId: string;
}

export default function UserRow({ user, currentUserId }: UserRowProps) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const isCurrentUser = user.id === currentUserId;

  async function deleteUser() {
    if (isCurrentUser) {
      alert('You cannot delete your own account!');
      return;
    }

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
      router.refresh();
    }
  }

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 border-2 ${
      user.is_blocked 
        ? 'border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-950/30' 
        : user.role === 'admin'
        ? 'border-purple-200 dark:border-purple-800 bg-purple-50/30 dark:bg-purple-950/30'
        : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700'
    } ${isCurrentUser ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}>
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* User Info Section */}
          <div className="flex items-center gap-4 flex-1">
            {/* Avatar */}
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg ${
              user.is_blocked 
                ? 'bg-gradient-to-br from-red-500 to-red-700' 
                : user.role === 'admin'
                ? 'bg-gradient-to-br from-purple-500 to-purple-700'
                : 'bg-gradient-to-br from-blue-500 to-cyan-600'
            }`}>
              {getInitials(user.email)}
            </div>

            {/* User Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg truncate">
                  {user.email.split('@')[0]}
                </h3>
                {isCurrentUser && (
                  <Badge className="bg-blue-500 text-white border-0 text-xs">You</Badge>
                )}
                {user.is_blocked && (
                  <Badge variant="destructive" className="text-xs">
                    <ShieldAlert className="w-3 h-3 mr-1" />
                    Blocked
                  </Badge>
                )}
              </div>
              
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Shield className={`w-4 h-4 shrink-0 ${
                    user.role === 'admin' 
                      ? 'text-purple-600 dark:text-purple-400' 
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`} />
                  <span className="capitalize font-medium">{user.role}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Section */}
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={`px-3 py-1.5 ${
                user.role === 'admin' 
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' 
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
              }`}
            >
              <UserIcon className="w-3 h-3 mr-1.5" />
              {user.role === 'admin' ? 'Administrator' : 'Regular User'}
            </Badge>
            
            {!isCurrentUser && (
              <Button 
                onClick={deleteUser} 
                disabled={loading}
                variant="destructive"
                size="icon"
                className="shrink-0"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
