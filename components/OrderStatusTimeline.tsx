'use client'

import React from 'react'
import { 
  ShoppingCart, 
  CreditCard, 
  Package, 
  Truck, 
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'

interface TimelineStep {
  status: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  timestamp?: string
  completed: boolean
  current: boolean
}

interface OrderStatusTimelineProps {
  currentStatus: string
  createdAt: string
  readyForDeliveryAt?: string
  deliveredAt?: string
}

export function OrderStatusTimeline({ 
  currentStatus, 
  createdAt,
  readyForDeliveryAt,
  deliveredAt
}: OrderStatusTimelineProps) {
  const statusOrder = ['pending', 'confirmed', 'processing', 'ready_for_delivery', 'out_for_delivery', 'delivered']
  const currentIndex = statusOrder.indexOf(currentStatus)
  const isCancelled = currentStatus === 'cancelled'

  const steps: TimelineStep[] = [
    {
      status: 'pending',
      label: 'Order Placed',
      icon: ShoppingCart,
      timestamp: createdAt,
      completed: currentIndex >= 0 || isCancelled,
      current: currentStatus === 'pending'
    },
    {
      status: 'confirmed',
      label: 'Payment Confirmed',
      icon: CreditCard,
      completed: currentIndex >= 1,
      current: currentStatus === 'confirmed'
    },
    {
      status: 'processing',
      label: 'Processing',
      icon: Package,
      completed: currentIndex >= 2,
      current: currentStatus === 'processing'
    },
    {
      status: 'ready_for_delivery',
      label: 'Ready for Delivery',
      icon: Package,
      timestamp: readyForDeliveryAt,
      completed: currentIndex >= 3,
      current: currentStatus === 'ready_for_delivery'
    },
    {
      status: 'out_for_delivery',
      label: 'Out for Delivery',
      icon: Truck,
      completed: currentIndex >= 4,
      current: currentStatus === 'out_for_delivery'
    },
    {
      status: 'delivered',
      label: 'Delivered',
      icon: CheckCircle,
      timestamp: deliveredAt,
      completed: currentIndex >= 5,
      current: currentStatus === 'delivered'
    }
  ]

  if (isCancelled) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
        <XCircle className="w-8 h-8 text-red-500" />
        <div>
          <p className="font-semibold text-red-700">Order Cancelled</p>
          <p className="text-sm text-red-600">This order has been cancelled</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />
      
      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon
          return (
            <div key={step.status} className="relative flex items-start gap-4">
              {/* Circle/Icon */}
              <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                step.completed
                  ? 'bg-green-500 border-green-500 text-white'
                  : step.current
                  ? 'bg-jeffy-yellow border-jeffy-yellow text-slate-900 animate-pulse'
                  : 'bg-white border-gray-300 text-gray-400'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              
              {/* Content */}
              <div className="flex-1 pb-4">
                <p className={`font-semibold ${
                  step.completed || step.current ? 'text-slate-900' : 'text-gray-400'
                }`}>
                  {step.label}
                </p>
                {step.timestamp && (
                  <p className="text-sm text-gray-500">
                    {new Date(step.timestamp).toLocaleString()}
                  </p>
                )}
                {step.current && !step.completed && (
                  <p className="text-sm text-jeffy-yellow font-medium flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    In Progress
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

