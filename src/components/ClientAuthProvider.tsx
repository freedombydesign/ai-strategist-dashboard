'use client';

import { useEffect, useState } from 'react';
import { AuthProvider } from '@/context/AuthContext';

interface ClientAuthProviderProps {
  children: React.ReactNode;
}

export default function ClientAuthProvider({ children }: ClientAuthProviderProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    console.log('[CLIENT-AUTH-PROVIDER] Hydrated on URL:', window.location.href);
  }, []);

  // TEMPORARY DEBUG: Bypass AuthProvider to test for redirect issues
  return (
    <div>
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        background: 'red', 
        color: 'white', 
        padding: '10px', 
        zIndex: 9999,
        fontSize: '12px'
      }}>
        DEBUG MODE: Auth disabled. Current URL: {typeof window !== 'undefined' ? window.location.href : 'SSR'}
      </div>
      {!isHydrated ? (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}