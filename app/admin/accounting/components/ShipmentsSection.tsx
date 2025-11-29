'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Modal } from '@/components/Modal'
import { Shipment } from '@/types/database'
import { 
  Truck, 
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Eye,
  Plus
} from 'lucide-react'

export default function ShipmentsSection() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchShipments()
  }, [statusFilter])

  const fetchShipments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/shipments?status=${statusFilter}`)
      const result = await response.json()
      
      if (result.success) {
        setShipments(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching shipments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'received':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'cleared':
        return <CheckCircle className="w-5 h-5 text-blue-600" />
      case 'arrived':
        return <Package className="w-5 h-5 text-purple-600" />
      case 'in_transit':
        return <Truck className="w-5 h-5 text-yellow-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received':
        return 'bg-green-100 text-green-800'
      case 'cleared':
        return 'bg-blue-100 text-blue-800'
      case 'arrived':
        return 'bg-purple-100 text-purple-800'
      case 'in_transit':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'N/A'
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Shipments</h2>
          <p className="text-sm text-gray-600">
            Track shipments from China, calculate customs, and verify costs
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Shipment
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6 p-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-jeffy-yellow"
        >
          <option value="all">All Status</option>
          <option value="ordered">Ordered</option>
          <option value="in_transit">In Transit</option>
          <option value="arrived">Arrived</option>
          <option value="cleared">Cleared</option>
          <option value="received">Received</option>
        </select>
      </Card>

      {/* Shipments List */}
      {loading ? (
        <Card className="p-8 text-center">
          <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading shipments...</p>
        </Card>
      ) : shipments.length === 0 ? (
        <Card className="p-8 text-center">
          <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Shipments</h3>
          <p className="text-gray-600 mb-4">
            Create a shipment from a procurement batch to track customs and costs
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Shipment
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {shipments.map((shipment) => (
            <Card key={shipment.id} className="p-6">
              <div className="flex flex-col lg:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {getStatusIcon(shipment.status)}
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {shipment.shipment_reference}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(shipment.status)}`}>
                        {shipment.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-gray-500">Total Cost (RMB)</p>
                      <p className="font-medium text-gray-900">
                        {shipment.total_cost_rmb ? `¥${shipment.total_cost_rmb.toFixed(2)}` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Cost (ZAR)</p>
                      <p className="font-medium text-gray-900">
                        {formatCurrency(shipment.total_cost_zar)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Import Duty</p>
                      <p className="font-medium text-gray-900">
                        {formatCurrency(shipment.total_import_duty)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">VAT</p>
                      <p className="font-medium text-gray-900">
                        {formatCurrency(shipment.total_vat)}
                      </p>
                    </div>
                  </div>

                  {shipment.total_landed_cost && (
                    <div className="mt-4 p-3 bg-jeffy-yellow-light rounded-lg">
                      <p className="text-sm text-gray-600">Total Landed Cost</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(shipment.total_landed_cost)}
                      </p>
                    </div>
                  )}

                  {shipment.batch && (
                    <p className="text-xs text-gray-500 mt-2">
                      Batch: {shipment.batch.batch_number}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedShipment(shipment)
                      setShowDetailsModal(true)
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Shipment Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false)
          setSelectedShipment(null)
        }}
        title={selectedShipment?.shipment_reference || 'Shipment Details'}
        size="xl"
      >
        {selectedShipment && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium">{selectedShipment.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Items</p>
                <p className="font-medium">{selectedShipment.items?.length || 0}</p>
              </div>
            </div>

            {/* Costs */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Cost Breakdown</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Cost (RMB)</span>
                  <span className="font-medium">
                    {selectedShipment.total_cost_rmb ? `¥${selectedShipment.total_cost_rmb.toFixed(2)}` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Cost (ZAR)</span>
                  <span className="font-medium">{formatCurrency(selectedShipment.total_cost_zar)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Shipping</span>
                  <span className="font-medium">{formatCurrency(selectedShipment.shipping_cost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Insurance</span>
                  <span className="font-medium">{formatCurrency(selectedShipment.insurance_cost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Import Duty</span>
                  <span className="font-medium">{formatCurrency(selectedShipment.total_import_duty)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">VAT</span>
                  <span className="font-medium">{formatCurrency(selectedShipment.total_vat)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t font-semibold">
                  <span>Total Landed Cost</span>
                  <span>{formatCurrency(selectedShipment.total_landed_cost)}</span>
                </div>
              </div>
            </div>

            {/* Items */}
            {selectedShipment.items && selectedShipment.items.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Shipment Items</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedShipment.items.map((item) => (
                    <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{item.product?.name || 'Product'}</p>
                          {item.variant && (
                            <p className="text-xs text-gray-500">
                              {Object.entries(item.variant.variant_attributes || {}).map(([key, value]) => `${key}: ${value}`).join(', ')}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">Qty: {item.quantity}</p>
                          <p className="text-xs text-gray-500">
                            {formatCurrency(item.landed_cost_per_unit)}/unit
                          </p>
                        </div>
                      </div>
                      {item.hs_code && (
                        <p className="text-xs text-gray-500">
                          HS Code: {item.hs_code} • Duty: {item.import_duty_rate}%
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create Shipment Modal - Placeholder */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Shipment"
        size="lg"
      >
        <div className="p-4">
          <p className="text-gray-600 mb-4">
            Shipment creation will be integrated with procurement batches.
          </p>
          <p className="text-sm text-gray-500">
            Select a procurement batch to create a shipment and calculate customs.
          </p>
        </div>
      </Modal>
    </div>
  )
}

