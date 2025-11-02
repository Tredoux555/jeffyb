'use client'

import React, { useEffect, useState } from 'react'
import { CheckCircle, X, XCircle, Info, AlertCircle } from 'lucide-react'

export type NotificationType = 'success' | 'error' | 'info' | 'warning'

export interface Notification {
  id: string
  message: string
  type: NotificationType
  duration?: number
}

interface NotificationProps {
  notification: Notification
  onRemove: (id: string) => void
  index: number
}

function NotificationItem({ notification, onRemove, index }: NotificationProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setIsVisible(true), 10)

    // Auto-remove after duration
    const duration = notification.duration || 3000
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onRemove(notification.id), 300) // Wait for fade out
    }, duration)

    return () => clearTimeout(timer)
  }, [notification, onRemove])

  const getStyles = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-500 text-white border-green-600'
      case 'error':
        return 'bg-red-500 text-white border-red-600'
      case 'info':
        return 'bg-blue-500 text-white border-blue-600'
      case 'warning':
        return 'bg-yellow-500 text-white border-yellow-600'
      default:
        return 'bg-gray-500 text-white border-gray-600'
    }
  }

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 flex-shrink-0" />
      case 'error':
        return <XCircle className="w-6 h-6 flex-shrink-0" />
      case 'info':
        return <Info className="w-6 h-6 flex-shrink-0" />
      case 'warning':
        return <AlertCircle className="w-6 h-6 flex-shrink-0" />
      default:
        return <Info className="w-6 h-6 flex-shrink-0" />
    }
  }

  return (
    <div
      className={`
        fixed z-50 min-w-[300px] max-w-md rounded-xl shadow-jeffy-lg flex items-center gap-3 px-6 py-4
        border-2 transition-all duration-300
        ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}
        ${getStyles()}
      `}
      style={{
        top: `${16 + index * 80}px`,
        right: '16px',
      }}
    >
      {getIcon()}
      <p className="flex-1 font-medium text-sm sm:text-base">{notification.message}</p>
      <button
        onClick={() => {
          setIsVisible(false)
          setTimeout(() => onRemove(notification.id), 300)
        }}
        className="flex-shrink-0 hover:bg-black/20 rounded-full p-1 transition-colors"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function NotificationContainer({ notifications, onRemove }: { notifications: Notification[]; onRemove: (id: string) => void }) {
  // Mobile: center position, Desktop: top-right
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640

  if (notifications.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div className={isMobile ? 'fixed top-4 left-1/2 transform -translate-x-1/2' : 'fixed top-4 right-4'}>
        {notifications.map((notification, index) => (
          <div key={notification.id} className="pointer-events-auto mb-2">
            <NotificationItem
              notification={notification}
              onRemove={onRemove}
              index={index}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// Export Notification component (backward compatibility alias for Toast)
export { NotificationContainer as Notification }

