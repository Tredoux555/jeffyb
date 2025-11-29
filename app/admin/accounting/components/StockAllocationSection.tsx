'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Modal } from '@/components/Modal'
import { Shipment, FranchiseStockAllocation, Location } from '@/types/database'
import { 
  Package,
  Truck,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight
} from 'lucide-react'

export default function StockAllocationSection() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [franchises, setFranchises] = useState<Location[]>([])
  const [allocations, setAllocations] = useState<FranchiseStockAllocation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)
  const [showAllocationModal, setShowAllocationModal] = useState(false)
  const [allocationForm, setAllocationForm] = useState<Record<string, Record<string, number>>>({})

  useEffect(() => {
    fetchShipments()
    fetchFranchises()
    fetchAllocations()
  }, [])

  const fetchShipments = async () => {
    try {
      const response = await fetch('/api/admin/shipments?status=arrived,cleared')
      const result = await response.json()
      if (result.success) {
        setShipments(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching shipments:', error)
    }
  }

  const fetchFranchises = async () => {
    try {
      const response = await fetch('/api/admin/franchises?active_only=true')
      const result = await response.json()
      if (result.success) {
        setFranchises(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching franchises:', error)
    }
  }

  const fetchAllocations = async () => {
    try {
      const response = await fetch('/api/admin/franchise-allocations')
      const result = await response.json()
      if (result.success) {
        setAllocations(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching allocations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAllocateStock = (shipment: Shipment) => {
    setSelectedShipment(shipment)
    
    // Initialize allocation form with shipment items
    const form: Record<string, Record<string, number>> = {}
    shipment.items?.forEach((item) => {
      const key = `${item.product_id}_${item.variant_id || 'null'}`
      form[key] = {}
      franchises.forEach(franchise => {
        form[key][franchise.id] = 0
      })
    })
    setAllocationForm(form)
    setShowAllocationModal(true)
  }

  const handleAllocationSubmit = async () => {
    if (!selectedShipment) return

    // Build allocations array
    const allocationsToCreate: any[] = []
    
    Object.entries(allocationForm).forEach(([key, franchiseAllocations]) => {
      const [productId, variantIdStr] = key.split('_')
      const variantId = variantIdStr === 'null' ? null : variantIdStr
      
      Object.entries(franchiseAllocations).forEach(([franchiseId, quantity]) => {
        if (quantity > 0) {
          allocationsToCreate.push({
            franchise_location_id: franchiseId,
            product_id: productId,
            variant_id: variantId,
            quantity: quantity
          })
        }
      })
    })

    if (allocationsToCreate.length === 0) {
      alert('Please allocate at least some stock to a franchise')
      return
    }

    try {
      const response = await fetch('/api/admin/franchise-allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipment_id: selectedShipment.id,
          allocations: allocationsToCreate
        })
      })

      const result = await response.json()
      if (result.success) {
        alert('Stock allocated successfully!')
        setShowAllocationModal(false)
        setSelectedShipment(null)
        fetchAllocations()
        fetchShipments()
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error allocating stock:', error)
      alert('Failed to allocate stock')
    }
  }

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'N/A'
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount)
  }

  const getShipmentAllocations = (shipmentId: string) => {
    return allocations.filter(a => a.shipment_id === shipmentId)
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Stock Allocation</h2>
        <p className="text-sm text-gray-600">
          Allocate stock from shipments to franchises
        </p>
      </div>

      {loading ? (
        <Card className="p-8 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading...</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {shipments.map((shipment) => {
            const shipmentAllocations = getShipmentAllocations(shipment.id)
            const hasAllocations = shipmentAllocations.length > 0
            
            return (
              <Card key={shipment.id} className="p-6">
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Truck className="w-5 h-5 text-gray-500" />
                      <h3 className="font-semibold text-gray-900">
                        {shipment.shipment_reference}
                      </h3>
                      {hasAllocations && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                          Allocated
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Total Items</p>
                        <p className="font-medium">{shipment.items?.length || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total Value</p>
                        <p className="font-medium">{formatCurrency(shipment.total_landed_cost)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Status</p>
                        <p className="font-medium">{shipment.status}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Allocations</p>
                        <p className="font-medium">{shipmentAllocations.length}</p>
                      </div>
                    </div>

                    {hasAllocations && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-2">Allocated to Franchises:</p>
                        <div className="flex flex-wrap gap-2">
                          {shipmentAllocations.reduce((acc: any[], allocation) => {
                            const franchise = franchises.find(f => f.id === allocation.franchise_location_id)
                            if (franchise && !acc.find(a => a.id === franchise.id)) {
                              acc.push({
                                ...franchise,
                                totalQty: shipmentAllocations
                                  .filter(a => a.franchise_location_id === franchise.id)
                                  .reduce((sum, a) => sum + a.quantity_allocated, 0)
                              })
                            }
                            return acc
                          }, []).map((franchise: any) => (
                            <span key={franchise.id} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {franchise.name}: {franchise.totalQty} units
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {!hasAllocations && (
                      <Button
                        onClick={() => handleAllocateStock(shipment)}
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Allocate Stock
                      </Button>
                    )}
                    {hasAllocations && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // View allocations
                          window.location.href = `/admin/accounting?tab=allocations&shipment=${shipment.id}`
                        }}
                      >
                        View Allocations
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}

          {shipments.length === 0 && (
            <Card className="p-8 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Shipments Ready</h3>
              <p className="text-gray-600">
                Shipments need to arrive and be cleared before stock can be allocated to franchises
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Allocation Modal */}
      <Modal
        isOpen={showAllocationModal}
        onClose={() => {
          setShowAllocationModal(false)
          setSelectedShipment(null)
        }}
        title={`Allocate Stock - ${selectedShipment?.shipment_reference}`}
        size="xl"
      >
        {selectedShipment && (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700 mb-2">
                Total Landed Cost: <span className="font-semibold">{formatCurrency(selectedShipment.total_landed_cost)}</span>
              </p>
              <p className="text-xs text-gray-600">
                Allocate quantities to each franchise. Stock will be tracked separately per franchise.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 text-sm font-semibold">Product</th>
                    <th className="text-right py-2 px-3 text-sm font-semibold">Available</th>
                    {franchises.map(franchise => (
                      <th key={franchise.id} className="text-center py-2 px-3 text-sm font-semibold min-w-[100px]">
                        {franchise.franchise_name || franchise.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedShipment.items?.map((item) => {
                    const key = `${item.product_id}_${item.variant_id || 'null'}`
                    return (
                      <tr key={item.id} className="border-b">
                        <td className="py-3 px-3">
                          <div>
                            <p className="font-medium text-sm">{item.product?.name || 'Product'}</p>
                            {item.variant && (
                              <p className="text-xs text-gray-500">
                                {Object.entries(item.variant.variant_attributes || {}).map(([k, v]) => `${k}: ${v}`).join(', ')}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="text-right py-3 px-3 font-medium">
                          {item.quantity}
                        </td>
                        {franchises.map(franchise => (
                          <td key={franchise.id} className="py-3 px-3">
                            <Input
                              type="number"
                              min="0"
                              max={item.quantity}
                              value={allocationForm[key]?.[franchise.id] || 0}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0
                                setAllocationForm(prev => ({
                                  ...prev,
                                  [key]: {
                                    ...prev[key],
                                    [franchise.id]: Math.min(value, item.quantity)
                                  }
                                }))
                              }}
                              className="w-full text-center"
                            />
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => {
                setShowAllocationModal(false)
                setSelectedShipment(null)
              }}>
                Cancel
              </Button>
              <Button onClick={handleAllocationSubmit}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Allocate Stock
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

