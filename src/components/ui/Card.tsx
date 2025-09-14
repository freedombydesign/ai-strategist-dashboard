'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const cardVariants = cva(
  "card-premium overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-surface border border-black/5",
        elevated: "bg-surface border border-black/5 shadow-lg",
        gold: "bg-gradient-to-br from-rich-gold/5 to-rich-gold/10 border border-rich-gold/20",
        success: "bg-gradient-to-br from-success/5 to-success/10 border border-success/20",
        warning: "bg-gradient-to-br from-warning/5 to-warning/10 border border-warning/20",
        error: "bg-gradient-to-br from-error/5 to-error/10 border border-error/20",
      },
      size: {
        sm: "p-4",
        md: "p-6", 
        lg: "p-8",
        xl: "p-10",
      },
      hover: {
        none: "",
        lift: "hover:shadow-md hover:-translate-y-1",
        glow: "hover:shadow-xl hover:shadow-rich-gold/10",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      hover: "lift",
    },
  }
)

interface CardProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  children: React.ReactNode
  animate?: boolean
}

export function Card({ 
  className, 
  variant, 
  size, 
  hover,
  animate = false,
  children,
  ...props 
}: CardProps) {
  const cardContent = (
    <div
      className={cn(cardVariants({ variant, size, hover, className }))}
      {...props}
    >
      {children}
    </div>
  )

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {cardContent}
      </motion.div>
    )
  }

  return cardContent
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div className={cn("pb-4 border-b border-black/5", className)} {...props}>
      {children}
    </div>
  )
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

export function CardTitle({ 
  className, 
  children, 
  as = 'h3',
  ...props 
}: CardTitleProps) {
  const Component = as
  
  return (
    <Component 
      className={cn("text-heading text-lg font-semibold text-foreground leading-tight", className)} 
      {...props}
    >
      {children}
    </Component>
  )
}

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode
}

export function CardDescription({ className, children, ...props }: CardDescriptionProps) {
  return (
    <p 
      className={cn("text-body text-sm text-medium-gray mt-1", className)} 
      {...props}
    >
      {children}
    </p>
  )
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function CardContent({ className, children, ...props }: CardContentProps) {
  return (
    <div className={cn("pt-4", className)} {...props}>
      {children}
    </div>
  )
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function CardFooter({ className, children, ...props }: CardFooterProps) {
  return (
    <div className={cn("pt-4 border-t border-black/5 flex items-center justify-between", className)} {...props}>
      {children}
    </div>
  )
}

export { cardVariants }