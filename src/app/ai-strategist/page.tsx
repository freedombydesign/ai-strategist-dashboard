'use client'

import { motion } from 'framer-motion'
import ProtectedRoute from '../../components/ProtectedRoute'
import { PremiumHeader } from '@/components/PremiumHeader'
import EnhancedChat from '@/components/EnhancedChat'
import { MobileNavigation, FloatingActionButton } from '@/components/MobileNavigation'
import { useAuth } from '../../context/AuthContext'

export default function AIStrategist() {
  const { user } = useAuth()

  return (
    <ProtectedRoute>
      <div className="h-screen bg-background flex flex-col transition-colors duration-300">
        {/* Premium Header */}
        <PremiumHeader />
        
        {/* Main Chat Interface - Original AI Strategist with full features */}
        <motion.main 
          className="flex-1 flex flex-col overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {user && <EnhancedChat userId={user.id} />}
        </motion.main>
        
        {/* Mobile Navigation - Only show on mobile */}
        <div className="md:hidden">
          <MobileNavigation />
          <FloatingActionButton />
        </div>
      </div>
    </ProtectedRoute>
  )
}