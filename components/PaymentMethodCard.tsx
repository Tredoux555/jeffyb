'use client'

import React from 'react'
import { Card } from './Card'
import { Button } from './Button'
import { SavedPaymentMethod } from '@/types/database'
import { CreditCard, Edit, Trash2, Check } from 'lucide-react'

interface PaymentMethodCardProps {
  paymentMethod: SavedPaymentMethod
  isDefault: boolean
  onEdit: (paymentMethod: SavedPaymentMethod) => void
  onDelete: (id: string) => void
  onSetDefault: (id: string) => void
}

const getBrandIcon = (brand: string | null) => {
  const brandLower = brand?.toLowerCase() || ''
  if (brandLower.includes('visa')) return '💳'
  if (brandLower.includes('master')) return '💳'
  if (brandLower.includes('paypal')) return '🔵'
  return '💳'
}

export function PaymentMethodCard({ paymentMethod, isDefault, onEdit, onDelete, onSetDefault }: PaymentMethodCardProps) {
  const formatCardNumber = (last4: string | null) => {
    if (!last4) return '****'
    return `•••• •••• •••• ${last4}`
  }

  const formatExpiry = () => {
    if (!paymentMethod.expiry_month || !paymentMethod.expiry_year) return ''
    const month = paymentMethod.expiry_month.toString().padStart(2, '0')
    const year = paymentMethod.expiry_year.toString().slice(-2)
    return `${month}/${year}`
  }

  return (
    <Card className="p-4 sm:p-6 hover:shadow-jeffy-lg transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-jeffy-yellow-light flex items-center justify-center text-xl">
            {getBrandIcon(paymentMethod.brand)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 capitalize">{paymentMethod.type}</h3>
            {paymentMethod.brand && (
              <p className="text-sm text-gray-600 capitalize">{paymentMethod.brand}</p>
            )}
          </div>
          {isDefault && (
            <span className="px-2 py-1 bg-jeffy-yellow text-gray-900 text-xs font-medium rounded-full flex items-center gap-1">
              <Check className="w-3 h-3" />
              Default
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(paymentMethod)}
            className="p-2"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(paymentMethod.id)}
            className="p-2 text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="space-y-1 text-sm text-gray-600">
        {paymentMethod.last4 && (
          <p className="font-mono">{formatCardNumber(paymentMethod.last4)}</p>
        )}
        {formatExpiry() && (
          <p>Expires: {formatExpiry()}</p>
        )}
        {paymentMethod.type === 'paypal' && (
          <p className="text-gray-500">PayPal account</p>
        )}
      </div>
      {!isDefault && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSetDefault(paymentMethod.id)}
          className="mt-3"
        >
          Set as Default
        </Button>
      )}
    </Card>
  )
}

