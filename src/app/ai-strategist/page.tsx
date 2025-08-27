'use client';

import EnhancedChat from '../../components/EnhancedChat';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { ArrowLeft, LogOut, User } from 'lucide-react';

export default function AIStrategist() {
  const { user, signOut } = useAuth();

  return (
    <ProtectedRoute>
      <div className="h-screen bg-gray-50 flex flex-col">
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Enhanced AI Strategist</h1>
            <p className="text-sm text-gray-600">Voice, files, personalities, and Freedom Score integration</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* User Info */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User size={16} />
              <span>{user?.email}</span>
            </div>
            
            {/* Navigation */}
            <Link 
              href="/dashboard"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>
            
            {/* Sign Out */}
            <button
              onClick={signOut}
              className="flex items-center gap-2 text-red-600 hover:text-red-800 text-sm font-medium"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
        
        <div className="flex-1">
          {user && <EnhancedChat userId={user.id} />}
        </div>
      </div>
    </ProtectedRoute>
  );
}