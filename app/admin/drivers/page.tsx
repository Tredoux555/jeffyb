'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { createClient } from '@/lib/supabase'
import { Driver } from '@/types/database'
import { DriversMap } from '@/components/DriversMap'
import { mockDrivers, shouldUseMockDrivers } from '@/lib/mock-drivers'
import {
  MapPin,
  Truck,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Filter,
  Package
} from 'lucide-react'

type StatusFilter = 'all' | 'active' | 'busy' | 'inactive'

export default function AdminDriversPage() {
  const router = useRouter()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)

  useEffect(() => {
    checkAuth()
    fetchDrivers()
  }, [])

  // Real-time subscription for driver location updates (optimized)
  useEffect(() => {
    const supabase = createClient()

    // Debounce location updates to prevent excessive re-renders
    let updateTimeout: NodeJS.Timeout | null = null
    const pendingUpdates = new Map<string, Driver>()

    const channel = supabase
      .channel('drivers-location-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'drivers',
          filter: 'current_location=not.is.null',
        },
        (payload) => {
          // Batch updates - collect changes and apply after debounce
          const updatedDriver = payload.new as Driver
          pendingUpdates.set(updatedDriver.id, updatedDriver)

          // Clear existing timeout
          if (updateTimeout) {
            clearTimeout(updateTimeout)
          }

          // Debounce updates (update every 2 seconds max)
          updateTimeout = setTimeout(() => {
            setDrivers((prevDrivers) => {
              const driverMap = new Map(prevDrivers.map((d) => [d.id, d]))
              
              // Apply all pending updates
              pendingUpdates.forEach((updatedDriver, id) => {
                driverMap.set(id, updatedDriver)
              })
              
              pendingUpdates.clear()
              return Array.from(driverMap.values())
            })
          }, 2000)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'drivers',
        },
        (payload) => {
          // Add new driver immediately (less frequent than updates)
          const newDriver = payload.new as Driver
          
          // Only add if has location data
          if (newDriver.current_location && newDriver.current_location.lat && newDriver.current_location.lng) {
            setDrivers((prevDrivers) => {
              // Check if driver already exists
              if (prevDrivers.some((d) => d.id === newDriver.id)) {
                return prevDrivers
              }
              return [...prevDrivers, newDriver]
            })
          }
        }
      )
      .subscribe()

    // Cleanup function
    return () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout)
      }
      supabase.removeChannel(channel)
    }
  }, [])

  const checkAuth = () => {
    if (typeof window !== 'undefined') {
      const isAdmin = localStorage.getItem('jeffy-admin')
      if (!isAdmin) {
        router.push('/admin/login')
      }
    }
  }

  const fetchDrivers = async () => {
    try {
      setLoading(true)

      // Use mock drivers if enabled (for testing)
      if (shouldUseMockDrivers()) {
        setDrivers(mockDrivers)
        return
      }

      const supabase = createClient()

      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching drivers:', error)
        return
      }

      // Filter drivers with location data
      const driversWithLocations = (data || []).filter(
        (driver: Driver) =>
          driver.current_location &&
          driver.current_location.lat &&
          driver.current_location.lng
      )

      setDrivers(driversWithLocations || [])
    } catch (error) {
      console.error('Error fetching drivers:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter drivers by status
  const filteredDrivers = React.useMemo(() => {
    if (filter === 'all') return drivers
    return drivers.filter((driver) => driver.status === filter)
  }, [drivers, filter])

  // Calculate stats
  const stats = React.useMemo(() => {
    const active = drivers.filter((d) => d.status === 'active').length
    const busy = drivers.filter((d) => d.status === 'busy').length
    const inactive = drivers.filter((d) => d.status === 'inactive').length
    const withLocation = drivers.filter(
      (d) => d.current_location && d.current_location.lat && d.current_location.lng
    ).length

    return { active, busy, inactive, withLocation, total: drivers.length }
  }, [drivers])

  const handleRefresh = () => {
    fetchDrivers()
  }

  const handleDriverClick = (driver: Driver) => {
    setSelectedDriver(driver)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-jeffy-yellow to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <Package className="w-12 h-12 text-green-500 animate-pulse" />
          </div>
          <p className="text-gray-700">Loading drivers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-jeffy-yellow to-amber-100">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Driver Locations
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Real-time tracking of all active drivers
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/admin')}
              className="w-full sm:w-auto"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Drivers</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
            </div>
          </Card>
          <Card className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Active</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
            </div>
          </Card>
          <Card className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Busy</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.busy}</p>
              </div>
              <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />
            </div>
          </Card>
          <Card className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Inactive</p>
                <p className="text-lg sm:text-2xl font-bold text-red-600">{stats.inactive}</p>
              </div>
              <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
            </div>
          </Card>
          <Card className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">On Map</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-600">{stats.withLocation}</p>
              </div>
              <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
            </div>
          </Card>
        </div>

        {/* Filter Controls */}
        <Card className="p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <span className="text-sm sm:text-base font-medium text-gray-700">Filter by Status:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all', 'active', 'busy', 'inactive'] as StatusFilter[]).map((status) => (
                <Button
                  key={status}
                  variant={filter === status ? 'primary' : 'outline'}
                  onClick={() => setFilter(status)}
                  className="capitalize"
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Map */}
        <Card className="p-4 sm:p-6">
          <div className="mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              Driver Locations Map
            </h2>
            <p className="text-sm text-gray-600">
              Showing {filteredDrivers.length} driver{filteredDrivers.length !== 1 ? 's' : ''} with
              location data
              {filter !== 'all' && ` (${filter} only)`}
            </p>
          </div>
          <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height: '600px' }}>
            <DriversMap drivers={filteredDrivers} onDriverClick={handleDriverClick} />
          </div>
        </Card>

        {/* Selected Driver Details */}
        {selectedDriver && (
          <Card className="mt-6 sm:mt-8 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Driver Details</h3>
              <Button variant="outline" onClick={() => setSelectedDriver(null)}>
                Close
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Name</p>
                <p className="font-medium text-gray-900">{selectedDriver.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${
                    selectedDriver.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : selectedDriver.status === 'busy'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selectedDriver.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Email</p>
                <p className="font-medium text-gray-900">{selectedDriver.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Phone</p>
                <p className="font-medium text-gray-900">{selectedDriver.phone}</p>
              </div>
              {selectedDriver.vehicle_type && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Vehicle Type</p>
                  <p className="font-medium text-gray-900 capitalize">{selectedDriver.vehicle_type}</p>
                </div>
              )}
              {selectedDriver.last_location_update && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Last Location Update</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedDriver.last_location_update).toLocaleString()}
                  </p>
                </div>
              )}
              {selectedDriver.current_location && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Current Location</p>
                  <p className="font-medium text-gray-900">
                    {selectedDriver.current_location.lat.toFixed(6)},{' '}
                    {selectedDriver.current_location.lng.toFixed(6)}
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

