import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import React from 'react';

class DetectStoreErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Check if it's a detectStore related error
    if (error && error.toString().includes('detectStore')) {
      console.log('[PROTECTED-ROUTE] Caught detectStore error in boundary:', error);
      return { hasError: false }; // Don't show error, just continue
    }
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    if (error && error.toString().includes('detectStore')) {
      console.log('[PROTECTED-ROUTE] DetectStore error caught and suppressed:', error);
      return; // Suppress detectStore errors
    }
    console.error('[PROTECTED-ROUTE] Unexpected error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600">Please refresh the page and try again</p>
        </div>
      </div>;
    }

    return this.props.children;
  }
}

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

function ProtectedRouteInner({ children, redirectTo = '/login' }: ProtectedRouteProps) {
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

export default function ProtectedRoute(props: ProtectedRouteProps) {
  return (
    <DetectStoreErrorBoundary>
      <ProtectedRouteInner {...props} />
    </DetectStoreErrorBoundary>
  );
}