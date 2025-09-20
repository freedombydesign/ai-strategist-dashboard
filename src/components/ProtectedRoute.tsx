import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export default function ProtectedRoute({ children, redirectTo = '/login' }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Set a maximum wait time for auth loading
    const authTimeout = setTimeout(() => {
      if (loading && !user) {
        console.log('[PROTECTED-ROUTE] Auth loading timeout, redirecting to:', redirectTo);
        router.push(redirectTo);
      }
    }, 3000); // 3 second max wait

    if (!loading && !user) {
      console.log('[PROTECTED-ROUTE] No authenticated user, redirecting to:', redirectTo);
      router.push(redirectTo);
    }

    return () => clearTimeout(authTimeout);
  }, [user, loading, router, redirectTo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        <div className="ml-4 text-gray-600">
          <p>Checking authentication...</p>
          <p className="text-sm">This should only take a moment</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}