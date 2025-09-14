'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'gold' | 'rose' | 'success' | 'warning' | 'error'
  showValue?: boolean
  animate?: boolean
  className?: string
}

const sizeMap = {
  sm: { size: 60, strokeWidth: 4, fontSize: 'text-xs' },
  md: { size: 80, strokeWidth: 6, fontSize: 'text-sm' },
  lg: { size: 120, strokeWidth: 8, fontSize: 'text-base' },
  xl: { size: 160, strokeWidth: 10, fontSize: 'text-lg' }
}

const colorMap = {
  default: { 
    primary: 'stroke-rich-gold', 
    secondary: 'stroke-light-gray',
    gradient: 'url(#gold-gradient)'
  },
  gold: { 
    primary: 'stroke-rich-gold', 
    secondary: 'stroke-light-gray',
    gradient: 'url(#gold-gradient)'
  },
  rose: { 
    primary: 'stroke-rose-gold', 
    secondary: 'stroke-light-gray',
    gradient: 'url(#rose-gradient)'
  },
  success: { 
    primary: 'stroke-success', 
    secondary: 'stroke-light-gray',
    gradient: 'url(#success-gradient)'
  },
  warning: { 
    primary: 'stroke-warning', 
    secondary: 'stroke-light-gray',
    gradient: 'url(#warning-gradient)'
  },
  error: { 
    primary: 'stroke-error', 
    secondary: 'stroke-light-gray',
    gradient: 'url(#error-gradient)'
  }
}

export function Progress({ 
  value, 
  max = 100, 
  size = 'md',
  variant = 'default',
  showValue = true,
  animate = true,
  className 
}: ProgressProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const percentage = Math.min((value / max) * 100, 100)
  
  const { size: circleSize, strokeWidth, fontSize } = sizeMap[size]
  const colors = colorMap[variant]
  const radius = (circleSize - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference
  
  useEffect(() => {
    if (animate) {
      let start: number
      const animate = (timestamp: number) => {
        if (!start) start = timestamp
        const progress = Math.min((timestamp - start) / 1000, 1) // 1 second animation
        
        setDisplayValue(Math.floor(progress * value))
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      requestAnimationFrame(animate)
    } else {
      setDisplayValue(value)
    }
  }, [value, animate])

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg 
        width={circleSize} 
        height={circleSize} 
        className="transform -rotate-90"
      >
        <defs>
          <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#B8860B" />
          </linearGradient>
          <linearGradient id="rose-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B76E79" />
            <stop offset="100%" stopColor="#A0516D" />
          </linearGradient>
          <linearGradient id="success-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="warning-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
          <linearGradient id="error-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#DC2626" />
          </linearGradient>
        </defs>
        
        {/* Background circle */}
        <circle
          cx={circleSize / 2}
          cy={circleSize / 2}
          r={radius}
          fill="none"
          className={colors.secondary}
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={circleSize / 2}
          cy={circleSize / 2}
          r={radius}
          fill="none"
          stroke={colors.gradient}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          initial={animate ? { strokeDashoffset: circumference } : false}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            className={cn("font-bold text-foreground", fontSize)}
            initial={animate ? { scale: 0 } : false}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            {Math.round((displayValue / max) * 100)}%
          </motion.span>
          <span className="text-xs text-medium-gray">
            {displayValue}/{max}
          </span>
        </div>
      )}
    </div>
  )
}

interface LinearProgressProps {
  value: number
  max?: number
  variant?: 'default' | 'gold' | 'rose' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  animate?: boolean
  className?: string
}

export function LinearProgress({
  value,
  max = 100,
  variant = 'default',
  size = 'md',
  showValue = true,
  animate = true,
  className
}: LinearProgressProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const percentage = Math.min((value / max) * 100, 100)
  
  const heightMap = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  }
  
  const gradientMap = {
    default: 'from-rich-gold to-yellow-600',
    gold: 'from-rich-gold to-yellow-600',
    rose: 'from-rose-gold to-pink-600',
    success: 'from-success to-green-600',
    warning: 'from-warning to-orange-600',
    error: 'from-error to-red-600'
  }
  
  useEffect(() => {
    if (animate) {
      let start: number
      const animate = (timestamp: number) => {
        if (!start) start = timestamp
        const progress = Math.min((timestamp - start) / 1000, 1) // 1 second animation
        
        setDisplayValue(Math.floor(progress * value))
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      requestAnimationFrame(animate)
    } else {
      setDisplayValue(value)
    }
  }, [value, animate])

  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-foreground">Progress</span>
        {showValue && (
          <span className="text-sm text-medium-gray">
            {Math.round((displayValue / max) * 100)}%
          </span>
        )}
      </div>
      <div className={cn("bg-light-gray rounded-full overflow-hidden", heightMap[size])}>
        <motion.div
          className={cn("h-full bg-gradient-to-r rounded-full", gradientMap[variant])}
          initial={animate ? { width: 0 } : false}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}