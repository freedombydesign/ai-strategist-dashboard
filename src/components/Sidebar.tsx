'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChartBarIcon,
  HomeIcon,
  CogIcon,
  UserIcon,
  DocumentChartBarIcon,
  TrophyIcon,
  SparklesIcon,
  Bars3Icon,
  XMarkIcon,
  LightBulbIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline'

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
    description: 'System overview'
  },
  {
    name: 'Workflow Analyzer',
    href: '/service-delivery-systemizer',
    icon: SparklesIcon,
    description: 'Optimize workflows'
  },
  {
    name: 'Templates',
    href: '/template-manager',
    icon: ChartBarIcon,
    description: 'Workflow templates'
  },
  {
    name: 'Export Manager',
    href: '/export-manager',
    icon: TrophyIcon,
    description: 'Platform exports'
  },
  {
    name: 'Analytics',
    href: '/business-metrics',
    icon: LightBulbIcon,
    description: 'Performance metrics'
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: RocketLaunchIcon,
    description: 'System configuration'
  }
]

interface SidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

export function Sidebar({ isCollapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const [isHovered, setIsHovered] = useState(false)

  const isExpanded = !isCollapsed || isHovered

  return (
    <motion.aside
      className="fixed left-0 top-0 z-50 h-full bg-surface glass-effect border-r border-border/50"
      initial={{ x: -280 }}
      animate={{ 
        x: 0,
        width: isExpanded ? 280 : 80
      }}
      transition={{ 
        duration: 0.4, 
        ease: [0.23, 1, 0.32, 1] 
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border/30">
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                <CogIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="headline-2 gradient-text">Systemizer</h1>
                <p className="caption text-muted">Workflow Platform</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center"
            >
              <CogIcon className="w-6 h-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={onToggle}
          className="p-2 text-muted hover:text-accent transition-colors rounded-lg hover:bg-accent/10"
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigationItems.map((item, index) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                duration: 0.4, 
                delay: index * 0.1,
                ease: [0.23, 1, 0.32, 1]
              }}
            >
              <Link
                href={item.href}
                className={`nav-link group relative ${isActive ? 'nav-link-active' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg transition-all duration-300 ${
                    isActive 
                      ? 'bg-accent text-champagne' 
                      : 'text-muted group-hover:text-accent group-hover:bg-accent/10'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <AnimatePresence mode="wait">
                    {isExpanded && (
                      <motion.div
                        key="nav-text"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="flex-1 min-w-0"
                      >
                        <div className="subhead">{item.name}</div>
                        <div className="caption text-muted group-hover:text-muted/80">
                          {item.description}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-8 bg-gradient-copper rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            </motion.div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border/30">
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              key="footer-expanded"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              <Link
                href="/settings"
                className="nav-link"
              >
                <CogIcon className="w-5 h-5" />
                <span className="subhead">Settings</span>
              </Link>
              
              <div className="divider" />
              
              <div className="text-center">
                <div className="caption text-muted">Version 2.0</div>
                <div className="caption text-accent">Premium</div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="footer-collapsed"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="flex justify-center"
            >
              <Link
                href="/settings"
                className="p-2 text-muted hover:text-accent transition-colors rounded-lg hover:bg-accent/10"
              >
                <CogIcon className="w-5 h-5" />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  )
}

export default Sidebar