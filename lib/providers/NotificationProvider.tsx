'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { NotificationContainer } from '@/components/Notification'

interface NotificationContextType {
  showSuccess: (message: string, duration?: number) => string
  showError: (message: string, duration?: number) => string
  showInfo: (message: string, duration?: number) => string
  showWarning: (message: string, duration?: number) => string
  addNotification: (message: string, type?: 'success' | 'error' | 'info' | 'warning', duration?: number) => string
  removeNotification: (id: string) => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const {
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    clearAll,
  } = useNotifications()

  return (
    <NotificationContext.Provider
      value={{
        showSuccess,
        showError,
        showInfo,
        showWarning,
        addNotification,
        removeNotification,
        clearAll,
      }}
    >
      {children}
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

