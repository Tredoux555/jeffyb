'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Modal } from '@/components/Modal'
import { createClient } from '@/lib/supabase'
import { DeliveryRequest } from '@/types/database'
import { 
  Search, 
  Filter,
  Eye,
  Truck,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  User,
  Phone
} from 'lucide-react'

export default function AdminDeliveriesPage() {
  const router = useRouter()
  const [deliveries, setDeliveries] = useState<DeliveryRequest[]>([])
  const [filteredDeliveries, setFilteredDeliveries] = useState<DeliveryRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryRequest | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [etaInput, setEtaInput] = useState('')
  
  const statusOptions = [
    { value: 'all', label: 'All Deliveries' },
    { value: 'pending', label: 'Pending' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'in_transit', label: 'In Transit' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ]
  
  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'pickup', label: 'Pickup Requests' },
    { value: 'send_products', label: 'Send Products' }
  ]
  
  const statusColors = {
    pending: 'bg-yellow-500',
    accepted: 'bg-blue-500',
    in_transit: 'bg-purple-500',
    delivered: 'bg-green-500',
    cancelled: 'bg-red-500'
  }
  
  const statusIcons = {
    pending: Clock,
    accepted: Package,
    in_transit: Truck,
    delivered: CheckCircle,
    cancelled: XCircle
  }
  
  useEffect(() => {
    checkAuth()
    fetchDeliveries()
  }, [])
  
  useEffect(() => {
    filterDeliveries()
  }, [deliveries, searchTerm, selectedStatus, selectedType])
  
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
      const supabase = createClient()
      const { data, error } = await supabase
        .from('delivery_requests')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setDeliveries(data || [])
    } catch (error) {
      console.error('Error fetching deliveries:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const filterDeliveries = () => {
    let filtered = deliveries
    
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(delivery => delivery.status === selectedStatus)
    }
    
    if (selectedType !== 'all') {
      filtered = filtered.filter(delivery => delivery.type === selectedType)
    }
    
    if (searchTerm) {
      filtered = filtered.filter(delivery =>
        delivery.shop_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.delivery_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.sender_info?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.recipient_info?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    setFilteredDeliveries(filtered)
  }
  
  const handleStatusUpdate = async (deliveryId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus }
      
      if (etaInput && newStatus === 'accepted') {
        updateData.estimated_arrival = etaInput
      }
      
      const supabase = createClient()
      const { error } = await supabase
        .from('delivery_requests')
        .update(updateData)
        .eq('id', deliveryId)
      
      if (error) throw error
      fetchDeliveries()
      setEtaInput('')
    } catch (error) {
      console.error('Error updating delivery status:', error)
      alert('Error updating delivery status')
    }
  }
  
  const viewDeliveryDetails = (delivery: DeliveryRequest) => {
    setSelectedDelivery(delivery)
    setIsModalOpen(true)
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-jeffy-grey mx-auto mb-4"></div>
          <p className="text-gray-700">Loading deliveries...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-jeffy-yellow">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Delivery Management</h1>
            <p className="text-gray-600">Manage delivery requests and tracking</p>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {statusOptions.slice(1).map((status) => {
            const count = deliveries.filter(delivery => delivery.status === status.value).length
            const Icon = statusIcons[status.value as keyof typeof statusIcons]
            return (
              <Card key={status.value}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{status.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                  </div>
                  <div className={`w-12 h-12 ${statusColors[status.value as keyof typeof statusColors]} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
        
        {/* Filters */}
        <Card className="mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search deliveries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-jeffy-yellow focus:border-transparent"
            >
              {typeOptions.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-jeffy-yellow focus:border-transparent"
            >
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter className="w-4 h-4" />
              <span>{filteredDeliveries.length} deliveries found</span>
            </div>
          </div>
        </Card>
        
        {/* Deliveries List */}
        {filteredDeliveries.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-gray-500">
              <p className="text-lg mb-2">No deliveries found</p>
              <p className="text-sm">
                {searchTerm || selectedStatus !== 'all' || selectedType !== 'all'
                  ? 'Try adjusting your search terms or filters' 
                  : 'No delivery requests available yet'
                }
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredDeliveries.map((delivery) => {
              const StatusIcon = statusIcons[delivery.status as keyof typeof statusIcons]
              
              return (
                <Card key={delivery.id} className="hover:shadow-jeffy-lg transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="font-semibold text-gray-900">#{delivery.id.slice(0, 8)}</h3>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                          statusColors[delivery.status as keyof typeof statusColors]
                        } text-white`}>
                          <StatusIcon className="w-3 h-3" />
                          {delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1)}
                        </div>
                        <span className="text-xs bg-jeffy-yellow-light text-gray-700 px-2 py-1 rounded-full">
                          {delivery.type === 'pickup' ? 'Pickup Request' : 'Send Products'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        {delivery.type === 'pickup' ? (
                          <>
                            <div>
                              <p className="font-medium text-gray-900">Shop Information</p>
                              <p>{delivery.shop_name}</p>
                              <p>{delivery.shop_address}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Delivery Address</p>
                              <p>{delivery.delivery_address}</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <p className="font-medium text-gray-900">Sender</p>
                              <p>{delivery.sender_info?.name}</p>
                              <p>{delivery.sender_info?.phone}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Recipient</p>
                              <p>{delivery.recipient_info?.name}</p>
                              <p>{delivery.recipient_info?.phone}</p>
                            </div>
                          </>
                        )}
                      </div>
                      
                      {delivery.estimated_arrival && (
                        <div className="mt-2 text-sm text-gray-600">
                          <strong>ETA:</strong> {delivery.estimated_arrival}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => viewDeliveryDetails(delivery)}
                        size="sm"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      
                      {delivery.status !== 'delivered' && delivery.status !== 'cancelled' && (
                        <select
                          value={delivery.status}
                          onChange={(e) => handleStatusUpdate(delivery.id, e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-jeffy-yellow"
                        >
                          <option value="pending">Pending</option>
                          <option value="accepted">Accepted</option>
                          <option value="in_transit">In Transit</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
        
        {/* Delivery Details Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Delivery Details #${selectedDelivery?.id.slice(0, 8)}`}
          size="lg"
        >
          {selectedDelivery && (
            <div className="space-y-6">
              {/* Delivery Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                    statusColors[selectedDelivery.status as keyof typeof statusColors]
                  } text-white`}>
                    {(() => {
                      const StatusIcon = statusIcons[selectedDelivery.status as keyof typeof statusIcons]
                      return <StatusIcon className="w-4 h-4" />
                    })()}
                    {selectedDelivery.status.charAt(0).toUpperCase() + selectedDelivery.status.slice(1)}
                  </div>
                  <span className="text-sm bg-jeffy-yellow-light text-gray-700 px-2 py-1 rounded-full">
                    {selectedDelivery.type === 'pickup' ? 'Pickup Request' : 'Send Products'}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {new Date(selectedDelivery.created_at).toLocaleDateString()}
                </p>
              </div>
              
              {/* Delivery Type Specific Information */}
              {selectedDelivery.type === 'pickup' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <Package className="w-4 h-4 mr-2" />
                      Shop Information
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Shop Name:</strong> {selectedDelivery.shop_name}</p>
                      <p><strong>Address:</strong> {selectedDelivery.shop_address}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Delivery Address
                    </h4>
                    <div className="text-sm text-gray-600">
                      <p>{selectedDelivery.delivery_address}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Sender Information
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Name:</strong> {selectedDelivery.sender_info?.name}</p>
                      <p><strong>Phone:</strong> {selectedDelivery.sender_info?.phone}</p>
                      <p><strong>Address:</strong> {selectedDelivery.sender_info?.address}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Recipient Information
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Name:</strong> {selectedDelivery.recipient_info?.name}</p>
                      <p><strong>Phone:</strong> {selectedDelivery.recipient_info?.phone}</p>
                      <p><strong>Address:</strong> {selectedDelivery.recipient_info?.address}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Product Description */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Product Description</h4>
                <p className="text-sm text-gray-600 bg-jeffy-yellow-light p-3 rounded-lg">
                  {selectedDelivery.product_description}
                </p>
              </div>
              
              {/* Special Instructions */}
              {selectedDelivery.special_instructions && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Special Instructions</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {selectedDelivery.special_instructions}
                  </p>
                </div>
              )}
              
              {/* ETA */}
              {selectedDelivery.estimated_arrival && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Estimated Arrival</h4>
                  <p className="text-sm text-gray-600">{selectedDelivery.estimated_arrival}</p>
                </div>
              )}
              
              {/* ETA Input for Admin */}
              {selectedDelivery.status === 'pending' && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Set Estimated Arrival</h4>
                  <div className="flex gap-3">
                    <Input
                      placeholder="e.g., 2-3 hours, Tomorrow 2 PM"
                      value={etaInput}
                      onChange={(e) => setEtaInput(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => handleStatusUpdate(selectedDelivery.id, 'accepted')}
                      disabled={!etaInput}
                    >
                      Accept & Set ETA
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </div>
  )
}
