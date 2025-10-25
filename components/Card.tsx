import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
  shadow?: boolean
}

export function Card({ 
  children, 
  className, 
  padding = 'md', 
  shadow = true 
}: CardProps) {
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  }
  
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200',
        paddingClasses[padding],
        shadow && 'shadow-jeffy',
        className
      )}
    >
      {children}
    </div>
  )
}
