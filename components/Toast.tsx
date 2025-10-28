'use client'

import React, { useEffect } from 'react'
import { CheckCircle, X, XCircle } from 'lucide-react'

interface ToastProps {
  message: string
  type?: 'success' | 'error'
  isVisible: boolean
  onClose: () => void
}

export function Toast({ message, type = 'success', isVisible, onClose }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose()
      }, 3000) // Auto-close after 3 seconds

      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  if (!isVisible) return null

  const isSuccess = type === 'success'
  const bgColor = isSuccess ? 'bg-green-500' : 'bg-red-500'
  const Icon = isSuccess ? CheckCircle : XCircle

  return (
    <div
      className={`fixed top-4 right-4 z-50 ${bgColor} text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 min-w-[300px] max-w-md slide-in-right`}
    >
      <Icon className="w-6 h-6 flex-shrink-0" />
      <p className="flex-1 font-medium text-sm sm:text-base">{message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 hover:bg-black/20 rounded-full p-1 transition-colors"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
