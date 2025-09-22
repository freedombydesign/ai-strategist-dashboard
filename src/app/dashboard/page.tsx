'use client'

import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import { DashboardLayout } from '@/components/DashboardLayout'
import { DashboardCards } from '@/components/DashboardCards'

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Page Header */}
          <div className="space-y-2">
            <h1 className="display-1">Business Dashboard</h1>
            <p className="body-large text-muted">
              Monitor your workflow optimization and business performance
            </p>
          </div>

          {/* Dashboard Cards */}
          <DashboardCards />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}