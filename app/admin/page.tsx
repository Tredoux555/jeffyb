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
  DollarSign,
  MapPin,
  Tag,
  BarChart3,
  LayoutDashboard,
  MessageSquare,
  Globe,
  Users,
  Gift,
  Sparkles
} from 'lucide-react'

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [locations, setLocations] = useState<any[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingDeliveries: 0,
    totalRevenue: 0,
    lowStockItems: 0
  })
  
  useEffect(() => {
    checkAuth()
    fetchLocations()
    loadSelectedLocation()
    fetchStats()
  }, [])

  useEffect(() => {
    if (selectedLocation) {
      localStorage.setItem('jeffy-selected-location', selectedLocation)
      fetchStats() // Refresh stats for selected location
    }
  }, [selectedLocation])

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/admin/locations')
      const result = await response.json()
      if (result.success) {
        setLocations(result.data || [])
        // Set default location if none selected
        if (!selectedLocation && result.data && result.data.length > 0) {
          setSelectedLocation(result.data[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }

  const loadSelectedLocation = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jeffy-selected-location')
      if (saved) {
        setSelectedLocation(saved)
      }
    }
  }
  
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
      <div className="min-h-screen bg-gradient-to-b from-jeffy-yellow to-amber-100 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 w-16 h-16 mx-auto rounded-2xl bg-jeffy-yellow/40 animate-pulse-ring" />
            <div className="relative w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center mx-auto animate-float">
              <LayoutDashboard className="w-8 h-8 text-jeffy-yellow" />
            </div>
          </div>
          <p className="text-slate-600 font-medium">Loading dashboard...</p>
          <div className="flex justify-center gap-1.5 mt-4 loading-dots">
            <span className="w-2 h-2 bg-slate-800 rounded-full"></span>
            <span className="w-2 h-2 bg-slate-800 rounded-full"></span>
            <span className="w-2 h-2 bg-slate-800 rounded-full"></span>
          </div>
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
    <div className="min-h-screen bg-gradient-to-b from-jeffy-yellow to-amber-100">
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

        {/* Location Selector */}
        {locations.length > 1 && (
          <Card className="mb-6 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Location:</span>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-jeffy-yellow bg-white"
                >
                  {locations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name} {location.code ? `(${location.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-sm text-gray-500">
                {locations.find(l => l.id === selectedLocation)?.name || 'All Locations'}
              </div>
            </div>
          </Card>
        )}
        
        {/* Core Management - 4 Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* 1. Products & Categories (Merged) */}
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Products & Categories</h3>
              <div className="flex gap-2">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                <Tag className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
              </div>
            </div>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Manage your product catalog and categories</p>
            <div className="space-y-2">
              <Link href="/admin/products">
                <Button className="w-full text-sm sm:text-base">
                  <Package className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Manage Products
                </Button>
              </Link>
              <Link href="/admin/categories">
                <Button variant="outline" className="w-full text-sm sm:text-base">
                  <Tag className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Manage Categories
                </Button>
              </Link>
            </div>
          </Card>

          {/* 2. Orders & Deliveries (Merged) */}
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Orders & Deliveries</h3>
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
            </div>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Process orders and manage deliveries</p>
            <div className="space-y-2">
              <Link href="/admin/orders">
                <Button className="w-full text-sm sm:text-base">
                  <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  View Orders
                </Button>
              </Link>
              <Link href="/admin/deliveries">
                <Button variant="outline" className="w-full text-sm sm:text-base">
                  <Truck className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Manage Deliveries
                </Button>
              </Link>
              <Link href="/admin/drivers">
                <Button variant="outline" className="w-full text-sm sm:text-base">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Driver Map
                </Button>
              </Link>
            </div>
          </Card>

          {/* 3. Financial & Accounting */}
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Financial & Accounting</h3>
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
            </div>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Procurement, shipments, customs, distributors, and financial tracking</p>
            <div className="space-y-2">
              <Link href="/admin/accounting">
                <Button className="w-full text-sm sm:text-base">
                  <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Open Accounting
                </Button>
              </Link>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Includes: Procurement Queue (auto-populated), Shipments, Stock Allocation, Customs Calculator, Franchise Financials
            </p>
          </Card>

          {/* 4. Franchise Management */}
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Franchise Management</h3>
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
            </div>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Manage franchise locations, stock allocation, and performance</p>
            <div className="space-y-2">
              <Link href="/admin/franchises">
                <Button className="w-full text-sm sm:text-base">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Manage Franchises
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Analytics & Insights - 4 Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* 5. User Management */}
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">User Management</h3>
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
            </div>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Manage user accounts, verify emails, and reset passwords</p>
            <div className="space-y-2">
              <Link href="/admin/users">
                <Button className="w-full text-sm sm:text-base">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Manage Users
                </Button>
              </Link>
            </div>
          </Card>

          {/* 6. Referral Program */}
          <Card className="p-4 sm:p-6 border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Referral Program</h3>
              <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
            </div>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Manage 50% off referral campaigns and promo codes</p>
            <div className="space-y-2">
              <Link href="/admin/referrals">
                <Button className="w-full text-sm sm:text-base bg-amber-500 hover:bg-amber-600">
                  <Gift className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Manage Referrals
                </Button>
              </Link>
            </div>
          </Card>

          {/* 7. Product Requests */}
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

          {/* 8. SEO Management */}
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">SEO Management</h3>
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
            </div>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Optimize product descriptions for search engines</p>
            <div className="space-y-2">
              <Link href="/admin/seo">
                <Button className="w-full text-sm sm:text-base">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Manage SEO
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* AI Tools Section */}
        <div className="mb-6 sm:mb-8">
          <Card className="p-4 sm:p-6 border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">AI Tools</h3>
                  <p className="text-sm text-gray-600">Powered by Claude AI - Generate descriptions, analyze data, get improvement suggestions</p>
                </div>
              </div>
              <Link href="/admin/ai-tools" className="w-full sm:w-auto">
                <Button className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Open AI Tools
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Jeffy Free Products Program */}
        <div className="mb-6 sm:mb-8">
          <Card className="p-4 sm:p-6 border-2 border-jeffy-yellow bg-yellow-50/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-jeffy-yellow rounded-xl flex items-center justify-center">
                  <Gift className="w-6 h-6 text-gray-900" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Jeffy's Free Product Program</h3>
                  <p className="text-sm text-gray-600">Viral referral system - customers get FREE products!</p>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Link href="/admin/jeffy-requests" className="flex-1 sm:flex-none">
                  <Button className="w-full">
                    <Gift className="w-4 h-4 mr-2" />
                    Manage Requests
                  </Button>
                </Link>
                <Link href="/free-products" target="_blank" className="flex-1 sm:flex-none">
                  <Button variant="outline" className="w-full">
                    View Page
                  </Button>
                </Link>
              </div>
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
