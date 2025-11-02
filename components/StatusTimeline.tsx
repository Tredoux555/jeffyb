'use client'

import React from 'react'
import { DeliveryAssignment, Order } from '@/types/database'
import { CheckCircle, Clock, Truck, XCircle } from 'lucide-react'

interface StatusTimelineProps {
  order: Order
  assignment: DeliveryAssignment | null
  eta?: string | null
}

export function StatusTimeline({ order, assignment, eta }: StatusTimelineProps) {
  if (!assignment) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-900">Order Confirmed</p>
            <p className="text-xs text-gray-600">
              {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-gray-500">Awaiting Driver Assignment</p>
          </div>
        </div>
      </div>
    )
  }

  const status = assignment.status as string

  return (
    <div className="space-y-4">
      {/* Order Confirmed */}
      <div className="flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold text-gray-900">Order Confirmed</p>
          <p className="text-xs text-gray-600">
            {new Date(order.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Driver Assigned */}
      {['assigned', 'picked_up', 'in_transit', 'delivered'].includes(status) ? (
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-900">Driver Assigned</p>
            {assignment.assigned_at && (
              <p className="text-xs text-gray-600">
                {new Date(assignment.assigned_at).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-gray-500">Awaiting Driver Assignment</p>
          </div>
        </div>
      )}

      {/* Picked Up */}
      {['picked_up', 'in_transit', 'delivered'].includes(status) ? (
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-900">Picked Up</p>
            {assignment.picked_up_at && (
              <p className="text-xs text-gray-600">
                {new Date(assignment.picked_up_at).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      ) : status === 'assigned' ? (
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-gray-500">Awaiting Pickup</p>
          </div>
        </div>
      ) : null}

      {/* In Transit */}
      {status === 'in_transit' && (
        <div className="flex items-start gap-3">
          <Truck className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0 animate-pulse" />
          <div>
            <p className="font-semibold text-blue-600">In Transit</p>
            <p className="text-xs text-gray-600">On the way to you</p>
            {eta && (
              <p className="text-xs text-jeffy-yellow font-medium mt-1">ETA: {eta}</p>
            )}
          </div>
        </div>
      )}

      {/* Delivered or Failed */}
      {status === 'delivered' ? (
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-600">Delivered</p>
            {assignment.delivered_at && (
              <p className="text-xs text-gray-600">
                {new Date(assignment.delivered_at).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      ) : status === 'failed' ? (
        <div className="flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-600">Delivery Failed</p>
            {assignment.delivery_notes && (
              <p className="text-xs text-gray-600 mt-1">{assignment.delivery_notes}</p>
            )}
          </div>
        </div>
      ) : status === 'in_transit' ? (
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-gray-500">Awaiting Delivery</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}

