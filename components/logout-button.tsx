"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    setLoading(true);
    
    try {
      // Call server-side logout API
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok || data.error) {
        console.error('Logout error:', data.error);
        alert('Logout failed: ' + (data.error || 'Unknown error'));
        setLoading(false);
        return;
      }
      
      // Clear local storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Force full page redirect (clears all client state)
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('Logout exception:', error);
      setLoading(false);
      alert('Logout failed');
    }
  };

  return (
    <Button onClick={logout} disabled={loading}>
      {loading ? 'Logging out...' : 'Logout'}
    </Button>
  );
}
