'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Modal } from '@/components/Modal'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { OrderStatusTimeline } from '@/components/OrderStatusTimeline'
import { createClient } from '@/lib/supabase'
import { Order, Driver } from '@/types/database'
import { 
  Search, 
  Filter,
  Eye,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Printer,
  ArrowLeft,
  UserCheck,
  Phone,
  MapPin,
  RefreshCw,
  ChevronRight,
  Zap
} from 'lucide-react'
import { ShippingLabelPDF } from '@/components/ShippingLabel'
import { pdf } from '@react-pdf/renderer'

type ViewMode = 'list' | 'pipeline'

export default function AdminOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('pipeline')
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  
  const statusOptions = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'ready_for_delivery', label: 'Ready' },
    { value: 'out_for_delivery', label: 'Out for Delivery' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ]
  
  const pipelineStages = [
    { status: 'pending', label: 'New Orders', color: 'bg-yellow-500', icon: Clock },
    { status: 'processing', label: 'Processing', color: 'bg-blue-500', icon: Package },
    { status: 'ready_for_delivery', label: 'Ready', color: 'bg-purple-500', icon: Package },
    { status: 'out_for_delivery', label: 'Out for Delivery', color: 'bg-orange-500', icon: Truck },
    { status: 'delivered', label: 'Delivered', color: 'bg-green-500', icon: CheckCircle }
  ]
  
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500',
    confirmed: 'bg-emerald-500',
    processing: 'bg-blue-500',
    ready_for_delivery: 'bg-purple-500',
    out_for_delivery: 'bg-orange-500',
    delivered: 'bg-green-500',
    cancelled: 'bg-red-500'
  }
  
  useEffect(() => {
    checkAuth()
    fetchOrders()
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

  const fetchDrivers = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .in('status', ['active', 'busy'])
        .order('name')
      
      if (!error && data) {
        setDrivers(data)
      }
    } catch (error) {
      console.error('Error fetching drivers:', error)
    }
  }
  
  const filteredOrders = orders.filter(order => {
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus
    const matchesSearch = !searchTerm || 
      order.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.delivery_info?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const getOrdersByStatus = (status: string) => {
    return orders.filter(order => order.status === status)
  }
  
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const supabase = createClient()
      const updateData: any = { status: newStatus }
      
      if (newStatus === 'ready_for_delivery') {
        updateData.ready_for_delivery = true
        updateData.ready_for_delivery_at = new Date().toISOString()
      }
      
      if (newStatus === 'delivered') {
        updateData.delivered_at = new Date().toISOString()
      }
      
      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
      
      if (error) throw error
      fetchOrders()
      
      // Close modal if open
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus as Order['status'] })
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Error updating order status')
    }
  }

  const handleAssignDriver = async (orderId: string, driverId: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('orders')
        .update({ 
          assigned_driver_id: driverId,
          status: 'out_for_delivery'
        })
        .eq('id', orderId)
      
      if (error) throw error
      
      // Update driver status to busy
      await supabase
        .from('drivers')
        .update({ status: 'busy' })
        .eq('id', driverId)
      
      fetchOrders()
      fetchDrivers()
    } catch (error) {
      console.error('Error assigning driver:', error)
      alert('Error assigning driver')
    }
  }

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedOrders.length === 0) return
    
    try {
      const supabase = createClient()
      const updateData: any = { status: newStatus }
      
      if (newStatus === 'ready_for_delivery') {
        updateData.ready_for_delivery = true
        updateData.ready_for_delivery_at = new Date().toISOString()
      }
      
      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .in('id', selectedOrders)
      
      if (error) throw error
      
      setSelectedOrders([])
      fetchOrders()
    } catch (error) {
      console.error('Error bulk updating orders:', error)
      alert('Error updating orders')
    }
  }

  const handlePrintLabel = async (order: Order) => {
    try {
      const doc = <ShippingLabelPDF order={order} />
      const blob = await pdf(doc).toBlob()
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `shipping-label-${order.id?.slice(0, 8) || 'unknown'}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error generating shipping label:', error)
      alert('Error generating shipping label')
    }
  }

  const handleBulkPrintLabels = async () => {
    const ordersToPrint = orders.filter(o => selectedOrders.includes(o.id))
    for (const order of ordersToPrint) {
      await handlePrintLabel(order)
    }
  }
  
  const getTotalRevenue = () => {
    return orders
      .filter(order => order.status === 'delivered')
      .reduce((sum, order) => sum + (order.total || 0), 0)
  }

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    )
  }
  
  if (loading) {
    return <LoadingSpinner message="Loading orders..." fullScreen />
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-jeffy-yellow to-amber-100">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Order Management</h1>
              <p className="text-slate-600">Manage and track all customer orders</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-slate-600">Total Revenue</p>
              <p className="text-xl font-bold text-green-600">R{getTotalRevenue().toFixed(2)}</p>
            </div>
            <Button variant="outline" onClick={fetchOrders}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {pipelineStages.map((stage) => {
            const count = getOrdersByStatus(stage.status).length
            const Icon = stage.icon
            return (
              <Card key={stage.status} className="p-3" hover>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">{stage.label}</p>
                    <p className="text-2xl font-bold text-slate-900">{count}</p>
                  </div>
                  <div className={`w-10 h-10 ${stage.color} rounded-xl flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </Card>
            )
          })}
          <Card className="p-3" hover>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600 mb-1">Cancelled</p>
                <p className="text-2xl font-bold text-slate-900">{getOrdersByStatus('cancelled').length}</p>
              </div>
              <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
                <XCircle className="w-5 h-5 text-white" />
              </div>
            </div>
          </Card>
        </div>

        {/* View Toggle & Filters */}
        <Card className="mb-6 p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* View Mode Toggle */}
            <div className="flex rounded-xl border border-slate-200 overflow-hidden">
              <button
                onClick={() => setViewMode('pipeline')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'pipeline'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Pipeline View
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                List View
              </button>
            </div>

            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by email, name, or order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Status Filter (List view only) */}
            {viewMode === 'list' && (
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-jeffy-yellow bg-gray-50"
              >
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedOrders.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-200">
              <span className="text-sm text-slate-600 font-medium">
                {selectedOrders.length} selected
              </span>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleBulkStatusUpdate('processing')}
              >
                Mark Processing
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleBulkStatusUpdate('ready_for_delivery')}
              >
                Mark Ready
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleBulkPrintLabels}
              >
                <Printer className="w-4 h-4 mr-1" />
                Print Labels
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => setSelectedOrders([])}
              >
                Clear Selection
              </Button>
            </div>
          )}
        </Card>
        
        {/* Pipeline View */}
        {viewMode === 'pipeline' && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {pipelineStages.map((stage) => {
              const stageOrders = getOrdersByStatus(stage.status)
              const Icon = stage.icon
              return (
                <div key={stage.status} className="space-y-3">
                  {/* Stage Header */}
                  <div className={`${stage.color} rounded-xl p-3 text-white`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5" />
                        <span className="font-semibold">{stage.label}</span>
                      </div>
                      <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm font-bold">
                        {stageOrders.length}
                      </span>
                    </div>
                  </div>
                  
                  {/* Orders in Stage */}
                  <div className="space-y-2 min-h-[200px]">
                    {stageOrders.slice(0, 5).map((order) => (
                      <button
                        key={order.id}
                        onClick={() => {
                          setSelectedOrder(order)
                          setIsModalOpen(true)
                        }}
                        className="w-full text-left"
                      >
                        <Card 
                          className="p-3 hover:shadow-lg transition-all"
                        >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono text-slate-500">
                            #{order.id?.slice(0, 8)}
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                        <p className="font-semibold text-slate-900 text-sm truncate">
                          {order.delivery_info?.name || 'No name'}
                        </p>
                        <p className="text-xs text-slate-500 truncate mb-2">
                          {order.user_email}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-green-600">
                            R{order.total?.toFixed(2)}
                          </span>
                          <span className="text-xs text-slate-400">
                            {order.items?.length || 0} items
                          </span>
                        </div>
                      </Card>
                      </button>
                    ))}
                    {stageOrders.length > 5 && (
                      <button 
                        className="w-full py-2 text-sm text-slate-500 hover:text-slate-700"
                        onClick={() => {
                          setSelectedStatus(stage.status)
                          setViewMode('list')
                        }}
                      >
                        +{stageOrders.length - 5} more
                      </button>
                    )}
                    {stageOrders.length === 0 && (
                      <div className="text-center py-8 text-slate-400 text-sm">
                        No orders
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <>
            {filteredOrders.length === 0 ? (
              <Card className="text-center py-12">
                <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-lg font-semibold text-slate-900 mb-2">No orders found</p>
                <p className="text-slate-500">
                  {searchTerm || selectedStatus !== 'all' 
                    ? 'Try adjusting your search or filters' 
                    : 'Orders will appear here when customers place them'
                  }
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order) => (
                  <Card key={order.id} className="p-4 hover:shadow-lg transition-all">
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => toggleOrderSelection(order.id)}
                        className="mt-1 w-4 h-4 text-jeffy-yellow border-slate-300 rounded focus:ring-jeffy-yellow"
                      />
                      
                      {/* Order Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="font-mono text-sm text-slate-500">
                            #{order.id?.slice(0, 8)}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold text-white ${
                            statusColors[order.status] || 'bg-slate-500'
                          }`}>
                            {order.status?.replace('_', ' ').toUpperCase()}
                          </span>
                          {order.assigned_driver_id && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              <Truck className="w-3 h-3" />
                              Driver Assigned
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="font-semibold text-slate-900">{order.delivery_info?.name || 'N/A'}</p>
                            <p className="text-slate-500 truncate">{order.user_email}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 truncate">{order.delivery_info?.address || 'No address'}</p>
                            <p className="text-slate-400 text-xs">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">R{order.total?.toFixed(2)}</p>
                            <p className="text-slate-400 text-xs">{order.items?.length || 0} items</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order)
                            setIsModalOpen(true)
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                            className="px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-jeffy-yellow"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="ready_for_delivery">Ready</option>
                            <option value="out_for_delivery">Out for Delivery</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
        
        {/* Order Details Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Order #${selectedOrder?.id?.slice(0, 8) || 'N/A'}`}
          size="xl"
        >
          {selectedOrder && (
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-200">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePrintLabel(selectedOrder)}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Label
                </Button>
                
                {selectedOrder.status === 'ready_for_delivery' && drivers.length > 0 && (
                  <div className="flex items-center gap-2">
                    <select
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAssignDriver(selectedOrder.id, e.target.value)
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="">Assign Driver...</option>
                      {drivers.map(driver => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name} ({driver.status})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                  <>
                    {selectedOrder.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(selectedOrder.id, 'processing')}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Start Processing
                      </Button>
                    )}
                    {selectedOrder.status === 'processing' && (
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={() => handleStatusUpdate(selectedOrder.id, 'ready_for_delivery')}
                      >
                        <Package className="w-4 h-4 mr-2" />
                        Mark Ready
                      </Button>
                    )}
                    {selectedOrder.status === 'out_for_delivery' && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleStatusUpdate(selectedOrder.id, 'delivered')}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Delivered
                      </Button>
                    )}
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Order Info */}
                <div className="space-y-6">
                  {/* Customer Info */}
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-slate-400" />
                      Customer Information
                    </h4>
                    <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                      <p className="font-semibold text-slate-900">{selectedOrder.delivery_info?.name || 'N/A'}</p>
                      <p className="text-slate-600 text-sm">{selectedOrder.user_email}</p>
                      {selectedOrder.delivery_info?.phone && (
                        <p className="text-slate-600 text-sm flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {selectedOrder.delivery_info.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      Delivery Address
                    </h4>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-slate-700">{selectedOrder.delivery_info?.address || 'N/A'}</p>
                      {selectedOrder.delivery_info?.city && (
                        <p className="text-slate-500 text-sm">{selectedOrder.delivery_info.city}</p>
                      )}
                      {selectedOrder.delivery_info?.postal_code && (
                        <p className="text-slate-500 text-sm">{selectedOrder.delivery_info.postal_code}</p>
                      )}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3">Order Items</h4>
                    <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                      {selectedOrder.items?.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-slate-200 last:border-0">
                          <div>
                            <p className="font-medium text-slate-900">{item.product_name}</p>
                            <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-semibold text-slate-900">
                            R{((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                          </p>
                        </div>
                      ))}
                      <div className="pt-3 border-t border-slate-300">
                        <div className="flex justify-between items-center text-lg font-bold">
                          <span>Total</span>
                          <span className="text-green-600">R{selectedOrder.total?.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Status Timeline */}
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Order Progress</h4>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <OrderStatusTimeline
                      currentStatus={selectedOrder.status}
                      createdAt={selectedOrder.created_at}
                      readyForDeliveryAt={selectedOrder.ready_for_delivery_at}
                      deliveredAt={selectedOrder.delivered_at}
                    />
                  </div>

                  {/* Assigned Driver */}
                  {selectedOrder.assigned_driver_id && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-slate-400" />
                        Assigned Driver
                      </h4>
                      <div className="bg-blue-50 rounded-xl p-4">
                        {drivers.find(d => d.id === selectedOrder.assigned_driver_id) ? (
                          <div>
                            <p className="font-semibold text-slate-900">
                              {drivers.find(d => d.id === selectedOrder.assigned_driver_id)?.name}
                            </p>
                            <p className="text-sm text-slate-600">
                              {drivers.find(d => d.id === selectedOrder.assigned_driver_id)?.phone}
                            </p>
                          </div>
                        ) : (
                          <p className="text-slate-600 text-sm">Driver ID: {selectedOrder.assigned_driver_id}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* QR Code */}
                  {selectedOrder.qr_code && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-slate-900 mb-3">Order QR Code</h4>
                      <div className="bg-white rounded-xl p-4 flex flex-col items-center">
                        <img 
                          src={selectedOrder.qr_code} 
                          alt="Order QR Code" 
                          className="w-32 h-32 border border-slate-200 rounded-lg"
                        />
                        <p className="text-xs text-slate-500 mt-2 text-center">
                          Scan to track order
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  )
}
