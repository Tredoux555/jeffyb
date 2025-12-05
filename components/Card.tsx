import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: boolean
  variant?: 'default' | 'elevated' | 'glass' | 'outline'
  hover?: boolean
}

export function Card({ 
  children, 
  className, 
  padding = 'md', 
  shadow = true,
  variant = 'default',
  hover = false
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  }

  const variantClasses = {
    default: 'bg-white border border-gray-100',
    elevated: 'bg-white border-0',
    glass: 'bg-white/80 backdrop-blur-sm border border-white/20',
    outline: 'bg-transparent border-2 border-gray-200'
  }
  
  return (
    <div
      className={cn(
        'rounded-2xl transition-all duration-200',
        paddingClasses[padding],
        variantClasses[variant],
        shadow && 'shadow-card',
        hover && 'hover:shadow-card-hover hover:-translate-y-1 cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}
