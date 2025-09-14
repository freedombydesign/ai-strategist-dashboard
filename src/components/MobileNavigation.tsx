'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  HomeIcon,
  SparklesIcon,
  ChartBarIcon,
  TrophyIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  SparklesIcon as SparklesIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  TrophyIcon as TrophyIconSolid,
  UserCircleIcon as UserCircleIconSolid
} from '@heroicons/react/24/solid'
import { cn } from '@/lib/utils'

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
    activeIcon: HomeIconSolid,
  },
  {
    name: 'AI Strategist',
    href: '/ai-strategist',
    icon: SparklesIcon,
    activeIcon: SparklesIconSolid,
  },
  {
    name: 'Analytics',
    href: '/business-metrics',
    icon: ChartBarIcon,
    activeIcon: ChartBarIconSolid,
  },
  {
    name: 'Achievements',
    href: '/achievements',
    icon: TrophyIcon,
    activeIcon: TrophyIconSolid,
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: UserCircleIcon,
    activeIcon: UserCircleIconSolid,
  },
]

interface MobileNavigationProps {
  className?: string
}

export function MobileNavigation({ className }: MobileNavigationProps) {
  const pathname = usePathname()

  return (
    <motion.nav 
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-elegant border-t border-black/5 md:hidden z-50",
        className
      )}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="grid grid-cols-5 h-16">
        {navigationItems.map((item, index) => {
          const isActive = pathname === item.href
          const Icon = isActive ? item.activeIcon : item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col items-center justify-center relative"
            >
              <motion.div
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full relative",
                  isActive && "text-rich-gold"
                )}
                whileTap={{ scale: 0.9 }}
                animate={isActive ? { y: -2 } : { y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    className="absolute -top-0.5 left-1/2 w-8 h-0.5 bg-rich-gold rounded-full"
                    initial={{ scale: 0, x: "-50%" }}
                    animate={{ scale: 1, x: "-50%" }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  />
                )}

                <Icon 
                  className={cn(
                    "w-6 h-6 transition-colors",
                    isActive 
                      ? "text-rich-gold" 
                      : "text-medium-gray"
                  )} 
                />
                
                <span 
                  className={cn(
                    "text-xs font-medium mt-1 transition-colors",
                    isActive 
                      ? "text-rich-gold" 
                      : "text-medium-gray"
                  )}
                >
                  {item.name}
                </span>

                {/* Ripple effect */}
                <motion.div
                  className="absolute inset-0 rounded-lg bg-rich-gold/10"
                  initial={{ scale: 0, opacity: 0 }}
                  whileTap={{ 
                    scale: 1, 
                    opacity: [0, 0.3, 0],
                    transition: { duration: 0.3 } 
                  }}
                />
              </motion.div>
            </Link>
          )
        })}
      </div>
    </motion.nav>
  )
}

// Floating Action Button for primary actions on mobile
interface FloatingActionButtonProps {
  className?: string
}

export function FloatingActionButton({ className }: FloatingActionButtonProps) {
  return (
    <motion.div
      className={cn(
        "fixed bottom-20 right-6 md:hidden z-40",
        className
      )}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.5 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <Link 
        href="/ai-strategist"
        className="w-14 h-14 rounded-full bg-gradient-to-br from-rich-gold to-rose-gold flex items-center justify-center shadow-lg"
      >
        <SparklesIcon className="w-6 h-6 text-white" />
      </Link>
    </motion.div>
  )
}