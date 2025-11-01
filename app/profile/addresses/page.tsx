'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'
import { createClient } from '@/lib/supabase'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { AddressCard } from '@/components/AddressCard'
import { AddressForm } from '@/components/AddressForm'
import { SavedAddress } from '@/types/database'
import { Package, Plus, MapPin, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AddressesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push('/auth/login')
      return
    }

    fetchAddresses()
  }, [user, authLoading])

  const fetchAddresses = async () => {
    if (!user) return

    try {
      setLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from('saved_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setAddresses(data || [])
    } catch (error) {
      console.error('Error fetching addresses:', error)
      alert('Error loading addresses')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (addressData: Omit<SavedAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return

    try {
      setFormLoading(true)
      const supabase = createClient()

      // If setting as default, unset other defaults first
      if (addressData.is_default) {
        await supabase
          .from('saved_addresses')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .eq('is_default', true)
      }

      if (editingAddress) {
        // Update existing address
        const { error } = await supabase
          .from('saved_addresses')
          .update({
            ...addressData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingAddress.id)
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        // Create new address
        const { error } = await supabase
          .from('saved_addresses')
          .insert({
            ...addressData,
            user_id: user.id,
          })

        if (error) throw error
      }

      await fetchAddresses()
      setShowForm(false)
      setEditingAddress(null)
    } catch (error: any) {
      console.error('Error saving address:', error)
      alert(error.message || 'Error saving address')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = (address: SavedAddress) => {
    setEditingAddress(address)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return
    if (!user) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('saved_addresses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      await fetchAddresses()
    } catch (error: any) {
      console.error('Error deleting address:', error)
      alert(error.message || 'Error deleting address')
    }
  }

  const handleSetDefault = async (id: string) => {
    if (!user) return

    try {
      const supabase = createClient()

      // Unset all other defaults
      await supabase
        .from('saved_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('is_default', true)

      // Set this one as default
      const { error } = await supabase
        .from('saved_addresses')
        .update({ is_default: true })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      await fetchAddresses()
    } catch (error: any) {
      console.error('Error setting default address:', error)
      alert(error.message || 'Error setting default address')
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <Package className="w-12 h-12 text-green-500 animate-[spin_3s_linear_infinite]" />
          </div>
          <p className="text-gray-700">Loading addresses...</p>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Saved Addresses</h1>
              <p className="text-sm sm:text-base text-gray-600">Manage your delivery addresses</p>
            </div>
            {!showForm && (
              <Button onClick={() => {
                setEditingAddress(null)
                setShowForm(true)
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Address
              </Button>
            )}
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <Card className="mb-6 sm:mb-8 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </h2>
            <AddressForm
              address={editingAddress}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false)
                setEditingAddress(null)
              }}
              loading={formLoading}
            />
          </Card>
        )}

        {/* Addresses List */}
        {addresses.length === 0 && !showForm ? (
          <Card className="p-8 sm:p-12 text-center">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved addresses</h3>
            <p className="text-gray-600 mb-6">Add your first address to make checkout faster</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Address
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                isDefault={address.is_default}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onSetDefault={handleSetDefault}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
