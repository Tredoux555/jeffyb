'use client'

import React from 'react'
import Link from 'next/link'
import { Card } from './Card'
import { OrderNotification } from '@/types/database'
import { 
  CheckCircle, 
  Truck, 
  Package, 
  CreditCard, 
  Bell,
  Clock,
  ArrowRight,
  Circle
} from 'lucide-react'

interface NotificationCardProps {
  notification: OrderNotification
  onMarkAsRead?: (id: string) => void
}

export function NotificationCard({ notification, onMarkAsRead }: NotificationCardProps) {
  const getIcon = () => {
    switch (notification.type) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'driver_assigned':
        return <Truck className="w-5 h-5 text-blue-600" />
      case 'status_update':
        return <Package className="w-5 h-5 text-yellow-600" />
      case 'payment_received':
        return <CreditCard className="w-5 h-5 text-purple-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  const getTypeColor = () => {
    switch (notification.type) {
      case 'delivered':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'driver_assigned':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'status_update':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'payment_received':
        return 'bg-purple-100 text-purple-700 border-purple-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const handleClick = () => {
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id)
    }
  }

  return (
    <Link href={notification.order_id ? `/profile/orders/${notification.order_id}` : '#'} onClick={handleClick}>
      <Card className={`p-4 sm:p-6 hover:shadow-jeffy-lg transition-all duration-300 cursor-pointer group ${
        !notification.read ? 'border-l-4 border-jeffy-yellow' : ''
      }`}>
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            notification.read ? 'bg-gray-100' : 'bg-jeffy-yellow-light'
          }`}>
            {getIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {!notification.read && (
                    <Circle className="w-2 h-2 fill-jeffy-yellow text-jeffy-yellow flex-shrink-0" />
                  )}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize border ${getTypeColor()}`}>
                    {notification.type.replace('_', ' ')}
                  </span>
                </div>
                <p className={`font-medium text-gray-900 ${!notification.read ? 'font-semibold' : ''}`}>
                  {notification.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>
                  {new Date(notification.created_at).toLocaleDateString('en-ZA', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              {notification.order_id && (
                <div className="flex items-center gap-1 text-xs text-jeffy-yellow group-hover:text-jeffy-yellow/80 transition-colors">
                  <span>View Order</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}

