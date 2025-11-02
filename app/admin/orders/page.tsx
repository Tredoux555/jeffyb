'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Modal } from '@/components/Modal'
import { createClient } from '@/lib/supabase'
import { Order } from '@/types/database'
import { 
  Search, 
  Filter,
  Eye,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Printer
} from 'lucide-react'
import { ShippingLabelPDF } from '@/components/ShippingLabel'
import { pdf } from '@react-pdf/renderer'
import { DeliveryMap } from '@/components/DeliveryMap'

export default function AdminOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const statusOptions = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ]
  
  const statusColors = {
    pending: 'bg-yellow-500',
    confirmed: 'bg-green-500',
    processing: 'bg-blue-500',
    shipped: 'bg-purple-500',
    delivered: 'bg-green-500',
    cancelled: 'bg-red-500'
  }
  
  const statusIcons = {
    pending: Clock,
    confirmed: CheckCircle,
    processing: Package,
    shipped: Truck,
    delivered: CheckCircle,
    cancelled: XCircle
  }
  
  useEffect(() => {
    checkAuth()
    fetchOrders()
  }, [])
  
  useEffect(() => {
    filterOrders()
  }, [orders, searchTerm, selectedStatus])
  
  const checkAuth = () => {
    if (typeof window !== 'undefined') {
      const isAdmin = localStorage.getItem('jeffy-admin')
      if (!isAdmin) {
        router.push('/admin/login')
      }
    }
  }
  
  const fetchOrders = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const filterOrders = () => {
    let filtered = orders
    
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(order => order.status === selectedStatus)
    }
    
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.delivery_info?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    setFilteredOrders(filtered)
  }
  
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)
      
      if (error) throw error
      fetchOrders()
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Error updating order status')
    }
  }
  
  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
  }

  const handlePrintLabel = async (order: Order) => {
    try {
      // Generate PDF blob
      const doc = <ShippingLabelPDF order={order} />
      const blob = await pdf(doc).toBlob()
      
      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `shipping-label-${order.id ? order.id.slice(0, 8) : 'unknown'}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error generating shipping label:', error)
      alert('Error generating shipping label. Please try again.')
    }
  }
  
  const getTotalRevenue = () => {
    return orders
      .filter(order => order.status === 'delivered')
      .reduce((sum, order) => sum + (order.total || 0), 0)
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <Package className="w-12 h-12 text-green-500 animate-spin" />
          </div>
          <p className="text-gray-700">Loading orders...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-jeffy-yellow">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Order Management</h1>
            <p className="text-sm sm:text-base text-gray-600">View and manage customer orders</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs sm:text-sm text-gray-600">Total Revenue</p>
            <p className="text-xl sm:text-2xl font-bold text-jeffy-yellow">R{getTotalRevenue().toFixed(2)}</p>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {statusOptions.slice(1).map((status) => {
            const count = orders.filter(order => order.status === status.value).length
            const Icon = statusIcons[status.value as keyof typeof statusIcons] || Package
            return (
              <Card key={status.value} className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">{status.label}</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{count}</p>
                  </div>
                  <div className={`w-8 h-8 sm:w-12 sm:h-12 ${statusColors[status.value as keyof typeof statusColors] || 'bg-gray-500'} rounded-lg flex items-center justify-center flex-shrink-0 ml-2`}>
                    {Icon && <Icon className="w-4 h-4 sm:w-6 sm:h-6 text-white" />}
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
                placeholder="Search orders by email, name, or order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
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
              <span>{filteredOrders.length} orders found</span>
            </div>
          </div>
        </Card>
        
        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-gray-500">
              <p className="text-lg mb-2">No orders found</p>
              <p className="text-sm">
                {searchTerm || selectedStatus !== 'all' 
                  ? 'Try adjusting your search terms or filters' 
                  : 'No orders available yet'
                }
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const StatusIcon = statusIcons[order.status as keyof typeof statusIcons] || Package
              const total = order.items && order.items.length > 0 
                ? order.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0)
                : order.total || 0
              
              return (
                <Card key={order.id} className="hover:shadow-jeffy-lg transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="font-semibold text-gray-900">#{order.id ? order.id.slice(0, 8) : 'N/A'}</h3>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                          statusColors[order.status as keyof typeof statusColors] || 'bg-gray-500'
                        } text-white`}>
                          {StatusIcon && <StatusIcon className="w-3 h-3" />}
                          {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Unknown'}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <p className="font-medium text-gray-900">{order.delivery_info?.name || 'N/A'}</p>
                          <p>{order.user_email || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Delivery Address</p>
                          <p>{order.delivery_info?.address || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Order Details</p>
                          <p>{order.items ? order.items.length : 0} items • R{total.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => viewOrderDetails(order)}
                        size="sm"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      
                      {order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-jeffy-yellow"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
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
        
        {/* Order Details Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Order Details #${selectedOrder?.id ? selectedOrder.id.slice(0, 8) : 'N/A'}`}
          size="lg"
        >
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                    statusColors[selectedOrder.status as keyof typeof statusColors] || 'bg-gray-500'
                  } text-white`}>
                    {(() => {
                      const StatusIcon = statusIcons[selectedOrder.status as keyof typeof statusIcons] || Package
                      return StatusIcon ? <StatusIcon className="w-4 h-4" /> : null
                    })()}
                    {selectedOrder.status ? selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1) : 'Unknown'}
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  {new Date(selectedOrder.created_at).toLocaleDateString()}
                </p>
              </div>
              
              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Customer Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Name:</strong> {selectedOrder.delivery_info?.name || 'N/A'}</p>
                    <p><strong>Email:</strong> {selectedOrder.user_email || 'N/A'}</p>
                    <p><strong>Phone:</strong> {selectedOrder.delivery_info?.phone || 'N/A'}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Delivery Address</h4>
                  <div className="text-sm text-gray-600">
                    <p>{selectedOrder.delivery_info?.address || 'N/A'}</p>
                    {selectedOrder.delivery_info?.city && <p>{selectedOrder.delivery_info.city}</p>}
                    {selectedOrder.delivery_info?.postal_code && <p>{selectedOrder.delivery_info.postal_code}</p>}
                  </div>
                </div>
              </div>
              
              {/* QR Code */}
              {selectedOrder.qr_code && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Order QR Code</h4>
                  <div className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <img 
                      src={selectedOrder.qr_code} 
                      alt="Order QR Code" 
                      className="w-48 h-48 border-2 border-gray-300 rounded-lg"
                    />
                    <p className="text-xs text-gray-500 text-center max-w-xs">
                      Scan this QR code to track the order. Can be printed on shipping labels.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Print Label Button */}
              <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => handlePrintLabel(selectedOrder)}
                  className="flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print Shipping Label
                </Button>
                {selectedOrder.status !== 'cancelled' && !selectedOrder.ready_for_delivery && (
                  <Button
                    onClick={async () => {
                      try {
                        const supabase = createClient()
                        await supabase
                          .from('orders')
                          .update({
                            ready_for_delivery: true,
                            ready_for_delivery_at: new Date().toISOString()
                          })
                          .eq('id', selectedOrder.id)
                        alert('Order marked as ready for delivery!')
                        fetchOrders()
                      } catch (error) {
                        console.error('Error marking ready for delivery:', error)
                        alert('Error updating order status')
                      }
                    }}
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white"
                  >
                    <Truck className="w-4 h-4" />
                    Ready for Delivery
                  </Button>
                )}
              </div>
              
              {/* Delivery Map */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Delivery Route</h4>
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <DeliveryMap
                    pickupAddress="123 Main Street, Johannesburg, 2000"
                    deliveryAddress={selectedOrder.delivery_info?.address || 'N/A'}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Map showing route from pickup location to delivery address
                </p>
              </div>
              
              {/* Order Items */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Order Items</h4>
                <div className="space-y-3">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                        <div>
                          <p className="font-medium text-gray-900">{item.product_name || 'Unknown Product'}</p>
                          <p className="text-sm text-gray-600">Qty: {item.quantity || 0}</p>
                        </div>
                        <p className="font-medium text-jeffy-yellow">
                          R{((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600 text-sm">No items found</p>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total</span>
                    <span className="text-jeffy-yellow">R{(selectedOrder.total || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  )
}
