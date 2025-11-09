'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { createClient } from '@/lib/supabase'
import { 
  Package, 
  ShoppingCart, 
  Truck, 
  Plus, 
  Edit, 
  DollarSign,
  MapPin,
  Tag,
  Calculator,
  AlertTriangle,
  BarChart3,
  LayoutDashboard,
  FileText,
  MessageSquare
} from 'lucide-react'

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingDeliveries: 0,
    totalRevenue: 0,
    lowStockItems: 0
  })
  
  useEffect(() => {
    checkAuth()
    fetchStats()
  }, [])
  
  const checkAuth = () => {
    if (typeof window !== 'undefined') {
      const isAdmin = localStorage.getItem('jeffy-admin')
      if (!isAdmin) {
        router.push('/admin/login')
      }
    }
  }
  
  const fetchStats = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      // Fetch products count
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
      
      // Fetch orders count
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
      
      // Fetch pending deliveries count
      const { count: deliveriesCount } = await supabase
        .from('delivery_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
      
      // Fetch total revenue
      const { data: orders } = await supabase
        .from('orders')
        .select('total')
        .eq('status', 'delivered')
      
      const revenue = orders?.reduce((sum, order) => sum + order.total, 0) || 0
      
      // Fetch low stock items count (simplified - check stock < 10 or reorder_point)
      const { data: allProducts } = await supabase
        .from('products')
        .select('id, stock, reorder_point')
        .eq('is_active', true)
      
      const lowStockCount = allProducts?.filter(p => {
        const reorderPoint = p.reorder_point || 10
        return p.stock < reorderPoint
      }).length || 0
      
      // Check variants with low stock
      const { data: allVariants } = await supabase
        .from('product_variants')
        .select('id, stock, reorder_point, product:products(reorder_point)')
      
      const lowStockVariantsCount = allVariants?.filter(v => {
        const reorderPoint = v.reorder_point || (v.product as any)?.reorder_point || 10
        return v.stock < reorderPoint
      }).length || 0
      
      setStats({
        totalProducts: productsCount || 0,
        totalOrders: ordersCount || 0,
        pendingDeliveries: deliveriesCount || 0,
        totalRevenue: revenue,
        lowStockItems: lowStockCount + lowStockVariantsCount
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleLogout = () => {
    localStorage.removeItem('jeffy-admin')
    router.push('/admin/login')
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center px-4">
        <div className="text-center">
          <LayoutDashboard className="w-12 h-12 sm:w-16 sm:h-16 text-blue-500 animate-bounce mx-auto mb-4" />
          <p className="text-sm sm:text-base text-gray-700">Loading dashboard...</p>
        </div>
      </div>
    )
  }
  
  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'bg-blue-500',
      link: '/admin/products'
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'bg-green-500',
      link: '/admin/orders'
    },
    {
      title: 'Pending Deliveries',
      value: stats.pendingDeliveries,
      icon: Truck,
      color: 'bg-orange-500',
      link: '/admin/deliveries'
    },
    {
      title: 'Total Revenue',
      value: `R${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-jeffy-yellow',
      link: '/admin/orders'
    }
  ]
  
  return (
    <div className="min-h-screen bg-jeffy-yellow">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage your Jeffy store</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto">
            Logout
          </Button>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Link key={stat.title} href={stat.link}>
                <Card className="hover:shadow-jeffy-lg transition-all duration-300 cursor-pointer group p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">{stat.title}</p>
                      <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{stat.value}</p>
                    </div>
                    <div className={`w-8 h-8 sm:w-12 sm:h-12 ${stat.color} rounded-lg flex items-center justify-center sm:group-hover:scale-110 transition-transform duration-300 flex-shrink-0 ml-2`}>
                      <Icon className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Product Management</h3>
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
            </div>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Add, edit, and manage your product catalog</p>
            <div className="space-y-2">
              <Link href="/admin/products">
                <Button className="w-full text-sm sm:text-base">
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Manage Products
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Category Management</h3>
              <Tag className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
            </div>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Add, edit, and manage product categories</p>
            <div className="space-y-2">
              <Link href="/admin/categories">
                <Button className="w-full text-sm sm:text-base">
                  <Tag className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Manage Categories
                </Button>
              </Link>
            </div>
          </Card>
          
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Accounting</h3>
              <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
            </div>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Track costs, profits, taxes, and financial reports</p>
            <div className="space-y-2">
              <Link href="/admin/accounting">
                <Button className="w-full text-sm sm:text-base">
                  <Calculator className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  View Accounting
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Reorder Management</h3>
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
            </div>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Track low stock items and manage reorders</p>
            <div className="space-y-2">
              <Link href="/admin/reorders">
                <Button className="w-full text-sm sm:text-base">
                  <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  {stats.lowStockItems > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-2">
                      {stats.lowStockItems}
                    </span>
                  )}
                  Manage Reorders
                </Button>
              </Link>
            </div>
          </Card>
          
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Stock Orders</h3>
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
            </div>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Create purchase orders for suppliers with shipping-compliant documents</p>
            <div className="space-y-2">
              <Link href="/admin/stock-orders">
                <Button className="w-full text-sm sm:text-base">
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Manage Stock Orders
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Analytics</h3>
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
            </div>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">View sales insights, best sellers, and performance metrics</p>
            <div className="space-y-2">
              <Link href="/admin/analytics">
                <Button className="w-full text-sm sm:text-base">
                  <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  View Analytics
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Order Management</h3>
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
            </div>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">View and process customer orders</p>
            <div className="space-y-2">
              <Link href="/admin/orders">
                <Button className="w-full text-sm sm:text-base">
                  <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  View Orders
                </Button>
              </Link>
            </div>
          </Card>
          
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Delivery Management</h3>
              <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
            </div>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Manage delivery requests and tracking</p>
            <div className="space-y-2">
              <Link href="/admin/deliveries">
                <Button className="w-full text-sm sm:text-base">
                  <Truck className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Manage Deliveries
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Driver Locations</h3>
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
            </div>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Track all delivery drivers in real-time</p>
            <div className="space-y-2">
              <Link href="/admin/drivers">
                <Button className="w-full text-sm sm:text-base">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  View Driver Map
                </Button>
              </Link>
            </div>
          </Card>

          {/* Product Requests */}
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Product Requests</h3>
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
            </div>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">View and manage customer product requests</p>
            <div className="space-y-2">
              <Link href="/admin/product-requests">
                <Button className="w-full text-sm sm:text-base">
                  <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  View Requests
                </Button>
              </Link>
            </div>
          </Card>
        </div>
        <Card className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Recent Activity</h3>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs sm:text-sm text-gray-600">New order received</span>
              </div>
              <span className="text-xs text-gray-500">2 min ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-xs sm:text-sm text-gray-600">Product updated</span>
              </div>
              <span className="text-xs text-gray-500">1 hour ago</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-xs sm:text-sm text-gray-600">Delivery request submitted</span>
              </div>
              <span className="text-xs text-gray-500">3 hours ago</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
