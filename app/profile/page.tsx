'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'
import { createClient } from '@/lib/supabase'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Package, ShoppingBag, Heart, MapPin, CreditCard, Settings, ArrowRight, Clock, Bell, User } from 'lucide-react'
import { Order, Favorite } from '@/types/database'
import Link from 'next/link'
import { getUnreadNotifications } from '@/lib/notifications'

type TabType = 'overview' | 'orders' | 'favorites' | 'addresses' | 'payment' | 'settings' | 'notifications'

export default function ProfilePage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    favoritesCount: 0,
  })
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [recentFavorites, setRecentFavorites] = useState<Favorite[]>([])
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push('/auth/login')
      return
    }

    fetchDashboardData()
    fetchUnreadNotificationsCount()
  }, [user, authLoading])

  const fetchUnreadNotificationsCount = async () => {
    if (!user) return

    try {
      const unread = await getUnreadNotifications(user.id)
      setUnreadNotificationsCount(unread.length)
    } catch (error) {
      console.error('Error fetching unread notifications count:', error)
    }
  }

  const fetchDashboardData = async () => {
    if (!user) return

    try {
      setLoading(true)
      const supabase = createClient()

      // Fetch orders count and total spent
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, total, status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!ordersError && orders) {
        setStats({
          totalOrders: orders.length,
          totalSpent: orders.reduce((sum, order) => sum + (order.total || 0), 0),
          favoritesCount: 0, // Will be updated below
        })
        setRecentOrders(orders.slice(0, 3) as Order[])
      }

      // Fetch favorites count
      const { count: favoritesCount } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (favoritesCount !== null) {
        setStats((prev) => ({ ...prev, favoritesCount }))
      }

      // Fetch recent favorites
      const { data: favorites } = await supabase
        .from('favorites')
        .select('*, product:products(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3)

      if (favorites) {
        setRecentFavorites(favorites as Favorite[])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotificationsCount },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center px-4">
        <div className="text-center">
          <User className="w-12 h-12 sm:w-16 sm:h-16 text-purple-500 animate-bounce mx-auto mb-4" />
          <p className="text-sm sm:text-base text-gray-700">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-jeffy-yellow">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile?.full_name || user.email?.split('@')[0] || 'User'}!
          </h1>
          <p className="text-sm sm:text-base text-gray-600">Manage your account and track your orders</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-wrap gap-2 sm:gap-3 border-b border-gray-200 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    if (tab.id === 'notifications') {
                      fetchUnreadNotificationsCount()
                    }
                  }}
                  className={`relative flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 font-medium text-sm sm:text-base transition-colors border-b-2 ${
                    isActive
                      ? 'border-jeffy-yellow text-gray-900'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                  {tab.badge && tab.badge > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full min-w-[1.25rem] text-center">
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
                <Card className="hover:shadow-jeffy-lg transition-all duration-300 cursor-pointer group p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Orders</p>
                      <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                    </div>
                    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-500 rounded-lg flex items-center justify-center sm:group-hover:scale-110 transition-transform duration-300">
                      <ShoppingBag className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>
                </Card>

                <Card className="hover:shadow-jeffy-lg transition-all duration-300 cursor-pointer group p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Spent</p>
                      <p className="text-lg sm:text-2xl font-bold text-jeffy-yellow">R{stats.totalSpent.toFixed(2)}</p>
                    </div>
                    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-jeffy-yellow rounded-lg flex items-center justify-center sm:group-hover:scale-110 transition-transform duration-300">
                      <CreditCard className="w-4 h-4 sm:w-6 sm:h-6 text-gray-900" />
                    </div>
                  </div>
                </Card>

                <Card className="hover:shadow-jeffy-lg transition-all duration-300 cursor-pointer group p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Favorites</p>
                      <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.favoritesCount}</p>
                    </div>
                    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-pink-500 rounded-lg flex items-center justify-center sm:group-hover:scale-110 transition-transform duration-300">
                      <Heart className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Recent Orders */}
              <Card className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Recent Orders</h2>
                  <Link href="/profile/orders" className="text-sm text-jeffy-yellow hover:underline flex items-center gap-1">
                    View all <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                {recentOrders.length > 0 ? (
                  <div className="space-y-3">
                    {recentOrders.map((order) => (
                      <Link
                        key={order.id}
                        href={`/profile/orders/${order.id}`}
                        className="block p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-jeffy-yellow transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">Order #{order.id.slice(0, 8)}</p>
                            <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                              <Clock className="w-3 h-3" />
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-jeffy-yellow">R{order.total?.toFixed(2) || '0.00'}</p>
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                                order.status === 'delivered'
                                  ? 'bg-green-100 text-green-700'
                                  : order.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-8">No orders yet</p>
                )}
              </Card>

              {/* Recent Favorites */}
              <Card className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Recent Favorites</h2>
                  <Link href="/profile/favorites" className="text-sm text-jeffy-yellow hover:underline flex items-center gap-1">
                    View all <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                {recentFavorites.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    {recentFavorites.map((favorite) => (
                      <Link
                        key={favorite.id}
                        href={`/products/${favorite.product_id}`}
                        className="block p-3 border border-gray-200 rounded-lg hover:border-jeffy-yellow transition-colors"
                      >
                        {favorite.product && (
                          <>
                            {favorite.product.images && favorite.product.images.length > 0 && (
                              <img
                                src={favorite.product.images[0]}
                                alt={favorite.product.name}
                                className="w-full h-32 object-cover rounded-lg mb-2"
                              />
                            )}
                            <p className="font-semibold text-gray-900 text-sm truncate">{favorite.product.name}</p>
                            <p className="text-jeffy-yellow font-bold">R{favorite.product.price?.toFixed(2) || '0.00'}</p>
                          </>
                        )}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-8">No favorites yet</p>
                )}
              </Card>

              {/* Quick Actions */}
              <Card className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Link href="/profile/addresses">
                    <Button variant="outline" className="w-full justify-start">
                      <MapPin className="w-4 h-4 mr-2" />
                      Manage Addresses
                    </Button>
                  </Link>
                  <Link href="/profile/payment">
                    <Button variant="outline" className="w-full justify-start">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Manage Payment Methods
                    </Button>
                  </Link>
                  <Link href="/profile/settings">
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="w-4 h-4 mr-2" />
                      Account Settings
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button variant="outline" className="w-full justify-start">
                      <Package className="w-4 h-4 mr-2" />
                      Continue Shopping
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <Card className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Order History</h2>
                  <Link href="/profile/orders">
                    <Button variant="outline" size="sm">
                      View All Orders
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
                {recentOrders.length > 0 ? (
                  <div className="space-y-3">
                    {recentOrders.map((order) => (
                      <Link
                        key={order.id}
                        href={`/profile/orders/${order.id}`}
                        className="block p-3 border border-gray-200 rounded-lg hover:border-jeffy-yellow transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">Order #{order.id.slice(0, 8)}</p>
                            <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                              <Clock className="w-3 h-3" />
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-jeffy-yellow">R{order.total?.toFixed(2) || '0.00'}</p>
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                                order.status === 'delivered'
                                  ? 'bg-green-100 text-green-700'
                                  : order.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-4">No orders yet</p>
                )}
              </Card>
            </div>
          )}

          {activeTab === 'favorites' && (
            <div>
              <Card className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Favorites</h2>
                  <Link href="/profile/favorites">
                    <Button variant="outline" size="sm">
                      View All Favorites
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
                {recentFavorites.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    {recentFavorites.map((favorite) => (
                      <Link
                        key={favorite.id}
                        href={`/products/${favorite.product_id}`}
                        className="block p-3 border border-gray-200 rounded-lg hover:border-jeffy-yellow transition-colors"
                      >
                        {favorite.product && (
                          <>
                            {favorite.product.images && favorite.product.images.length > 0 && (
                              <img
                                src={favorite.product.images[0]}
                                alt={favorite.product.name}
                                className="w-full h-32 object-cover rounded-lg mb-2"
                              />
                            )}
                            <p className="font-semibold text-gray-900 text-sm truncate">{favorite.product.name}</p>
                            <p className="text-jeffy-yellow font-bold">R{favorite.product.price?.toFixed(2) || '0.00'}</p>
                          </>
                        )}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-4">No favorites yet</p>
                )}
              </Card>
            </div>
          )}

          {activeTab === 'addresses' && (
            <div>
              <Card className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Saved Addresses</h2>
                  <Link href="/profile/addresses">
                    <Button variant="outline" size="sm">
                      Manage Addresses
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
                <p className="text-gray-600 text-center py-4">
                  <Link href="/profile/addresses" className="text-jeffy-yellow hover:underline">
                    Click here to manage your saved addresses
                  </Link>
                </p>
              </Card>
            </div>
          )}

          {activeTab === 'payment' && (
            <div>
              <Card className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Payment Methods</h2>
                  <Link href="/profile/payment">
                    <Button variant="outline" size="sm">
                      Manage Payments
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
                <p className="text-gray-600 text-center py-4">
                  <Link href="/profile/payment" className="text-jeffy-yellow hover:underline">
                    Click here to manage your saved payment methods
                  </Link>
                </p>
              </Card>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <Card className="p-4 sm:p-6">
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">View and manage your notifications</p>
                  <Link href="/profile/notifications">
                    <Button>
                      <Bell className="w-4 h-4 mr-2" />
                      View Notifications
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <Card className="p-4 sm:p-6">
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">Manage your account settings</p>
                  <Link href="/profile/settings">
                    <Button>
                      <Settings className="w-4 h-4 mr-2" />
                      Go to Settings
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

