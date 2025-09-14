'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-medium ring-offset-background transition-all duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rich-gold focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden",
  {
    variants: {
      variant: {
        primary: "btn-gradient-gold text-white shadow-md hover:shadow-lg",
        secondary: "btn-gradient-rose text-white shadow-md hover:shadow-lg", 
        outline: "border border-medium-gray text-foreground bg-surface hover:bg-light-gray hover:border-rich-gold",
        ghost: "text-foreground hover:bg-light-gray hover:text-rich-gold",
        success: "bg-success text-white hover:bg-success/90",
        warning: "bg-warning text-white hover:bg-warning/90",
        error: "bg-error text-white hover:bg-error/90",
        info: "bg-info text-white hover:bg-info/90",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 py-2",
        lg: "h-11 px-8",
        xl: "h-12 px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  icon?: React.ReactNode
  children: React.ReactNode
}

export function Button({ 
  className, 
  variant, 
  size, 
  loading = false,
  icon,
  children, 
  disabled,
  ...props 
}: ButtonProps) {
  return (
    <motion.button
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}
      
      <span className={cn(
        "flex items-center gap-2",
        loading && "opacity-0"
      )}>
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </span>
    </motion.button>
  )
}

export { buttonVariants }