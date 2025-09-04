'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { ThemeToggle } from './ui/ThemeToggle'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { 
  SparklesIcon, 
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  BellIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { getInitials } from '@/lib/utils'

interface PremiumHeaderProps {
  className?: string
}

export function PremiumHeader({ className }: PremiumHeaderProps) {
  const { user, signOut, isSigningOut } = useAuth()

  return (
    <motion.header 
      className={`bg-surface/90 backdrop-blur-elegant border-b border-black/5 sticky top-0 z-40 ${className}`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo & Brand */}
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rich-gold to-rose-gold flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-display text-xl font-bold text-foreground">Freedom by Design</h1>
              <p className="text-xs text-medium-gray">Premium Business Intelligence</p>
            </div>
          </motion.div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/dashboard" 
              className="text-sm font-medium text-medium-gray hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
            <Link 
              href="/ai-strategist" 
              className="text-sm font-medium text-medium-gray hover:text-foreground transition-colors"
            >
              AI Strategist
            </Link>
            <Link 
              href="/business-metrics" 
              className="text-sm font-medium text-medium-gray hover:text-foreground transition-colors"
            >
              Analytics
            </Link>
            <Link 
              href="/achievements" 
              className="text-sm font-medium text-medium-gray hover:text-foreground transition-colors"
            >
              Achievements
            </Link>
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <BellIcon className="w-5 h-5" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-error rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>
            </Button>

            {/* Theme Toggle */}
            <ThemeToggle variant="button" />

            {/* Settings */}
            <Button variant="ghost" size="icon">
              <Cog6ToothIcon className="w-5 h-5" />
            </Button>

            {/* User Profile */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-foreground">
                  {user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-medium-gray">Business Owner</p>
              </div>

              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-elegant-silver to-medium-gray flex items-center justify-center text-white font-medium text-sm">
                {user?.email ? getInitials(user.email.split('@')[0]) : 'U'}
              </div>

              <Button
                variant="ghost"
                onClick={signOut}
                disabled={isSigningOut}
                className="text-error hover:text-error/80 hover:bg-error/5"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  )
}

// Welcome banner for dashboard
interface WelcomeBannerProps {
  userName?: string
  className?: string
}

export function WelcomeBanner({ userName, className }: WelcomeBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={className}
    >
      <Card variant="gold" size="lg" className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-rich-gold/20" />
          <div className="absolute bottom-4 left-4 w-24 h-24 rounded-full bg-rose-gold/20" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-display text-2xl font-bold text-foreground mb-2">
                Welcome back, {userName || 'Entrepreneur'}! 🌟
              </h2>
              <p className="text-body text-medium-gray text-lg leading-relaxed">
                Ready to optimize your business and increase your freedom score? 
                Your AI strategist is standing by to help you scale with confidence.
              </p>
            </div>
            <div className="flex-shrink-0 ml-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rich-gold to-rose-gold flex items-center justify-center">
                <SparklesIcon className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-6">
            <Button variant="primary" className="btn-gradient-gold">
              Continue Strategy Session
            </Button>
            <Button variant="outline">
              View Progress Report
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}