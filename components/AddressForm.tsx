'use client'

import React, { useState } from 'react'
import { Button } from './Button'
import { Input } from './Input'
import { AddressInput } from './AddressInput'
import { SavedAddress } from '@/types/database'

interface AddressFormProps {
  address?: SavedAddress | null
  onSubmit: (address: Omit<SavedAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function AddressForm({ address, onSubmit, onCancel, loading = false }: AddressFormProps) {
  const [formData, setFormData] = useState<Omit<SavedAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'>>({
    label: address?.label || '',
    address: address?.address || '',
    city: address?.city || '',
    postal_code: address?.postal_code || '',
    country: address?.country || 'South Africa',
    latitude: address?.latitude ?? null,
    longitude: address?.longitude ?? null,
    is_default: address?.is_default || false,
  })

  const handleAddressSelect = (data: {
    address: string
    city: string
    postal_code: string
    latitude?: number
    longitude?: number
  }) => {
    setFormData((prev) => ({
      ...prev,
      address: data.address,
      city: data.city,
      postal_code: data.postal_code,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.label || !formData.address) {
      alert('Please fill in all required fields')
      return
    }
    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Label"
        type="text"
        value={formData.label}
        onChange={(e) => setFormData({ ...formData, label: e.target.value })}
        required
        placeholder="Home, Work, Office, etc."
      />

      <div>
        <AddressInput
          label="Address"
          value={formData.address}
          onChange={(value) => setFormData({ ...formData, address: value })}
          onAddressSelect={handleAddressSelect}
          placeholder="Type and select an address"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="City"
            type="text"
            value={formData.city || ''}
            onChange={(e) => setFormData({ ...formData, city: e.target.value || null })}
            placeholder="City"
          />

          <Input
            label="Postal Code"
            type="text"
            value={formData.postal_code || ''}
            onChange={(e) => setFormData({ ...formData, postal_code: e.target.value || null })}
            placeholder="Postal code"
          />
      </div>

      <Input
        label="Country"
        type="text"
        value={formData.country}
        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
        placeholder="Country"
      />

      <div className="flex items-center">
        <input
          type="checkbox"
          checked={formData.is_default}
          onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
          className="rounded border-gray-300 text-jeffy-yellow focus:ring-jeffy-yellow"
        />
        <label className="ml-2 text-sm text-gray-600">Set as default address</label>
      </div>

      <div className="flex gap-3">
        <Button type="submit" loading={loading} className="flex-1">
          {address ? 'Update Address' : 'Add Address'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

