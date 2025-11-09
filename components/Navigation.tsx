'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ShoppingCart, Menu, X, User, Package, Truck, LogOut, Settings, Heart, ShoppingBag, Bell } from 'lucide-react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { createClient } from '@/lib/supabase'
import { getUnreadNotifications } from '@/lib/notifications'

interface NavigationProps {
  cartItemCount?: number
}

export function Navigation({ cartItemCount = 0 }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, signOut } = useAuth()

  // Fetch unread notifications count
  useEffect(() => {
    if (!user) {
      setUnreadNotificationsCount(0)
      return
    }

    const fetchUnreadCount = async () => {
      try {
        const unread = await getUnreadNotifications(user.id)
        setUnreadNotificationsCount(unread.length)
      } catch (error) {
        console.error('Error fetching unread notifications count:', error)
      }
    }

    fetchUnreadCount()

    // Set up real-time subscription
    const supabase = createClient()
    const channel = supabase
      .channel(`user-notifications-nav-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Refetch count on any notification change
          fetchUnreadCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])
  
  const navItems = [
    { href: '/', label: 'Jeffy', icon: Package },
    // { href: '/products', label: 'Products', icon: Package }, // hidden by request
    { href: '/admin', label: 'Admin', icon: User },
    { href: '/delivery', label: 'Send and Recieve', icon: Truck },
  ]
  
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }
  
  return (
    <nav className="bg-jeffy-grey shadow-jeffy">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Package className="w-8 h-8 text-jeffy-yellow" />
            <span className="text-xl font-bold text-white">Jeffy</span>
            <span className="text-sm text-jeffy-yellow-light">in a Jiffy</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-jeffy-yellow text-gray-900'
                      : 'text-white hover:bg-jeffy-yellow-light hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
          
          {/* Cart, Auth & Mobile Menu */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <Link href="/cart" className="relative">
              <ShoppingCart className="w-6 h-6 text-white" />
              {cartItemCount > 0 && (
                <span 
                  key={cartItemCount}
                  className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg animate-bounce-in"
                >
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* Auth: Login or Profile Dropdown */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-white hover:bg-jeffy-yellow-light hover:text-gray-900 relative"
                >
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-jeffy-yellow flex items-center justify-center">
                      <span className="text-gray-900 font-semibold text-sm">
                        {profile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    {unreadNotificationsCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                        {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                      </span>
                    )}
                  </div>
                  <span className="hidden md:block text-sm">{profile?.full_name || user.email?.split('@')[0]}</span>
                </button>

                {/* Profile Dropdown Menu */}
                {isProfileMenuOpen && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsProfileMenuOpen(false)}
                    />
                    {/* Menu */}
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-jeffy-lg z-20 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">{profile?.full_name || 'User'}</p>
                        <p className="text-xs text-gray-600 truncate">{user.email}</p>
                      </div>
                      <div className="py-1">
                        <Link
                          href="/profile"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-jeffy-yellow-light transition-colors"
                        >
                          <User className="w-4 h-4" />
                          <span>View Profile</span>
                        </Link>
                        <Link
                          href="/profile/orders"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-jeffy-yellow-light transition-colors"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          <span>My Orders</span>
                        </Link>
                        <Link
                          href="/profile/favorites"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-jeffy-yellow-light transition-colors"
                        >
                          <Heart className="w-4 h-4" />
                          <span>Favorites</span>
                        </Link>
                        <Link
                          href="/profile/notifications"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-jeffy-yellow-light transition-colors relative"
                        >
                          <Bell className="w-4 h-4" />
                          <span>Notifications</span>
                          {unreadNotificationsCount > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                              {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                            </span>
                          )}
                        </Link>
                        <Link
                          href="/profile/settings"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-jeffy-yellow-light transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Settings</span>
                        </Link>
                        <div className="border-t border-gray-200 mt-1">
                          <button
                            onClick={async () => {
                              await signOut()
                              setIsProfileMenuOpen(false)
                              router.push('/')
                            }}
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive('/auth/login') || isActive('/auth/register')
                    ? 'bg-jeffy-yellow text-gray-900'
                    : 'text-white hover:bg-jeffy-yellow-light hover:text-gray-900'
                }`}
              >
                <User className="w-4 h-4" />
                <span className="hidden md:inline">Login</span>
              </Link>
            )}
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-white"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-jeffy-yellow-light">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      isActive(item.href)
                        ? 'bg-jeffy-yellow text-gray-900'
                        : 'text-white hover:bg-jeffy-yellow-light hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
              {user ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-white hover:bg-jeffy-yellow-light hover:text-gray-900"
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={async () => {
                      await signOut()
                      setIsMenuOpen(false)
                      router.push('/')
                    }}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-white hover:bg-jeffy-yellow-light hover:text-gray-900"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-white hover:bg-jeffy-yellow-light hover:text-gray-900"
                >
                  <User className="w-4 h-4" />
                  <span>Login</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
