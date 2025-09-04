'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Sidebar from './Sidebar'
import Header from './Header'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-background page-transition">
      <Sidebar 
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className={`transition-all duration-500 ${
        sidebarCollapsed ? 'ml-20' : 'ml-80'
      }`}>
        <Header onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        
        <motion.main
          className="p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  )
}

export default DashboardLayout