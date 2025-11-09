'use client'

import React from 'react'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Toggle({ 
  checked, 
  onChange, 
  disabled = false, 
  label,
  size = 'md' 
}: ToggleProps) {
  const sizeClasses = {
    sm: 'w-9 h-5',
    md: 'w-11 h-6',
    lg: 'w-14 h-7'
  }
  
  const thumbSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }
  
  const translateClasses = {
    sm: checked ? 'translate-x-4' : 'translate-x-0',
    md: checked ? 'translate-x-5' : 'translate-x-0',
    lg: checked ? 'translate-x-7' : 'translate-x-0'
  }

  return (
    <div className="flex items-center gap-3">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`
          relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-jeffy-yellow focus:ring-offset-2
          ${sizeClasses[size]}
          ${checked ? 'bg-green-500' : 'bg-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span
          className={`
            inline-block transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out
            ${thumbSizeClasses[size]}
            ${translateClasses[size]}
          `}
        />
      </button>
    </div>
  )
}

