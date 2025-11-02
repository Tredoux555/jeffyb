'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card } from './Card'
import { Button } from './Button'
import { Order } from '@/types/database'
import { Clock, MapPin, Package, CheckCircle, XCircle, Truck } from 'lucide-react'

interface OrderCardProps {
  order: Order
  onViewDetails?: (orderId: string) => void
  showViewDetails?: boolean
  className?: string
}

export function OrderCard({ order, onViewDetails, showViewDetails = true, className }: OrderCardProps) {
  const router = useRouter()

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'shipped':
      case 'in_transit':
        return <Truck className="w-4 h-4 text-blue-600" />
      case 'processing':
      case 'confirmed':
        return <Package className="w-4 h-4 text-blue-600" />
      case 'pending':
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-700'
      case 'confirmed':
      case 'processing':
        return 'bg-blue-100 text-blue-700'
      case 'shipped':
        return 'bg-purple-100 text-purple-700'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const handleViewDetails = (e: React.MouseEvent) => {
    if (onViewDetails) {
      e.preventDefault()
      onViewDetails(order.id)
    } else {
      router.push(`/profile/orders/${order.id}`)
    }
  }

  const itemCount = order.items?.length || 0
  const total = order.total || 0

  return (
    <Link href={`/profile/orders/${order.id}`} className={className}>
      <Card className="p-4 sm:p-6 hover:shadow-jeffy-lg transition-all duration-300 cursor-pointer group">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 w-full">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 group-hover:text-jeffy-yellow transition-colors">
                Order #{order.id.slice(0, 8)}
              </h3>
              <div className="flex items-center gap-2">
                {getStatusIcon(order.status)}
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
                {order.payment_status && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    {order.payment_status === 'paid' ? 'Paid' : order.payment_status}
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {new Date(order.created_at).toLocaleDateString('en-ZA', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              {order.delivery_info?.address && (
                <p className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {order.delivery_info.address}
                  {order.delivery_info.city && `, ${order.delivery_info.city}`}
                </p>
              )}
              <p className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                {itemCount} item{itemCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-lg sm:text-2xl font-bold text-jeffy-yellow mb-2">
              R{total.toFixed(2)}
            </p>
            {showViewDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewDetails}
                className="group-hover:bg-jeffy-yellow group-hover:text-gray-900 transition-colors"
              >
                View Details
              </Button>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}

