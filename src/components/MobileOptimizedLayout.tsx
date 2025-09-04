'use client'

import { ReactNode } from 'react'
import MobileNav from './MobileNav'

interface MobileOptimizedLayoutProps {
  children: ReactNode
  className?: string
}

export default function MobileOptimizedLayout({ children, className = '' }: MobileOptimizedLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Navigation */}
      <MobileNav />
      
      {/* Main Content with Mobile Padding */}
      <main className={`pb-20 md:pb-0 ${className}`}>
        {children}
      </main>
    </div>
  )
}