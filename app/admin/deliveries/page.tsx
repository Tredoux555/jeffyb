'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { createClient } from '@/lib/supabase'
import { 
  ArrowLeft, 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Phone, 
  Package,
  RefreshCw,
  User,
  Calendar,
  Navigation,
  AlertCircle
} from 'lucide-react'

interface DeliveryRequest {
  id: string
  order_id: string
  status: 'pending' | 'accepted' | 'in_transit' | 'delivered' | 'cancelled'
  driver_id: string | null
  pickup_address: string
  delivery_address: string
  estimated_delivery: string | null
  actual_delivery: string | null
  notes: string
  created_at: string
  customer_name?: string
  customer_phone?: string
  order?: {
    id: string
    total: number
    items: any[]
    delivery_info: any
  }
  driver?: {
    id: string
    name: string
    phone: string
    status: string
  }
}

interface Driver {
  id: string
  name: string
  phone: string
  status: 'active' | 'busy' | 'offline'
  current_lat?: number
  current_lng?: number
  last_location_update?: string
}

export default function AdminDeliveriesPage() {
  const router = useRouter()
  const [deliveries, setDeliveries] = useState<DeliveryRequest[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [etaInput, setEtaInput] = useState<{ [key: string]: string }>({})

  const statusConfig = {
    pending: { label: 'Pending', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgLight: 'bg-yellow-50' },
    accepted: { label: 'Accepted', color: 'bg-blue-500', textColor: 'text-blue-700', bgLight: 'bg-blue-50' },
    in_transit: { label: 'In Transit', color: 'bg-purple-500', textColor: 'text-purple-700', bgLight: 'bg-purple-50' },
    delivered: { label: 'Delivered', color: 'bg-green-500', textColor: 'text-green-700', bgLight: 'bg-green-50' },
    cancelled: { label: 'Cancelled', color: 'bg-red-500', textColor: 'text-red-700', bgLight: 'bg-red-50' }
  }

  useEffect(() => {
    checkAuth()
    fetchDeliveries()
    fetchDrivers()
  }, [])

  const checkAuth = () => {
    if (typeof window !== 'undefined') {
      const isAdmin = localStorage.getItem('jeffy-admin')
      if (!isAdmin) {
        router.push('/admin/login')
      }
    }
  }

  const fetchDeliveries = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/deliveries')
      const result = await response.json()
      if (result.success) {
        setDeliveries(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDrivers = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('name')
      
      if (!error && data) {
        setDrivers(data)
      }
    } catch (error) {
      console.error('Error fetching drivers:', error)
    }
  }

  const handleStatusUpdate = async (deliveryId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/admin/deliveries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryId, status: newStatus })
      })
      
      const result = await response.json()
      if (result.success) {
        fetchDeliveries()
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update delivery status')
    }
  }

  const handleAssignDriver = async (deliveryId: string, driverId: string) => {
    try {
      const response = await fetch('/api/admin/deliveries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          deliveryId, 
          driver_id: driverId,
          status: 'accepted'
        })
      })
      
      const result = await response.json()
      if (result.success) {
        // Update driver status to busy
        const supabase = createClient()
        await supabase
          .from('drivers')
          .update({ status: 'busy' })
          .eq('id', driverId)
        
        fetchDeliveries()
        fetchDrivers()
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error assigning driver:', error)
      alert('Failed to assign driver')
    }
  }

  const handleSetETA = async (deliveryId: string) => {
    const eta = etaInput[deliveryId]
    if (!eta) {
      alert('Please enter an ETA')
      return
    }

    try {
      const response = await fetch('/api/admin/deliveries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          deliveryId, 
          estimated_delivery: new Date(eta).toISOString()
        })
      })
      
      const result = await response.json()
      if (result.success) {
        fetchDeliveries()
        setEtaInput({ ...etaInput, [deliveryId]: '' })
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error setting ETA:', error)
      alert('Failed to set ETA')
    }
  }

  const filteredDeliveries = deliveries.filter(delivery => 
    selectedStatus === 'all' || delivery.status === selectedStatus
  )

  const getStatusCounts = () => {
    return {
      all: deliveries.length,
      pending: deliveries.filter(d => d.status === 'pending').length,
      accepted: deliveries.filter(d => d.status === 'accepted').length,
      in_transit: deliveries.filter(d => d.status === 'in_transit').length,
      delivered: deliveries.filter(d => d.status === 'delivered').length
    }
  }

  const statusCounts = getStatusCounts()
  const availableDrivers = drivers.filter(d => d.status === 'active')

  if (loading) {
    return <LoadingSpinner message="Loading deliveries..." fullScreen />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-jeffy-yellow to-amber-100">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Delivery Management</h1>
              <p className="text-slate-600">Track and manage delivery requests</p>
            </div>
          </div>
          <Button variant="outline" onClick={fetchDeliveries}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {[
            { status: 'all', label: 'All', icon: Package },
            { status: 'pending', label: 'Pending', icon: Clock },
            { status: 'accepted', label: 'Accepted', icon: CheckCircle },
            { status: 'in_transit', label: 'In Transit', icon: Truck },
            { status: 'delivered', label: 'Delivered', icon: CheckCircle }
          ].map((item) => {
            const Icon = item.icon
            const config = item.status !== 'all' ? statusConfig[item.status as keyof typeof statusConfig] : { color: 'bg-slate-900' }
            return (
              <button
                key={item.status}
                onClick={() => setSelectedStatus(item.status)}
                className="w-full text-left"
              >
                <Card 
                  className={`p-3 transition-all ${
                    selectedStatus === item.status ? 'ring-2 ring-slate-900' : ''
                  }`}
                  hover
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-600">{item.label}</p>
                      <p className="text-xl font-bold text-slate-900">
                        {statusCounts[item.status as keyof typeof statusCounts] || 0}
                      </p>
                    </div>
                    <div className={`w-8 h-8 ${config.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </Card>
              </button>
            )
          })}
        </div>

        {/* Available Drivers */}
        <Card className="mb-6 p-4">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-5 h-5 text-slate-400" />
            <h3 className="font-semibold text-slate-900">Available Drivers</h3>
            <span className="text-sm text-slate-500">({availableDrivers.length} available)</span>
          </div>
          {availableDrivers.length === 0 ? (
            <p className="text-slate-500 text-sm">No drivers available at the moment</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableDrivers.map(driver => (
                <div 
                  key={driver.id}
                  className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {driver.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{driver.name}</p>
                    <p className="text-xs text-slate-500">{driver.phone}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Deliveries List */}
        {filteredDeliveries.length === 0 ? (
          <Card className="text-center py-12">
            <Truck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-lg font-semibold text-slate-900 mb-2">No deliveries found</p>
            <p className="text-slate-500">
              {selectedStatus !== 'all' 
                ? `No ${selectedStatus.replace('_', ' ')} deliveries`
                : 'Delivery requests will appear here'
              }
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredDeliveries.map((delivery) => {
              const config = statusConfig[delivery.status]
              return (
                <Card key={delivery.id} className="p-4 hover:shadow-lg transition-all">
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="font-mono text-sm text-slate-500">
                          #{delivery.id.slice(0, 8)}
                        </span>
                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold text-white ${config.color}`}>
                          {config.label}
                        </span>
                        {delivery.order_id && (
                          <Link href={`/admin/orders`} className="text-xs text-blue-600 hover:underline">
                            Order #{delivery.order_id.slice(0, 8)}
                          </Link>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Customer Info */}
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <User className="w-4 h-4 text-slate-400 mt-0.5" />
                            <div>
                              <p className="font-semibold text-slate-900">{delivery.customer_name || 'N/A'}</p>
                              {delivery.customer_phone && (
                                <p className="text-sm text-slate-500 flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {delivery.customer_phone}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-red-500 mt-0.5" />
                            <p className="text-sm text-slate-700">{delivery.delivery_address || 'No address'}</p>
                          </div>
                        </div>

                        {/* Time Info */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <p className="text-sm text-slate-600">
                              Created: {new Date(delivery.created_at).toLocaleString()}
                            </p>
                          </div>
                          
                          {delivery.estimated_delivery && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-blue-500" />
                              <p className="text-sm text-blue-600 font-medium">
                                ETA: {new Date(delivery.estimated_delivery).toLocaleString()}
                              </p>
                            </div>
                          )}

                          {delivery.actual_delivery && (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <p className="text-sm text-green-600 font-medium">
                                Delivered: {new Date(delivery.actual_delivery).toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Assigned Driver */}
                      {delivery.driver && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {delivery.driver.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{delivery.driver.name}</p>
                              <p className="text-sm text-slate-600">{delivery.driver.phone}</p>
                            </div>
                            <span className={`ml-auto px-2 py-1 rounded-lg text-xs font-medium ${
                              delivery.driver.status === 'active' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {delivery.driver.status}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {delivery.notes && (
                        <div className="mt-3 p-3 bg-slate-50 rounded-xl">
                          <p className="text-sm text-slate-600">
                            <span className="font-medium">Notes:</span> {delivery.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 min-w-[200px]">
                      {/* Status Update */}
                      {delivery.status !== 'delivered' && delivery.status !== 'cancelled' && (
                        <select
                          value={delivery.status}
                          onChange={(e) => handleStatusUpdate(delivery.id, e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-jeffy-yellow"
                        >
                          <option value="pending">Pending</option>
                          <option value="accepted">Accepted</option>
                          <option value="in_transit">In Transit</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      )}

                      {/* Assign Driver */}
                      {!delivery.driver_id && delivery.status === 'pending' && availableDrivers.length > 0 && (
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAssignDriver(delivery.id, e.target.value)
                            }
                          }}
                          defaultValue=""
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-jeffy-yellow"
                        >
                          <option value="">Assign driver...</option>
                          {availableDrivers.map(driver => (
                            <option key={driver.id} value={driver.id}>
                              {driver.name}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* Set ETA */}
                      {delivery.status !== 'delivered' && delivery.status !== 'cancelled' && (
                        <div className="flex gap-1">
                          <Input
                            type="datetime-local"
                            value={etaInput[delivery.id] || ''}
                            onChange={(e) => setEtaInput({ ...etaInput, [delivery.id]: e.target.value })}
                            className="flex-1 text-xs"
                          />
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleSetETA(delivery.id)}
                          >
                            <Clock className="w-4 h-4" />
                          </Button>
                        </div>
                      )}

                      {/* Quick Actions */}
                      {delivery.status === 'accepted' && (
                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700"
                          onClick={() => handleStatusUpdate(delivery.id, 'in_transit')}
                        >
                          <Navigation className="w-4 h-4 mr-2" />
                          Start Transit
                        </Button>
                      )}
                      
                      {delivery.status === 'in_transit' && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleStatusUpdate(delivery.id, 'delivered')}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark Delivered
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
