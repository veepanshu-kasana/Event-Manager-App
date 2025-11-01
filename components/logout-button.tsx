"use client";

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
      
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout exception:', error);
      setLoading(false);
      alert('Logout failed');
    }
  };

  return (
    <button onClick={logout} disabled={loading} className="w-full text-left">
      {loading ? 'Logging out...' : 'Logout'}
    </button>
  );
}
