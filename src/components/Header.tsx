'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import {
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon,
  ChevronDownIcon,
  Bars3Icon
} from '@heroicons/react/24/outline'
import { getInitials } from '@/lib/utils'

interface HeaderProps {
  onSidebarToggle?: () => void
}

export function Header({ onSidebarToggle }: HeaderProps) {
  const { user, signOut, isSigningOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const notifications = [
    {
      id: 1,
      title: "Sprint Milestone Achieved",
      message: "You've completed 80% of your current sprint objectives",
      time: "2 min ago",
      type: "success"
    },
    {
      id: 2,
      title: "Weekly Report Ready",
      message: "Your business analytics report is now available",
      time: "1 hour ago",
      type: "info"
    },
    {
      id: 3,
      title: "New AI Insights",
      message: "Strategic recommendations based on your latest metrics",
      time: "3 hours ago",
      type: "insight"
    }
  ]

  return (
    <motion.header
      className="sticky top-0 z-40 bg-surface/80 glass-effect border-b border-border/30"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
    >
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button
            onClick={onSidebarToggle}
            className="lg:hidden p-2 text-muted hover:text-accent transition-colors rounded-lg hover:bg-accent/10"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>

          <div>
            <h1 className="headline-2">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}
            </h1>
            <p className="body-medium text-muted">
              {user?.email?.split('@')[0] || 'Welcome back'}
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <motion.button
            onClick={toggleTheme}
            className="p-3 text-muted hover:text-accent transition-colors rounded-xl hover:bg-accent/10"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence mode="wait">
              {theme === 'dark' ? (
                <motion.div
                  key="sun"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <SunIcon className="w-5 h-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <MoonIcon className="w-5 h-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Notifications */}
          <div className="relative">
            <motion.button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-3 text-muted hover:text-accent transition-colors rounded-xl hover:bg-accent/10 relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <BellIcon className="w-5 h-5" />
              {notifications.length > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-champagne">
                    {notifications.length}
                  </span>
                </div>
              )}
            </motion.button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-2 w-80 card-editorial p-0 overflow-hidden"
                >
                  <div className="p-4 border-b border-border/30">
                    <h3 className="subhead">Notifications</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        className="p-4 hover:bg-accent/5 transition-colors border-b border-border/20 last:border-b-0"
                        whileHover={{ x: 4 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            notification.type === 'success' ? 'bg-success' :
                            notification.type === 'info' ? 'bg-accent-secondary' :
                            'bg-accent'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <h4 className="body-medium font-semibold">
                              {notification.title}
                            </h4>
                            <p className="body-medium text-muted">
                              {notification.message}
                            </p>
                            <p className="caption text-muted mt-1">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="p-4 border-t border-border/30 text-center">
                    <button className="caption text-accent hover:text-accent/80 transition-colors">
                      View all notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Menu */}
          <div className="relative">
            <motion.button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 p-2 text-muted hover:text-accent transition-colors rounded-xl hover:bg-accent/10"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-sophisticated flex items-center justify-center text-champagne font-semibold">
                {user?.email ? getInitials(user.email.split('@')[0]) : 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="body-medium font-semibold">
                  {user?.email?.split('@')[0] || 'User'}
                </div>
                <div className="caption text-muted">Business Owner</div>
              </div>
              <ChevronDownIcon className="w-4 h-4" />
            </motion.button>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-2 w-64 card-editorial p-0 overflow-hidden"
                >
                  <div className="p-4 border-b border-border/30">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-sophisticated flex items-center justify-center text-champagne font-semibold">
                        {user?.email ? getInitials(user.email.split('@')[0]) : 'U'}
                      </div>
                      <div>
                        <div className="subhead">
                          {user?.email?.split('@')[0] || 'User'}
                        </div>
                        <div className="caption text-muted">
                          {user?.email || 'user@example.com'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-2">
                    <button className="w-full flex items-center gap-3 p-3 text-muted hover:text-accent hover:bg-accent/10 rounded-lg transition-all">
                      <UserCircleIcon className="w-5 h-5" />
                      <span className="body-medium">Profile Settings</span>
                    </button>
                    
                    <div className="divider my-2" />
                    
                    <button
                      onClick={signOut}
                      disabled={isSigningOut}
                      className="w-full flex items-center gap-3 p-3 text-error hover:text-error/80 hover:bg-error/10 rounded-lg transition-all"
                    >
                      <ArrowRightOnRectangleIcon className="w-5 h-5" />
                      <span className="body-medium">
                        {isSigningOut ? 'Signing out...' : 'Sign Out'}
                      </span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  )
}

export default Header