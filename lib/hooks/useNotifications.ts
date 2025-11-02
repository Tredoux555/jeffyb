/**
 * Notification Hook
 * Manages toast notifications throughout the app
 */

import { useState, useCallback } from 'react'
import { Notification, NotificationType } from '@/components/Notification'

let notificationIdCounter = 0

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((message: string, type: NotificationType = 'success', duration?: number) => {
    const id = `notification-${++notificationIdCounter}-${Date.now()}`
    const notification: Notification = {
      id,
      message,
      type,
      duration,
    }

    setNotifications((prev) => [...prev, notification])
    return id
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const showSuccess = useCallback((message: string, duration?: number) => {
    return addNotification(message, 'success', duration)
  }, [addNotification])

  const showError = useCallback((message: string, duration?: number) => {
    return addNotification(message, 'error', duration)
  }, [addNotification])

  const showInfo = useCallback((message: string, duration?: number) => {
    return addNotification(message, 'info', duration)
  }, [addNotification])

  const showWarning = useCallback((message: string, duration?: number) => {
    return addNotification(message, 'warning', duration)
  }, [addNotification])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  return {
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    clearAll,
  }
}

