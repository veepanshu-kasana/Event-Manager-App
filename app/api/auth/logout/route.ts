import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = await createClient();
    
    // Sign out with global scope to clear all sessions
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    
    if (error) {
      console.error('Logout error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    // Create response with redirect
    const response = NextResponse.json(
      { success: true },
      { status: 200 }
    );
    
    // Clear all auth-related cookies
    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');
    
    // Clear all cookies that match Supabase patterns
    const cookieNames = [
      'sb-access-token',
      'sb-refresh-token',
      'sb-auth-token',
    ];
    
    cookieNames.forEach(name => {
      response.cookies.set(name, '', {
        expires: new Date(0),
        path: '/',
      });
    });
    
    return response;
  } catch (error) {
    console.error('Logout exception:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}

