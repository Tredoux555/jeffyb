'use client'

import React from 'react'
import { Package } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
  className?: string
}

export function LoadingSpinner({ 
  message = 'Loading...', 
  size = 'md',
  fullScreen = false,
  className
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: {
      container: 'w-12 h-12',
      icon: 'w-6 h-6',
      text: 'text-sm',
      dots: 'w-1.5 h-1.5'
    },
    md: {
      container: 'w-16 h-16',
      icon: 'w-8 h-8',
      text: 'text-base',
      dots: 'w-2 h-2'
    },
    lg: {
      container: 'w-20 h-20',
      icon: 'w-10 h-10',
      text: 'text-lg',
      dots: 'w-2.5 h-2.5'
    }
  }

  const sizes = sizeClasses[size]

  const content = (
    <div className={cn("text-center", className)}>
      {/* Animated Logo Container */}
      <div className="relative mb-4">
        {/* Pulsing ring */}
        <div className={cn(
          "absolute inset-0 mx-auto rounded-2xl bg-jeffy-yellow/40 animate-pulse-ring",
          sizes.container
        )} />
        
        {/* Logo box */}
        <div className={cn(
          "relative rounded-2xl bg-white shadow-lg flex items-center justify-center mx-auto animate-float",
          sizes.container
        )}>
          <Package className={cn("text-jeffy-yellow", sizes.icon)} />
        </div>
      </div>
      
      {/* Message */}
      {message && (
        <p className={cn("text-slate-600 font-medium mb-4", sizes.text)}>{message}</p>
      )}
      
      {/* Loading dots */}
      <div className="flex justify-center gap-1.5 loading-dots">
        <span className={cn("bg-slate-800 rounded-full", sizes.dots)}></span>
        <span className={cn("bg-slate-800 rounded-full", sizes.dots)}></span>
        <span className={cn("bg-slate-800 rounded-full", sizes.dots)}></span>
      </div>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-jeffy-yellow to-amber-100 flex items-center justify-center px-4">
        {content}
      </div>
    )
  }

  return content
}

