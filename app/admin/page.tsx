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
  BarChart3,
  Users,
  DollarSign
} from 'lucide-react'

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingDeliveries: 0,
    totalRevenue: 0
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
      
      setStats({
        totalProducts: productsCount || 0,
        totalOrders: ordersCount || 0,
        pendingDeliveries: deliveriesCount || 0,
        totalRevenue: revenue
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
      <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-jeffy-grey mx-auto mb-4"></div>
          <p className="text-gray-700">Loading dashboard...</p>
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
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-jeffy-yellow',
      link: '/admin/orders'
    }
  ]
  
  return (
    <div className="min-h-screen bg-jeffy-yellow">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage your Jeffy store</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Link key={stat.title} href={stat.link}>
                <Card className="hover:shadow-jeffy-lg transition-all duration-300 cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Product Management</h3>
              <Package className="w-6 h-6 text-gray-500" />
            </div>
            <p className="text-gray-600 mb-4">Add, edit, and manage your product catalog</p>
            <div className="space-y-2">
              <Link href="/admin/products">
                <Button className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Manage Products
                </Button>
              </Link>
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Order Management</h3>
              <ShoppingCart className="w-6 h-6 text-gray-500" />
            </div>
            <p className="text-gray-600 mb-4">View and process customer orders</p>
            <div className="space-y-2">
              <Link href="/admin/orders">
                <Button className="w-full">
                  <Edit className="w-4 h-4 mr-2" />
                  View Orders
                </Button>
              </Link>
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Delivery Management</h3>
              <Truck className="w-6 h-6 text-gray-500" />
            </div>
            <p className="text-gray-600 mb-4">Manage delivery requests and tracking</p>
            <div className="space-y-2">
              <Link href="/admin/deliveries">
                <Button className="w-full">
                  <Truck className="w-4 h-4 mr-2" />
                  Manage Deliveries
                </Button>
              </Link>
            </div>
          </Card>
        </div>
        
        {/* Recent Activity */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">New order received</span>
              </div>
              <span className="text-xs text-gray-500">2 minutes ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Product updated</span>
              </div>
              <span className="text-xs text-gray-500">1 hour ago</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Delivery request submitted</span>
              </div>
              <span className="text-xs text-gray-500">3 hours ago</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
