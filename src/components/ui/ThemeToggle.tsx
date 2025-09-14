'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'
import { useTheme } from '@/context/ThemeContext'
import { Button } from './Button'

interface ThemeToggleProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'button' | 'switch'
}

export function ThemeToggle({ 
  className, 
  size = 'md', 
  variant = 'button' 
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()

  if (variant === 'switch') {
    return (
      <motion.button
        className={`relative inline-flex items-center h-6 rounded-full w-11 focus:outline-none focus:ring-2 focus:ring-rich-gold focus:ring-offset-2 transition-colors ${
          theme === 'dark' ? 'bg-rich-gold' : 'bg-light-gray'
        } ${className}`}
        onClick={toggleTheme}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.span
          className={`inline-block w-4 h-4 transform transition-transform bg-white rounded-full shadow-md flex items-center justify-center ${
            theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
          }`}
          animate={{
            x: theme === 'dark' ? 24 : 4
          }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          {theme === 'dark' ? (
            <MoonIcon className="w-2.5 h-2.5 text-rich-gold" />
          ) : (
            <SunIcon className="w-2.5 h-2.5 text-warning" />
          )}
        </motion.span>
      </motion.button>
    )
  }

  const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'
  const buttonSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'

  return (
    <Button
      variant="ghost"
      size={buttonSize}
      onClick={toggleTheme}
      className={className}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === 'dark' ? 180 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {theme === 'light' ? (
          <MoonIcon className={iconSize} />
        ) : (
          <SunIcon className={iconSize} />
        )}
      </motion.div>
    </Button>
  )
}

// Premium theme selector with multiple options
interface ThemeSelectorProps {
  className?: string
}

export function ThemeSelector({ className }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme()

  const themes = [
    { key: 'light', label: 'Light', icon: SunIcon },
    { key: 'dark', label: 'Dark', icon: MoonIcon },
  ] as const

  return (
    <div className={`flex items-center gap-1 p-1 bg-light-gray rounded-lg ${className}`}>
      {themes.map(({ key, label, icon: Icon }) => (
        <motion.button
          key={key}
          onClick={() => setTheme(key)}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
            theme === key
              ? 'bg-surface text-foreground shadow-sm'
              : 'text-medium-gray hover:text-foreground hover:bg-surface/50'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Icon className="w-4 h-4" />
          {label}
        </motion.button>
      ))}
    </div>
  )
}