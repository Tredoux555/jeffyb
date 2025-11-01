'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/contexts/AuthContext'
import { SavedAddress } from '@/types/database'
import { Button } from './Button'
import { MapPin, Plus } from 'lucide-react'

interface AddressSelectorProps {
  selectedAddressId?: string | null
  onSelect: (address: SavedAddress | null) => void
  allowNew?: boolean
  onNew?: () => void
}

export function AddressSelector({ selectedAddressId, onSelect, allowNew = true, onNew }: AddressSelectorProps) {
  const { user } = useAuth()
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    fetchAddresses()
  }, [user])

  const fetchAddresses = async () => {
    if (!user) return

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('saved_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setAddresses(data || [])

      // Auto-select default address if none selected
      if (!selectedAddressId && data && data.length > 0) {
        const defaultAddress = data.find((a) => a.is_default) || data[0]
        onSelect(defaultAddress)
      }
    } catch (error) {
      console.error('Error fetching addresses:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user || loading) {
    return null
  }

  if (addresses.length === 0) {
    return (
      <div>
        <p className="text-sm text-gray-600 mb-2">No saved addresses</p>
        {allowNew && onNew && (
          <Button variant="outline" size="sm" onClick={onNew}>
            <Plus className="w-4 h-4 mr-2" />
            Add Address
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select a saved address
      </label>
      <select
        value={selectedAddressId || ''}
        onChange={(e) => {
          const address = addresses.find((a) => a.id === e.target.value)
          onSelect(address || null)
        }}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-jeffy-yellow focus:border-transparent"
      >
        <option value="">Choose an address...</option>
        {addresses.map((address) => (
          <option key={address.id} value={address.id}>
            {address.label} {address.is_default && '(Default)'} - {address.address}
          </option>
        ))}
      </select>
      {allowNew && onNew && (
        <Button variant="outline" size="sm" onClick={onNew} className="mt-2">
          <Plus className="w-4 h-4 mr-2" />
          Use a different address
        </Button>
      )}
    </div>
  )
}

