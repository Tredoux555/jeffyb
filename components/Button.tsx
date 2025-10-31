import React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  loading?: boolean
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  className, 
  children, 
  loading = false,
  disabled,
  ...props 
}: ButtonProps) {
  const baseClasses = 'font-medium rounded-xl transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-jeffy-yellow focus:ring-offset-2 touch-manipulation active:scale-95'
  
  const variants = {
    primary: 'bg-jeffy-yellow text-gray-900 hover:bg-yellow-400 shadow-jeffy',
    secondary: 'bg-jeffy-grey text-white hover:bg-gray-600',
    outline: 'border-2 border-jeffy-yellow text-gray-900 hover:bg-jeffy-yellow',
    ghost: 'text-gray-700 hover:bg-jeffy-yellow-light'
  }
  
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }
  
  return (
    <button
      className={cn(baseClasses, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="animate-[spin_3s_linear_infinite] rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  )
}
