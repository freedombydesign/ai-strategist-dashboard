'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import UltimateImplementationCoach from '@/components/UltimateImplementationCoach'

export default function ImplementationCoachPage() {
  return (
    <ProtectedRoute>
      <UltimateImplementationCoach />
    </ProtectedRoute>
  )
}