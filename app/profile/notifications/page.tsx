'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'
import { createClient } from '@/lib/supabase'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { NotificationCard } from '@/components/NotificationCard'
import { OrderNotification } from '@/types/database'
import { 
  Package, 
  ArrowLeft, 
  Filter, 
  Bell,
  CheckCircle,
  CheckCheck,
  Truck,
  CreditCard,
  PackageCheck
} from 'lucide-react'
import Link from 'next/link'
import { markNotificationAsRead, getAllNotifications } from '@/lib/notifications'

type NotificationTypeFilter = 'all' | 'status_update' | 'driver_assigned' | 'delivered' | 'payment_received'

export default function NotificationsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [notifications, setNotifications] = useState<OrderNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<NotificationTypeFilter>('all')
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all')

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push('/auth/login')
      return
    }

    fetchNotifications()
  }, [user, authLoading])

  // Real-time subscription for notifications
  useEffect(() => {
    if (!user) return

    const supabase = createClient()

    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications((prev) => [payload.new as OrderNotification, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setNotifications((prev) =>
              prev.map((n) => (n.id === payload.new.id ? (payload.new as OrderNotification) : n))
            )
          } else if (payload.eventType === 'DELETE') {
            setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const fetchNotifications = async () => {
    if (!user) return

    try {
      setLoading(true)
      const allNotifications = await getAllNotifications(user.id, 100)
      setNotifications(allNotifications)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      alert('Error loading notifications')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!user) return

    try {
      const unreadNotifications = notifications.filter((n) => !n.read)
      await Promise.all(unreadNotifications.map((n) => markNotificationAsRead(n.id)))
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  // Filter notifications
  const filteredNotifications = React.useMemo(() => {
    let filtered = notifications

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter((n) => n.type === typeFilter)
    }

    // Filter by read status
    if (readFilter === 'unread') {
      filtered = filtered.filter((n) => !n.read)
    } else if (readFilter === 'read') {
      filtered = filtered.filter((n) => n.read)
    }

    return filtered
  }, [notifications, typeFilter, readFilter])

  const unreadCount = notifications.filter((n) => !n.read).length

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <Package className="w-12 h-12 text-green-500 animate-[spin_3s_linear_infinite]" />
          </div>
          <p className="text-gray-700">Loading notifications...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-jeffy-yellow">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link href="/profile" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Profile</span>
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Bell className="w-6 h-6 sm:w-8 sm:h-8" />
                Notifications
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                {unreadCount > 0 ? (
                  <span>
                    {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </span>
                ) : (
                  'All caught up!'
                )}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button onClick={handleMarkAllAsRead} variant="outline" size="sm">
                <CheckCheck className="w-4 h-4 mr-2" />
                Mark All Read
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6 sm:mb-8 p-4 sm:p-6">
          <div className="space-y-4">
            {/* Type Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Type:</span>
              {([
                { value: 'all', label: 'All', icon: Bell },
                { value: 'status_update', label: 'Status', icon: PackageCheck },
                { value: 'driver_assigned', label: 'Driver', icon: Truck },
                { value: 'delivered', label: 'Delivered', icon: CheckCircle },
                { value: 'payment_received', label: 'Payment', icon: CreditCard },
              ] as const).map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  variant={typeFilter === value ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setTypeFilter(value as NotificationTypeFilter)}
                  className="capitalize flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Button>
              ))}
            </div>

            {/* Read Status Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              {(['all', 'unread', 'read'] as const).map((status) => (
                <Button
                  key={status}
                  variant={readFilter === status ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setReadFilter(status)}
                  className="capitalize"
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <Card className="p-8 sm:p-12 text-center">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {notifications.length === 0 ? 'No notifications yet' : 'No notifications match your filters'}
            </h3>
            <p className="text-gray-600">
              {notifications.length === 0
                ? "You'll receive notifications about your orders here"
                : 'Try adjusting your filters'}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

