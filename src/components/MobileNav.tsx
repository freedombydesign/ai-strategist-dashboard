'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Target, 
  Trophy, 
  MessageCircle, 
  DollarSign, 
  CheckCircle, 
  Menu, 
  X,
  Bot,
  TrendingUp
} from 'lucide-react'

interface MobileNavProps {
  className?: string
}

export default function MobileNav({ className = '' }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/checkin', icon: CheckCircle, label: 'Check-in' },
    { href: '/achievements', icon: Trophy, label: 'Achievements' },
    { href: '/implementation-coach', icon: Bot, label: 'AI Coach' },
    { href: '/ai-strategist', icon: MessageCircle, label: 'Strategist' },
    { href: '/business-metrics', icon: DollarSign, label: 'Metrics' }
  ]

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/')

  return (
    <>
      {/* Mobile Header */}
      <div className={`md:hidden bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between ${className}`}>
        <div className="flex items-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-8 h-8 rounded-lg flex items-center justify-center mr-3">
            <TrendingUp className="text-white" size={20} />
          </div>
          <h1 className="text-lg font-bold text-gray-900">AI Strategist</h1>
        </div>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors btn-press mobile-tap-target"
          aria-label="Toggle navigation"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Slide-out Menu */}
      <div className={`md:hidden fixed inset-0 z-50 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        {/* Backdrop */}
        <div 
          className={`fixed inset-0 bg-black transition-opacity duration-300 ${
            isOpen ? 'opacity-50' : 'opacity-0'
          }`}
          onClick={() => setIsOpen(false)}
        />
        
        {/* Slide-out Panel */}
        <div className={`fixed right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-xl transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0 slide-in-up' : 'translate-x-full'
        }`}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-10 h-10 rounded-lg flex items-center justify-center mr-3">
                  <TrendingUp className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">AI Strategist</h2>
                  <p className="text-sm text-gray-600">Dashboard</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors touch-feedback mobile-tap-target ${
                      active
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={20} className="mr-3" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            {/* Quick Actions */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/checkin"
                  onClick={() => setIsOpen(false)}
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-center font-medium transition-colors btn-press mobile-tap-target"
                >
                  Complete Check-in
                </Link>
                <Link
                  href="/achievements"
                  onClick={() => setIsOpen(false)}
                  className="block w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg text-center font-medium transition-colors btn-press mobile-tap-target"
                >
                  View Achievements
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1 z-40">
        <div className="flex justify-around">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center p-2 rounded-lg transition-colors touch-feedback mobile-tap-target ${
                  active
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={20} className="mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}