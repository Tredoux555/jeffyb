'use client'

import React from 'react'
import { Card } from './Card'
import { Button } from './Button'
import { SavedAddress } from '@/types/database'
import { MapPin, Edit, Trash2, Check } from 'lucide-react'

interface AddressCardProps {
  address: SavedAddress
  isDefault: boolean
  onEdit: (address: SavedAddress) => void
  onDelete: (id: string) => void
  onSetDefault: (id: string) => void
}

export function AddressCard({ address, isDefault, onEdit, onDelete, onSetDefault }: AddressCardProps) {
  return (
    <Card className="p-4 sm:p-6 hover:shadow-jeffy-lg transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-jeffy-yellow" />
          <h3 className="font-semibold text-gray-900">{address.label}</h3>
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
            onClick={() => onEdit(address)}
            className="p-2"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(address.id)}
            className="p-2 text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="space-y-1 text-sm text-gray-600">
        <p>{address.address}</p>
        {address.city && (
          <p>
            {address.city}
            {address.postal_code && ` ${address.postal_code}`}
          </p>
        )}
        {address.country && <p>{address.country}</p>}
      </div>
      {!isDefault && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSetDefault(address.id)}
          className="mt-3"
        >
          Set as Default
        </Button>
      )}
    </Card>
  )
}

