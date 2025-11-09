'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Modal } from '@/components/Modal'
import { StockOrder, StockOrderItem, Product, ProductVariant } from '@/types/database'
import { downloadStockOrderPDF } from '@/lib/stock-order-pdf'
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  FileText,
  Package,
  ShoppingCart,
  Truck
} from 'lucide-react'

export default function StockOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<StockOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<StockOrder | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [showProductSelector, setShowProductSelector] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const [formData, setFormData] = useState({
    supplier_name: '',
    supplier_email: '',
    supplier_phone: '',
    supplier_address: '',
    supplier_city: '',
    supplier_postal_code: '',
    supplier_country: 'South Africa',
    shipping_address: '',
    shipping_city: '',
    shipping_postal_code: '',
    shipping_country: 'South Africa',
    shipping_contact_name: '',
    shipping_contact_phone: '',
    shipping_method: '',
    expected_delivery_date: '',
    order_date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  const [orderItems, setOrderItems] = useState<StockOrderItem[]>([])

  useEffect(() => {
    checkAuth()
    fetchOrders()
    fetchProducts()
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
      const response = await fetch('/api/admin/stock-orders')
      const result = await response.json()
      if (result.success) {
        setOrders(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching stock orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const supabase = (await import('@/lib/supabase')).createClient()
      const { data } = await supabase
        .from('products')
        .select('*, variants:product_variants(*)')
        .eq('is_active', true)
        .order('name')
      
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const handleAddProduct = (product: Product, variant?: ProductVariant) => {
    const item: StockOrderItem = {
      id: `temp-${Date.now()}`,
      stock_order_id: editingOrder?.id || '',
      product_id: product.id,
      variant_id: variant?.id || null,
      product_name: product.name + (variant ? ` - ${Object.values(variant.variant_attributes).join(', ')}` : ''),
      product_sku: variant?.sku || null,
      product_description: product.description || null,
      variant_attributes: variant?.variant_attributes || null,
      quantity: variant?.reorder_quantity || product.reorder_quantity || 1,
      unit_cost: variant?.cost || product.cost || 0,
      line_total: (variant?.cost || product.cost || 0) * (variant?.reorder_quantity || product.reorder_quantity || 1),
      unit_weight_kg: null,
      unit_length_cm: null,
      unit_width_cm: null,
      unit_height_cm: null,
      received_quantity: 0,
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setOrderItems([...orderItems, item])
    setShowProductSelector(false)
  }

  const handleAddManualProduct = () => {
    const item: StockOrderItem = {
      id: `temp-${Date.now()}`,
      stock_order_id: editingOrder?.id || '',
      product_id: null,
      variant_id: null,
      product_name: '',
      product_sku: null,
      product_description: null,
      variant_attributes: null,
      quantity: 1,
      unit_cost: 0,
      line_total: 0,
      unit_weight_kg: null,
      unit_length_cm: null,
      unit_width_cm: null,
      unit_height_cm: null,
      received_quantity: 0,
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setOrderItems([...orderItems, item])
  }

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const updated = [...orderItems]
    updated[index] = { ...updated[index], [field]: value }
    if (field === 'quantity' || field === 'unit_cost') {
      updated[index].line_total = updated[index].quantity * updated[index].unit_cost
    }
    setOrderItems(updated)
  }

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!formData.supplier_name || !formData.shipping_address || !formData.shipping_city || !formData.shipping_postal_code) {
      alert('Please fill in all required fields')
      return
    }

    if (orderItems.length === 0) {
      alert('Please add at least one item to the order')
      return
    }

    try {
      const url = editingOrder 
        ? `/api/admin/stock-orders?id=${editingOrder.id}`
        : '/api/admin/stock-orders'
      
      const method = editingOrder ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items: orderItems.map(item => ({
            product_id: item.product_id,
            variant_id: item.variant_id,
            product_name: item.product_name,
            product_sku: item.product_sku,
            product_description: item.product_description,
            variant_attributes: item.variant_attributes,
            quantity: item.quantity,
            unit_cost: item.unit_cost,
            unit_weight_kg: item.unit_weight_kg,
            unit_length_cm: item.unit_length_cm,
            unit_width_cm: item.unit_width_cm,
            unit_height_cm: item.unit_height_cm,
            notes: item.notes,
          }))
        })
      })

      const result = await response.json()
      if (result.success) {
        fetchOrders()
        handleCloseModal()
        alert(editingOrder ? 'Order updated successfully' : 'Order created successfully')
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error saving order:', error)
      alert('Failed to save order')
    }
  }

  const handleEdit = (order: StockOrder) => {
    setEditingOrder(order)
    setFormData({
      supplier_name: order.supplier_name,
      supplier_email: order.supplier_email || '',
      supplier_phone: order.supplier_phone || '',
      supplier_address: order.supplier_address || '',
      supplier_city: order.supplier_city || '',
      supplier_postal_code: order.supplier_postal_code || '',
      supplier_country: order.supplier_country || 'South Africa',
      shipping_address: order.shipping_address,
      shipping_city: order.shipping_city,
      shipping_postal_code: order.shipping_postal_code,
      shipping_country: order.shipping_country || 'South Africa',
      shipping_contact_name: order.shipping_contact_name || '',
      shipping_contact_phone: order.shipping_contact_phone || '',
      shipping_method: order.shipping_method || '',
      expected_delivery_date: order.expected_delivery_date ? order.expected_delivery_date.split('T')[0] : '',
      order_date: order.order_date.split('T')[0],
      notes: order.notes || '',
    })
    setOrderItems(order.items || [])
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return
    
    try {
      const response = await fetch(`/api/admin/stock-orders?id=${id}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      if (result.success) {
        fetchOrders()
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error deleting order:', error)
      alert('Failed to delete order')
    }
  }

  const handleExportPDF = async (order: StockOrder) => {
    try {
      // Fetch complete order with items
      const response = await fetch(`/api/admin/stock-orders?id=${order.id}`)
      const result = await response.json()
      if (result.success) {
        await downloadStockOrderPDF(result.data)
      }
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Failed to export PDF')
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingOrder(null)
    setOrderItems([])
    setFormData({
      supplier_name: '',
      supplier_email: '',
      supplier_phone: '',
      supplier_address: '',
      supplier_city: '',
      supplier_postal_code: '',
      supplier_country: 'South Africa',
      shipping_address: '',
      shipping_city: '',
      shipping_postal_code: '',
      shipping_country: 'South Africa',
      shipping_contact_name: '',
      shipping_contact_phone: '',
      shipping_method: '',
      expected_delivery_date: '',
      order_date: new Date().toISOString().split('T')[0],
      notes: '',
    })
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center px-4">
        <div className="text-center">
          <ShoppingCart className="w-12 h-12 sm:w-16 sm:h-16 text-blue-500 animate-bounce mx-auto mb-4" />
          <p className="text-sm sm:text-base text-gray-700">Loading stock orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-jeffy-yellow">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Stock Orders</h1>
              <p className="text-sm sm:text-base text-gray-600">Manage purchase orders for suppliers</p>
            </div>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            New Order
          </Button>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <Card className="p-8 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Stock Orders</h3>
            <p className="text-gray-600 mb-4">Create your first purchase order to get started.</p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Order
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-5 h-5 text-blue-500" />
                      <h3 className="text-lg font-semibold text-gray-900">{order.order_number}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        order.order_status === 'draft' ? 'bg-gray-200 text-gray-700' :
                        order.order_status === 'confirmed' ? 'bg-green-200 text-green-700' :
                        order.order_status === 'in_transit' ? 'bg-blue-200 text-blue-700' :
                        order.order_status === 'received' ? 'bg-purple-200 text-purple-700' :
                        'bg-red-200 text-red-700'
                      }`}>
                        {order.order_status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Supplier:</span>
                        <span className="ml-2 font-medium">{order.supplier_name}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Date:</span>
                        <span className="ml-2 font-medium">{new Date(order.order_date).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Items:</span>
                        <span className="ml-2 font-medium">{order.total_quantity}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Total:</span>
                        <span className="ml-2 font-medium">R{order.total_cost.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportPDF(order)}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(order)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(order.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingOrder ? 'Edit Stock Order' : 'New Stock Order'}
          size="xl"
        >
          <div className="space-y-6">
            {/* Supplier Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Supplier Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Supplier Name *"
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                  required
                />
                <Input
                  label="Supplier Email"
                  type="email"
                  value={formData.supplier_email}
                  onChange={(e) => setFormData({ ...formData, supplier_email: e.target.value })}
                />
                <Input
                  label="Supplier Phone"
                  value={formData.supplier_phone}
                  onChange={(e) => setFormData({ ...formData, supplier_phone: e.target.value })}
                />
                <Input
                  label="Supplier City"
                  value={formData.supplier_city}
                  onChange={(e) => setFormData({ ...formData, supplier_city: e.target.value })}
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Supplier Address"
                    value={formData.supplier_address}
                    onChange={(e) => setFormData({ ...formData, supplier_address: e.target.value })}
                  />
                </div>
                <Input
                  label="Supplier Postal Code"
                  value={formData.supplier_postal_code}
                  onChange={(e) => setFormData({ ...formData, supplier_postal_code: e.target.value })}
                />
                <Input
                  label="Supplier Country"
                  value={formData.supplier_country}
                  onChange={(e) => setFormData({ ...formData, supplier_country: e.target.value })}
                />
              </div>
            </div>

            {/* Shipping Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Shipping Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Input
                    label="Shipping Address *"
                    value={formData.shipping_address}
                    onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
                    required
                  />
                </div>
                <Input
                  label="Shipping City *"
                  value={formData.shipping_city}
                  onChange={(e) => setFormData({ ...formData, shipping_city: e.target.value })}
                  required
                />
                <Input
                  label="Shipping Postal Code *"
                  value={formData.shipping_postal_code}
                  onChange={(e) => setFormData({ ...formData, shipping_postal_code: e.target.value })}
                  required
                />
                <Input
                  label="Shipping Country"
                  value={formData.shipping_country}
                  onChange={(e) => setFormData({ ...formData, shipping_country: e.target.value })}
                />
                <Input
                  label="Contact Name"
                  value={formData.shipping_contact_name}
                  onChange={(e) => setFormData({ ...formData, shipping_contact_name: e.target.value })}
                />
                <Input
                  label="Contact Phone"
                  value={formData.shipping_contact_phone}
                  onChange={(e) => setFormData({ ...formData, shipping_contact_phone: e.target.value })}
                />
                <Input
                  label="Shipping Method"
                  value={formData.shipping_method}
                  onChange={(e) => setFormData({ ...formData, shipping_method: e.target.value })}
                  placeholder="e.g., Standard Shipping, Express, Air Freight"
                />
                <Input
                  label="Expected Delivery Date"
                  type="date"
                  value={formData.expected_delivery_date}
                  onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                />
                <Input
                  label="Order Date"
                  type="date"
                  value={formData.order_date}
                  onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                />
              </div>
            </div>

            {/* Order Items */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Order Items</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowProductSelector(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddManualProduct}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Manual
                  </Button>
                </div>
              </div>

              {orderItems.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-gray-600">No items added yet. Add products from your inventory or add manually.</p>
                </Card>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {orderItems.map((item, index) => (
                    <Card key={item.id} className="p-4">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        <div className="lg:col-span-4">
                          <Input
                            label="Product Name"
                            value={item.product_name}
                            onChange={(e) => handleUpdateItem(index, 'product_name', e.target.value)}
                          />
                          <Input
                            label="SKU"
                            value={item.product_sku || ''}
                            onChange={(e) => handleUpdateItem(index, 'product_sku', e.target.value)}
                            className="mt-2"
                          />
                        </div>
                        <div className="lg:col-span-2">
                          <Input
                            label="Quantity"
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="lg:col-span-2">
                          <Input
                            label="Unit Cost (R)"
                            type="number"
                            step="0.01"
                            value={item.unit_cost}
                            onChange={(e) => handleUpdateItem(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="lg:col-span-2">
                          <Input
                            label="Weight (kg)"
                            type="number"
                            step="0.001"
                            value={item.unit_weight_kg || ''}
                            onChange={(e) => handleUpdateItem(index, 'unit_weight_kg', e.target.value ? parseFloat(e.target.value) : null)}
                          />
                        </div>
                        <div className="lg:col-span-1">
                          <div className="pt-6">
                            <p className="text-sm font-semibold">Total: R{item.line_total.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="lg:col-span-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                            className="mt-6"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <Input
                          label="Length (cm)"
                          type="number"
                          step="0.01"
                          value={item.unit_length_cm || ''}
                          onChange={(e) => handleUpdateItem(index, 'unit_length_cm', e.target.value ? parseFloat(e.target.value) : null)}
                        />
                        <Input
                          label="Width (cm)"
                          type="number"
                          step="0.01"
                          value={item.unit_width_cm || ''}
                          onChange={(e) => handleUpdateItem(index, 'unit_width_cm', e.target.value ? parseFloat(e.target.value) : null)}
                        />
                        <Input
                          label="Height (cm)"
                          type="number"
                          step="0.01"
                          value={item.unit_height_cm || ''}
                          onChange={(e) => handleUpdateItem(index, 'unit_height_cm', e.target.value ? parseFloat(e.target.value) : null)}
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jeffy-yellow focus:border-transparent"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes or instructions..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingOrder ? 'Update Order' : 'Create Order'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Product Selector Modal */}
        <Modal
          isOpen={showProductSelector}
          onClose={() => setShowProductSelector(false)}
          title="Select Product"
          size="lg"
        >
          <div className="space-y-4">
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredProducts.map((product) => (
                <div key={product.id}>
                  {product.has_variants && product.variants && product.variants.length > 0 ? (
                    product.variants.map((variant) => (
                      <Card
                        key={variant.id}
                        className="p-3 cursor-pointer hover:bg-gray-50 mb-2"
                        onClick={() => handleAddProduct(product, variant)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-600">
                              {Object.entries(variant.variant_attributes).map(([key, value]) => `${key}: ${value}`).join(', ')}
                            </p>
                            <p className="text-xs text-gray-500">SKU: {variant.sku || 'N/A'}</p>
                          </div>
                          <Button size="sm">Add</Button>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <Card
                      className="p-3 cursor-pointer hover:bg-gray-50 mb-2"
                      onClick={() => handleAddProduct(product)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-gray-500">Cost: R{product.cost?.toFixed(2) || '0.00'}</p>
                        </div>
                        <Button size="sm">Add</Button>
                      </div>
                    </Card>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}

