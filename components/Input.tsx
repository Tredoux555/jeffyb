import React from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export function Input({ 
  label, 
  error, 
  helperText, 
  className, 
  ...props 
}: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-semibold text-gray-700">
          {label}
        </label>
      )}
      <input
        className={cn(
          'w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl',
          'focus:outline-none focus:border-jeffy-yellow focus:bg-white focus:ring-4 focus:ring-yellow-100',
          'transition-all duration-200 placeholder:text-gray-400',
          error && 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-100',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600 font-medium">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  )
}
